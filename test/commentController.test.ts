import request from "supertest";
import prismaMock from "./prismaMock";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { app } from "../src/app";

dotenv.config();

describe("POST /api/posts/:postId/comments", () => {
  beforeEach(() => {
    prismaMock.user.create.mockReset(); // Reset mocks before each test
  });
  it("Should create a new comment in a post", async () => {
    // Simulate setting a cookie
    const agent = request.agent(app);

    // Mock prisma create method
    const mockPost = {
      id: "post-id",
      title: "Post",
      content: null,
      createdAt: new Date(),
      authorId: "author-id",
      subredditId: "subreddit-id",
      karma: 0
    };

    const mockComment = {
      id: "comment-id",
      content: "comment",
      createdAt: new Date(),
      updatedAt: new Date(),
      authorId: "author-id",
      postId: "post-id",
      parentId: null,
      karma: 1,
    };
    // Mock user data
    const mockUser = {
      id: 'uuid-id',
      email: 'bastio74@gmail.com',
      username: 'Bastio',
      password: "password",
      createdAt: new Date(),
      profilePictureUrl: null,
      bio: null,
    };
    
    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || "secret-key";
    const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET, { expiresIn: "1d" });
    agent.jar.setCookie(`token=${token}`);

    prismaMock.post.create.mockResolvedValue(mockPost);
    prismaMock.comment.create.mockResolvedValue(mockComment);

    // Make a post request to create a new comment
    const res = await request(app).post("/api/posts/:postId/comments")
    .send({
      content: "new comment",
    })
  });
})