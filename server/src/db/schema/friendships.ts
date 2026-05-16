import { pgTable, serial, integer, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const friendships = pgTable('friendships', {
  id: serial('id').primaryKey(),
  user_id_1: integer('user_id_1').notNull().references(() => users.id),
  user_id_2: integer('user_id_2').notNull().references(() => users.id),
  status: varchar('status', { length: 50 }).notNull(),
});

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
