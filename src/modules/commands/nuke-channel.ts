import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  ChannelType,
  TextChannel,
} from "discord.js";
import { hasModerationRole } from "../../lib/utils";

const data = new SlashCommandBuilder()
  .setName("nuke-channel")
  .setDescription(
    "Nuke the specifid channel, deleting all messages and resetting it."
  )
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("The channel to nuke")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("channelId")
      .setDescription("The ID of the channel to nuke (for verification)")
      .setRequired(true)
  );
async function execute(interaction: ChatInputCommandInteraction) {
  if (!hasModerationRole(interaction)) {
    return await interaction.reply({
      content: "You do not have permission to use this command.",
    });
  }
  await interaction.deferReply();

  const channel = interaction.options.getChannel("channel", true);
  const channelId = interaction.options.getString("channelId", true);

  if (channel.type !== ChannelType.GuildText) {
    return await interaction.editReply({
      content: "You can only nuke text channels.",
    });
  }

  // Cast to TextChannel
  const textChannel = channel as TextChannel;

  // Verify that the provided channel ID matches the selected channel
  if (channel.id !== channelId) {
    return await interaction.editReply({
      content:
        "⚠️ **SAFETY CHECK FAILED** ⚠️\nThe provided channel ID does not match the selected channel. Please verify the channel ID for safety.\n\n**Selected channel:** <#" +
        channel.id +
        ">\n**Provided ID:** `" +
        channelId +
        "`",
    });
  }

  // Additional safety check for important channels
  const sensitiveChannelNames = [
    "rules",
    "announcements",
    "welcome",
    "general",
    "mod",
    "admin",
  ];
  const channelName = textChannel.name.toLowerCase();
  if (sensitiveChannelNames.some((name) => channelName.includes(name))) {
    return await interaction.editReply({
      content: `⚠️ **WARNING** ⚠️\nYou're attempting to nuke a potentially important channel: **#${textChannel.name}**\n\nThis appears to be a sensitive channel. Please double-check that this is intentional. If you're sure, run the command again.`,
    });
  }

  // Clone the channel
  const cloned = await textChannel.clone({
    reason: `Nuked by ${interaction.user.tag}`,
  });
  // Set the position of the new channel to match the original
  await cloned.setPosition(textChannel.position);

  // Delete the original channel
  await textChannel.delete("Nuked by command");

  // Optionally, send a message in the new channel
  await cloned.send({
    embeds: [
      new EmbedBuilder()
        .setTitle(":boom: Channel Nuked :boom:")
        .setDescription(`This channel was nuked by <@${interaction.user.id}>!`)
        .setColor(0xff0000),
    ],
  });

  // Edit the interaction reply to confirm
  await interaction.editReply({
    content: `:boom: <#${cloned.id}> has been nuked!`,
  });
}

export default { data, execute } as const;
