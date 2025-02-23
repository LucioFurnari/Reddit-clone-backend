import request from 'supertest';
import prismaMock from './prismaMock';
import { app } from '../src/app';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from "uuid";

const JWT_SECRET = process.env.JWT_SECRET || "secret-key";

const mockUser = {
  id: uuidv4(),
  email: "userTest@gmail.com",
  username: "UserTest",
  password: "hashed-password",
  createdAt: new Date(),
  profilePictureUrl: null,
  bio: null,
};

const mockPost = {
  id: uuidv4(),
  title: "Test Post",
  content: "This is a test post",
  authorId:  mockUser.id,
  subredditId: uuidv4(),
  createdAt: new Date(),
  updatedAt: new Date(),
  karma: 0,
};

const mockComment = {
  id: uuidv4(),
  content: "new comment",
  createdAt: new Date(),
  updatedAt: new Date(),
  authorId: "uuid-id",
  postId: mockPost.id,
  parentId: null,
  karma: 1,
};

const mockVotePost = {
  id: uuidv4(),
  userId: mockUser.id,
  postId: uuidv4(),
  commentId: null,
  value: 1,
};

const mockVoteComment = {
  id: uuidv4(),
  userId: mockUser.id,
  postId: null,
  commentId: uuidv4(),
  value: 1,
};

const mockVoteComment2 = {
  id: uuidv4(),
  userId: mockUser.id,
  postId: null,
  commentId: uuidv4(),
  value: -1,
};

// -------------- Test for vote comment -------------- //

describe("PATCH /vote", () => {
  beforeEach(() => {
    prismaMock.vote.aggregate.mockReset();
    prismaMock.post.update.mockReset();
    prismaMock.comment.update.mockReset();
    prismaMock.user.findUnique.mockReset();
  });

  it("Should vote a comment", async () => {
    prismaMock.vote.create.mockResolvedValue(mockVoteComment);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    prismaMock.comment.update.mockResolvedValue(mockComment);
    prismaMock.vote.aggregate.mockResolvedValue({
      _sum: { value: 1 },
      _count: undefined,
      _avg: undefined,
      _min: undefined,
      _max: undefined
    });

    const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET, { expiresIn: "1d" });

    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    const res = await agent.patch("/api/vote").send({
      type: "comment",
      targetId: mockComment.id,
      action: "upvote",
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, vote: mockVoteComment, message: "Vote created" });
  });

  it("Should vote a post", async () => {
    prismaMock.vote.create.mockResolvedValue(mockVotePost);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    prismaMock.post.update.mockResolvedValue(mockPost);
    prismaMock.vote.aggregate.mockResolvedValue({
      _sum: { value: 1 },
      _count: undefined,
      _avg: undefined,
      _min: undefined,
      _max: undefined
    });

    const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET, { expiresIn: "1d" });

    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    const res = await agent.patch("/api/vote").send({
      type: "post",
      targetId: mockPost.id,
      action: "upvote",
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, vote: mockVotePost, message: "Vote created" });
  });

  it("Should update a vote", async () => {
    prismaMock.vote.findFirst.mockResolvedValue(mockVoteComment2);
    prismaMock.vote.update.mockResolvedValue(mockVoteComment2);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    prismaMock.comment.update.mockResolvedValue(mockComment);
    prismaMock.vote.aggregate.mockResolvedValue({
      _sum: { value: 1 },
      _count: undefined,
      _avg: undefined,
      _min: undefined,
      _max: undefined
    });

    const agent = request.agent(app);
    const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET, { expiresIn: "1d" });
    agent.jar.setCookie(`token=${token}`);

    const res = await agent.patch("/api/vote").send({
      action: "upvote",
      type: "comment",
      targetId: mockComment.id,
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, vote: mockVoteComment2, message: "Vote updated" });
  });
});