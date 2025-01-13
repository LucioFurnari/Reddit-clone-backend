import request from "supertest";
import prismaMock from "./prismaMock";
import dotenv from "dotenv";

dotenv.config();

describe("POST /api/posts/:postId/comments", () => {
  beforeEach(() => {
    prismaMock.user.create.mockReset(); // Reset mocks before each test
  });
  it("Should create a new comment in a post", async () => {
    // Mock prisma create method
    const mockPost = {
      id: "post-id",
      title: "Post",
      content: null,
      createdAt: new Date(),
      authorId: "author-id",
      subredditId: "subreddit-id",
      karma: 0
    };

    prismaMock.post.create.mockResolvedValue(mockPost);
  });
})