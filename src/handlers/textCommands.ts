import {
  Client,
  Collection,
  Events,
  Message,
  type PartialMessage,
} from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { type TextCommand } from "../types/textCommand";

// Collections for text commands and cooldowns
const textCommands = new Collection<string, TextCommand>();
const textCooldowns = new Collection<string, Collection<string, number>>();

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load text commands dynamically
const textCommandsPath = path.join(__dirname, "commands");
const textCommandFiles = fs
  .readdirSync(textCommandsPath)
  .filter((file) => file.endsWith(".js") || file.endsWith(".ts"));

for (const file of textCommandFiles) {
  const filePath = path.join(textCommandsPath, file);
  const { default: textCommand }: { default: TextCommand } = await import(
    `file://${filePath}`
  );

  if (
    textCommand &&
    textCommand.name &&
    typeof textCommand.execute === "function"
  ) {
    // Normalize command name (replace hyphens with underscores)
    const normalizedName = textCommand.name.replace(/-/g, "_");
    textCommands.set(normalizedName, textCommand);
    console.log(
      `Registered command: ${normalizedName} (original: ${textCommand.name})`
    );

    // Also register aliases if they exist
    if (textCommand.aliases) {
      textCommand.aliases.forEach((alias) => {
        // Normalize alias names too
        const normalizedAlias = alias.replace(/-/g, "_");
        textCommands.set(normalizedAlias, textCommand);
        console.log(
          `Registered alias: ${normalizedAlias} (original: ${alias})`
        );
      });
    }
  } else {
    console.error(
      `The text command at ${filePath} is missing a required "name" or "execute" property.`
    );
  }
}

// Helper function to parse text commands
function parseTextCommand(
  content: string
): { command: string; args: string[] } | null {
  const match = content.match(/^([\w-]+)!\s*(.*)/);
  if (!match || !match[1]) return null;

  // Normalize hyphens to underscores for command matching
  const command = match[1]?.toLowerCase().replace(/-/g, "_");
  const args = match[2] ? match[2].split(/\s+/) : [];

  return { command, args };
}

// Helper function to handle cooldowns
function handleCooldown(command: TextCommand, userId: string): number | null {
  if (!textCooldowns.has(command.name)) {
    textCooldowns.set(command.name, new Collection());
  }

  const now = Date.now();
  const timestamps = textCooldowns.get(command.name)!;
  const cooldownAmount = (command.cooldown ?? 3) * 1000;

  if (timestamps.has(userId)) {
    const expirationTime = timestamps.get(userId)! + cooldownAmount;
    if (now < expirationTime) {
      return expirationTime;
    }
  }

  timestamps.set(userId, now);
  setTimeout(() => timestamps.delete(userId), cooldownAmount);

  return null;
}

// Main text command handler
export default function handleTextCommands(client: Client) {
  // Handle message creation
  client.on(Events.MessageCreate, async (message: Message) => {
    if (!client.user || message.author.id === client.user.id) return;

    const parsed = parseTextCommand(message.content);
    if (!parsed) return;

    const textCommand = textCommands.get(parsed.command);
    if (!textCommand) return;

    // Check cooldown
    const cooldownExpiration = handleCooldown(textCommand, message.author.id);
    if (cooldownExpiration) {
      const expiredTimestamp = Math.round(cooldownExpiration / 1000);
      const cooldownMsg = await message.reply({
        content: `Pray, thou must wait ere thou usest the \`${textCommand.name}\` command again. Return <t:${expiredTimestamp}:R>, good traveler.`,
      });

      setTimeout(() => cooldownMsg.delete().catch(() => {}), 5000);
      return;
    }

    try {
      await textCommand.execute(message, parsed.args);
    } catch (error) {
      console.error(`Error executing text command ${textCommand.name}:`, error);

      const errorMsg = await message.reply({
        content: "There was an error while executing this command!",
      });

      setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
    }
  });

  // Handle message updates for commands that support it
  client.on(
    Events.MessageUpdate,
    async (
      oldMessage: Message | PartialMessage,
      newMessage: Message | PartialMessage
    ) => {
      if (
        !client.user ||
        !newMessage.author ||
        newMessage.author.id === client.user.id
      )
        return;
      if (!newMessage.content) return;

      const parsed = parseTextCommand(newMessage.content);
      if (!parsed) return;

      const textCommand = textCommands.get(parsed.command);
      if (!textCommand || !textCommand.executeOnUpdate) return;

      // Check cooldown
      const cooldownExpiration = handleCooldown(
        textCommand,
        newMessage.author.id
      );
      if (cooldownExpiration) {
        const expiredTimestamp = Math.round(cooldownExpiration / 1000);
        const cooldownMsg = await (newMessage as Message).reply({
          content: `Pray, thou must wait ere thou usest the \`${textCommand.name}\` command again. Return <t:${expiredTimestamp}:R>, good traveler.`,
        });

        setTimeout(() => cooldownMsg.delete().catch(() => {}), 5000);
        return;
      }

      try {
        await textCommand.execute(newMessage as Message, parsed.args);
      } catch (error) {
        console.error(
          `Error executing text command ${textCommand.name} on update:`,
          error
        );

        const errorMsg = await (newMessage as Message).reply({
          content: "There was an error while executing this command!",
        });

        setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
      }
    }
  );
}

export { textCommands, textCooldowns };
