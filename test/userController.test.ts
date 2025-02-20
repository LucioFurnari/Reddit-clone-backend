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

const mockSubreddit = {
  id: uuidv4(),
  name: 'TestSubreddit',
  description: 'This is a test subreddit',
  createdAt: new Date(),
  creatorId: mockUser.id,
  bannerUrl: null,
  iconUrl: null,
  rules: null,
};

const mockUserOnSubreddit = {
  id: uuidv4(),
  userId: mockUser.id,
  subredditId: mockSubreddit.id,
  joinedAt: new Date(),
  role: "MEMBER",
  subreddit: mockSubreddit,
};

// Helper function to convert date fields to strings
const convertDatesToString = (obj: any) => {
  return {
    ...obj,
    createdAt: obj.createdAt.toISOString(),
  };
};

// -------------- Test for updateUserProfile -------------- //

describe("PUT /profile", () => {
  beforeEach(() => {
    prismaMock.user.findUnique.mockReset();
    prismaMock.user.update.mockReset();
  });

  it("Should update the user profile", async () => {
    const token = jwt.sign({ id: mockUser.id }, process.env.JWT_SECRET!);

    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    prismaMock.user.update.mockResolvedValue(mockUser);

    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    const res = await agent
      .put("/api/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ bio: "Hello, I am a user" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "Profile updated successfully",
      user: convertDatesToString(mockUser),
    });
  });
});

// -------------- Test for getSubscribedSubreddits -------------- //

describe("GET /subscribed-subreddits", () => {
  beforeEach(() => {
    prismaMock.userOnSubreddit.findMany.mockReset();
  });

  it("Should get the subscribed subreddits", async () => {
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    prismaMock.userOnSubreddit.findMany.mockResolvedValue([mockUserOnSubreddit]);
    prismaMock.subreddit.findUnique.mockResolvedValue(mockSubreddit);

    const token = jwt.sign({ id: mockUser.id }, process.env.JWT_SECRET!);

    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    const res = await agent
      .get("/api/subscribed-subreddits")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("subreddits")
    expect(res.body.subreddits).toEqual([convertDatesToString(mockSubreddit)]);
  });
});