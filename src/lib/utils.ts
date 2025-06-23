import type { ChatInputCommandInteraction } from "discord.js";
import { getRandomChuckNorrisJoke } from "../modules/chuck-norris";
import { MODERATION_ROLE_IDS, MASTER_IDS } from "./constants";

export const gloat = async (name: string): Promise<string> => {
  const joke = await getRandomChuckNorrisJoke();
  return joke.replace(/Chuck Norris|Chuck|Norris/g, name);
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
