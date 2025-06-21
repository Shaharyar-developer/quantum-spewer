import assert from "assert/strict";
import { init, type Command } from "./init";
import type { Collection } from "discord.js";

declare global {
  var commands: Collection<string, Command>;
  var cooldowns: Collection<string, number>;
}

assert(process.env.DISCORD_TOKEN, "DISCORD_TOKEN is not set");

init(process.env.DISCORD_TOKEN);
