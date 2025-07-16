import type { ChatInputCommandInteraction } from "discord.js";
import { getRandomChuckNorrisJoke } from "../modules/chuck-norris";
import { MODERATION_ROLE_IDS, MASTER_IDS } from "./constants";
import axios from "axios";
import db from "../db";
import { nickMappings } from "../db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { keyValTimestamps } from "../db/schema";

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

export const insertTimestamp = async (
  key = nanoid(),
  value: string,
  timestamp: number
) => {
  try {
    await db.insert(keyValTimestamps).values({
      key,
      value,
      timestamp,
    });
  } catch (error) {
    console.error("Error inserting timestamp:", error);
  }
};


export const mapD2ItemType = (itemType: number): string => {
  switch (itemType) {
    case 0:
      return "None";
    case 1:
      return "Currency";
    case 2:
      return "Armor";
    case 3:
      return "Weapon";
    case 7:
      return "Message";
    case 8:
      return "Engram";
    case 9:
      return "Consumable";
    case 10:
      return "Exchange Material";
    case 11:
      return "Mission Reward";
    case 12:
      return "Quest Step";
    case 13:
      return "Quest Step Complete";
    case 14:
      return "Emblem";
    case 15:
      return "Quest";
    case 16:
      return "Subclass";
    case 17:
      return "Clan Banner";
    case 18:
      return "Aura";
    case 19:
      return "Mod";
    case 20:
      return "Dummy";
    case 21:
      return "Ship";
    case 22:
      return "Vehicle";
    case 23:
      return "Emote";
    case 24:
      return "Ghost";
    case 25:
      return "Package";
    case 26:
      return "Bounty";
    case 27:
      return "Wrapper";
    case 28:
      return "Seasonal Artifact";
    case 29:
      return "Finisher";
    case 30:
      return "Pattern";
    default:
      return `Unknown (${itemType})`;
  }
};

export const mapD2ItemSubType = (itemSubType: number): string => {
  switch (itemSubType) {
    case 0:
      return "None";
    case 1:
      return "Crucible";
    case 2:
      return "Vanguard";
    case 5:
      return "Exotic";
    case 6:
      return "Auto Rifle";
    case 7:
      return "Shotgun";
    case 8:
      return "Machine Gun";
    case 9:
      return "Hand Cannon";
    case 10:
      return "Rocket Launcher";
    case 11:
      return "Fusion Rifle";
    case 12:
      return "Sniper Rifle";
    case 13:
      return "Pulse Rifle";
    case 14:
      return "Scout Rifle";
    case 16:
      return "CRM";
    case 17:
      return "Sidearm";
    case 18:
      return "Sword";
    case 19:
      return "Mask";
    case 20:
      return "Shader";
    case 21:
      return "Ornament";
    case 22:
      return "Fusion Rifle Line";
    case 23:
      return "Grenade Launcher";
    case 24:
      return "Submachine Gun";
    case 25:
      return "Trace Rifle";
    case 26:
      return "Helmet";
    case 27:
      return "Gauntlets";
    case 28:
      return "Chest Armor";
    case 29:
      return "Leg Armor";
    case 30:
      return "Class Armor";
    case 31:
      return "Bow";
    case 32:
      return "Dummy Repeatable Bounty";
    case 33:
      return "Glaive";
    default:
      return `Unknown (${itemSubType})`;
  }
};

export const mapD2DamageType = (damageType: number): string => {
  switch (damageType) {
    case 0:
      return "None";
    case 1:
      return "Kinetic";
    case 2:
      return "Arc";
    case 3:
      return "Solar";
    case 4:
      return "Void";
    case 5:
      return "Raid";
    case 6:
      return "Stasis";
    case 7:
      return "Strand";
    default:
      return `Unknown (${damageType})`;
  }
};

export const mapD2AmmoType = (ammoType: number): string => {
  switch (ammoType) {
    case 0:
      return "None";
    case 1:
      return "Primary";
    case 2:
      return "Special";
    case 3:
      return "Heavy";
    case 4:
      return "Unknown";
    default:
      return `Unknown (${ammoType})`;
  }
};