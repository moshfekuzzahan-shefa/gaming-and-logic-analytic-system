import { pgTable, serial, integer, varchar, text, boolean, timestamp, foreignKey, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  current_streak: integer('current_streak').notNull().default(0),
  last_login: timestamp('last_login'),
  join_date: timestamp('join_date').notNull().defaultNow(),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: text('description'),
});

export const levels = pgTable('levels', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  difficulty_level: varchar('difficulty_level', { length: 50 }).notNull(),
  category_id: integer('category_id').notNull().references(() => categories.id),
});

export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  text: text('text').notNull(),
  options: jsonb('options').$type<string[]>().notNull(), // PostgreSQL array representation or jsonb
  correct_answer: text('correct_answer').notNull(),
  category_id: integer('category_id').notNull().references(() => categories.id),
});

export const attempts = pgTable('attempts', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id),
  level_id: integer('level_id').notNull().references(() => levels.id),
  time_taken: integer('time_taken').notNull(),
  is_success: boolean('is_success').notNull(),
  score: integer('score').notNull(),
});

export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  badge_name: varchar('badge_name', { length: 255 }).notNull(),
  criteria: varchar('criteria', { length: 255 }).notNull(),
});

export const userAchievements = pgTable('user_achievements', {
  unlock_id: serial('unlock_id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id),
  achievement_id: integer('achievement_id').notNull().references(() => achievements.id),
});

export const friendships = pgTable('friendships', {
  id: serial('id').primaryKey(),
  user_id_1: integer('user_id_1').notNull().references(() => users.id),
  user_id_2: integer('user_id_2').notNull().references(() => users.id),
  status: varchar('status', { length: 50 }).notNull(),
});

// Define relations for deep querying
export const usersRelations = relations(users, ({ many }) => ({
  attempts: many(attempts),
  userAchievements: many(userAchievements),
  friendshipsInit: many(friendships, { relationName: 'user1_friendships' }),
  friendshipsRecv: many(friendships, { relationName: 'user2_friendships' }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  levels: many(levels),
  questions: many(questions),
}));

export const levelsRelations = relations(levels, ({ one, many }) => ({
  category: one(categories, {
    fields: [levels.category_id],
    references: [categories.id],
  }),
  attempts: many(attempts),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  category: one(categories, {
    fields: [questions.category_id],
    references: [categories.id],
  }),
}));

export const attemptsRelations = relations(attempts, ({ one }) => ({
  user: one(users, {
    fields: [attempts.user_id],
    references: [users.id],
  }),
  level: one(levels, {
    fields: [attempts.level_id],
    references: [levels.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.user_id],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievement_id],
    references: [achievements.id],
  }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  user1: one(users, {
    fields: [friendships.user_id_1],
    references: [users.id],
    relationName: 'user1_friendships',
  }),
  user2: one(users, {
    fields: [friendships.user_id_2],
    references: [users.id],
    relationName: 'user2_friendships',
  }),
}));
