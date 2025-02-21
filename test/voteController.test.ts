import request from 'supertest';
import prismaMock from './prismaMock';
import { app } from '../src/app';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from "uuid";

const mockUser = {
  id: uuidv4(),
  email: "userTest@gmail.com",
  username: "UserTest",
  password: "hashed-password",
  createdAt: new Date(),
  profilePictureUrl: null,
  bio: null,
};

const mockVotePost = {
  id: uuidv4(),
  userId: mockUser.id,
  postId: uuidv4(),
  value: 1,
};

const mockVoteComment = {
  id: uuidv4(),
  userId: mockUser.id,
  commentId: uuidv4(),
  value: 1,
};

// -------------- Test for vote comment -------------- //

describe("PATCH /vote", () => {
  beforeEach(() => {
    prismaMock.vote.upsert.mockReset();
    prismaMock.vote.aggregate.mockReset();
    prismaMock.post.update.mockReset();
    prismaMock.comment.update.mockReset();
  });
});