import { db } from './index';
import { users, categories, levels, questions, attempts, achievements, userAchievements, friendships } from './schema/index';

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

  console.log('Seeding database with rich, realistic data...');

  // 1. Create Categories
  const [dsCategory] = await db.insert(categories).values({
    name: 'Data Structures',
    description: 'Master the building blocks of efficient software, from Linked Lists to Graphs.',
  } as any).returning();

  const [algoCategory] = await db.insert(categories).values({
    name: 'Algorithms',
    description: 'Learn the logic behind sorting, searching, and complex problem-solving.',
  } as any).returning();

  const [logicCategory] = await db.insert(categories).values({
    name: 'Logic Puzzles',
    description: 'Sharpen your brain with classic logic challenges and mathematical riddles.',
  } as any).returning();

  // 2. Create Levels (10+ realistic levels)
  await db.insert(levels).values([
    // Data Structures
    { 
      name: 'Reverse a Linked List', 
      difficulty_level: 'Beginner', 
      category_id: dsCategory.id,
      reward_xp: 100,
      expected_output: '5 4 3 2 1',
      problem_statement: 'Write a program that simulates reversing a singly linked list with values 1 through 5. Your output should be the space-separated values in reverse order.',
      boilerplate_code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Mock linked list reversal output\n    cout << "5 4 3 2 1";\n    return 0;\n}'
    },
    { 
      name: 'Binary Tree Inorder Traversal', 
      difficulty_level: 'Intermediate', 
      category_id: dsCategory.id,
      reward_xp: 200,
      expected_output: '1 2 3 4 5',
      problem_statement: 'Implement an inorder traversal for a binary search tree containing nodes 1, 2, 3, 4, 5. Output the result as space-separated integers.',
      boilerplate_code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Output the inorder traversal\n    cout << "1 2 3 4 5";\n    return 0;\n}'
    },
    { 
      name: 'Implement a Min-Heap', 
      difficulty_level: 'Advanced', 
      category_id: dsCategory.id,
      reward_xp: 400,
      expected_output: 'Min: 10',
      problem_statement: 'Build a min-heap structure. After inserting values 10, 20, 30, and 5, performing a "getMin" should return 10 (assuming 5 was removed). Output exactly: Min: 10',
      boilerplate_code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Min: 10";\n    return 0;\n}'
    },
    { 
      name: 'Graph Cycle Detection', 
      difficulty_level: 'Advanced', 
      category_id: dsCategory.id,
      reward_xp: 500,
      expected_output: 'Cycle Detected',
      problem_statement: 'Given a directed graph with an edge from A to B and B to A, detect the cycle. Output: Cycle Detected',
      boilerplate_code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Cycle Detected";\n    return 0;\n}'
    },
    
    // Algorithms
    { 
      name: 'Bubble Sort Basics', 
      difficulty_level: 'Beginner', 
      category_id: algoCategory.id,
      reward_xp: 80,
      expected_output: 'Sorted',
      problem_statement: 'Implement the Bubble Sort algorithm to sort an array of integers. When complete, output the word: Sorted',
      boilerplate_code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Sorted";\n    return 0;\n}'
    },
    { 
      name: 'Merge Sort implementation', 
      difficulty_level: 'Intermediate', 
      category_id: algoCategory.id,
      reward_xp: 250,
      expected_output: 'Merge Sort Complete',
      problem_statement: 'Implement the Divide and Conquer Merge Sort algorithm. Output exactly: Merge Sort Complete',
      boilerplate_code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Merge Sort Complete";\n    return 0;\n}'
    },
    { 
      name: 'Dijkstra Pathfinding', 
      difficulty_level: 'Advanced', 
      category_id: algoCategory.id,
      reward_xp: 450,
      expected_output: 'Shortest Path: 15',
      problem_statement: 'Find the shortest path between Node A and Node E in the provided weighted graph using Dijkstra\'s algorithm. Output exactly: Shortest Path: 15',
      boilerplate_code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Shortest Path: 15";\n    return 0;\n}'
    },
    { 
      name: 'Knapsack Problem (DP)', 
      difficulty_level: 'Advanced', 
      category_id: algoCategory.id,
      reward_xp: 500,
      expected_output: 'Max Value: 220',
      problem_statement: 'Solve the 0/1 Knapsack problem using Dynamic Programming for a capacity of 50kg. Output the maximum value found. Output exactly: Max Value: 220',
      boilerplate_code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Max Value: 220";\n    return 0;\n}'
    },

    // Logic Puzzles
    { 
      name: 'Tower of Hanoi', 
      difficulty_level: 'Intermediate', 
      category_id: logicCategory.id,
      reward_xp: 200,
      expected_output: 'Solved with 7 moves',
      problem_statement: 'Write a recursive function to solve the Tower of Hanoi for 3 disks. Output the minimum number of moves required. Output exactly: Solved with 7 moves',
      boilerplate_code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Solved with 7 moves";\n    return 0;\n}'
    },
    { 
      name: 'N-Queens Challenge', 
      difficulty_level: 'Advanced', 
      category_id: logicCategory.id,
      reward_xp: 600,
      expected_output: '92 solutions found',
      problem_statement: 'Find all possible ways to place 8 queens on an 8x8 chessboard such that no two queens threaten each other. Output exactly: 92 solutions found',
      boilerplate_code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "92 solutions found";\n    return 0;\n}'
    },
    { 
      name: 'Sudoku Validator', 
      difficulty_level: 'Intermediate', 
      category_id: logicCategory.id,
      reward_xp: 150,
      expected_output: 'Valid',
      problem_statement: 'Check if a given 9x9 Sudoku board is valid according to standard Sudoku rules. Output exactly: Valid',
      boilerplate_code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Valid";\n    return 0;\n}'
    },
  ] as any);

  const allLevels = await db.select().from(levels);

  // 3. Create Achievements
  await db.insert(achievements).values([
    { badge_name: 'First Blood', criteria: 'first_success' },
    { badge_name: 'Speedster', criteria: 'fast_execution' },
    { badge_name: 'Centurion', criteria: 'score_100' },
    { badge_name: 'Logic Grandmaster', criteria: 'score_500' },
  ]);

  const allAchievements = await db.select().from(achievements);

  // 4. Create Users
  const [user1] = await db.insert(users).values({
    username: 'EliteCoder99',
    email: 'elite99@example.com',
    current_streak: 25,
    join_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), 
  } as any).returning();

  const [user2] = await db.insert(users).values({
    username: 'SyntaxTerror',
    email: 'syntax@example.com',
    current_streak: 12,
    join_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  } as any).returning();

  const [user3] = await db.insert(users).values({
    username: 'LogicMaster',
    email: 'logic@example.com',
    current_streak: 45,
    join_date: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
  } as any).returning();

  const [user4] = await db.insert(users).values({
    username: 'NewbieDev',
    email: 'newbie@example.com',
    current_streak: 2,
    join_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  } as any).returning();

  // 5. Create Rich Attempts for realistic Leaderboard/Stats
  // EliteCoder99 successes
  await db.insert(attempts).values([
    { user_id: user1.id, level_id: allLevels[0].id, time_taken: 450, is_success: true, score: 100 },
    { user_id: user1.id, level_id: allLevels[1].id, time_taken: 1200, is_success: true, score: 150 },
    { user_id: user1.id, level_id: allLevels[4].id, time_taken: 300, is_success: true, score: 80 },
    { user_id: user1.id, level_id: allLevels[6].id, time_taken: 5000, is_success: true, score: 300 },
  ]);

  // LogicMaster successes (high score)
  await db.insert(attempts).values([
    { user_id: user3.id, level_id: allLevels[8].id, time_taken: 800, is_success: true, score: 200 },
    { user_id: user3.id, level_id: allLevels[9].id, time_taken: 15000, is_success: true, score: 500 },
    { user_id: user3.id, level_id: allLevels[10].id, time_taken: 2000, is_success: true, score: 150 },
  ]);

  // SyntaxTerror mixed results
  await db.insert(attempts).values([
    { user_id: user2.id, level_id: allLevels[0].id, time_taken: 900, is_success: true, score: 90 },
    { user_id: user2.id, level_id: allLevels[1].id, time_taken: 3000, is_success: false, score: 0 },
    { user_id: user2.id, level_id: allLevels[4].id, time_taken: 400, is_success: true, score: 100 },
  ]);

  // 6. Unlock Badges
  await db.insert(userAchievements).values([
    { user_id: user1.id, achievement_id: allAchievements[0].id }, // First Blood
    { user_id: user1.id, achievement_id: allAchievements[1].id }, // Speedster
    { user_id: user3.id, achievement_id: allAchievements[0].id },
    { user_id: user3.id, achievement_id: allAchievements[3].id }, // Logic Grandmaster
  ]);

  console.log('Database successfully seeded with realistic Drizzle ORM data for your presentation!');
  process.exit(0);
}

main().catch((e) => {
  console.error('Seeding failed:', e);
  process.exit(1);
});
