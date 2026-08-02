import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../server.js";

describe("Authentication API Endpoints", () => {
  const testUser = {
    username: "test_user_qa",
    email: "test_user_qa@example.com",
    password: "Password123!",
    name: "QA Tester"
  };

  it("should successfully register a new user", async () => {
    const res = await request(app)
      .post("/api/users")
      .send(testUser);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("username", testUser.username.toLowerCase());
    expect(res.body).toHaveProperty("email", testUser.email.toLowerCase());
  });

  it("should return 400 error on duplicate username/email registration", async () => {
    // Register first user
    await request(app)
      .post("/api/users")
      .send(testUser);

    // Attempt to register duplicate user credentials
    const res = await request(app)
      .post("/api/users")
      .send(testUser);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message");
  });

  it("should successfully login an existing user", async () => {
    // Register first
    await request(app)
      .post("/api/users")
      .send(testUser);

    // Login
    const res = await request(app)
      .post("/api/users/login")
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("username", testUser.username.toLowerCase());
  });

  it("should fail login with invalid password", async () => {
    // Register first
    await request(app)
      .post("/api/users")
      .send(testUser);

    // Login with incorrect password
    const res = await request(app)
      .post("/api/users/login")
      .send({
        email: testUser.email,
        password: "WrongPassword"
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty("message");
  });
});
