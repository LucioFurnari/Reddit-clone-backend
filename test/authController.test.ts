import request from "supertest";
import prismaMock from "./prismaMock";
import { app } from "../src/app";
import { v4 as uuidv4 } from "uuid";

describe("POST /signup", () => {
  it("Should create a new user", async () => {
    // Mock prisma create method
    const id = uuidv4();
    prismaMock.user.create.mockResolvedValue({
      id: id,
      email: "bastio74@gmail.com",
      username: "Bastio",
      password: "123",
      createdAt: new Date(),
      profilePictureUrl: null,
      bio: null
    });

    // Make a POST request to create a new user
    const res = await request(app).post("/signup")

    // Assert the response
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toBe("User created");
  });
});