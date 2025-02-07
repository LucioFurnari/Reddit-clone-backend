import request from 'supertest';
import prismaMock from './prismaMock';
import { app } from '../src/app';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "secret-key";

const mockUser = {
  id: 'some-uuid',
  email: "userTest@gmail.com",
  username: "UserTest",
  password: "hashed-password",
  createdAt: new Date(),
  profilePictureUrl: null,
  bio: null,
}

const mockSubreddit = {
  id: 'some-uuid',
  name: 'TestSubreddit',
  description: 'This is a test subreddit',
  createdAt: new Date(),
  creatorId: mockUser.id,
  bannerUrl: null,
  iconUrl: null,
  rules: null,
}

// ------------------ Test for creating a subreddit ------------------ //

describe('POST /api/subreddits', () => {
  beforeEach(() => {
    prismaMock.subreddit.create.mockReset(); // Reset mocks before each test
    prismaMock.user.findUnique.mockReset();
  });

  it('Should create a new subreddit', async () => {
    prismaMock.subreddit.create.mockResolvedValue(mockSubreddit);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET, { expiresIn: "1d" });
    
    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    // Make a POST request to create a new subreddit
    const res = await agent
      .post('/api/subreddits')
      .send({
        name: 'TestSubreddit',
        description: 'This is a test subreddit',
      });

    // Assert the response
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Subreddit created successfully.');
  });

  it("Should return 400 if the subreddit's name is missing", async () => {
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET, { expiresIn: "1d" });
    
    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    // Make a POST request to create a new subreddit
    const res = await agent
      .post('/api/subreddits')
      .send({
        description: 'This is a test subreddit',
        name: 'ab',
      });
    // Assert the response
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Subreddit name must be at least 3 characters.");
  });
});