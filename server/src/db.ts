import { PrismaClient } from "@prisma/client";
import { configureDatabaseUrl } from "../../lib/database-url";

configureDatabaseUrl();

const globalDb = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalDb.prisma || new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["warn"] : [] });
if (process.env.NODE_ENV !== "production") globalDb.prisma = prisma;
