import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { getInsult } from "../insults";
import axios from "axios";

async function getTechBS(): Promise<string> {
  const url = "https://techy-api.vercel.app/api/text";
  try {
    const response = await axios.get(url);
    return response.data;
  } catch {
    return "Failed to fetch tech BS. Please try again later.";
  }
}

async function getCorpoBS(): Promise<string> {
  const url = "https://corporatebs-generator.sameerkumar.website/";
  try {
    const response = await axios.get(url);
    return response.data.phrase;
  } catch {
    return "Failed to fetch corporate BS. Please try again later.";
  }
}

const data = new SlashCommandBuilder()
  .setName("bullshit")
  .setDescription("Get some bullshit (tech or corporate).")
  .addStringOption((option) =>
    option
      .setName("type")
      .setDescription("Type of bullshit")
      .setRequired(true)
      .addChoices(
        { name: "Tech", value: "tech" },
        { name: "Corporate", value: "corpo" }
      )
  );

async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  const type = interaction.options.getString("type", true);

  let bs: string;
  let title: string;
  if (type === "tech") {
    bs = await getTechBS();
    title = "Tech Bullshit";
  } else {
    bs = await getCorpoBS();
    title = "Corporate Bullshit";
  }

  if (!bs) {
    return await interaction.editReply({
      content: `No ${type} bullshit found.`,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(bs)
    .setColor(0xcba6f7)
    .setFooter({ text: await getInsult() });

  await interaction.editReply({ embeds: [embed] });
}

export default { data, execute, cooldown: 10 } as const;
