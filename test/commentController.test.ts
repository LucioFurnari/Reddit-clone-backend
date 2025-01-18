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

describe("DELETE /api/comments/:commentId", () => {
  const mockCommentId = uuidv4();
  const mockUserId = uuidv4();
  const mockSubredditId = uuidv4();

  const mockUser = {
    id: mockUserId,
    email: 'testuser@gmail.com',
    username: 'testuser',
    password: "password",
    createdAt: new Date(),
    profilePictureUrl: null,
    bio: null,
  };

  const mockComment = {
    id: mockCommentId,
    content: "test comment",
    createdAt: new Date(),
    updatedAt: new Date(),
    authorId: mockUserId,
    postId: uuidv4(),
    parentId: null,
    karma: 1,
    post: {
      subredditId: mockSubredditId,
    },
  };

  const mockUserOnSubreddit = {
    id: uuidv4(),
    userId: mockUserId,
    subredditId: mockSubredditId,
    joinedAt: new Date(),
    role: "MODERATOR",
  }

  beforeEach(() => {
    prismaMock.comment.findUnique.mockReset();
    prismaMock.comment.delete.mockReset();
    prismaMock.userOnSubreddit.findFirst.mockReset();
    prismaMock.user.findUnique.mockReset();
  });

  it("Should delete the comment if the user is the author", async () => {
    const agent = request.agent(app);
    prismaMock.comment.findUnique.mockResolvedValue(mockComment);
    prismaMock.comment.delete.mockResolvedValue(mockComment);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const JWT_SECRET = process.env.JWT_SECRET || "secret-key";
    const token = jwt.sign({ userId: mockUserId }, JWT_SECRET, { expiresIn: "1d" });
    agent.jar.setCookie(`token=${token}`);
    const res = await agent
      .delete(`/api/comments/${mockCommentId}`)

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Comment deleted successfully.");
  });

  it("Should delete the comment if the user is a moderator", async () => {
    const agent = request.agent(app);
    prismaMock.comment.findUnique.mockResolvedValue(mockComment);
    prismaMock.comment.delete.mockResolvedValue(mockComment);
    prismaMock.userOnSubreddit.findFirst.mockResolvedValue(mockUserOnSubreddit);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const JWT_SECRET = process.env.JWT_SECRET || "secret-key";
    const token = jwt.sign({ userId: mockUserId }, JWT_SECRET, { expiresIn: "1d" });
    agent.jar.setCookie(`token=${token}`);
    const res = await agent
      .delete(`/api/comments/${mockCommentId}`)

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Comment deleted successfully.");
  });

  it("Should return 403 if the user is not authorized", async () => {
    const agent = request.agent(app);
    prismaMock.comment.findUnique.mockResolvedValue(mockComment);
    prismaMock.userOnSubreddit.findFirst.mockResolvedValue(null);

    const JWT_SECRET = process.env.JWT_SECRET || "secret-key";
    const token = jwt.sign({ userId: uuidv4() }, JWT_SECRET, { expiresIn: "1d" });
    agent.jar.setCookie(`token=${token}`);
    const res = await agent
      .delete(`/api/comments/${mockCommentId}`)

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("message", "You are not authorized to delete this comment.");
  });

  it("Should return 404 if the comment is not found", async () => {
    const agent = request.agent(app);
    prismaMock.comment.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const JWT_SECRET = process.env.JWT_SECRET || "secret-key";
    const token = jwt.sign({ userId: mockUserId }, JWT_SECRET, { expiresIn: "1d" });
    agent.jar.setCookie(`token=${token}`);
    const res = await agent
      .delete(`/api/comments/${mockCommentId}`)

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Comment not found.");
  });

  it("Should return 500 on unexpected error", async () => {
    const agent = request.agent(app);
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    prismaMock.comment.findUnique.mockRejectedValue(new Error("Database error"));
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const JWT_SECRET = process.env.JWT_SECRET || "secret-key";
    const token = jwt.sign({ userId: mockUserId }, JWT_SECRET, { expiresIn: "1d" });
    agent.jar.setCookie(`token=${token}`);
    const res = await agent
      .delete(`/api/comments/${mockCommentId}`)
    console.log(res.error)
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("message", "Internal server error.");

    consoleErrorMock.mockRestore();
  });
});