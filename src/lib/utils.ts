import type { ChatInputCommandInteraction } from "discord.js";
import { getRandomChuckNorrisJoke } from "../modules/chuck-norris";
import { MODERATION_ROLE_IDS, MASTER_IDS } from "./constants";
import axios from "axios";

export const gloat = async (name: string): Promise<string> => {
  const joke = await getRandomChuckNorrisJoke();
  return joke.replace(/chuck norris|norris|chuck/gi, name);
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

export function getRandomWord(): Promise<string> {
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
      console.error("Error fetching random word:", error);
    });
}
