import { Message, EmbedBuilder } from "discord.js";
import { type TextCommand } from "../../types/textCommand";
import { textCommands } from "../textCommands";

export default {
  name: "list",
  description: "List all available text commands",
  aliases: ["help", "commands"],
  cooldown: 5,
  execute: async (message: Message, args: string[]) => {
    await message.delete().catch(() => {});

    // Get unique commands (avoid duplicates from aliases)
    const uniqueCommands = new Map<string, TextCommand>();

    textCommands.forEach((command, commandName) => {
      // Only add if it's the main command name (not an alias)
      if (command.name === commandName) {
        uniqueCommands.set(commandName, command);
      }
    });

    const commandList = Array.from(uniqueCommands.values());

    // Sort commands alphabetically
    commandList.sort((a, b) => a.name.localeCompare(b.name));

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle("📜 Available Text Commands")
      .setDescription(
        "Here are all the available text commands. Use `command!` to execute them."
      )
      .setColor(0x89b4fa)
      .setTimestamp()
      .setFooter({
        text: `Requested by ${message.author.username}`,
        iconURL: message.author.displayAvatarURL(),
      });

    // Create fields for commands
    let commandFields: string[] = [];

    commandList.forEach((command) => {
      let fieldText = `**${command.name}!**`;

      if (command.description) {
        fieldText += ` - ${command.description}`;
      }

      // Add aliases and cooldown info in a more visually appealing way
      let metaInfo: string[] = [];

      if (command.aliases && command.aliases.length > 0) {
        metaInfo.push(
          `Aliases: \`${command.aliases
            .map((alias) => `${alias}!`)
            .join("`, `")}\``
        );
      }

      if (command.cooldown && command.cooldown > 3) {
        metaInfo.push(`Cooldown: \`${command.cooldown}s\``);
      }

      if (metaInfo.length > 0) {
        fieldText += `\n${metaInfo.join(" • ")}`;
      }

      commandFields.push(fieldText);
    });

    // Split into multiple fields if too long
    const maxFieldLength = 1024;
    const maxDescriptionLength = 4096;
    let currentField = "";
    let fieldCount = 0;

    for (const commandField of commandFields) {
      const proposedField =
        currentField + (currentField ? "\n\n" : "") + commandField;

      if (proposedField.length > maxFieldLength || fieldCount >= 25) {
        // Add current field and start new one
        if (currentField) {
          embed.addFields({
            name: `Commands ${
              fieldCount === 0
                ? "(1/2)"
                : `(${fieldCount + 1}/${Math.ceil(commandFields.length / 10)})`
            }`,
            value: currentField,
            inline: false,
          });
          fieldCount++;
        }
        currentField = commandField;
      } else {
        currentField = proposedField;
      }
    }

    // Add the last field
    if (currentField) {
      embed.addFields({
        name:
          fieldCount === 0
            ? "Commands"
            : `Commands (${fieldCount + 1}/${Math.ceil(
                commandFields.length / 10
              )})`,
        value: currentField,
        inline: false,
      });
    }

    // Add a visual separator with blank field
    embed.addFields({
      name: "\u200b", // Zero-width space for invisible name
      value: "\u200b", // Zero-width space for invisible value
      inline: false,
    });

    // Add usage instructions
    embed.addFields({
      name: "📝 Usage",
      value:
        "Type `commandname!` followed by any arguments to use a command.\nExample: `encode! hello world`",
      inline: false,
    });

    embed.addFields({
      name: "ℹ️ Note",
      value: `Found ${commandList.length} unique commands. Some commands may have aliases for convenience.`,
      inline: false,
    });

    if (
      "send" in message.channel &&
      typeof message.channel.send === "function"
    ) {
      const sentMessage = await message.channel.send({
        embeds: [embed],
      });

      // Delete the embed after 30 seconds to keep chat clean
      setTimeout(() => sentMessage.delete().catch(() => {}), 30000);
    }
  },
} as TextCommand; 