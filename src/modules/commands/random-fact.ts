import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { getInsult } from "../insults";
import { UselessFact } from "../facts";

const data = new SlashCommandBuilder()
  .setName("fact")
  .setDescription(
    "Replies with a random, completely and utterly useless fact."
  );

async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  const fact = await UselessFact.getRandomFact();
  const insult = await getInsult();

  const embed = new EmbedBuilder()
    .setTitle("Useless Fact")
    .setDescription(fact)
    .setColor(0xcba6f7)
    .setFooter({ text: insult });

  await interaction.editReply({ embeds: [embed] });
}

export default { data, execute, cooldown: 10 } as const;
