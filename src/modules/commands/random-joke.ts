import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import { getInsult } from "../insults";
import { getRandomJoke, getDadJoke, getYoMamaJoke } from "../jokes";

const data = new SlashCommandBuilder()
  .setName("joke")
  .setDescription("Get a random joke or a dad joke.")
  .addStringOption((opt) =>
    opt
      .setName("type")
      .setDescription("Type of joke to fetch.")
      .setRequired(true)
      .addChoices(
        { name: "Random Joke", value: "random" },
        { name: "Dad Joke", value: "dad" },
        { name: "Yo Mama Joke", value: "yo-mama" }
      )
  );

async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  const type = interaction.options.getString("type");

  let joke: string | { setup: string; punchline: string } | null = null;

  if (type === "random") {
    joke = await getRandomJoke();
  } else if (type === "dad") {
    joke = await getDadJoke();
  } else if (type === "yo-mama") {
    joke = await getYoMamaJoke();
  }

  if (!joke) {
    return await interaction.reply({
      content: "No joke found.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle("Joke")
    .setDescription(typeof joke === "string" ? joke : joke.setup)
    .setColor(0xcba6f7)
    .setFooter({ text: await getInsult() });

  if (typeof joke !== "string") {
    embed.addFields({ name: "", value: `||${joke.punchline}||` });
  }

  await interaction.editReply({ embeds: [embed] });
}

export default { data, execute, cooldown: 10 } as const;
