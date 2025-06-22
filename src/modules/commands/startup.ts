import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { getInsult } from "../insults";
import axios from "axios";

async function getMillionDollarIdea(): Promise<string> {
  const url = "https://itsthisforthat.com/api.php?text";
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch million dollar idea:", error);
    return "Failed to fetch a million dollar idea. Please try again later.";
  }
}
const data = new SlashCommandBuilder()
  .setName("milliondollaridea")
  .setDescription("Get a million dollar idea.")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("User to send the idea to")
      .setRequired(true)
  );
async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user", true);
  const idea = await getMillionDollarIdea();

  const embed = new EmbedBuilder()
    .setTitle("🖤 Here's a million dollar idea my bestest friend")
    .setDescription(idea)
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
