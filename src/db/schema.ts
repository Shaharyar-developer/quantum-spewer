import * as p from "drizzle-orm/sqlite-core";

export const bannedWords = p.sqliteTable("banned_words", {
  word: p.text().primaryKey(),
});
export const nickMappings = p.sqliteTable("nick_mappings", {
  userId: p.text().primaryKey(),
  seed: p.text().notNull(),
});
export const keyValTimestamps = p.sqliteTable("key_val_timestamps", {
  key: p.text().primaryKey(),
  value: p.text(),
  timestamp: p.integer().notNull(),
});
export const userPoints = p.sqliteTable("user_points", {
  userId: p.text().primaryKey(),
  points: p.integer().notNull().default(0),
});