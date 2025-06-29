import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  Collection,
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { getRandomWord, gloat } from "./lib/utils";
import { MASTER_IDS, MODERATION_ROLE_IDS } from "./lib/constants";

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
import handleMessageUpdateModeration from "./handlers/messageUpdateModeration";
import handleInteractionCreate from "./handlers/interactionCreate";

export const init = async (token: string) => {
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

  // Auto-register all messageCreate handlers
  const handlersPath = path.join(__dirname, "handlers");
  const handlerFiles = fs
    .readdirSync(handlersPath)
    .filter(
      (file) =>
        file.startsWith("messageCreate") &&
        (file.endsWith(".js") || file.endsWith(".ts"))
    );
  for (const file of handlerFiles) {
    const filePath = path.join(handlersPath, file);
    const { default: handler } = await import(`file://${filePath}`);
    if (typeof handler === "function") {
      handler(client);
    }
  }

  handleMessageUpdateModeration(client);
  handleInteractionCreate(client, commands, cooldowns);

  client.login(token);
};
