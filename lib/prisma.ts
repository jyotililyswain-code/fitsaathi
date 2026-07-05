import { PrismaClient } from "@prisma/client";
import { configureDatabaseUrl } from "@/lib/database-url";

configureDatabaseUrl();

const globalPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalPrisma.prisma = prisma;
