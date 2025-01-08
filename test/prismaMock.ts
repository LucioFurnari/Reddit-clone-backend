import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

const prismaMock = mockDeep<PrismaClient>();

export const prisma = prismaMock as unknown as DeepMockProxy<PrismaClient>;
export default prismaMock;