import { Message } from "discord.js";

export interface TextCommand {
  name: string;
  description?: string;
  aliases?: string[];
  cooldown?: number;
  execute: (message: Message, args: string[]) => Promise<void>;
  executeOnUpdate?: boolean; // Whether to execute on message update
}
