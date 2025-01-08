import request from "supertest";
import bcrypt from "bcrypt";
import prismaMock from "./prismaMock";
import { app } from "../src/app";
import { v4 as uuidv4 } from "uuid";

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
  it("Should login a user", async () => {
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
});