import request from "supertest";
import prismaMock from "./prismaMock";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { app } from "../src/app";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

describe("POST /api/posts/:postId/comments", () => {
  beforeEach(() => {
    prismaMock.post.findUnique.mockReset();
    prismaMock.comment.create.mockReset();
    prismaMock.user.findUnique.mockReset();
  });  
  it("Should create a new comment in a post", async () => {
    const agent = request.agent(app);

    const mockPostId = uuidv4(); // Generate a valid UUID for post
    const mockPost = {
      id: "post-id",
      title: "Post",
      content: null,
      createdAt: new Date(),
      authorId: "author-id",
      subredditId: "subreddit-id",
      karma: 0,
    };

    const mockComment = {
      id: uuidv4(),
      content: "new comment",
      createdAt: new Date(),
      updatedAt: new Date(),
      authorId: "uuid-id",
      postId: mockPostId,
      parentId: null,
      karma: 1,
    };

    const mockUser = {
      id: 'uuid-id',
      email: 'bastio74@gmail.com',
      username: 'Bastio',
      password: "password",
      createdAt: new Date(),
      profilePictureUrl: null,
      bio: null,
    };

    prismaMock.post.findUnique.mockResolvedValue(mockPost); // Mock finding the post
    prismaMock.comment.create.mockResolvedValue(mockComment);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const JWT_SECRET = process.env.JWT_SECRET || "secret-key";
    const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET, { expiresIn: "1d" });

    agent.jar.setCookie(`token=${token}`);

    const res = await agent.post(`/api/posts/${mockPost.id}/comments`)
      .send({ content: "new comment" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("message", "Comment created successfully.");
  });
});

describe("GET /api/posts/:postId/comments", () => {
  it("Should get the comments of a post", async () => {
    const mockPostId = uuidv4(); // Generate a valid UUID for post
    const mockPost = {
      id: mockPostId,
      title: "Post",
      content: null,
      createdAt: new Date(),
      authorId: "author-id",
      subredditId: "subreddit-id",
      karma: 0,
    };
    const mockComment = [{
      id: "comment-id",
      content: "comment-content",
      createdAt: new Date(),
      updatedAt: new Date(),
      authorId: "uuid-id",
      postId: mockPostId,
      parentId: null,
      karma: 1,
    }];

    prismaMock.post.findUnique.mockResolvedValue(mockPost);
    prismaMock.comment.findMany.mockResolvedValue(mockComment);

    const res = await request(app).get(`/api/posts/${mockPost.id}/comments`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Comments fetched successfully");
    expect(res.body).toHaveProperty("comments");
    expect(res.body.comments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: "comment-id",
        content: "comment-content",
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: "uuid-id",
        postId: mockPostId,
        parentId: null,
        karma: 1,
      }),
    ])
    );
  });
});