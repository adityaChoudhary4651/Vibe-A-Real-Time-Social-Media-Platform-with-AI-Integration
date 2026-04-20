// src/types/Post.ts

export interface PostAuthor {
  _id: string;
  username: string;
  name: string;
  avatar?: string;
}

export interface Post {
  _id: string;
  imageUrl: string;
  caption?: string;
  likes: string[];      // user ids
  createdAt: string;
  author: PostAuthor;
}
