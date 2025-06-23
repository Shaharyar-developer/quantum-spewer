import * as p from "drizzle-orm/sqlite-core";

export const bannedWords = p.sqliteTable("banned_words", {
  word: p.text().primaryKey(),
});
