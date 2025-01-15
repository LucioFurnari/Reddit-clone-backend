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
  it("Should get the comments of a post", async () => {

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
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        authorId: "uuid-id",
        postId: mockPostId,
        parentId: null,
        karma: 1,
      }),
    ])
    );
  });

  it("Should get a empty comments list", async () => {
    prismaMock.comment.findMany.mockResolvedValue([]);
    
    const res = await request(app).get(`/api/posts/${mockPost.id}/comments`);
    expect(res.status).toBe(200);
    expect(res.body.comments).toEqual([]);
  });

  it("Should return 404 post not found", async () => {
    prismaMock.post.findUnique.mockResolvedValue(null);
    const res = await request(app).get(`/api/posts/${mockPost.id}/comments`)
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Post not found.");
  });

  it("Should return an unexpected failure", async () => {
      // Mock console.error to suppress error logging
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});

    prismaMock.post.findUnique.mockRejectedValue(new Error("Database error"));
    const res = await request(app).get(`/api/posts/${mockPostId}/comments`);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("message", "Internal server error.");

    // Restore console.error after the test
    consoleErrorMock.mockRestore();
  });
});

describe("PUT /api/comments/:commentId", () => {
  beforeEach(() => {
    prismaMock.post.findUnique.mockReset();
    prismaMock.comment.create.mockReset();
    prismaMock.user.findUnique.mockReset();
  }); 
  const mockPostId = uuidv4(); // Generate a valid UUID for post
  const mockUser = {
    id: 'uuid-id',
    email: 'bastio74@gmail.com',
    username: 'Bastio', // Ensure the username is correct
    password: "password",
    createdAt: new Date(),
    profilePictureUrl: null,
    bio: null,
  };
  const mockComment = {
    id: uuidv4(),
    content: "new comment",
    createdAt: new Date(),
    updatedAt: new Date(),
    authorId: mockUser.id,
    postId: mockPostId,
    parentId: null,
    karma: 1,
  };

  it("Should edit the comment", async () => {
    const agent = request.agent(app);

    prismaMock.comment.findUnique.mockResolvedValue(mockComment);
    prismaMock.comment.update.mockResolvedValue(mockComment);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const JWT_SECRET = process.env.JWT_SECRET || "secret-key";
    const token = jwt.sign({ userId: mockComment.authorId }, JWT_SECRET, { expiresIn: "1d" });

    agent.jar.setCookie(`token=${token}`);

    const res = await agent.put(`/api/comments/${mockComment.id}`)
      .send({ content: "edited comment" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Comment updated successfully.");
  });
});