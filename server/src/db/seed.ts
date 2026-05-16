import { db } from './index';
import { users, categories, levels, questions, attempts, achievements, userAchievements, friendships } from './schema';

async function main() {
  console.log('Clearing existing database...');
  // Delete in reverse order of relations
  await db.delete(attempts);
  await db.delete(userAchievements);
  await db.delete(friendships);
  await db.delete(users);
  await db.delete(questions);
  await db.delete(levels);
  await db.delete(categories);
  await db.delete(achievements);

  console.log('Seeding database...');

  // 1. Create Categories
  const [cppCategory] = await db.insert(categories).values({
    name: 'C++',
    description: 'Learn C++ programming from basics to advanced',
  }).returning();

  const [webDevCategory] = await db.insert(categories).values({
    name: 'Web Development',
    description: 'HTML, CSS, JavaScript, and React',
  }).returning();

  // 2. Create Levels for C++ Category
  await db.insert(levels).values([
    { name: 'Hello World in C++', difficulty_level: 'Beginner', category_id: cppCategory.id },
    { name: 'Variables and Data Types', difficulty_level: 'Beginner', category_id: cppCategory.id },
    { name: 'Control Flow (If/Else, Loops)', difficulty_level: 'Intermediate', category_id: cppCategory.id },
    { name: 'Pointers and References', difficulty_level: 'Advanced', category_id: cppCategory.id },
    { name: 'Object-Oriented Programming in C++', difficulty_level: 'Advanced', category_id: cppCategory.id },
  ]);

  const allLevels = await db.select().from(levels);

  // 3. Create Achievements
  await db.insert(achievements).values([
    { badge_name: 'First Blood', criteria: 'first_success' },
    { badge_name: 'Speedster', criteria: 'fast_execution' },
    { badge_name: 'Centurion', criteria: 'score_100' },
  ]);

  const allAchievements = await db.select().from(achievements);

  // 4. Create Users
  const [user1] = await db.insert(users).values({
    username: 'EliteCoder99',
    email: 'elite99@example.com',
    current_streak: 15,
    join_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), 
  }).returning();

  const [user2] = await db.insert(users).values({
    username: 'SyntaxTerror',
    email: 'syntax@example.com',
    current_streak: 12,
    join_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  }).returning();

  const [user3] = await db.insert(users).values({
    username: 'LogicMaster',
    email: 'logic@example.com',
    current_streak: 8,
    join_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  }).returning();

  // 5. Create Attempts
  await db.insert(attempts).values([
    { user_id: user1.id, level_id: allLevels[0].id, time_taken: 500, is_success: true, score: 100 },
    { user_id: user1.id, level_id: allLevels[1].id, time_taken: 800, is_success: true, score: 100 },
    { user_id: user1.id, level_id: allLevels[2].id, time_taken: 1200, is_success: true, score: 100 },
    
    { user_id: user2.id, level_id: allLevels[0].id, time_taken: 600, is_success: true, score: 100 },
    { user_id: user2.id, level_id: allLevels[1].id, time_taken: 1500, is_success: true, score: 80 },
    
    { user_id: user3.id, level_id: allLevels[0].id, time_taken: 2000, is_success: true, score: 90 },
    { user_id: user3.id, level_id: allLevels[1].id, time_taken: 5000, is_success: false, score: 0 },
  ]);

  // 6. Unlock Badges for Users
  await db.insert(userAchievements).values([
    { user_id: user1.id, achievement_id: allAchievements[0].id },
    { user_id: user1.id, achievement_id: allAchievements[1].id },
    { user_id: user1.id, achievement_id: allAchievements[2].id },
    
    { user_id: user2.id, achievement_id: allAchievements[0].id },
    
    { user_id: user3.id, achievement_id: allAchievements[0].id },
  ]);

  console.log('Database successfully seeded with realistic Drizzle ORM data!');
  process.exit(0);
}

main().catch((e) => {
  console.error('Seeding failed:', e);
  process.exit(1);
});
