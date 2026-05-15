import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Categories
  const cppCategory = await prisma.category.create({
    data: {
      name: 'C++',
      description: 'Learn C++ programming from basics to advanced',
    },
  });

  const webDevCategory = await prisma.category.create({
    data: {
      name: 'Web Development',
      description: 'HTML, CSS, JavaScript, and React',
    },
  });

  // Create Levels for C++ Category
  await prisma.level.createMany({
    data: [
      {
        name: 'Hello World in C++',
        difficulty_level: 'Beginner',
        category_id: cppCategory.id,
      },
      {
        name: 'Variables and Data Types',
        difficulty_level: 'Beginner',
        category_id: cppCategory.id,
      },
      {
        name: 'Control Flow (If/Else, Loops)',
        difficulty_level: 'Intermediate',
        category_id: cppCategory.id,
      },
      {
        name: 'Pointers and References',
        difficulty_level: 'Advanced',
        category_id: cppCategory.id,
      },
      {
        name: 'Object-Oriented Programming in C++',
        difficulty_level: 'Advanced',
        category_id: cppCategory.id,
      },
    ],
  });

  // Create Achievements
  await prisma.achievement.createMany({
    data: [
      { badge_name: 'First Blood', criteria: 'first_success' },
      { badge_name: 'Speedster', criteria: 'fast_execution' },
      { badge_name: 'Centurion', criteria: 'score_100' },
    ],
  });

  console.log('Database seeded with categories, C++ levels, and achievements!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
