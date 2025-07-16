import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { type TextCommand } from "../../types/textCommand";
import { getRandomWord, insertOrUpdateUserMapping } from "../../lib/utils";

export default {
  name: "nick_seed",
  description: "Set your nickname based off of a random seed",
  aliases: ["ns", "nick"],
  cooldown: 5,
  execute: async (message: Message, args: string[]) => {
    console.log(
      `[nickseed] Command executed by user ${message.author.id} (${message.author.username}) with args:`,
      args
    );

    const seed = args.length > 0 && args.join(" ");

    if (!seed) {
      console.error("[nickseed] No seed provided in arguments.");
      return message.reply("Please provide a seed to generate your nickname.");
    }

    console.log(`[nickseed] Generated/received seed: "${seed}"`);

    const nickname = await getRandomWord(seed);
    console.log(
      `[nickseed] Generated nickname: "${nickname}" for seed: "${seed}"`
    );

    try {
      let member = message.member;
      if (!member && message.guild) {
        console.log(
          `[nickseed] Member not cached, fetching from guild: ${message.guild.id}`
        );
        member = await message.guild.members.fetch(message.author.id);
      }
      if (!member) {
        console.error(
          `[nickseed] Member not found in guild for user ${message.author.id}`
        );
        throw new Error("Member not found in guild.");
      }

      console.log(
        `[nickseed] Setting nickname "${nickname}" for member ${member.user.username} (${member.user.id})`
      );
      await member.setNickname(nickname);

      console.log(
        `[nickseed] Inserting/updating user mapping for user ${message.author.id} with seed "${seed}"`
      );
      await insertOrUpdateUserMapping(message.author.id, seed);

      console.log(
        `[nickseed] Successfully set nickname and updated database for user ${message.author.id}`
      );

      const successEmbed = new EmbedBuilder()
        .setTitle("✅ Nickname Set")
        .setDescription(
          `Your nickname has been set to \`${nickname}\` using seed: \`${seed}\``
        )
        .setColor(0x00ff00)
        .setTimestamp();

      const reply = await message.reply({ embeds: [successEmbed] });
      setTimeout(() => reply.delete().catch(() => {}), 5000);
    } catch (error) {
      console.error("Error setting nickname:", error);
      const errorEmbed = new EmbedBuilder()
        .setTitle("❌ Error")
        .setDescription(
          "Failed to set your nickname. Something went wrong it seems."
        )
        .setColor(0xff0000)
        .setTimestamp();

      const reply = await message.reply({ embeds: [errorEmbed] });
      setTimeout(() => reply.delete().catch(() => {}), 5000);
    }
    await message.delete().catch(() => {}); // Clean up the command message
  },
} as TextCommand;
