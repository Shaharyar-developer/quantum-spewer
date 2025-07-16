import assert from "assert/strict";
import { init, type Command } from "./init";
import type { Collection } from "discord.js";

declare global {
  var commands: Collection<string, Command>;
  var cooldowns: Collection<string, number>;
}

assert(process.env.BUNGIE_API_KEY, "BUNGIE_API_KEY is not set");
assert(process.env.GEMINI_API_KEY, "GEMINI_API_KEY is not set");
assert(process.env.DISCORD_TOKEN, "DISCORD_TOKEN is not set");
assert(process.env.CLIENT_ID, "CLIENT_ID is not set");
assert(process.env.GUILD_ID, "GUILD_ID is not set");
assert(process.env.LOG_CHANNEL_ID, "LOG_CHANNEL_ID is not set");


init(process.env.DISCORD_TOKEN);
