"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.friendshipsRelations = exports.userAchievementsRelations = exports.achievementsRelations = exports.attemptsRelations = exports.questionsRelations = exports.levelsRelations = exports.categoriesRelations = exports.usersRelations = exports.friendships = exports.userAchievements = exports.achievements = exports.attempts = exports.questions = exports.levels = exports.categories = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    username: (0, pg_core_1.varchar)('username', { length: 255 }).notNull().unique(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    current_streak: (0, pg_core_1.integer)('current_streak').notNull().default(0),
    last_login: (0, pg_core_1.timestamp)('last_login'),
    join_date: (0, pg_core_1.timestamp)('join_date').notNull().defaultNow(),
});
exports.categories = (0, pg_core_1.pgTable)('categories', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull().unique(),
    description: (0, pg_core_1.text)('description'),
});
exports.levels = (0, pg_core_1.pgTable)('levels', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    difficulty_level: (0, pg_core_1.varchar)('difficulty_level', { length: 50 }).notNull(),
    category_id: (0, pg_core_1.integer)('category_id').notNull().references(() => exports.categories.id),
});
exports.questions = (0, pg_core_1.pgTable)('questions', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    text: (0, pg_core_1.text)('text').notNull(),
    options: (0, pg_core_1.jsonb)('options').$type().notNull(), // PostgreSQL array representation or jsonb
    correct_answer: (0, pg_core_1.text)('correct_answer').notNull(),
    category_id: (0, pg_core_1.integer)('category_id').notNull().references(() => exports.categories.id),
});
exports.attempts = (0, pg_core_1.pgTable)('attempts', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    user_id: (0, pg_core_1.integer)('user_id').notNull().references(() => exports.users.id),
    level_id: (0, pg_core_1.integer)('level_id').notNull().references(() => exports.levels.id),
    time_taken: (0, pg_core_1.integer)('time_taken').notNull(),
    is_success: (0, pg_core_1.boolean)('is_success').notNull(),
    score: (0, pg_core_1.integer)('score').notNull(),
});
exports.achievements = (0, pg_core_1.pgTable)('achievements', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    badge_name: (0, pg_core_1.varchar)('badge_name', { length: 255 }).notNull(),
    criteria: (0, pg_core_1.varchar)('criteria', { length: 255 }).notNull(),
});
exports.userAchievements = (0, pg_core_1.pgTable)('user_achievements', {
    unlock_id: (0, pg_core_1.serial)('unlock_id').primaryKey(),
    user_id: (0, pg_core_1.integer)('user_id').notNull().references(() => exports.users.id),
    achievement_id: (0, pg_core_1.integer)('achievement_id').notNull().references(() => exports.achievements.id),
});
exports.friendships = (0, pg_core_1.pgTable)('friendships', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    user_id_1: (0, pg_core_1.integer)('user_id_1').notNull().references(() => exports.users.id),
    user_id_2: (0, pg_core_1.integer)('user_id_2').notNull().references(() => exports.users.id),
    status: (0, pg_core_1.varchar)('status', { length: 50 }).notNull(),
});
// Define relations for deep querying
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many }) => ({
    attempts: many(exports.attempts),
    userAchievements: many(exports.userAchievements),
    friendshipsInit: many(exports.friendships, { relationName: 'user1_friendships' }),
    friendshipsRecv: many(exports.friendships, { relationName: 'user2_friendships' }),
}));
exports.categoriesRelations = (0, drizzle_orm_1.relations)(exports.categories, ({ many }) => ({
    levels: many(exports.levels),
    questions: many(exports.questions),
}));
exports.levelsRelations = (0, drizzle_orm_1.relations)(exports.levels, ({ one, many }) => ({
    category: one(exports.categories, {
        fields: [exports.levels.category_id],
        references: [exports.categories.id],
    }),
    attempts: many(exports.attempts),
}));
exports.questionsRelations = (0, drizzle_orm_1.relations)(exports.questions, ({ one }) => ({
    category: one(exports.categories, {
        fields: [exports.questions.category_id],
        references: [exports.categories.id],
    }),
}));
exports.attemptsRelations = (0, drizzle_orm_1.relations)(exports.attempts, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.attempts.user_id],
        references: [exports.users.id],
    }),
    level: one(exports.levels, {
        fields: [exports.attempts.level_id],
        references: [exports.levels.id],
    }),
}));
exports.achievementsRelations = (0, drizzle_orm_1.relations)(exports.achievements, ({ many }) => ({
    userAchievements: many(exports.userAchievements),
}));
exports.userAchievementsRelations = (0, drizzle_orm_1.relations)(exports.userAchievements, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.userAchievements.user_id],
        references: [exports.users.id],
    }),
    achievement: one(exports.achievements, {
        fields: [exports.userAchievements.achievement_id],
        references: [exports.achievements.id],
    }),
}));
exports.friendshipsRelations = (0, drizzle_orm_1.relations)(exports.friendships, ({ one }) => ({
    user1: one(exports.users, {
        fields: [exports.friendships.user_id_1],
        references: [exports.users.id],
        relationName: 'user1_friendships',
    }),
    user2: one(exports.users, {
        fields: [exports.friendships.user_id_2],
        references: [exports.users.id],
        relationName: 'user2_friendships',
    }),
}));
//# sourceMappingURL=schema.js.map