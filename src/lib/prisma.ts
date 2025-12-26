import { PrismaClient } from "@prisma/client";
// Using standard Prisma client with datasourceUrl; Neon pool adapter is available but optional for dev/local.
// import { PrismaNeon } from "@prisma/adapter-neon";
// import { neonConfig, Pool } from "@neondatabase/serverless";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  return new PrismaClient({ datasourceUrl: connectionString });
}
