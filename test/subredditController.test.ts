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

const mockOtherSubreddit = {
  id: uuidv4(),
  name: 'testSubreddit2',
  description: 'This is another test subreddit',
  createdAt: new Date(),
  creatorId: uuidv4(),
  bannerUrl: null,
  iconUrl: null,
  rules: null,
}

const mockUserOnSubreddit = {
  id: uuidv4(),
  userId: mockUser.id,
  subredditId: mockSubreddit.id,
  joinedAt: new Date(),
  role: "MEMBER",
};

// Helper function to convert date fields to strings
const convertDatesToString = (obj: any) => {
  return {
    ...obj,
    createdAt: obj.createdAt.toISOString(),
  };
};

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
    prismaMock.subreddit.create.mockResolvedValue(mockSubreddit);

    const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET, { expiresIn: "1d" });
    
    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    // Make a POST request to create a new subreddit
    const res = await agent
      .post('/api/subreddits')
      .send({
        description: '',
        name: '',
      });
    // Assert the response
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

// ------------------ Test for editing a subreddit ------------------ //

describe('PUT /api/subreddits/:id', () => {
  beforeEach(() => {
    prismaMock.subreddit.update.mockReset(); // Reset mocks before each test
    prismaMock.subreddit.findUnique.mockReset();
    prismaMock.user.findUnique.mockReset();
  });

  it('Should edit a subreddit', async () => {
    prismaMock.subreddit.update.mockResolvedValue(mockSubreddit);
    prismaMock.subreddit.findUnique.mockResolvedValue(mockSubreddit);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET, { expiresIn: "1d" });
    
    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    // Make a PUT request to edit a subreddit
    const res = await agent
      .put(`/api/subreddits/${mockSubreddit.id}`)
      .send({
        name: 'TestSubreddit',
        description: 'This is a test subreddit',
      });

    // Assert the response
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Subreddit updated successfully.');
  });

  it("Should return 400 if the subreddit's name is missing", async () => {
    prismaMock.subreddit.findUnique.mockResolvedValue(mockSubreddit);
    prismaMock.subreddit.findUnique.mockResolvedValue(mockSubreddit);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET, { expiresIn: "1d" });
    
    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    // Make a PUT request to edit a subreddit
    const res = await agent
      .put(`/api/subreddits/${mockSubreddit.id}`)
      .send({
        description: '',
        name: '',
      });
    // Assert the response
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("Should return 404 if the subreddit doesn't exist", async () => {
    prismaMock.subreddit.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET, { expiresIn: "1d" });
    
    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    // Make a PUT request to edit a subreddit
    const res = await agent
      .put(`/api/subreddits/${mockSubreddit.id}`)
      .send({
        name: 'TestSubreddit',
        description: 'This is a test subreddit',
      });
    // Assert the response
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("Should return 403 if the user is not the creator of the subreddit", async () => {
    prismaMock.subreddit.findUnique.mockResolvedValue(mockSubreddit);
    prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, id: 'another-uuid' });

    const token = jwt.sign({ userId: 'another-uuid' }, JWT_SECRET, { expiresIn: "1d" });
    
    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    // Make a PUT request to edit a subreddit
    const res = await agent
      .put(`/api/subreddits/${mockSubreddit.id}`)
      .send({
        name: 'TestSubreddit',
        description: 'This is a test subreddit',
      });
    // Assert the response
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error");
  });
});

// ------------------ Test for deleting a subreddit ------------------ //

describe('DELETE /api/subreddits/:id', () => {
  beforeEach(() => {
    prismaMock.subreddit.delete.mockReset(); // Reset mocks before each test
    prismaMock.subreddit.findUnique.mockReset();
    prismaMock.user.findUnique.mockReset();
  });

  it('Should delete a subreddit', async () => {
    prismaMock.subreddit.delete.mockResolvedValue(mockSubreddit);
    prismaMock.subreddit.findUnique.mockResolvedValue(mockSubreddit);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET, { expiresIn: "1d" });
    
    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    // Make a DELETE request to delete a subreddit
    const res = await agent
      .delete(`/api/subreddits/${mockSubreddit.id}`);

    // Assert the response
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Subreddit deleted successfully.');
  });

  it("Should return 404 if the subreddit doesn't exist", async () => {
    prismaMock.subreddit.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET, { expiresIn: "1d" });
    
    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    // Make a DELETE request to delete a subreddit
    const res = await agent
      .delete(`/api/subreddits/${mockSubreddit.id}`);
    // Assert the response
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("Should return 403 if the user is not the creator of the subreddit", async () => {
    prismaMock.subreddit.findUnique.mockResolvedValue(mockSubreddit);
    prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, id: 'another-uuid' });

    const token = jwt.sign({ userId: 'another-uuid' }, JWT_SECRET, { expiresIn: "1d" });
    
    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    // Make a DELETE request to delete a subreddit
    const res = await agent
      .delete(`/api/subreddits/${mockSubreddit.id}`);
    // Assert the response
    expect(res.status).toBe(403);
  })
});

// ------------------ Test for get a subreddit ------------------ //

describe('GET /api/subreddits/:id', () => {
  beforeEach(() => {
    prismaMock.subreddit.findUnique.mockReset(); // Reset mocks before each test
  });

  it('Should get a subreddit', async () => {
    prismaMock.subreddit.findUnique.mockResolvedValue(mockSubreddit);

    // Make a GET request to get a subreddit
    const res = await request(app)
      .get(`/api/subreddits/${mockSubreddit.id}`);

    // Assert the response
    expect(res.status).toBe(200);
    expect(res.body).toEqual(convertDatesToString(mockSubreddit));
  });

  it("Should return 404 if the subreddit doesn't exist", async () => {
    prismaMock.subreddit.findUnique.mockResolvedValue(null);

    // Make a GET request to get a subreddit
    const res = await request(app)
      .get(`/api/subreddits/${mockSubreddit.id}`);
    // Assert the response
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});

// ------------------ Test for subscribe to a subreddit ------------------ //

describe('POST /api/subreddits/:id/subscribe', () => {
  beforeEach(() => {
    prismaMock.subreddit.findUnique.mockReset();
    prismaMock.userOnSubreddit.create.mockReset();
    prismaMock.userOnSubreddit.findUnique.mockReset();
    prismaMock.user.findUnique.mockReset();
  });

  it('Should subscribe to a subreddit', async () => {
    prismaMock.subreddit.findUnique.mockResolvedValue(mockSubreddit);
    prismaMock.userOnSubreddit.findUnique.mockResolvedValue(null);
    prismaMock.userOnSubreddit.create.mockResolvedValue(mockUserOnSubreddit);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET, { expiresIn: "1d" });
    
    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    // Make a POST request to subscribe to a subreddit
    const res = await agent
      .post(`/api/subreddits/${mockSubreddit.id}/subscribe`);

    // Assert the response
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', "Successfully subscribed to subreddit.");
  });

  it("Should return 404 if the subreddit doesn't exist", async () => {
    prismaMock.subreddit.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET, { expiresIn: "1d" });
    
    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    // Make a POST request to subscribe to a subreddit
    const res = await agent
      .post(`/api/subreddits/${mockSubreddit.id}/subscribe`);
    // Assert the response
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("Should return 403 if the user is already subscribed to the subreddit", async () => {
    prismaMock.subreddit.findUnique.mockResolvedValue(mockSubreddit);
    prismaMock.userOnSubreddit.findFirst.mockResolvedValue(mockUserOnSubreddit);
    prismaMock.userOnSubreddit.create.mockResolvedValue(mockUserOnSubreddit);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET, { expiresIn: "1d" });
    
    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    // Make a POST request to subscribe to a subreddit
    const res = await agent
      .post(`/api/subreddits/${mockSubreddit.id}/subscribe`);
    // Assert the response
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

// ------------------ Test for unsubscribe from a subreddit ------------------ //

describe('DELETE /api/subreddits/:id/unsubscribe', () => {
  beforeEach(() => {
    prismaMock.subreddit.findUnique.mockReset();
    prismaMock.userOnSubreddit.delete.mockReset();
    prismaMock.userOnSubreddit.findUnique.mockReset();
    prismaMock.user.findUnique.mockReset();
  });

  it('Should unsubscribe from a subreddit', async () => {
    prismaMock.subreddit.findUnique.mockResolvedValue(mockSubreddit);
    prismaMock.userOnSubreddit.findFirst.mockResolvedValue(mockUserOnSubreddit);
    prismaMock.userOnSubreddit.delete.mockResolvedValue(mockUserOnSubreddit);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET, { expiresIn: "1d" });
    
    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    // Make a DELETE request to unsubscribe from a subreddit
    const res = await agent
      .delete(`/api/subreddits/${mockSubreddit.id}/unsubscribe`);

    // Assert the response
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', "Successfully unsubscribed from subreddit.");
  });

  it("Should return 404 if the subreddit doesn't exist", async () => {
    prismaMock.subreddit.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET, { expiresIn: "1d" });
    
    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    // Make a DELETE request to unsubscribe from a subreddit
    const res = await agent
      .delete(`/api/subreddits/${mockSubreddit.id}/unsubscribe`);
    // Assert the response
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("Should return 403 if the user is not subscribed to the subreddit", async () => {
    prismaMock.subreddit.findUnique.mockResolvedValue(mockSubreddit);
    prismaMock.userOnSubreddit.findFirst.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET, { expiresIn: "1d" });
    
    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);
  });
});

// ------------------ Test for searching subreddits ------------------ //

describe('GET /api/subreddits/search', () => {
  beforeEach(() => {
    prismaMock.subreddit.findMany.mockReset(); // Reset mocks before each test
  });

  it('Should search subreddits', async () => {
    prismaMock.subreddit.findMany.mockResolvedValue([mockSubreddit, mockOtherSubreddit]);

    // Make a GET request to search subreddits
    const res = await request(app)
      .get('/api/subreddits/search?query=test');

    // Assert the response
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('subreddits');
    expect(res.body.subreddits).toHaveLength(2);
    expect(res.body.subreddits[0]).toEqual(convertDatesToString(mockSubreddit));
    expect(res.body.subreddits[1]).toEqual(convertDatesToString(mockOtherSubreddit));
  });

  it('Should return 400 if the query is missing', async () => {
    // Make a GET request to search subreddits
    const res = await request(app)
      .get('/api/subreddits/search');

    // Assert the response
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

// ------------------ Test for assigning a moderator to a subreddit ------------------ //

describe('POST /api/subreddits/:id/moderators', () => {
  beforeEach(() => {
    prismaMock.subreddit.findUnique.mockReset();
    prismaMock.userOnSubreddit.findFirst.mockReset();
    prismaMock.userOnSubreddit.create.mockReset();
    prismaMock.user.findUnique.mockReset();
  });

  it('Should assign a moderator to a subreddit', async () => {
    prismaMock.subreddit.findUnique.mockResolvedValue(mockSubreddit);
    prismaMock.userOnSubreddit.findFirst.mockResolvedValue(mockUserOnSubreddit);
    prismaMock.userOnSubreddit.create.mockResolvedValue(mockUserOnSubreddit);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET, { expiresIn: "1d" });
    
    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    // Make a POST request to assign a moderator to a subreddit
    const res = await agent
      .post(`/api/subreddits/${mockSubreddit.id}/moderators`)
      .send({
        userId: 'some-uuid',
      });

    // Assert the response
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', "Successfully assigned moderator to subreddit.");
  });

  it("Should return 404 if the subreddit doesn't exist", async () => {
    prismaMock.subreddit.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET, { expiresIn: "1d" });
    
    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    // Make a POST request to assign a moderator to a subreddit
    const res = await agent
      .post(`/api/subreddits/${mockSubreddit.id}/moderators`)
      .send({
        userId: 'some-uuid',
      });
    // Assert the response
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("Should return 403 if the user is not the creator of the subreddit", async () => {
    prismaMock.subreddit.findUnique.mockResolvedValue(mockSubreddit);
    prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, id: 'another-uuid' });

    const token = jwt.sign({ userId: 'another-uuid' }, JWT_SECRET, { expiresIn: "1d" });
  });
});