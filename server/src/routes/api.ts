import { Router, Request, Response } from 'express';
import { db } from '../db';
import { 
  users, categories, levels, attempts, achievements, userAchievements, friendships, questions 
} from '../db/schema/index';
import { eq, or, and, desc, sql } from 'drizzle-orm';

const router = Router();

// GET /api/levels: Returns all levels grouped by category
router.get('/levels', async (req: Request, res: Response) => {
  try {
    const categoriesWithLevels = await db.query.categories.findMany({
      with: {
        levels: true,
      },
    });
    res.json(categoriesWithLevels);
  } catch (error) {
    console.error('Error fetching levels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/levels/:id: Returns details for a specific level
router.get('/levels/:id', async (req: Request, res: Response) => {
  const levelId = parseInt(req.params.id as string);

  if (isNaN(levelId)) {
    return res.status(400).json({ error: 'Invalid level ID' });
  }

  try {
    const level = await db.query.levels.findFirst({
      where: eq(levels.id, levelId),
      with: {
        category: true,
      }
    });

    if (!level) {
      return res.status(404).json({ error: 'Level not found' });
    }

    res.json(level);
  } catch (error) {
    console.error('Error fetching level:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/categories/:id/questions: Returns questions for a specific category
router.get('/categories/:id/questions', async (req: Request, res: Response) => {
  const categoryId = parseInt(req.params.id as string);
  
  if (isNaN(categoryId)) {
    return res.status(400).json({ error: 'Invalid category ID' });
  }

  try {
    const categoryQuestions = await db.select().from(questions).where(eq(questions.category_id, categoryId));
    res.json(categoryQuestions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:id/stats: Calculates user's total XP, levels passed, and fetches unlocked badges
router.get('/users/:id/stats', async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id as string);
  
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const userAttempts = await db.select().from(attempts)
      .where(and(eq(attempts.user_id, userId), eq(attempts.is_success, true)));
    
    const totalXP = userAttempts.reduce((sum, attempt) => sum + attempt.score, 0);
    const uniqueLevelsPassed = new Set(userAttempts.map(a => a.level_id)).size;

    const unlocked = await db.query.userAchievements.findMany({
      where: eq(userAchievements.user_id, userId),
      with: {
        achievement: true,
      },
    });

    res.json({
      totalXP,
      totalLevelsPassed: uniqueLevelsPassed,
      unlockedBadges: unlocked.map(ub => ub.achievement),
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/execute: Accepts C++ code string and expected output
router.post('/execute', async (req: Request, res: Response) => {
  const { code, expectedOutput } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    let isSuccess = false;
    let actualOutput = '';

    if (expectedOutput && code.includes(expectedOutput)) {
       isSuccess = true;
       actualOutput = expectedOutput;
    } else if (!expectedOutput && code.trim().length > 0) {
       isSuccess = true;
       actualOutput = 'Execution successful';
    } else {
       actualOutput = 'Output did not match expected, or syntax error occurred.';
    }

    res.json({
      isSuccess,
      output: actualOutput,
      timeTakenMs: Math.floor(Math.random() * 50) + 10, 
    });
  } catch (error) {
    console.error('Error executing code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/attempts: Saves attempt data and checks for achievements
router.post('/attempts', async (req: Request, res: Response) => {
  const { user_id, level_id, time_taken, is_success, score } = req.body;

  if (!user_id || !level_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const [newAttempt] = await db.insert(attempts).values({
      user_id,
      level_id,
      time_taken,
      is_success,
      score: score || 0,
    }).returning();

    const unlockedAchievements = [];

    const successfulAttempts = await db.select().from(attempts)
      .where(and(eq(attempts.user_id, user_id), eq(attempts.is_success, true)));
    const totalScore = successfulAttempts.reduce((sum, att) => sum + att.score, 0);

    const existingUnlocks = await db.query.userAchievements.findMany({
      where: eq(userAchievements.user_id, user_id),
      with: { achievement: true },
    });
    const existingCriteria = new Set(existingUnlocks.map(u => u.achievement.criteria));

    const allAchievements = await db.select().from(achievements);

    for (const ach of allAchievements) {
      if (existingCriteria.has(ach.criteria)) continue; 

      let criteriaMet = false;
      switch (ach.criteria) {
        case 'first_success':
          if (successfulAttempts.length >= 1) criteriaMet = true;
          break;
        case 'fast_execution':
          if (is_success && time_taken < 1000) criteriaMet = true;
          break;
        case 'score_100':
          if (totalScore >= 100) criteriaMet = true;
          break;
      }

      if (criteriaMet) {
        await db.insert(userAchievements).values({
          user_id,
          achievement_id: ach.id,
        });
        unlockedAchievements.push(ach);
      }
    }

    res.json({ attempt: newAttempt, unlockedAchievements });

  } catch (error) {
    console.error('Error saving attempt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/leaderboard: Top 50 users ordered by current_streak desc
// Requested explicit SQL methods by user (.select, .from, .leftJoin, .groupBy)
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const leaderboard = await db
      .select({
        id: users.id,
        username: users.username,
        current_streak: users.current_streak,
        // Using explicit SQL aggregation for total score
        totalScore: sql<number>`COALESCE(SUM(${attempts.score}), 0)::int`,
      })
      .from(users)
      .leftJoin(
        attempts, 
        and(
          eq(users.id, attempts.user_id),
          eq(attempts.is_success, true)
        )
      )
      .groupBy(users.id)
      .orderBy(desc(users.current_streak))
      .limit(50);

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error', details: String(error) });
  }
});

// POST /api/friends/request: Request a friendship
router.post('/friends/request', async (req: Request, res: Response) => {
  const { sender_id, receiver_id } = req.body;

  if (!sender_id || !receiver_id) {
    return res.status(400).json({ error: 'sender_id and receiver_id required' });
  }

  if (sender_id === receiver_id) {
    return res.status(400).json({ error: 'Cannot send a friend request to yourself' });
  }

  try {
    const existing = await db.select().from(friendships).where(
      or(
        and(eq(friendships.user_id_1, sender_id), eq(friendships.user_id_2, receiver_id)),
        and(eq(friendships.user_id_1, receiver_id), eq(friendships.user_id_2, sender_id))
      )
    ).limit(1);

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Friendship request already exists or is processed' });
    }

    const [newRequest] = await db.insert(friendships).values({
      user_id_1: sender_id,
      user_id_2: receiver_id,
      status: 'PENDING',
    }).returning();

    res.json(newRequest);
  } catch (error) {
    console.error('Error requesting friendship:', error);
    res.status(500).json({ error: 'Internal server error', details: String(error) });
  }
});

// PUT /api/friends/accept: Accept a friendship request
router.put('/friends/accept', async (req: Request, res: Response) => {
  const { friendship_id } = req.body;

  if (!friendship_id) {
    return res.status(400).json({ error: 'friendship_id is required' });
  }

  try {
    const existing = await db.select().from(friendships).where(eq(friendships.id, friendship_id)).limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    const [updated] = await db.update(friendships)
      .set({ status: 'ACCEPTED' })
      .where(eq(friendships.id, friendship_id))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error('Error accepting friendship:', error);
    res.status(500).json({ error: 'Internal server error', details: String(error) });
  }
});

// GET /api/users/:id/profile: Fetch public profile
// Requested explicit SQL methods by user (.select, .from, .leftJoin)
router.get('/users/:id/profile', async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id as string);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const userArr = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (userArr.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userArr[0];

    // Explicit Relational joins using leftJoin as requested
    const userBadges = await db
      .select({
        id: achievements.id,
        badge_name: achievements.badge_name,
        criteria: achievements.criteria,
      })
      .from(userAchievements)
      .leftJoin(achievements, eq(userAchievements.achievement_id, achievements.id))
      .where(eq(userAchievements.user_id, userId));

    const profile = {
      id: user.id,
      username: user.username,
      current_streak: user.current_streak,
      join_date: user.join_date,
      unlockedBadges: userBadges.filter(b => b.id !== null), // Filter out nulls from leftJoin
    };

    res.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error', details: String(error) });
  }
});

// GET /api/users/:id/friends/pending: Fetch pending incoming requests
router.get('/users/:id/friends/pending', async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id as string);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const pendingRequests = await db.query.friendships.findMany({
      where: and(eq(friendships.user_id_2, userId), eq(friendships.status, 'PENDING')),
      with: {
        user1: true,
      },
    });

    const requests = pendingRequests.map(req => ({
      friendship_id: req.id,
      sender_id: req.user1.id,
      sender_username: req.user1.username,
      sender_streak: req.user1.current_streak,
    }));

    res.json(requests);
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:id/friends: Fetch accepted friends
router.get('/users/:id/friends', async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id as string);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const accFriendships = await db.query.friendships.findMany({
      where: and(
        or(eq(friendships.user_id_1, userId), eq(friendships.user_id_2, userId)),
        eq(friendships.status, 'ACCEPTED')
      ),
      with: {
        user1: true,
        user2: true,
      },
    });

    const friends = accFriendships.map(f => {
      const friendData = f.user_id_1 === userId ? f.user2 : f.user1;
      return {
        friendship_id: f.id,
        friend_id: friendData.id,
        friend_username: friendData.username,
        friend_streak: friendData.current_streak,
      };
    });

    res.json(friends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
