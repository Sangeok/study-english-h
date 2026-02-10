import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prismaClientSingleton = () => {
  return new PrismaClient({ adapter });
};

// Global variable to prevent multiple instances of Prisma Client in development
declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

// Prisma Client instance
const prisma = globalThis.prismaGlobal || prismaClientSingleton();

// Prevent multiple instances of Prisma Client in development
if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;

export default prisma;
