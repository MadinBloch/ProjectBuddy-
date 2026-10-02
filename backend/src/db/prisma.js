import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;
const defaultDbUrl = "file:./data/projectbuddy.db";
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = defaultDbUrl;
}

const prisma =
  globalForPrisma.__projectbuddyPrisma ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__projectbuddyPrisma = prisma;
}

export async function ensureDatabase() {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
}

export default prisma;
