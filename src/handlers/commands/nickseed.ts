import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { type TextCommand } from "../../types/textCommand";
import db from "../../db";
import { getRandomWord, insertOrUpdateUserMapping } from "../../lib/utils";
import { nickMappings } from "../../db/schema";

export default {
  name: "nick_seed",
  description: "Set your nickname based off of a random seed",
  aliases: ["ns", "nick"],
  cooldown: 5,
  execute: async (message: Message, args: string[]) => {
    await message.delete().catch(() => {});

    const seed =
      args.length > 0
        ? args.join(" ")
        : Math.floor(Math.random() * 1000000).toString();
    const nickname = await getRandomWord(seed);

    try {
      let member = message.member;
      if (!member && message.guild) {
        member = await message.guild.members.fetch(message.author.id);
      }
      if (!member) {
        throw new Error("Member not found in guild.");
      }
      await member.setNickname(nickname);
      await insertOrUpdateUserMapping(message.author.id, seed);
    } catch (error) {
      console.error("Error setting nickname:", error);
      const errorEmbed = new EmbedBuilder()
        .setTitle("❌ Error")
        .setDescription(
          "Failed to set your nickname. Something went wrong it seems."
        )
        .setColor(0xff0000)
        .setTimestamp();

      if (
        "send" in message.channel &&
        typeof message.channel.send === "function"
      ) {
        await (message.channel as TextChannel).send({ embeds: [errorEmbed] });
      }
    }
  },
} as TextCommand;
