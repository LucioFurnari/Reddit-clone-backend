import { PrismaClient } from "@prisma/client";
import dotenv from 'dotenv';
import prismaMock from "../test/prismaMock";
dotenv.config();


let prisma: PrismaClient;

if (process.env.NODE_ENV === 'test') {
  prisma = require('../test/prismaMock').default; // Import mock in test environment
} else {
  prisma = new PrismaClient(); // Use real PrismaClient otherwise
}

export default prisma;