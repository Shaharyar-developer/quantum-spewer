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
  EmbedBuilder,
  TextChannel,
  Message,
} from "discord.js";
import { getInsult } from "./modules/insults";
import trivia from "./modules/commands/trivia";
import { getRandomWord, gloat } from "./lib/utils";
import { MASTER_IDS, MODERATION_ROLE_IDS } from "./lib/constants";
import LanguageModeration from "./modules/mod/lang";
import morse from "./lib/morse-code";
import morseCode from "./lib/morse-code";

export type Command = {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  cooldown?: number;
};

const commands = new Collection<string, Command>();
const cooldowns = new Collection<string, Collection<string, number>>();
export { commands, cooldowns };

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamically load command files
const commandsPath = path.join(__dirname, "modules", "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js") || file.endsWith(".ts"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const { default: command }: { default: Command } = await import(
    `file://${filePath}`
  );
  if (
    command &&
    typeof command.data !== "undefined" &&
    typeof command.execute === "function"
  ) {
    commands.set(command.data.name, command);
  } else {
    console.error(
      `The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

import handleClientReady from "./handlers/clientReady";
import handleMessageCreateEncodeDecode from "./handlers/messageCreateEncodeDecode";
import handleMessageCreateFunFact from "./handlers/messageCreateFunFact";
import handleMessageCreateInsult from "./handlers/messageCreateInsult";
import handleMessageCreateModeration from "./handlers/messageCreateModeration";
import handleMessageCreateMorse from "./handlers/messageCreateMorse";
import handleMessageUpdateModeration from "./handlers/messageUpdateModeration";
import handleInteractionCreate from "./handlers/interactionCreate";

export const init = (token: string) => {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
  });

  // Register all event handlers
  handleClientReady(client, MASTER_IDS, MODERATION_ROLE_IDS, getRandomWord);
  handleMessageCreateEncodeDecode(client);
  handleMessageCreateFunFact(client);
  handleMessageCreateInsult(client);
  handleMessageCreateModeration(client);
  handleMessageCreateMorse(client);
  handleMessageUpdateModeration(client);
  handleInteractionCreate(client, commands, cooldowns);

  client.login(token);
};
