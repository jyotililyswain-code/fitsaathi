import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const fakeCustomerCount = 1_000;
const emailDomain = "fitsaathi.test";

function fakeCustomerEmail(index: number) {
  return `fake-customer-${String(index).padStart(4, "0")}@${emailDomain}`;
}

async function seedFakeCustomers() {
  const users = Array.from({ length: fakeCustomerCount }, (_, offset) => {
    const index = offset + 1;
    const email = fakeCustomerEmail(index);
    return {
      name: `Fake Customer ${String(index).padStart(4, "0")}`,
      email,
      emailNormalized: email,
      role: "customer" as const,
      accountStatus: "pending_email_verification",
      emailVerified: false,
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
