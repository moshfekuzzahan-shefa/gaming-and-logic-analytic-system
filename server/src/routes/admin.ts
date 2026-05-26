import { Router, Request, Response } from 'express';
import { db } from '../db';
import { users } from '../db/schema/users';
import { levels, categories } from '../db/schema/levels';
import { attempts } from '../db/schema/attempts';
import { userAchievements } from '../db/schema/achievements';
import { friendships } from '../db/schema/friendships';
import { authenticateToken } from './auth';
import { desc, sql, eq, or } from 'drizzle-orm';

const router = Router();

// Middleware to verify Admin clearance
export const requireAdmin = (req: Request, res: Response, next: any) => {
  const user = (req as any).user;

  if (!user || user.role?.toLowerCase() !== 'admin') {
    return res.status(403).json({ error: 'Access Denied: Administrative privileges required' });
  }

  next();
};

// GET /api/admin/stats: Return stats and telemetry (Guarded by authenticateToken and requireAdmin)
router.get('/stats', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    // 1. Drizzle SQL Count Queries
    const [usersCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users);

    const [levelsCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(levels);

    const [attemptsCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(attempts);

    // 2. Fetch recent telemetry attempts with relations (joins)
    const recent = await db.query.attempts.findMany({
      limit: 5,
      orderBy: desc(attempts.id),
      with: {
        user: {
          columns: {
            username: true,
          }
        },
        level: {
          columns: {
            name: true,
          }
        }
      }
    } as any) as any[];

    // 3. Return clean payload
    res.json({
      stats: {
        totalUsers: usersCountResult?.count || 0,
        totalLevels: levelsCountResult?.count || 0,
        totalAttempts: attemptsCountResult?.count || 0,
      },
      recentAttempts: recent.map(r => ({
        id: r.id,
        username: r.user?.username || 'Unknown User',
        levelName: r.level?.name || 'Unknown Level',
        timeTaken: r.time_taken,
        isSuccess: r.is_success,
        score: r.score,
      }))
    });

  } catch (error) {
    console.error('Error fetching admin statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/users: Return list of all users (Guarded by authenticateToken and requireAdmin)
router.get('/users', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        join_date: users.join_date,
      })
      .from(users);

    res.json(allUsers);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/users/:id/role: Update user's role (Guarded by authenticateToken and requireAdmin)
router.put('/users/:id/role', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id as string, 10);
    const { role } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (role !== 'admin' && role !== 'player') {
      return res.status(400).json({ error: "Role must be 'admin' or 'player'" });
    }

    const updatedUsers = await db
      .update(users)
      .set({ role } as any)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        join_date: users.join_date,
      });

    if (updatedUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(updatedUsers[0]);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/users/:id: Delete user with cascading relations (Guarded by authenticateToken and requireAdmin)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id as string, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Perform deleting cascade in a transaction
    const deletedUser = await db.transaction(async (tx) => {
      // 1. Delete associated attempts
      await tx.delete(attempts).where(eq(attempts.user_id, userId));

      // 2. Delete associated achievements
      await tx.delete(userAchievements).where(eq(userAchievements.user_id, userId));

      // 3. Delete friendships
      await tx.delete(friendships).where(
        or(
          eq(friendships.user_id_1, userId),
          eq(friendships.user_id_2, userId)
        )
      );

      // 4. Delete user
      const result = await tx
        .delete(users)
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
        });

      return result;
    });

    if (deletedUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User and all related records deleted successfully', user: deletedUser[0] });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/levels: Fetch all levels with category names (Guarded by authenticateToken and requireAdmin)
router.get('/levels', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const allLevels = await db
      .select({
        id: levels.id,
        name: levels.name,
        difficulty_level: levels.difficulty_level,
        category_id: levels.category_id,
        category_name: categories.name,
        problem_statement: levels.problem_statement,
        boilerplate_code: levels.boilerplate_code,
        expected_output: levels.expected_output,
        reward_xp: levels.reward_xp,
      })
      .from(levels)
      .leftJoin(categories, eq(levels.category_id, categories.id));

    res.json(allLevels);
  } catch (error) {
    console.error('Error fetching admin levels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/levels: Create a new level (Guarded by authenticateToken and requireAdmin)
router.post('/levels', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      name,
      category_id,
      difficulty_level,
      reward_xp,
      problem_statement,
      boilerplate_code,
      expected_output
    } = req.body;

    if (!name || !category_id || !difficulty_level) {
      return res.status(400).json({ error: 'Missing required fields (name, category_id, difficulty_level)' });
    }

    const categoryIdNum = parseInt(category_id, 10);
    const rewardXpNum = parseInt(reward_xp, 10) || 100;

    if (isNaN(categoryIdNum)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    const [newLevel] = await db
      .insert(levels)
      .values({
        name,
        category_id: categoryIdNum,
        difficulty_level,
        reward_xp: rewardXpNum,
        problem_statement: problem_statement || '',
        boilerplate_code: boilerplate_code || '',
        expected_output: expected_output || '',
      } as any)
      .returning();

    res.status(201).json(newLevel);
  } catch (error) {
    console.error('Error creating level:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/levels/:id: Delete a level with cascading attempts (Guarded by authenticateToken and requireAdmin)
router.delete('/levels/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const levelId = parseInt(req.params.id as string, 10);

    if (isNaN(levelId)) {
      return res.status(400).json({ error: 'Invalid level ID' });
    }

    // Cascade delete attempts first inside a transaction
    const deletedLevel = await db.transaction(async (tx) => {
      // 1. Delete associated attempts
      await tx.delete(attempts).where(eq(attempts.level_id, levelId));

      // 2. Delete the level itself
      const result = await tx
        .delete(levels)
        .where(eq(levels.id, levelId))
        .returning();

      return result;
    });

    if (deletedLevel.length === 0) {
      return res.status(404).json({ error: 'Level not found' });
    }

    res.json({ message: 'Level and all associated attempts deleted successfully', level: deletedLevel[0] });
  } catch (error) {
    console.error('Error deleting level:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/categories: Fetch all categories for the dropdown
router.get('/categories', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const allCategories = await db.select().from(categories);
    res.json(allCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
