import request from "supertest";
import prismaMock from "./prismaMock";
import { app } from "../src/app";
import { v4 as uuidv4 } from "uuid";

describe("POST /api/signup", () => {
  it("Should create a new user", async () => {
    beforeEach(() => {
      prismaMock.user.create.mockReset(); // Reset mocks before each test
    });
    // Mock prisma create method
    const mockUser = {
      id: 'some-uuid',
      email: 'bastio74@gmail.com',
      username: 'Bastio',
      password: '123',
      createdAt: new Date(),
      profilePictureUrl: null,
      bio: null,
    };

    prismaMock.user.create.mockResolvedValue(mockUser);

    // Make a POST request to create a new user
    const res = await request(app)
      .post('/api/signup')
      .send({
        email: 'bastio174@gmail.com',
        username: 'Bastio',
        password: 'clave741123',
      });

    // Assert the response
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'User created');
  });
});

// describe("POST /api/login", () => {
//   it("Should login a user", async () => {
//     // Mock prisma create method
//     const mockUser = {
//       id: 'some-uuid',
//       email: 'bastio74@gmail.com',
//       username: 'Bastio',
//       password: '12345678',
//       createdAt: new Date(),
//       profilePictureUrl: null,
//       bio: null,
//     };

//     prismaMock.user.create.mockResolvedValue(mockUser);

//     // Make a POST request to login the user
//     const res = await request(app)
//     .post("/api/login")
//     .send({
//       email: "bastio74@gmail.com",
//       password: "12345678"
//     });

//     // Assert the response
//     expect(res.status).toBe(200);
//     expect(res.body).toHaveProperty("message", "Logged in successfully");
//   });
// });