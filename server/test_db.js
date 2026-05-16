const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst();
    console.log("Connected successfully! User:", user);
  } catch (e) {
    console.error("Error:", e.message || e);
  }
}

main().finally(() => prisma.$disconnect());
