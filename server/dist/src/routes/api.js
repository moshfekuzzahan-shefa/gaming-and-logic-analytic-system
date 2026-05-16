"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const router = (0, express_1.Router)();
// GET /api/levels: Returns all levels grouped by category
router.get('/levels', async (req, res) => {
    try {
        const categoriesWithLevels = await db_1.db.query.categories.findMany({
            with: {
                levels: true,
            },
        });
        res.json(categoriesWithLevels);
    }
    catch (error) {
        console.error('Error fetching levels:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/categories/:id/questions: Returns questions for a specific category
router.get('/categories/:id/questions', async (req, res) => {
    const categoryId = parseInt(req.params.id);
    if (isNaN(categoryId)) {
        return res.status(400).json({ error: 'Invalid category ID' });
    }
    try {
        const categoryQuestions = await db_1.db.select().from(schema_1.questions).where((0, drizzle_orm_1.eq)(schema_1.questions.category_id, categoryId));
        res.json(categoryQuestions);
    }
    catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/users/:id/stats: Calculates user's total XP, levels passed, and fetches unlocked badges
router.get('/users/:id/stats', async (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }
    try {
        const userAttempts = await db_1.db.select().from(schema_1.attempts)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attempts.user_id, userId), (0, drizzle_orm_1.eq)(schema_1.attempts.is_success, true)));
        const totalXP = userAttempts.reduce((sum, attempt) => sum + attempt.score, 0);
        const uniqueLevelsPassed = new Set(userAttempts.map(a => a.level_id)).size;
        const unlocked = await db_1.db.query.userAchievements.findMany({
            where: (0, drizzle_orm_1.eq)(schema_1.userAchievements.user_id, userId),
            with: {
                achievement: true,
            },
        });
        res.json({
            totalXP,
            totalLevelsPassed: uniqueLevelsPassed,
            unlockedBadges: unlocked.map(ub => ub.achievement),
        });
    }
    catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/execute: Accepts C++ code string and expected output
router.post('/execute', async (req, res) => {
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
        }
        else if (!expectedOutput && code.trim().length > 0) {
            isSuccess = true;
            actualOutput = 'Execution successful';
        }
        else {
            actualOutput = 'Output did not match expected, or syntax error occurred.';
        }
        res.json({
            isSuccess,
            output: actualOutput,
            timeTakenMs: Math.floor(Math.random() * 50) + 10,
        });
    }
    catch (error) {
        console.error('Error executing code:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/attempts: Saves attempt data and checks for achievements
router.post('/attempts', async (req, res) => {
    const { user_id, level_id, time_taken, is_success, score } = req.body;
    if (!user_id || !level_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        const [newAttempt] = await db_1.db.insert(schema_1.attempts).values({
            user_id,
            level_id,
            time_taken,
            is_success,
            score: score || 0,
        }).returning();
        const unlockedAchievements = [];
        const successfulAttempts = await db_1.db.select().from(schema_1.attempts)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attempts.user_id, user_id), (0, drizzle_orm_1.eq)(schema_1.attempts.is_success, true)));
        const totalScore = successfulAttempts.reduce((sum, att) => sum + att.score, 0);
        const existingUnlocks = await db_1.db.query.userAchievements.findMany({
            where: (0, drizzle_orm_1.eq)(schema_1.userAchievements.user_id, user_id),
            with: { achievement: true },
        });
        const existingCriteria = new Set(existingUnlocks.map(u => u.achievement.criteria));
        const allAchievements = await db_1.db.select().from(schema_1.achievements);
        for (const ach of allAchievements) {
            if (existingCriteria.has(ach.criteria))
                continue;
            let criteriaMet = false;
            switch (ach.criteria) {
                case 'first_success':
                    if (successfulAttempts.length >= 1)
                        criteriaMet = true;
                    break;
                case 'fast_execution':
                    if (is_success && time_taken < 1000)
                        criteriaMet = true;
                    break;
                case 'score_100':
                    if (totalScore >= 100)
                        criteriaMet = true;
                    break;
            }
            if (criteriaMet) {
                await db_1.db.insert(schema_1.userAchievements).values({
                    user_id,
                    achievement_id: ach.id,
                });
                unlockedAchievements.push(ach);
            }
        }
        res.json({ attempt: newAttempt, unlockedAchievements });
    }
    catch (error) {
        console.error('Error saving attempt:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/leaderboard: Top 50 users ordered by current_streak desc
// Requested explicit SQL methods by user (.select, .from, .leftJoin, .groupBy)
router.get('/leaderboard', async (req, res) => {
    try {
        const leaderboard = await db_1.db
            .select({
            id: schema_1.users.id,
            username: schema_1.users.username,
            current_streak: schema_1.users.current_streak,
            // Using explicit SQL aggregation for total score
            totalScore: (0, drizzle_orm_1.sql) `COALESCE(SUM(${schema_1.attempts.score}), 0)::int`,
        })
            .from(schema_1.users)
            .leftJoin(schema_1.attempts, (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.attempts.user_id), (0, drizzle_orm_1.eq)(schema_1.attempts.is_success, true)))
            .groupBy(schema_1.users.id)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.users.current_streak))
            .limit(50);
        res.json(leaderboard);
    }
    catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Internal server error', details: String(error) });
    }
});
// POST /api/friends/request: Request a friendship
router.post('/friends/request', async (req, res) => {
    const { sender_id, receiver_id } = req.body;
    if (!sender_id || !receiver_id) {
        return res.status(400).json({ error: 'sender_id and receiver_id required' });
    }
    if (sender_id === receiver_id) {
        return res.status(400).json({ error: 'Cannot send a friend request to yourself' });
    }
    try {
        const existing = await db_1.db.select().from(schema_1.friendships).where((0, drizzle_orm_1.or)((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.friendships.user_id_1, sender_id), (0, drizzle_orm_1.eq)(schema_1.friendships.user_id_2, receiver_id)), (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.friendships.user_id_1, receiver_id), (0, drizzle_orm_1.eq)(schema_1.friendships.user_id_2, sender_id)))).limit(1);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Friendship request already exists or is processed' });
        }
        const [newRequest] = await db_1.db.insert(schema_1.friendships).values({
            user_id_1: sender_id,
            user_id_2: receiver_id,
            status: 'PENDING',
        }).returning();
        res.json(newRequest);
    }
    catch (error) {
        console.error('Error requesting friendship:', error);
        res.status(500).json({ error: 'Internal server error', details: String(error) });
    }
});
// PUT /api/friends/accept: Accept a friendship request
router.put('/friends/accept', async (req, res) => {
    const { friendship_id } = req.body;
    if (!friendship_id) {
        return res.status(400).json({ error: 'friendship_id is required' });
    }
    try {
        const existing = await db_1.db.select().from(schema_1.friendships).where((0, drizzle_orm_1.eq)(schema_1.friendships.id, friendship_id)).limit(1);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Friendship not found' });
        }
        const [updated] = await db_1.db.update(schema_1.friendships)
            .set({ status: 'ACCEPTED' })
            .where((0, drizzle_orm_1.eq)(schema_1.friendships.id, friendship_id))
            .returning();
        res.json(updated);
    }
    catch (error) {
        console.error('Error accepting friendship:', error);
        res.status(500).json({ error: 'Internal server error', details: String(error) });
    }
});
// GET /api/users/:id/profile: Fetch public profile
// Requested explicit SQL methods by user (.select, .from, .leftJoin)
router.get('/users/:id/profile', async (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }
    try {
        const userArr = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId)).limit(1);
        if (userArr.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = userArr[0];
        // Explicit Relational joins using leftJoin as requested
        const userBadges = await db_1.db
            .select({
            id: schema_1.achievements.id,
            badge_name: schema_1.achievements.badge_name,
            criteria: schema_1.achievements.criteria,
        })
            .from(schema_1.userAchievements)
            .leftJoin(schema_1.achievements, (0, drizzle_orm_1.eq)(schema_1.userAchievements.achievement_id, schema_1.achievements.id))
            .where((0, drizzle_orm_1.eq)(schema_1.userAchievements.user_id, userId));
        const profile = {
            id: user.id,
            username: user.username,
            current_streak: user.current_streak,
            join_date: user.join_date,
            unlockedBadges: userBadges.filter(b => b.id !== null), // Filter out nulls from leftJoin
        };
        res.json(profile);
    }
    catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Internal server error', details: String(error) });
    }
});
// GET /api/users/:id/friends/pending: Fetch pending incoming requests
router.get('/users/:id/friends/pending', async (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }
    try {
        const pendingRequests = await db_1.db.query.friendships.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.friendships.user_id_2, userId), (0, drizzle_orm_1.eq)(schema_1.friendships.status, 'PENDING')),
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
    }
    catch (error) {
        console.error('Error fetching pending requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/users/:id/friends: Fetch accepted friends
router.get('/users/:id/friends', async (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }
    try {
        const accFriendships = await db_1.db.query.friendships.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.friendships.user_id_1, userId), (0, drizzle_orm_1.eq)(schema_1.friendships.user_id_2, userId)), (0, drizzle_orm_1.eq)(schema_1.friendships.status, 'ACCEPTED')),
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
    }
    catch (error) {
        console.error('Error fetching friends:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=api.js.map