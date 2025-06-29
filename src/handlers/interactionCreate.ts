import type { Command } from "../init";
import {
  Events,
  Client,
  Collection,
  Message,
  TextChannel,
  EmbedBuilder,
} from "discord.js";
import trivia from "../modules/commands/trivia";
import morseCode from "../lib/morse-code";
import LanguageModeration from "../modules/mod/lang";

export default function handleInteractionCreate(
  client: Client,
  commands: Collection<string, Command>,
  cooldowns: Collection<string, Collection<string, number>>
) {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) {
      /**
       * Handles trivia answer button interactions.
       * Delegates to the trivia module's handleButton method.
       */
      // ===================== Trivia Button Handler =====================
      if (
        interaction.customId &&
        interaction.customId.startsWith("trivia_answer_")
      ) {
        if (!interaction.replied && !interaction.deferred) {
          if (trivia && typeof trivia.handleButton === "function") {
            await trivia.handleButton(interaction);
          }
        }
        return;
      }
      /**
       * Handles Morse code translation button interactions.
       * Replies with the decoded translation as an ephemeral message.
       */
      // ===================== Morse Code Translation Button Handler =====================
      if (
        interaction.customId &&
        interaction.customId.startsWith("show-translation-")
      ) {
        if (!interaction.replied && !interaction.deferred) {
          const embed = interaction.message.embeds[0];
          if (!embed || !embed.description) return;
          const morseMatch = embed.description.match(/`([^`]*)`/);
          if (!morseMatch) return;
          const morseText = morseMatch[1];
          const translation = morseCode.decode(morseText ?? "");
          await interaction.reply({
            content: `**Translation:**\n\`${translation}\``,
            ephemeral: true,
          });
        }
        return;
      }
      /**
       * Handles Morse code message delete button interactions.
       * Only the original author can delete their Morse code message.
       */
      // ===================== Morse Code Delete Button Handler =====================
      if (
        interaction.customId &&
        interaction.customId.startsWith("delete-morse-")
      ) {
        const parts = interaction.customId.split("-");
        const originalAuthorId = parts[3];
        if (interaction.user.id !== originalAuthorId) {
          await interaction.reply({
            content: "Only the original author can delete this message.",
            ephemeral: true,
          });
          return;
        }
        await interaction.message.delete().catch(() => {});
        return;
      }
      /**
       * Handles embed delete button interactions.
       * Only the creator of the embed can delete it.
       */
      // ===================== Embed Delete Button Handler =====================
      if (
        interaction.customId &&
        interaction.customId.startsWith("delete-embed-")
      ) {
        const creatorId = interaction.customId.split("-")[2];
        if (interaction.user.id !== creatorId) {
          await interaction.reply({
            content: "Only the creator of this embed can delete it.",
            ephemeral: true,
          });
          return;
        }
        await interaction.message.delete().catch(() => {});
        return;
      }
      /**
       * Handles embed edit button interactions.
       * Only the creator of the embed can edit it. Prompts for new content and updates the embed if allowed.
       */
      // ===================== Embed Edit Button Handler =====================
      if (
        interaction.customId &&
        interaction.customId.startsWith("edit-embed-")
      ) {
        const creatorId = interaction.customId.split("-")[2];
        if (interaction.user.id !== creatorId) {
          await interaction.reply({
            content: "Only the creator of this embed can edit it.",
            ephemeral: true,
          });
          return;
        }
        await interaction.reply({
          content:
            "Send a new message with the new embed content within 60 seconds.",
          ephemeral: true,
        });
        if (!interaction.channel) return;
        const textChannel = interaction.channel as TextChannel;
        const filter = (m: Message) =>
          m.author.id === interaction.user.id &&
          m.channel.id === interaction.channelId;
        const collector = textChannel.createMessageCollector({
          filter,
          max: 1,
          time: 60000,
        });
        collector.on("collect", async (m: Message) => {
          const newContent = m.content.trim();
          const isSafe = await LanguageModeration.isContentSafe(newContent);
          if (!isSafe) {
            await m.reply({
              content: "Your new embed content was not allowed.",
              allowedMentions: { repliedUser: false },
            });
            return;
          }
          const oldEmbed = interaction.message.embeds[0];
          if (!oldEmbed) return;
          const newEmbed = EmbedBuilder.from(oldEmbed.toJSON())
            .setDescription(newContent)
            .setTimestamp();
          await interaction.message.edit({ embeds: [newEmbed] });
          // Delete the user's message after successful edit
          await m.delete().catch(() => {});
        });
        collector.on("end", (collected, _reason) => {
          if (collected.size === 0) {
            interaction.followUp({
              content: "No new content received. Edit cancelled.",
              ephemeral: true,
            });
          }
        });
        return;
      }
    }
    /**
     * Handles slash command interactions, including cooldown logic and error handling.
     */
    // ===================== Slash Command Handler =====================
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    if (!cooldowns.has(command.data.name)) {
      cooldowns.set(command.data.name, new Collection());
    }
    const now = Date.now();
    const timestamps = cooldowns.get(command.data.name)!;
    const cooldownAmount = (command.cooldown ?? 3) * 1000;

    if (timestamps.has(interaction.user.id)) {
      const expirationTime =
        timestamps.get(interaction.user.id)! + cooldownAmount;
      if (now < expirationTime) {
        const expiredTimestamp = Math.round(expirationTime / 1000);
        return interaction.reply({
          content: `Pray, thou must wait ere thou usest the \`${command.data.name}\` command again. Return <t:${expiredTimestamp}:R>, good traveler.`,
          ephemeral: true,
        });
      }
    }
    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(
        `Error executing command ${interaction.commandName}:`,
        error
      );
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    }
  });
}
