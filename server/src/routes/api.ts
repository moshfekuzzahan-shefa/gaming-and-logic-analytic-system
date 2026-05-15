import { Router, Request, Response } from 'express';
import { prisma } from '../prismaClient';

const router = Router();

// GET /api/levels: Returns all levels grouped by category
router.get('/levels', async (req: Request, res: Response) => {
  try {
    const categoriesWithLevels = await prisma.category.findMany({
      include: {
        levels: true,
      },
    });
    res.json(categoriesWithLevels);
  } catch (error) {
    console.error('Error fetching levels:', error);
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
    const questions = await prisma.question.findMany({
      where: {
        category_id: categoryId,
      },
    });
    res.json(questions);
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
    // Total XP (Sum of scores from successful attempts)
    const attempts = await prisma.attempt.findMany({
      where: {
        user_id: userId,
        is_success: true,
      },
    });
    
    const totalXP = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
    
    // Total Levels Passed (Unique level_ids from successful attempts)
    const uniqueLevelsPassed = new Set(attempts.map(a => a.level_id)).size;

    // Unlocked Badges
    const unlockedBadges = await prisma.user_Achievement.findMany({
      where: {
        user_id: userId,
      },
      include: {
        achievement: true,
      },
    });

    res.json({
      totalXP,
      totalLevelsPassed: uniqueLevelsPassed,
      unlockedBadges: unlockedBadges.map(ub => ub.achievement),
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

  // Mocked Judge0 Execution
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simple mocked logic: 
    // In a real scenario, this would send the code to Judge0, wait for compilation & execution,
    // and compare the standard output with expected output.
    // Here, we just do a dummy check: if code includes the expected output string, consider it a success.
    // For more generic mocking, we can randomly pass/fail or assume pass if not empty.
    let isSuccess = false;
    let actualOutput = '';

    if (expectedOutput && code.includes(expectedOutput)) {
       isSuccess = true;
       actualOutput = expectedOutput;
    } else if (!expectedOutput && code.trim().length > 0) {
       // If no expected output, just assume success if code is not empty
       isSuccess = true;
       actualOutput = 'Execution successful';
    } else {
       actualOutput = 'Output did not match expected, or syntax error occurred.';
    }

    res.json({
      isSuccess,
      output: actualOutput,
      timeTakenMs: Math.floor(Math.random() * 50) + 10, // Simulated execution time
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
    // 1. Save the attempt
    const newAttempt = await prisma.attempt.create({
      data: {
        user_id,
        level_id,
        time_taken,
        is_success,
        score: score || 0,
      },
    });

    const unlockedAchievements = [];

    // 2. Achievement Check Logic
    // Fetch user stats for evaluation
    const successfulAttempts = await prisma.attempt.findMany({
      where: { user_id, is_success: true },
    });
    const totalScore = successfulAttempts.reduce((sum, att) => sum + att.score, 0);

    // Fetch user's current unlocked achievements
    const existingUnlocks = await prisma.user_Achievement.findMany({
      where: { user_id },
      include: { achievement: true },
    });
    const existingCriteria = new Set(existingUnlocks.map(u => u.achievement.criteria));

    // Fetch all available achievements to evaluate
    const allAchievements = await prisma.achievement.findMany();

    for (const ach of allAchievements) {
      if (existingCriteria.has(ach.criteria)) continue; // Already unlocked

      let criteriaMet = false;

      switch (ach.criteria) {
        case 'first_success':
          if (successfulAttempts.length >= 1) criteriaMet = true;
          break;
        case 'fast_execution':
          // Arbitrary condition: completed an attempt successfully in under 1000ms
          if (is_success && time_taken < 1000) criteriaMet = true;
          break;
        case 'score_100':
          if (totalScore >= 100) criteriaMet = true;
          break;
      }

      if (criteriaMet) {
        await prisma.user_Achievement.create({
          data: {
            user_id,
            achievement_id: ach.id,
          },
        });
        unlockedAchievements.push(ach);
      }
    }

    res.json({
      attempt: newAttempt,
      unlockedAchievements,
    });

  } catch (error) {
    console.error('Error saving attempt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/leaderboard: Top 50 users ordered by current_streak desc
router.get('/leaderboard', async (req: Request, res: Response) => {
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

    const leaderboard = topUsers.map(user => {
      const totalScore = user.attempts.reduce((sum, att) => sum + att.score, 0);
      return {
        id: user.id,
        username: user.username,
        current_streak: user.current_streak,
        totalScore,
      };
    });

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
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
    // Check for existing friendship
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user_id_1: sender_id, user_id_2: receiver_id },
          { user_id_1: receiver_id, user_id_2: sender_id },
        ],
      },
    });

    if (existing) {
      return res.status(409).json({ error: 'Friendship request already exists or is processed' });
    }

    const newRequest = await prisma.friendship.create({
      data: {
        user_id_1: sender_id,
        user_id_2: receiver_id,
        status: 'PENDING',
      },
    });

    res.json(newRequest);
  } catch (error) {
    console.error('Error requesting friendship:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/friends/accept: Accept a friendship request
router.put('/friends/accept', async (req: Request, res: Response) => {
  const { friendship_id } = req.body;

  if (!friendship_id) {
    return res.status(400).json({ error: 'friendship_id is required' });
  }

  try {
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendship_id },
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    const updated = await prisma.friendship.update({
      where: { id: friendship_id },
      data: { status: 'ACCEPTED' },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error accepting friendship:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:id/profile: Fetch public profile
router.get('/users/:id/profile', async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id as string);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        achievements: {
          include: {
            achievement: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = {
      id: user.id,
      username: user.username,
      current_streak: user.current_streak,
      join_date: user.join_date,
      unlockedBadges: user.achievements.map(ua => ua.achievement),
    };

    res.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:id/friends/pending: Fetch pending incoming requests
router.get('/users/:id/friends/pending', async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id as string);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const pendingRequests = await prisma.friendship.findMany({
      where: {
        user_id_2: userId,
        status: 'PENDING',
      },
      include: {
        user_1: true, // Include sender details
      },
    });

    const requests = pendingRequests.map(req => ({
      friendship_id: req.id,
      sender_id: req.user_1.id,
      sender_username: req.user_1.username,
      sender_streak: req.user_1.current_streak,
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
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { user_id_1: userId },
          { user_id_2: userId },
        ],
        status: 'ACCEPTED',
      },
      include: {
        user_1: true,
        user_2: true,
      },
    });

    const friends = friendships.map(f => {
      // Return the user that is NOT the requested user
      const friendData = f.user_id_1 === userId ? f.user_2 : f.user_1;
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
