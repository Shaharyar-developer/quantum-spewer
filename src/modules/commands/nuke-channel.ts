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
  );
async function execute(interaction: ChatInputCommandInteraction) {
  if (!hasModerationRole(interaction)) {
    return await interaction.reply({
      content: "You do not have permission to use this command.",
    });
  }
  await interaction.deferReply();

  const channel = interaction.options.getChannel("channel", true);
  if (channel.type !== ChannelType.GuildText) {
    return await interaction.editReply({
      content: "You can only nuke text channels.",
    });
  }

  // Cast to TextChannel
  const textChannel = channel as TextChannel;

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
