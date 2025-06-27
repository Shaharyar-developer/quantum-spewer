import { eq } from "drizzle-orm";
import db from "../../db";
import { bannedWords } from "../../db/schema";
import leventshtein from "fastest-levenshtein";
import natural from "natural";

/**
 * Moderation class for managing and checking banned words in content.
 * Handles loading, adding, removing, and matching banned words as whole words only.
 */
class LanguageModeration {
  /** List of banned words loaded from the database. */
  private static bannedWords: string[] = [];
  /** Compiled regex for matching banned words as whole words, case-insensitive and Unicode-aware. */
  private static bannedRegex: RegExp | null = null;
  /** Promise that resolves when the moderation service is ready for use. */
  private static loadingPromise: Promise<void> | null = null;
  /** Indicates if the moderation service is ready for use. */
  private isReady: boolean = false;

  /**
   * Initializes the Moderation service and loads banned words from the database.
   */
  constructor() {
    if (!LanguageModeration.loadingPromise) {
      LanguageModeration.loadingPromise = this.loadBannedWords();
    }
    LanguageModeration.loadingPromise.then(() => {
      this.isReady = true;
    });
  }

  /**
   * Ensures the moderation service is ready before proceeding.
   */
  private async ensureReady() {
    if (LanguageModeration.loadingPromise) {
      await LanguageModeration.loadingPromise;
      this.isReady = true;
    }
  }

  /**
   * Loads banned words from the database and compiles the regex for matching.
   */
  private async loadBannedWords() {
    const words = await db.query.bannedWords.findMany();
    LanguageModeration.bannedWords = words.map((row) => row.word);
    // Escape regex special characters and join with | for alternation
    const escaped = LanguageModeration.bannedWords.map((w) =>
      w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );
    // Only create regex if there are banned words
    if (escaped.length > 0) {
      LanguageModeration.bannedRegex = new RegExp(
        `\\b(${escaped.join("|")})\\b`,
        "iu"
      );
    } else {
      LanguageModeration.bannedRegex = null;
    }
  }

  /**
   * Adds new words to the banned list and updates the regex.
   * @param words The words to ban.
   * @returns Array of booleans: true if added, false if already present or on error.
   */
  public async addBannedWord(words: string[]): Promise<boolean[]> {
    await this.ensureReady();
    if (!words || words.length === 0) return [];
    const results: boolean[] = [];
    for (const word of words) {
      const lower = word.toLowerCase();
      if (LanguageModeration.bannedWords.includes(lower)) {
        results.push(false);
        continue;
      }
      try {
        await db.insert(bannedWords).values({ word: lower });
        LanguageModeration.bannedWords.push(lower);
        results.push(true);
      } catch {
        results.push(false);
      }
    }
    // Update the regex after adding new words
    const escaped = LanguageModeration.bannedWords.map((w) =>
      w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );
    if (escaped.length > 0) {
      LanguageModeration.bannedRegex = new RegExp(
        `\\b(${escaped.join("|")})\\b`,
        "iu"
      );
    } else {
      LanguageModeration.bannedRegex = null;
    }
    return results;
  }

  /**
   * Retrieves the list of currently banned words.
   * @returns Array of banned words.
   */
  public getBannedWords(): string[] {
    return LanguageModeration.bannedWords;
  }

  /**
   * Finds a banned word that is similar to the given word using Levenshtein distance.
   * @param word The word to check for fuzzy matches.
   * @returns The matched banned word if found, otherwise null.
   */
  public async fuzzyFindBannedWord(word: string): Promise<string | null> {
    await this.ensureReady();
    if (!word) return null;
    const threshold = 1;
    for (const bannedWord of LanguageModeration.bannedWords) {
      const distance = leventshtein.distance(word, bannedWord);
      if (distance <= threshold) {
        return bannedWord;
      }
    }
    return null;
  }

  /**
   * Removes a word from the banned list and updates the regex.
   * @param word The word to unban.
   * @returns True if removed, false if not present or on error.
   */
  public async removeBannedWord(word: string): Promise<boolean> {
    await this.ensureReady();
    if (!word) return false;
    // Case-insensitive check
    const index = LanguageModeration.bannedWords.findIndex(
      (w) => w.toLowerCase() === word.toLowerCase()
    );
    if (index === -1) return false;
    try {
      await db.delete(bannedWords).where(eq(bannedWords.word, word));
      LanguageModeration.bannedWords.splice(index, 1);
      // Update the regex after removing a word
      const escaped = LanguageModeration.bannedWords.map((w) =>
        w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      );
      if (escaped.length > 0) {
        LanguageModeration.bannedRegex = new RegExp(
          `\\b(${escaped.join("|")})\\b`,
          "iu"
        );
      } else {
        LanguageModeration.bannedRegex = null;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Removes words from the banned list and updates the regex.
   * @param words The words to unban.
   * @returns Array of booleans: true if removed, false if not present or on error.
   */
  public async removeBannedWords(words: string[]): Promise<boolean[]> {
    await this.ensureReady();
    if (!words || words.length === 0) return [];
    const results: boolean[] = [];
    for (const word of words) {
      if (!word) {
        results.push(false);
        continue;
      }
      // Case-insensitive check
      const index = LanguageModeration.bannedWords.findIndex(
        (w) => w.toLowerCase() === word.toLowerCase()
      );
      if (index === -1) {
        results.push(false);
        continue;
      }
      try {
        await db.delete(bannedWords).where(eq(bannedWords.word, word));
        LanguageModeration.bannedWords.splice(index, 1);
        results.push(true);
      } catch {
        results.push(false);
      }
    }
    // Update the regex after removing words
    const escaped = LanguageModeration.bannedWords.map((w) =>
      w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );
    if (escaped.length > 0) {
      LanguageModeration.bannedRegex = new RegExp(
        `\\b(${escaped.join("|")})\\b`,
        "iu"
      );
    } else {
      LanguageModeration.bannedRegex = null;
    }
    return results;
  }

  /**
   * Checks if the provided content contains any banned words or phrases (including stemming and fuzzy matching for words).
   * @param content The content to check.
   * @returns True if content is clean, false if any banned word or phrase is found.
   */
  public async isContentSafe(content: string): Promise<boolean> {
    await this.ensureReady();
    if (!content) return true;
    if (!LanguageModeration.bannedWords.length) return true;
    const tokenizer = new natural.WordTokenizer();
    const stemmer = natural.PorterStemmer;
    // Precompute stemmed banned words
    const bannedStems = LanguageModeration.bannedWords.map((w) =>
      stemmer.stem(w.toLowerCase())
    );
    const lowerContent = content.toLowerCase();
    // First, check for banned phrases (those containing spaces)
    for (const banned of LanguageModeration.bannedWords) {
      if (banned.includes(" ") && lowerContent.includes(banned.toLowerCase())) {
        return false;
      }
    }
    // Then, check for single word bans (stemming and fuzzy)
    const words = tokenizer.tokenize(content);
    for (const word of words) {
      const stemmed = stemmer.stem(word.toLowerCase());
      if (bannedStems.includes(stemmed)) {
        return false;
      }
      // Improved fuzzy match: only for words of length >= 6, and first char must match
      if (word.length >= 7) {
        for (const bannedWord of LanguageModeration.bannedWords) {
          if (
            !bannedWord.includes(" ") &&
            bannedWord.length >= 7 &&
            word.length > 0 &&
            bannedWord.length > 0 &&
            word[0] !== undefined &&
            bannedWord[0] !== undefined &&
            word[0].toLowerCase() === bannedWord[0].toLowerCase() &&
            natural.LevenshteinDistance(
              word.toLowerCase(),
              bannedWord.toLowerCase()
            ) === 1
          ) {
            return false;
          }
        }
      }
    }
    return true;
  }
}

/**
 * Singleton instance of LanguageModeration for use throughout the application.
 */
export default new LanguageModeration();
