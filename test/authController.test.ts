import request from "supertest";
import bcrypt from "bcrypt";
import prismaMock from "./prismaMock";
import { verifyToken } from "../src/utils/jwt";
import { app } from "../src/app";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import { v4 as uuidv4 } from "uuid";

dotenv.config();

describe("POST /api/signup", () => {
  beforeEach(() => {
    prismaMock.user.create.mockReset(); // Reset mocks before each test
  });
  it("Should create a new user", async () => {
    // Mock prisma create method
    const mockUser = {
      id: 'some-uuid',
      email: 'test@gmail.com',
      username: 'TestUser',
      password: 'hashed-password',
      createdAt: new Date(),
      profilePictureUrl: null,
      bio: null,
    };

    prismaMock.user.create.mockResolvedValue(mockUser);

    // Make a POST request to create a new user
    const res = await request(app)
      .post('/api/signup')
      .send({
        email: 'testUser@gmail.com',
        username: 'TestUser',
        password: 'password123',
      });

    // Assert the response
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'User created');
  });
});

describe("POST /api/login", () => {
  it("Should log in a user with correct credentials", async () => {
    const plainPassword = "password123";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Mock prisma create method
    const mockUser = {
      id: 'some-uuid',
      email: 'bastio74@gmail.com',
      username: 'Bastio',
      password:  hashedPassword,
      createdAt: new Date(),
      profilePictureUrl: null,
      bio: null,
    };

    prismaMock.user.findUnique.mockResolvedValue(mockUser);

     // Make a POST request to login the user
    const res = await request(app).post("/api/login").send({
      email: "bastio74@gmail.com",
      password: plainPassword,
    });

    // Assert the response
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Logged in successfully");
  });
  
  it("Should return 401 with incorrect credentials", async () => {
    const plainPassword = "password123";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Mock prisma create method
    const mockUser = {
      id: 'some-uuid',
      email: 'bastio74@gmail.com',
      username: 'Bastio',
      password:  hashedPassword,
      createdAt: new Date(),
      profilePictureUrl: null,
      bio: null,
    };

    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    // Make a POST request with incorrect password
    const res = await request(app).post("/api/login").send({
      email: "bastio74@gmail.com",
      password: "wrongpassword"
    });

    // Assert the response
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "Invalid credentials");
  });
});

describe("POST /api/logout", () => {
  it("Should clear the token cookie and return a success message", async () => {
    // Simulate setting a cookie
    const agent = request.agent(app);
    agent.jar.setCookie("token=some-token-value");

    // Perform a logout request
    const res = await agent.post("/api/logout");

    // Assert the response
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Logged out");
    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.headers["set-cookie"][0]).toContain("token=;"); // Check that the cookie is cleared
  });

  
  it("Should return a 400 if no token is found", async () => {
    // Perform logout request without setting a token
    const res = await request(app).post("/api/logout");

    // Assert the response
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message", "No token found");
  });
});

describe("GET /api/user", () => {
  it("Should get the user info by id", async () => {
    // Simulate setting a cookie
    const agent = request.agent(app);
    

    const plainPassword = "password123";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const JWT_SECRET = process.env.JWT_SECRET || "secret-key"

    // Mock prisma create method
    const mockUser = {
      id: 'uuid-id',
      email: 'bastio74@gmail.com',
      username: 'Bastio',
      password:  hashedPassword,
      createdAt: new Date(),
      profilePictureUrl: null,
      bio: null,
    };

    // Generate JWT token
    const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET, { expiresIn: "1d" });
    agent.jar.setCookie(`token=${token}`);

    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const res = await request(app).get("/api/user");

    // Assert the response
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "No token found");
  });
});