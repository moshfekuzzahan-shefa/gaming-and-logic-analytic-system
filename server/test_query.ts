import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const topUsers = await prisma.user.findMany({
      take: 50,
      orderBy: {
        current_streak: 'desc',
      },
      include: {
        attempts: {
          where: { is_success: true },
        },
      },
    });
    console.log(topUsers);
  } catch (e) {
    console.error("Leaderboard Error:", e);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: 1 },
      include: {
        achievements: {
          include: {
            achievement: true,
          },
        },
      },
    });
    console.log(user);
  } catch (e) {
    console.error("Profile Error:", e);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
