import { Message, TextChannel } from "discord.js";
import { type TextCommand } from "../../types/textCommand";
import morse from "../../lib/morse-code";

const encodeCommand: TextCommand = {
  name: "encode",
  description: "Encode text to Morse code with embed",
  execute: async (message: Message, args: string[]) => {
    const toEncode = args.join(" ").trim();

    if (!toEncode) {
      await message.delete().catch(() => {});
      return;
    }

    const encoded = morse.encode(toEncode);
    const warnMsg = await (message.channel as TextChannel).send({
      embeds: [
        {
          title: "Morse Code Encoded",
          description: `\u200B\n**Input:**\n\`${toEncode}\`\n\n**Morse:**\n\`${encoded}\``,
          color: 0x89b4fa,
        },
      ],
    });

    setTimeout(() => warnMsg.delete().catch(() => {}), 10000);
    await message.delete().catch(() => {});
  },
};

export default encodeCommand;
