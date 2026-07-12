/**
 * Seed script — creates the first FLEET_MANAGER account.
 * Run with:  npx tsx prisma/seed.ts
 *
 * Change the credentials below before running.
 */

import { loadEnvConfig } from "@next/env";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Load .env.local so DATABASE_URL is available
loadEnvConfig(process.cwd());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "admin@transitops.com";
  const password = "Admin@1234"; // ⚠️ Change this before running in production
  const name = "Fleet Admin";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`✓ User already exists: ${email}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "FLEET_MANAGER",
    },
  });

  console.log(`✅ Fleet Manager created:`);
  console.log(`   Name  : ${user.name}`);
  console.log(`   Email : ${user.email}`);
  console.log(`   Role  : ${user.role}`);
  console.log(`\n   Login at http://localhost:3000/login`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
