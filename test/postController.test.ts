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

describe("GET /api/subreddits/:subredditId/posts", () => {
  const mockSubredditId = uuidv4();

  const mockPosts = [
    {
      id: uuidv4(),
      title: "Test Post 1",
      content: "This is a test post 1",
      authorId: uuidv4(),
      subredditId: mockSubredditId,
      createdAt: new Date(),
      updatedAt: new Date(),
      karma: 0,
      author: {
        id: uuidv4(),
        username: "testuser1",
      },
      subreddit: {
        id: mockSubredditId,
        name: "testsubreddit",
      },
    },
    {
      id: uuidv4(),
      title: "Test Post 2",
      content: "This is a test post 2",
      authorId: uuidv4(),
      subredditId: mockSubredditId,
      createdAt: new Date(),
      updatedAt: new Date(),
      karma: 0,
      author: {
        id: uuidv4(),
        username: "testuser2",
      },
      subreddit: {
        id: mockSubredditId,
        name: "testsubreddit",
      },
    },
  ];

  beforeEach(() => {
    prismaMock.post.findMany.mockReset();
  });

  it("Should fetch posts successfully", async () => {
    prismaMock.post.findMany.mockResolvedValue(mockPosts);

    const res = await request(app)
      .get(`/api/subreddits/${mockSubredditId}/posts`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Post fetched successfully");

    // Convert date strings back to Date objects for comparison
    const receivedPosts = res.body.posts.map((post: any) => ({
      ...post,
      createdAt: new Date(post.createdAt),
      updatedAt: new Date(post.updatedAt),
    }));

    expect(receivedPosts).toEqual(mockPosts);
  });

  it("Should return 404 if no posts are found", async () => {
    prismaMock.post.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get(`/api/subreddits/${mockSubredditId}/posts`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "No posts found for this subreddit.");
  });

  it("Should return 500 on unexpected error", async () => {
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    prismaMock.post.findMany.mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .get(`/api/subreddits/${mockSubredditId}/posts`);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error", "Internal server error");

    consoleErrorMock.mockRestore();
  });
});

describe("GET /api/posts/:postId", () => {
  const mockPostId = uuidv4();
  const mockUserId = uuidv4();
  const mockSubredditId = uuidv4();

  const mockPost = {
    id: mockPostId,
    title: "Test Post",
    content: "This is a test post",
    authorId: mockUserId,
    subredditId: mockSubredditId,
    createdAt: new Date(),
    updatedAt: new Date(),
    karma: 0,
    author: {
      id: mockUserId,
      username: "testuser",
      profilePictureUrl: "http://example.com/profile.jpg",
    },
    subreddit: {
      id: mockSubredditId,
      name: "testsubreddit",
      description: "This is a test subreddit",
    },
    comments: [
      {
        id: uuidv4(),
        content: "This is a test comment",
        createdAt: new Date(),
        author: {
          id: uuidv4(),
          username: "commentuser",
        },
      },
    ],
  };

  beforeEach(() => {
    prismaMock.post.findUnique.mockReset();
  });

  it("Should fetch post by ID successfully", async () => {
    prismaMock.post.findUnique.mockResolvedValue(mockPost);

    const res = await request(app)
      .get(`/api/posts/${mockPostId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Post fetched successfully");

    // Convert date strings back to Date objects for comparison
    const receivedPost = {
      ...res.body.post,
      createdAt: new Date(res.body.post.createdAt),
      updatedAt: new Date(res.body.post.updatedAt),
      comments: res.body.post.comments.map((comment: any) => ({
        ...comment,
        createdAt: new Date(comment.createdAt),
      })),
    };

    expect(receivedPost).toEqual(mockPost);
  });

  it("Should return 404 if post is not found", async () => {
    prismaMock.post.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get(`/api/posts/${mockPostId}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "Post not found.");
  });

  it("Should return 500 on unexpected error", async () => {
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    prismaMock.post.findUnique.mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .get(`/api/posts/${mockPostId}`);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error", "Internal server error");

    consoleErrorMock.mockRestore();
  });
});

// -------------------------------------------- PUT edit post -------------------------------------------- //

describe("PUT /api/posts/:postId", () => {
  const mockPostId = uuidv4();
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

  const mockModerator = {
    id: uuidv4(),
    email: 'testModerator@gmail.com',
    username: 'testModerator',
    password: "password",
    createdAt: new Date(),
    profilePictureUrl: null,
    bio: null,
  };

  const mockPost = {
    id: mockPostId,
    title: "Test Post",
    content: "This is a test post",
    authorId: mockUserId,
    subredditId: mockSubredditId,
    createdAt: new Date(),
    updatedAt: new Date(),
    karma: 0,
  };

  beforeEach(() => {
    prismaMock.post.findUnique.mockReset();
    prismaMock.post.update.mockReset();
    prismaMock.userOnSubreddit.findFirst.mockReset();
    prismaMock.user.findUnique.mockReset();
  });

  it("Should edit the post successfully if the user is the author", async () => {
    prismaMock.post.findUnique.mockResolvedValue(mockPost);
    prismaMock.post.update.mockResolvedValue({
      ...mockPost,
      title: "Updated Test Post",
      content: "This is an updated test post",
    });
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const JWT_SECRET = process.env.JWT_SECRET || "secret-key";
    const token = jwt.sign({ userId: mockUserId }, JWT_SECRET, { expiresIn: "1d" });

    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    const res = await agent
      .put(`/api/posts/${mockPostId}`)
      .send({ title: "Updated Test Post", content: "This is an updated test post" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Post updated successfully.");
    expect(res.body.post.title).toBe("Updated Test Post");
    expect(res.body.post.content).toBe("This is an updated test post");
  });

  it("Should edit the post successfully if the user is a moderator", async () => {
    prismaMock.post.findUnique.mockResolvedValue(mockPost);
    prismaMock.post.update.mockResolvedValue({
      ...mockPost,
      title: "Updated Test Post",
      content: "This is an updated test post",
    });
    prismaMock.user.findUnique.mockResolvedValue(mockModerator);
    prismaMock.userOnSubreddit.findFirst.mockResolvedValue({ id: uuidv4(), joinedAt: new Date(), userId: mockModerator.id, subredditId: mockSubredditId, role: "MODERATOR" });

    const JWT_SECRET = process.env.JWT_SECRET || "secret-key";
    const token = jwt.sign({ userId: mockModerator.id }, JWT_SECRET, { expiresIn: "1d" });

    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    const res = await agent
      .put(`/api/posts/${mockPostId}`)
      .send({ title: "Updated Test Post", content: "This is an updated test post" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Post updated successfully.");
    expect(res.body.post.title).toBe("Updated Test Post");
    expect(res.body.post.content).toBe("This is an updated test post");
  });

  it("Should return 403 if the user is not authorized", async () => {
    const fakeUser = {
      id: uuidv4(),
      email: "fakeUser@gmail.com",
      username: "fakeUser",
      password: "password",
      createdAt: new Date(),
      profilePictureUrl: null,
      bio: null,
    }

    prismaMock.post.findUnique.mockResolvedValue(mockPost);
    prismaMock.userOnSubreddit.findFirst.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(fakeUser);

    const JWT_SECRET = process.env.JWT_SECRET || "secret-key";
    const token = jwt.sign({ userId: fakeUser }, JWT_SECRET, { expiresIn: "1d" });

    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    const res = await agent
      .put(`/api/posts/${mockPostId}`)
      .send({ title: "Updated Test Post", content: "This is an updated test post" });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error", "You are not authorized to perform this action.");
  });

  it("Should return 404 if the post is not found", async () => {
    prismaMock.post.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const JWT_SECRET = process.env.JWT_SECRET || "secret-key";
    const token = jwt.sign({ userId: mockUserId }, JWT_SECRET, { expiresIn: "1d" });

    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    const res = await agent
      .put(`/api/posts/${mockPostId}`)
      .send({ title: "Updated Test Post", content: "This is an updated test post" });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "Post not found.");
  });

  it("Should return 400 for invalid request body", async () => {
    prismaMock.post.findUnique.mockResolvedValue(mockPost);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const JWT_SECRET = process.env.JWT_SECRET || "secret-key";
    const token = jwt.sign({ userId: mockUserId }, JWT_SECRET, { expiresIn: "1d" });

    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    const res = await agent
      .put(`/api/posts/${mockPostId}`)
      .send({ title: "", content: "" }); // Invalid data

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("Should return 500 on unexpected error", async () => {
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    prismaMock.post.findUnique.mockRejectedValue(new Error("Database error"));
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const JWT_SECRET = process.env.JWT_SECRET || "secret-key";
    const token = jwt.sign({ userId: mockUserId }, JWT_SECRET, { expiresIn: "1d" });

    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    const res = await agent
      .put(`/api/posts/${mockPostId}`)
      .send({ title: "Updated Test Post", content: "This is an updated test post" });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error", "Internal server error.");

    consoleErrorMock.mockRestore();
  });
});

// -------------------------------------------- DELETE delete post -------------------------------------------- //

describe("DELETE /api/posts/:postId", () => {
  const mockPostId = uuidv4();
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

  const mockPost = {
    id: mockPostId,
    title: "Test Post",
    content: "This is a test post",
    authorId: mockUserId,
    subredditId: mockSubredditId,
    createdAt: new Date(),
    updatedAt: new Date(),
    karma: 0,
    author: mockUserId,
    subreddit: mockSubredditId,
  };

  beforeEach(() => {
    prismaMock.post.findUnique.mockReset();
    prismaMock.post.delete.mockReset();
    prismaMock.userOnSubreddit.findFirst.mockReset();
    prismaMock.user.findUnique.mockReset();
  });

  it("Should delete the post successfully if the user is the author", async () => {
    prismaMock.post.findUnique.mockResolvedValue(mockPost);
    prismaMock.post.delete.mockResolvedValue(mockPost);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
  
    const JWT_SECRET = process.env.JWT_SECRET || "secret-key";
    const token = jwt.sign({ userId: mockUserId }, JWT_SECRET, { expiresIn: "1d" });

    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    const res = await agent
      .delete(`/api/posts/${mockPostId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Post deleted successfully.");

    // Convert date strings back to Date objects for comparison
    const receivedPosts = res.body.posts.map((post: any) => ({
      ...post,
      createdAt: new Date(post.createdAt),
      updatedAt: new Date(post.updatedAt),
    }));

    expect(receivedPosts).toEqual(mockPost);
  });

  it("Should delete the post successfully if the user is a moderator", async () => {
    prismaMock.post.findUnique.mockResolvedValue(mockPost);
    prismaMock.post.delete.mockResolvedValue(mockPost);
    prismaMock.userOnSubreddit.findFirst.mockResolvedValue({
      userId: mockUserId, subredditId: mockSubredditId, role: "MODERATOR",
      id: uuidv4(),
      joinedAt: new Date(),
    });

    const JWT_SECRET = process.env.JWT_SECRET || "secret-key";
    const token = jwt.sign({ userId: mockUserId }, JWT_SECRET, { expiresIn: "1d" });

    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    const res = await agent
      .delete(`/api/posts/${mockPostId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Post deleted successfully.");
    
      // Convert date strings back to Date objects for comparison
      const receivedPosts = res.body.posts.map((post: any) => ({
        ...post,
        createdAt: new Date(post.createdAt),
        updatedAt: new Date(post.updatedAt),
      }));
  
      expect(receivedPosts).toEqual(mockPost);
  });

  it("Should return 403 if the user is not authorized", async () => {
    prismaMock.post.findUnique.mockResolvedValue(mockPost);
    prismaMock.userOnSubreddit.findFirst.mockResolvedValue(null);

    const JWT_SECRET = process.env.JWT_SECRET || "secret-key";
    const token = jwt.sign({ userId: uuidv4() }, JWT_SECRET, { expiresIn: "1d" });

    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    const res = await agent
      .delete(`/api/posts/${mockPostId}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error", "You are not authorized to perform this action.");
  });

  it("Should return 404 if the post is not found", async () => {
    prismaMock.post.findUnique.mockResolvedValue(null);

    const JWT_SECRET = process.env.JWT_SECRET || "secret-key";
    const token = jwt.sign({ userId: mockUserId }, JWT_SECRET, { expiresIn: "1d" });

    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    const res = await agent
      .delete(`/api/posts/${mockPostId}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "Post not found.");
  });

  it("Should return 500 on unexpected error", async () => {
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    prismaMock.post.findUnique.mockRejectedValue(new Error("Database error"));

    const JWT_SECRET = process.env.JWT_SECRET || "secret-key";
    const token = jwt.sign({ userId: mockUserId }, JWT_SECRET, { expiresIn: "1d" });

    const agent = request.agent(app);
    agent.jar.setCookie(`token=${token}`);

    const res = await agent
      .delete(`/api/posts/${mockPostId}`);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error", "Internal server error.");

    consoleErrorMock.mockRestore();
  });
});

// -------------------------------------------- GET search post -------------------------------------------- //
describe("GET /api/posts/search", () => {
  const mockPosts = [
    {
      id: uuidv4(),
      title: "Test Post 1",
      content: "This is a test post 1",
      createdAt: new Date(),
      authorId: uuidv4(),
      subredditId: uuidv4(),
      karma: 0,
      author: {
        id: uuidv4(),
        username: "testuser1",
      },
      subreddit: {
        id: uuidv4(),
        name: "testsubreddit",
      },
    },
    {
      id: uuidv4(),
      title: "Test Post 2",
      content: "This is a test post 2",
      createdAt: new Date(),
      authorId: uuidv4(),
      subredditId: uuidv4(),
      karma: 0,
      author: {
        id: uuidv4(),
        username: "testuser2",
      },
      subreddit: {
        id: uuidv4(),
        name: "testsubreddit",
      },
    },
  ];

  beforeEach(() => {
    prismaMock.post.findMany.mockReset();
  });

  it("Should fetch posts successfully based on search query", async () => {
    prismaMock.post.findMany.mockResolvedValue(mockPosts);

    const res = await request(app)
      .get(`/api/posts/search`)
      .query({ query: "test" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Posts fetched successfully.");

    // Convert date strings back to Date objects for comparison
    const receivedPosts = res.body.posts.map((post: any) => ({
      ...post,
      createdAt: new Date(post.createdAt),
    }));

    expect(receivedPosts).toEqual(mockPosts);
  });

  it("Should return 400 for invalid query parameter", async () => {
    const res = await request(app)
      .get(`/api/posts/search`)
      .query({ query: "" }); // Invalid query

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Query parameter is required and cannot be empty.");
  });

  it("Should return 500 on unexpected error", async () => {
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    prismaMock.post.findMany.mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .get(`/api/posts/search`)
      .query({ query: "test" });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error", "Internal server error");

    consoleErrorMock.mockRestore();
  });
});