import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    const levels = await prisma.level.findMany();
    console.log("Levels:", levels.length);
  } catch (e) {
    console.error("Levels Error:", e.message);
  }
}

test().finally(() => prisma.$disconnect());
