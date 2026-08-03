import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../server.js";
import mongoose from "mongoose";
import Post from "../models/Post.js";
import Story from "../models/story.js";
import Comment from "../models/Comment.js";

describe("Threaded Comments and Story Comments API", () => {
  let token = "";
  let testPostId = null;
  let testStoryId = null;

  beforeEach(async () => {
    // Register & Login a user to get token
    const testUser = {
      username: "comment_test_user",
      email: "comment_test_user@example.com",
      password: "Password123!",
      name: "Comment Tester"
    };

    await request(app).post("/api/users").send(testUser);
    const loginRes = await request(app).post("/api/users/login").send({
      email: testUser.email,
      password: testUser.password
    });

    token = loginRes.body.token;

    // Create a mock post
    const mockPost = await Post.create({
      author: new mongoose.Types.ObjectId(),
      caption: "Test post for comment threads",
      type: "post"
    });
    testPostId = mockPost._id.toString();

    // Create a mock story
    const mockStory = await Story.create({
      user: new mongoose.Types.ObjectId(),
      mediaUrl: "https://example.com/mock.jpg",
      mediaType: "image",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    testStoryId = mockStory._id.toString();
  });

  it("should successfully comment on a post and reply to it", async () => {
    // 1. Post a root comment
    const commentRes = await request(app)
      .post(`/api/comments/${testPostId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ text: "Root comment text" });

    expect(commentRes.statusCode).toEqual(201);
    expect(commentRes.body).toHaveProperty("_id");
    const parentCommentId = commentRes.body._id;

    // 2. Reply to that root comment
    const replyRes = await request(app)
      .post(`/api/comments/reply/${parentCommentId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ text: "Threaded reply text" });

    expect(replyRes.statusCode).toEqual(201);
    expect(replyRes.body).toHaveProperty("parentComment", parentCommentId);
    const replyId = replyRes.body._id;

    // 2.5. Reply to the reply (R2 replying to R1)
    const replyToReplyRes = await request(app)
      .post(`/api/comments/reply/${replyId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ text: "Reply to reply text" });

    expect(replyToReplyRes.statusCode).toEqual(201);
    // Verify that parentComment is still resolved as the root parent comment ID (parentCommentId)
    expect(replyToReplyRes.body).toHaveProperty("parentComment", parentCommentId);

    // 3. Fetch replies
    const fetchRepliesRes = await request(app)
      .get(`/api/comments/replies/${parentCommentId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(fetchRepliesRes.statusCode).toEqual(200);
    expect(fetchRepliesRes.body).toBeInstanceOf(Array);
    expect(fetchRepliesRes.body.length).toEqual(2);
    expect(fetchRepliesRes.body[0]).toHaveProperty("text", "Threaded reply text");
    expect(fetchRepliesRes.body[1]).toHaveProperty("text", "Reply to reply text");
  });

  it("should successfully comment on a story and retrieve it", async () => {
    // 1. Post comment to story
    const storyCommentRes = await request(app)
      .post(`/api/comments/story/${testStoryId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ text: "Nice story!" });

    expect(storyCommentRes.statusCode).toEqual(201);
    expect(storyCommentRes.body).toHaveProperty("_id");

    // 2. Retrieve story comments
    const getStoryCommentsRes = await request(app)
      .get(`/api/comments/story/${testStoryId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(getStoryCommentsRes.statusCode).toEqual(200);
    expect(getStoryCommentsRes.body).toBeInstanceOf(Array);
    expect(getStoryCommentsRes.body.length).toBeGreaterThanOrEqual(1);
    expect(getStoryCommentsRes.body[0]).toHaveProperty("text", "Nice story!");
  });
});
