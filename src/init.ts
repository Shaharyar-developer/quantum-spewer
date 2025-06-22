import {
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  Collection,
} from "discord.js";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

import type {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { getInsult } from "./modules/insults";

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Type definitions
export type Command = {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  cooldown?: number;
};

// Globals
const commands = new Collection<string, Command>();
const cooldowns = new Collection<string, Collection<string, number>>();

export { commands, cooldowns };

// Load command files dynamically
const commandsPath = path.join(__dirname, "modules", "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js") || file.endsWith(".ts"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const { default: command }: { default: Command } = await import(
    `file://${filePath}`
  );

  if ("data" in command && "execute" in command) {
    commands.set(command.data.name, command);
  } else {
    console.error(
      `The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

// Import trivia for button handling
import trivia from "./modules/commands/trivia";

// Bot Init
export const init = (token: string) => {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  });

  client.on(Events.MessageCreate, async (message) => {
    if (!client.user) {
      console.error("Client user is not defined.");
      return;
    }
    // Only ignore messages from itself, not other bots
    if (message.author.id === client.user.id) return;

    // Ignore message from certain author
    if (message.author.username === ".fenryx.") return;

    if (message.mentions.has(client.user)) {
      await message.reply({
        content: message.author.displayName + `, ${await getInsult(0)}`,
      });
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    // Handle trivia answer buttons
    if (interaction.isButton()) {
      await trivia.handleButton(interaction);
      return;
    }
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    // Cooldown logic
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
          flags: MessageFlags.Ephemeral,
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
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  });

  client.login(token);
};
