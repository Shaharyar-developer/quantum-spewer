import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { getInsult } from "../insults";
import axios from "axios";

async function getAdvice(): Promise<string> {
  const url = "https://api.adviceslip.com/advice";
  try {
    const response = await axios.get(url);
    return response.data.slip.advice;
  } catch {
    return "Failed to fetch advice. Please try again later.";
  }
}

const data = new SlashCommandBuilder()
  .setName("advise")
  .setDescription("Get a random piece of advice.")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("User to send advice to")
      .setRequired(true)
  );

async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user", true);
  const advice = await getAdvice();

  const embed = new EmbedBuilder()
    .setTitle("💡 Here's a piece of advice:")
    .setDescription(advice)
    .setColor(0xcba6f7)
    .setFooter({
      text: await getInsult(1),
    });

  await interaction.reply({
    content: `<@${user.id}>`,
    embeds: [embed],
  });
}

export default {
  data,
  execute,
  cooldown: 3,
};
