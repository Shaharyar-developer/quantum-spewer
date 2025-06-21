import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { UselessFact } from "../facts";
import { getCorpoInsult } from "../insults";

const data = new SlashCommandBuilder()
  .setName("fact")
  .setDescription(
    "Replies with a random, completely and utterly useless fact."
  );

async function execute(interaction: ChatInputCommandInteraction) {
  const fact = await UselessFact.getRandomFact();
  const insult = await getCorpoInsult();

  const embed = new EmbedBuilder()
    .setTitle("Useless Fact")
    .setDescription(fact)
    .setColor(0x7289da)
    .setFooter({ text: insult });

  await interaction.reply({ embeds: [embed] });
}

export default { data, execute, cooldown: 10 } as const;
