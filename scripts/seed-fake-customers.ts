import "dotenv/config";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const fakeCustomerCount = 1_000;
const emailDomain = "fitsaathi.test";

function fakeCustomerEmail(index: number) {
  return `fake-customer-${String(index).padStart(4, "0")}@${emailDomain}`;
}

async function seedFakeCustomers() {
  // The random password is discarded so seeded accounts cannot be used to sign in.
  const passwordHash = await bcrypt.hash(randomBytes(48).toString("base64url"), 12);
  const users = Array.from({ length: fakeCustomerCount }, (_, offset) => {
    const index = offset + 1;
    return {
      name: `Fake Customer ${String(index).padStart(4, "0")}`,
      email: fakeCustomerEmail(index),
      passwordHash,
      role: "customer" as const,
      accountStatus: "active",
      acceptedPolicies: false,
      onboardingCompleted: false,
      isOnline: false,
    };
  });

  const result = await prisma.user.createMany({ data: users, skipDuplicates: true });
  const emailFilter = {
    startsWith: "fake-customer-",
    endsWith: `@${emailDomain}`,
  };
  const [customerUsers, nonCustomerUsers, sellers, coaches, dojos] = await Promise.all([
    prisma.user.count({ where: { email: emailFilter, role: "customer" } }),
    prisma.user.count({ where: { email: emailFilter, role: { not: "customer" } } }),
    prisma.seller.count({ where: { owner: { email: emailFilter } } }),
    prisma.coach.count({ where: { owner: { email: emailFilter } } }),
    prisma.dojo.count({ where: { owner: { email: emailFilter } } }),
  ]);

  if (customerUsers !== fakeCustomerCount || nonCustomerUsers || sellers || coaches || dojos) {
    throw new Error(
      `Fake customer verification failed: ${JSON.stringify({ customerUsers, nonCustomerUsers, sellers, coaches, dojos })}`,
    );
  }

  console.log(JSON.stringify({ inserted: result.count, customerUsers, sellers, coaches, dojos }));
}

seedFakeCustomers()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
