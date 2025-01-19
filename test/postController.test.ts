import request from 'supertest';
import { app } from '../src/app';
import prismaMock from './prismaMock';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

describe("POST /api/subreddits/:subredditId/posts", () => {
  const mockSubredditId = uuidv4();
  const mockUserId = uuidv4();

  const mockUser = {
    id: mockUserId,
    email: 'testuser@gmail.com',
    username: 'testuser',
    password: "password",
    createdAt: new Date(),
    profilePictureUrl: null,
    bio: null,
  };

  const mockPost = {
    id: uuidv4(),
    title: "Test Post",
    content: "This is a test post",
    authorId: mockUserId,
    subredditId: mockSubredditId,
    createdAt: new Date(),
    updatedAt: new Date(),
    karma: 0,
  };

  beforeEach(() => {
    prismaMock.post.create.mockReset();
    prismaMock.user.findUnique.mockReset();
  });

  it("Should create a post successfully", async () => {
    prismaMock.post.create.mockResolvedValue(mockPost);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const JWT_SECRET = process.env.JWT_SECRET || "secret-key";
    const token = jwt.sign({ userId: mockUserId }, JWT_SECRET, { expiresIn: "1d" });

    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    const res = await agent
      .post(`/api/subreddits/${mockSubredditId}/posts`)
      .send({ title: mockPost.title, content: mockPost.content });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("message", "Post created");
    // Convert date strings back to Date objects for comparison
    const receivedPost = {
      ...res.body.post,
      createdAt: new Date(res.body.post.createdAt),
      updatedAt: new Date(res.body.post.updatedAt),
    };

    expect(receivedPost).toEqual(mockPost);
  });

  it("Should return 400 for invalid request body", async () => {
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const JWT_SECRET = process.env.JWT_SECRET || "secret-key";
    const token = jwt.sign({ userId: mockUserId }, JWT_SECRET, { expiresIn: "1d" });

    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    const res = await agent
      .post(`/api/subreddits/${mockSubredditId}/posts`)
      .send({ title: "", content: "" }); // Invalid data

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("Should return 500 on unexpected error", async () => {
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    prismaMock.post.create.mockRejectedValue(new Error("Database error"));
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const JWT_SECRET = process.env.JWT_SECRET || "secret-key";
    const token = jwt.sign({ userId: mockUserId }, JWT_SECRET, { expiresIn: "1d" });

    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    const res = await agent
      .post(`/api/subreddits/${mockSubredditId}/posts`)
      .send({ title: mockPost.title, content: mockPost.content });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error", "Internal server error");

    consoleErrorMock.mockRestore();
  });
});