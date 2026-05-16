import { pgTable, serial, integer, varchar, text, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { attempts } from './attempts';

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
  problem_statement: text('problem_statement'),
  boilerplate_code: text('boilerplate_code'),
  expected_output: text('expected_output'),
  reward_xp: integer('reward_xp').notNull().default(100),
});

export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  text: text('text').notNull(),
  options: jsonb('options').$type<string[]>().notNull(),
  correct_answer: text('correct_answer').notNull(),
  category_id: integer('category_id').notNull().references(() => categories.id),
});

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
