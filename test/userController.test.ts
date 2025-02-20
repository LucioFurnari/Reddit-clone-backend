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