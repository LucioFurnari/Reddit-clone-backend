import { DeepMockProxy, mockDeep, mockReset } from "jest-mock-extended";
import { PrismaClient } from "@prisma/client";

const prismaMock = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prismaMock);
});

export const prisma = prismaMock as unknown as DeepMockProxy<PrismaClient>;
export default prismaMock;