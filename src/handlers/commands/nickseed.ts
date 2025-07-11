import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { type TextCommand } from "../../types/textCommand";
import db from "../../db";
import { getRandomWord } from "../../lib/utils";
import { nickMappings } from "../../db/schema";

export default {
  name: "nick_seed",
  description: "Set your nickname based off of a random seed",
  aliases: ["ns", "nick"],
  cooldown: 5,
  execute: async (message: Message, args: string[]) => {
    await message.delete().catch(() => {});

    const seed = Math.floor(Math.random() * 1000000).toString();
    const nickname = await getRandomWord(seed);

    try {
      await message.member?.setNickname(nickname);
      await db.insert(nickMappings).values({
        userId: message.author.id,
        seed: seed,
      });
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
