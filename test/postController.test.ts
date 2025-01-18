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
  };

  beforeEach(() => {
    prismaMock.post.create.mockReset();
  });

  it("Should create a post successfully", async () => {
    prismaMock.post.create.mockResolvedValue(mockPost);

    const JWT_SECRET = process.env.JWT_SECRET || "secret-key";
    const token = jwt.sign({ userId: mockUserId }, JWT_SECRET, { expiresIn: "1d" });

    const res = await request(app)
      .post(`/api/subreddits/${mockSubredditId}/posts`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: mockPost.title, content: mockPost.content });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("message", "Post created");
    expect(res.body.post).toEqual(mockPost);
  });

  it("Should return 400 for invalid request body", async () => {
    const JWT_SECRET = process.env.JWT_SECRET || "secret-key";
    const token = jwt.sign({ userId: mockUserId }, JWT_SECRET, { expiresIn: "1d" });

    const res = await request(app)
      .post(`/api/subreddits/${mockSubredditId}/posts`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: "", content: "" }); // Invalid data

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("Should return 500 on unexpected error", async () => {
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    prismaMock.post.create.mockRejectedValue(new Error("Database error"));

    const JWT_SECRET = process.env.JWT_SECRET || "secret-key";
    const token = jwt.sign({ userId: mockUserId }, JWT_SECRET, { expiresIn: "1d" });

    const res = await request(app)
      .post(`/api/subreddits/${mockSubredditId}/posts`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: mockPost.title, content: mockPost.content });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error", "Internal server error");

    consoleErrorMock.mockRestore();
  });
});