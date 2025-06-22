import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { getInsult } from "../insults";
import { getRandomPoem } from "../poetry";

const data = new SlashCommandBuilder()
  .setName("poetry")
  .setDescription("Get a random poem");

async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const poem = await getRandomPoem();

  if (!poem) {
    return await interaction.editReply({
      content: "No poem found.",
    });
  }

  const embed = new EmbedBuilder()
    .setTitle(poem.title)
    .setDescription(poem.lines.join("\n"))
    .setColor(0xcba6f7)
    .addFields({ name: "Author", value: poem.author, inline: true })
    .addFields({
      name: "Lines",
      value: poem.linecount.toString(),
      inline: true,
    })
    .setFooter({ text: await getInsult() });

  await interaction.editReply({ embeds: [embed] });
}

export default { data, execute, cooldown: 10 } as const;
