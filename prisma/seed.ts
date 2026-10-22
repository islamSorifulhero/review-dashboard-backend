import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "mentor@example.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "Mentor@12345";
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "MENTOR" },
    create: { name: process.env.ADMIN_NAME ?? "Head Mentor", email, passwordHash, role: "MENTOR" },
  });
  console.log(`Seeded mentor: ${email}`);
}

main().finally(() => prisma.$disconnect());
