import type { ChatInputCommandInteraction } from "discord.js";
import { getRandomChuckNorrisJoke } from "../modules/chuck-norris";
import { MODERATION_ROLE_IDS, MASTER_IDS } from "./constants";
import axios from "axios";
import db from "../db";
import { nickMappings } from "../db/schema";
import { eq } from "drizzle-orm";

export const gloat = async (name: string): Promise<string> => {
  const joke = await getRandomChuckNorrisJoke();
  return joke.replace(/chuck norris|norris|chuck|chucks/gi, name);
};

export function hasModerationRole(
  interaction: ChatInputCommandInteraction
): boolean {
  if (MASTER_IDS.includes(interaction.user.id)) return true;
  if (!interaction.member || !("roles" in interaction.member)) return false;
  const { roles } = interaction.member;
  if (Array.isArray(roles)) {
    return MODERATION_ROLE_IDS.some((roleId) => roles.includes(roleId));
  } else if (
    roles &&
    "cache" in roles &&
    typeof roles.cache.has === "function"
  ) {
    return MODERATION_ROLE_IDS.some((roleId) => roles.cache.has(roleId));
  }
  return false;
}

export function getRandomWord(seed?: string): Promise<string> {
  if (seed) {
    const seedUrl = `https://api.datamuse.com/words?ml=${encodeURIComponent(
      seed
    )}&max=1000`;
    return axios
      .get(seedUrl)
      .then((response) => {
        if (
          Array.isArray(response.data) &&
          response.data.length > 0 &&
          response.data[0].word
        ) {
          // Pick a random word from the seeded response
          const randomIndex = Math.floor(Math.random() * response.data.length);
          return response.data[randomIndex].word;
        } else {
          console.warn(
            `[getRandomWord] Datamuse API returned no results for seed: '${seed}'. Falling back to random word API.`
          );
          // Fallback to random word API
          return axios
            .get("https://random-word.ryanrk.com/api/en/word/random")
            .then((fallbackResponse) => {
              if (fallbackResponse.data && fallbackResponse.data[0]) {
                return fallbackResponse.data[0];
              } else {
                throw new Error("Fallback random word API also failed.");
              }
            });
        }
      })
      .catch((error) => {
        console.error(
          `[getRandomWord] Error fetching seeded random word for seed '${seed}':`,
          error
        );
        // Fallback to random word API on error
        return axios
          .get("https://random-word.ryanrk.com/api/en/word/random")
          .then((fallbackResponse) => {
            if (fallbackResponse.data && fallbackResponse.data[0]) {
              return fallbackResponse.data[0];
            } else {
              throw new Error("Fallback random word API also failed.");
            }
          })
          .catch((fallbackError) => {
            console.error(
              `[getRandomWord] Fallback random word API failed:`,
              fallbackError
            );
            return "nickname";
          });
      });
  } else {
    const url = "https://random-word.ryanrk.com/api/en/word/random";
    return axios
      .get(url)
      .then((response) => {
        if (response.data && response.data[0]) {
          return response.data[0];
        } else {
          throw new Error("Invalid response from random word API");
        }
      })
      .catch((error) => {
        console.error("[getRandomWord] Error fetching random word:", error);
        return "nickname";
      });
  }
}

export const findUserMappings = async (
  userId: string
): Promise<{ seed: string }[]> => {
  try {
    const mappings = await db.query.nickMappings.findMany({
      where(fields, operators) {
        return operators.eq(fields.userId, userId);
      },
    });
    return mappings.map((mapping) => ({ seed: mapping.seed }));
  } catch (error) {
    console.error("Error fetching user mappings:", error);
    return [];
  }
};
export const insertOrUpdateUserMapping = async (
  userId: string,
  seed: string
): Promise<void> => {
  try {
    const existingMapping = await db.query.nickMappings.findFirst({
      where(fields, operators) {
        return operators.eq(fields.userId, userId);
      },
    });

    if (existingMapping) {
      await db
        .update(nickMappings)
        .set({ seed })
        .where(eq(nickMappings.userId, userId));
    } else {
      await db.insert(nickMappings).values({ userId, seed });
    }
  } catch (error) {
    console.error("Error inserting or updating user mapping:", error);
  }
};