import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { type TextCommand } from "../../types/textCommand";
import { textCommands } from "../textCommands";

export default {
  name: "coinflip",
  description: "Flip a coin and see the result",
  aliases: ["flip", "cf"],
  cooldown: 3,
  execute: async (message: Message, args: string[]) => {
    await message.delete().catch(() => {});

    const result = Math.random() < 0.5 ? "Heads" : "Tails";

    const embed = new EmbedBuilder()
      .setTitle("🪙 Coin Flip Result")
      .setDescription(`The coin landed on: **${result}**`)
      .setColor(0x89b4fa)
      .setTimestamp()
      .setFooter({
        text: `Flipped by ${message.author.username}`,
        iconURL: message.author.displayAvatarURL(),
      });

    if (
      "send" in message.channel &&
      typeof message.channel.send === "function"
    ) {
      await (message.channel as TextChannel).send({ embeds: [embed] });
    }
  },
} as TextCommand;