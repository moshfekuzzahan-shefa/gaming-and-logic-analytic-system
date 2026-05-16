import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.DATABASE_URL?.replace('localhost', '127.0.0.1');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: url,
    },
  },
});

async function main() {
  try {
    const user = await prisma.user.findFirst();
    console.log("Connected! User:", user);
  } catch (e) {
    console.error("Error:", e);
  }
}

main().finally(() => prisma.$disconnect());
