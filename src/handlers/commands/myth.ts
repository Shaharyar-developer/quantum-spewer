import ai from "../../lib/ai";
import { Message, EmbedBuilder, TextChannel, userMention } from "discord.js";
import { type TextCommand } from "../../types/textCommand";
import { MASTER_IDS } from "../../lib/constants";

export default {
  name: "myth",
  description: "Generate a myth about yourself based on your name.",
  aliases: ["mythos", "mythic"],
  cooldown: 60, // 1 minute cooldown
  execute: async (message: Message, args: string[]) => {
    message.reply("Removed for now...");
  },
} as TextCommand;
