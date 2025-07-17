import { Message, TextChannel } from "discord.js";
import { type TextCommand } from "../../types/textCommand";
import morse from "../../lib/morse-code";

export default {
  name: "encodep",
  description: "Encode text to Morse code (plain text output)",
  execute: async (message: Message, args: string[]) => {
    const toEncode = args.join(" ").trim();

    if (!toEncode) {
      await message.delete().catch(() => {});
      return;
    }

    const encoded = morse.encode(toEncode);
    await (message.channel as TextChannel).send(encoded);
    await message.delete().catch(() => {});
  },
} as TextCommand;