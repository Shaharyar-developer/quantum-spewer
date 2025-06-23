import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  Collection,
  Client,
  GatewayIntentBits,
  Events,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  MessageFlags,
} from "discord.js";
import { getInsult } from "./modules/insults";
import trivia from "./modules/commands/trivia";
import { gloat } from "./lib/utils";
import { MASTER_IDS } from "./lib/constants";
import LanguageModeration from "./modules/mod/lang";

/**
 * Represents a Discord slash command with its data, execution logic, and optional cooldown.
 * @typedef {Object} Command
 * @property {SlashCommandBuilder} data - The command's data and metadata.
 * @property {(interaction: ChatInputCommandInteraction) => Promise<void>} execute - The function to execute when the command is invoked.
 * @property {number} [cooldown] - Optional cooldown in seconds for the command.
 */
export type Command = {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  cooldown?: number;
};

// Globals

/**
 * Collection of all loaded commands, keyed by command name.
 * @type {Collection<string, Command>}
 */
const commands: Collection<string, Command> = new Collection<string, Command>();

/**
 * Collection for tracking cooldowns per command and user.
 * @type {Collection<string, Collection<string, number>>}
 */
const cooldowns: Collection<
  string,
  Collection<string, number>
> = new Collection<string, Collection<string, number>>();
export { commands, cooldowns };

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamically load command files
/**
 * Loads all command modules from the commands directory and registers them in the commands collection.
 * Only files ending with .js or .ts are considered.
 */
const commandsPath = path.join(__dirname, "modules", "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js") || file.endsWith(".ts"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  // Dynamically import each command module
  const { default: command }: { default: Command } = await import(
    `file://${filePath}`
  );
  if ("data" in command && "execute" in command) {
    commands.set(command.data.name, command);
  } else {
    console.error(
      `The command at ${filePath} is missing a required \"data\" or \"execute\" property.`
    );
  }
}

/**
 * Initializes and starts the Discord bot client.
 * Sets up event listeners for ready, message creation, and interaction events.
 * @param {string} token - The Discord bot token to log in with.
 */
export const init = (token: string) => {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  /**
   * Event: Client is ready.
   * Logs the bot's username to the console.
   */
  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  });

  /**
   * Event: Message is created in a guild.
   * Handles fun facts, insults, and bot mentions.
   */
  client.on(Events.MessageCreate, async (message) => {
    if (!client.user) {
      console.error("Client user is not defined.");
      return;
    }
    // Only ignore messages from itself, not other bots
    if (message.author.id === client.user.id) return;

    // Respond with a fun fact if the master user is mentioned directly (not as a reply)
    message.mentions.members?.forEach(async (element) => {
      if (MASTER_IDS.includes(element.user.id) && !message.reference) {
        // Use the member's display name for gloat
        const displayName = element.displayName || element.user.username;
        await message.reply({
          embeds: [
            {
              title: "Fun Fact!",
              description: await gloat(displayName),
              color: 0xcba6f7,
            },
          ],
        });
      }
    });

    // Ignore further processing if the message is from the master user
    // if (MASTER_IDS.includes(message.author.id)) return;

    // If the bot is mentioned or a specific role is mentioned, reply with an insult
    if (
      message.mentions.has(client.user) ||
      message.content.includes("<@&1386122719938216040>")
    ) {
      // UserID for `@Back`
      const targetUserId = "881043694554337361";
      let targetName = targetUserId;
      try {
        const member = await message.guild?.members.fetch(targetUserId);
        if (member) {
          targetName = member.displayName || member.user.username;
        }
      } catch (e) {
        targetName = message.author.displayName || message.author.username;
      }
      await message.reply({
        content: targetName + `, ${await getInsult(0)}`,
      });
    }

    // Moderation: Check for banned words in the message content
    const moderationResult = await LanguageModeration.isContentSafe(
      message.content
    );

    if (!moderationResult) {
      // If banned words are found, delete the message and notify the user
      await message.delete();
      const embed = {
        title: ":no_entry: Thy Missive Hath Been Expunged",
        description: `Verily, thy utterance hath transgressed the bounds of permitted discourse and thus hath been consigned to oblivion. Refrain henceforth from employing such forbidden parlance, lest graver consequences befall thee. ${await getInsult(0)}`,
        color: 0xff0000,
      };
      await message.channel
        .send({
          content: `<@${message.author.id}>,`,
          embeds: [embed],
        })
        .catch(console.error);
    }
  });

  /**
   * Event: Interaction is created (slash command or button).
   * Handles command execution and cooldowns.
   */
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

  // Log in to Discord with the provided token
  client.login(token);
};
