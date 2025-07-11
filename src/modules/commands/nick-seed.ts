import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";

import { getRandomWord, hasModerationRole } from "../../lib/utils";
import db from "../../db";
import { nickMappings } from "../../db/schema";

const data = new SlashCommandBuilder()
  .setName("nick-seed")
  .setDescription("Set nickname of any user based off of a random seed")
  .addUserOption((option) =>
    option.setName("user").setDescription("User to set nickname for")
  )
  .addStringOption((option) =>
    option
      .setName("seed")
      .setDescription("Seed to use for nickname generation")
      .setRequired(false)
  );
async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  if (!hasModerationRole(interaction)) {
    const errorEmbed = new EmbedBuilder()
      .setTitle("❌ Error")
      .setDescription(
        "You do not have permission to use this command. Please contact a moderator, or use list! command for help."
      )
      .setColor(0xff0000)
      .setTimestamp();

    await interaction.editReply({ embeds: [errorEmbed] });
    return;
  }
  const user = interaction.options.getUser("user") || interaction.user;
  const seed =
    interaction.options.getString("seed") ||
    Math.floor(Math.random() * 1000000).toString();

  const nickname = await getRandomWord(seed);

  try {
    await interaction?.guild?.members.cache.get(user.id)?.setNickname(nickname);
    await db.insert(nickMappings).values({
      userId: user.id,
      seed: seed,
    });

    const embed = new EmbedBuilder()
      .setTitle("Nickname Set")
      .setDescription(`Nickname for ${user.username} set to \`${nickname}\``)
      .setColor(0x00ff00);

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Error setting nickname:", error);
    const errorEmbed = new EmbedBuilder()
      .setTitle("❌ Error")
      .setDescription(
        "Failed to set the nickname. Please check my permissions."
      )
      .setColor(0xff0000)
      .setTimestamp();

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

export default { data, execute, cooldown: 5 } as const;
