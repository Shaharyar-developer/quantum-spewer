import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import { getInsult } from "../insults";
import { getRandomActivity } from "../activities";

const data = new SlashCommandBuilder()
  .setName("random-activity")
  .setDescription("Get a random activity to do.");

async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const activity = await getRandomActivity();

  if (typeof activity === "string") {
    return await interaction.reply({
      content: activity,
      flags: MessageFlags.Ephemeral,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle("Random Activity 🎉")
    .setDescription(`**${activity.activity}**`)
    .addFields(
      { name: "Type", value: activity.type, inline: true },
      { name: "Accessibility", value: activity.accessibility, inline: true },
      {
        name: "Link",
        value: activity.link
          ? `[Click here](${activity.link})`
          : "`No link available`",
        inline: true,
      }
    )
    .setColor(0xcba6f7)
    .setFooter({ text: await getInsult() });

  await interaction.editReply({ embeds: [embed] });
}

export default { data, execute, cooldown: 10 } as const;
