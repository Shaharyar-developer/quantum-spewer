import { REST, Routes } from "discord.js";
import assert from "assert/strict";
import fs from "fs";
import path from "path";

const commands = [];

const commandsPath = path.join(
  path.dirname(__dirname),
  "src",
  "modules",
  "commands"
);

const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath).default;
  if ("data" in command && "execute" in command) {
    commands.push(command.data.toJSON());
  } else {
    console.error(
      `The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

assert(process.env.DISCORD_TOKEN, "DISCORD_TOKEN is not set");

assert(process.env.GUILD_ID, "GUILD_ID is not set");
const clientId = process.env.CLIENT_ID;
assert(clientId, "CLIENT_ID is not set");
const guildId = process.env.GUILD_ID;

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

try {
  console.log(
    `Started refreshing ${commands.length} application (/) commands.`
  );

  const data = await rest.put(
    Routes.applicationGuildCommands(clientId, guildId),
    { body: commands }
  );

  console.log(
    `Successfully reloaded ${(data as []).length} application (/) commands.`
  );
} catch (error) {
  console.error(error);
}
