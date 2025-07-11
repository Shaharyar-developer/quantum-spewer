import * as p from "drizzle-orm/sqlite-core";

export const bannedWords = p.sqliteTable("banned_words", {
  word: p.text().primaryKey(),
});
export const nickMappings = p.sqliteTable("nick_mappings", {
  userId: p.text().primaryKey(),
  seed: p.text().notNull(),
});