import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import { getInsult } from "../insults";
import { getRandomChuckNorrisJoke } from "../chuck-norris";

const data = new SlashCommandBuilder()
  .setName("chuck-norris")
  .setDescription("Get a random Chuck Norris joke.");

async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const joke = await getRandomChuckNorrisJoke();
  const insult = await getInsult();

  const embed = new EmbedBuilder()
    .setTitle("Chuck Norris 🗿")
    .setDescription(joke)
    .setColor(0xcba6f7)
    .setFooter({ text: insult });

  await interaction.editReply({ embeds: [embed] });
}

export default { data, execute, cooldown: 10 } as const;
