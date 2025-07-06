import { Message, TextChannel } from "discord.js";
import { type TextCommand } from "../../types/textCommand";
import morse from "../../lib/morse-code";

const decodepCommand: TextCommand = {
  name: "decodep",
  description: "Decode Morse code to text (plain text output)",
  execute: async (message: Message, args: string[]) => {
    const toDecode = args.join(" ").trim();

    if (!toDecode) {
      await message.delete().catch(() => {});
      return;
    }

    const decoded = morse.decode(toDecode);
    await (message.channel as TextChannel).send(decoded);
    await message.delete().catch(() => {});
  },
};

export default decodepCommand;
