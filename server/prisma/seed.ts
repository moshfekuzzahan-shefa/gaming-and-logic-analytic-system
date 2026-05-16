import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing database...');
  // Delete in reverse order of relations to prevent foreign key constraint errors
  await prisma.attempt.deleteMany();
  await prisma.user_Achievement.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.user.deleteMany();
  await prisma.level.deleteMany();
  await prisma.question.deleteMany();
  await prisma.category.deleteMany();
  await prisma.achievement.deleteMany();

  console.log('Seeding database...');

  // 1. Create Categories
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

  // 2. Create Levels for C++ Category
  await prisma.level.createMany({
    data: [
      { name: 'Hello World in C++', difficulty_level: 'Beginner', category_id: cppCategory.id },
      { name: 'Variables and Data Types', difficulty_level: 'Beginner', category_id: cppCategory.id },
      { name: 'Control Flow (If/Else, Loops)', difficulty_level: 'Intermediate', category_id: cppCategory.id },
      { name: 'Pointers and References', difficulty_level: 'Advanced', category_id: cppCategory.id },
      { name: 'Object-Oriented Programming in C++', difficulty_level: 'Advanced', category_id: cppCategory.id },
    ],
  });

  const levels = await prisma.level.findMany();

  // 3. Create Achievements
  await prisma.achievement.createMany({
    data: [
      { badge_name: 'First Blood', criteria: 'first_success' },
      { badge_name: 'Speedster', criteria: 'fast_execution' },
      { badge_name: 'Centurion', criteria: 'score_100' },
    ],
  });

  const achievements = await prisma.achievement.findMany();

  // 4. Create Users
  const user1 = await prisma.user.create({
    data: {
      username: 'EliteCoder99',
      email: 'elite99@example.com',
      current_streak: 15,
      join_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    }
  });

  const user2 = await prisma.user.create({
    data: {
      username: 'SyntaxTerror',
      email: 'syntax@example.com',
      current_streak: 12,
      join_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    }
  });

  const user3 = await prisma.user.create({
    data: {
      username: 'LogicMaster',
      email: 'logic@example.com',
      current_streak: 8,
      join_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    }
  });

  // 5. Create Attempts (for Total Score generation)
  const attemptsData = [
    // EliteCoder99 Attempts (Total Score: 300)
    { user_id: user1.id, level_id: levels[0].id, time_taken: 500, is_success: true, score: 100 },
    { user_id: user1.id, level_id: levels[1].id, time_taken: 800, is_success: true, score: 100 },
    { user_id: user1.id, level_id: levels[2].id, time_taken: 1200, is_success: true, score: 100 },
    // SyntaxTerror Attempts (Total Score: 180)
    { user_id: user2.id, level_id: levels[0].id, time_taken: 600, is_success: true, score: 100 },
    { user_id: user2.id, level_id: levels[1].id, time_taken: 1500, is_success: true, score: 80 },
    // LogicMaster Attempts (Total Score: 90)
    { user_id: user3.id, level_id: levels[0].id, time_taken: 2000, is_success: true, score: 90 },
    { user_id: user3.id, level_id: levels[1].id, time_taken: 5000, is_success: false, score: 0 },
  ];

  await prisma.attempt.createMany({ data: attemptsData });

  // 6. Unlock Badges for Users
  await prisma.user_Achievement.createMany({
    data: [
      { user_id: user1.id, achievement_id: achievements[0].id }, // First Blood
      { user_id: user1.id, achievement_id: achievements[1].id }, // Speedster
      { user_id: user1.id, achievement_id: achievements[2].id }, // Centurion
      
      { user_id: user2.id, achievement_id: achievements[0].id }, // First Blood
      
      { user_id: user3.id, achievement_id: achievements[0].id }, // First Blood
    ]
  });

  console.log('Database successfully seeded with realistic Users, Attempts, and Badges!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
