import { pgTable, serial, integer, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

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
