import { pgTable, serial, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { levels } from './levels';

export const attempts = pgTable('attempts', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id),
  level_id: integer('level_id').notNull().references(() => levels.id),
  time_taken: integer('time_taken').notNull(),
  is_success: boolean('is_success').notNull(),
  score: integer('score').notNull(),
});

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
