import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { type TextCommand } from "../../types/textCommand";

export default {
  name: "roulette-roll",
  description:
    "Roll a roulette wheel and get a random number between 0 and 36.",
  aliases: ["roulette", "roll-roulette"],
  cooldown: 10,
  execute: async (message: Message, args: string[]) => {
    console.log("=== ROULETTE-ROLL COMMAND EXECUTED ===");
    console.log("User:", message.author.username);
    console.log("Channel:", message.channel.id);
    console.log("Args:", args);

    // Roll a random number between 0 and 36
    const result = Math.floor(Math.random() * 37);
    console.log("Roulette result:", result);

    // Create an embed to display the result
    const embed = new EmbedBuilder()
      .setColor(0x00ff00) // Green color for success
      .setTitle("🎰 Roulette Roll Result")
      .setDescription(`You rolled: **${result}**`)
      .setTimestamp()
      .setFooter({
        text: `Requested by ${message.author.username}`,
        iconURL: message.author.displayAvatarURL(),
      });

    // Send the embed to the channel
    if (message.channel instanceof TextChannel) {
      await message.channel.send({ embeds: [embed] });
    } else {
      console.error("Command can only be used in text channels.");
    }
  },
} as TextCommand;
