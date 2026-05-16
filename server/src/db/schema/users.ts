import { pgTable, serial, integer, varchar, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { attempts } from './attempts';
import { userAchievements } from './achievements';
import { friendships } from './friendships';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  current_streak: integer('current_streak').notNull().default(0),
  last_login: timestamp('last_login'),
  join_date: timestamp('join_date').notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  attempts: many(attempts),
  userAchievements: many(userAchievements),
  friendshipsInit: many(friendships, { relationName: 'user1_friendships' }),
  friendshipsRecv: many(friendships, { relationName: 'user2_friendships' }),
}));
