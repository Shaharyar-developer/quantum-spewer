import { Message, TextChannel } from "discord.js";
import { type TextCommand } from "../../types/textCommand";
import morse from "../../lib/morse-code";

const decodeCommand: TextCommand = {
  name: "decode",
  description: "Decode Morse code to text with embed",
  execute: async (message: Message, args: string[]) => {
    const toDecode = args.join(" ").trim();

    if (!toDecode) {
      await message.delete().catch(() => {});
      return;
    }

    const decoded = morse.decode(toDecode);
    const warnMsg = await (message.channel as TextChannel).send({
      embeds: [
        {
          title: "Morse Code Decoded",
          description: `\u200B\n**Morse:**\n\`${toDecode}\`\n\n**Output:**\n\`${decoded}\``,
          color: 0xa6e3a1,
        },
      ],
    });

    setTimeout(() => warnMsg.delete().catch(() => {}), 10000);
    await message.delete().catch(() => {});
  },
};

export default decodeCommand;
