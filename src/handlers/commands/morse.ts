import { Message, TextChannel } from "discord.js";
import { type TextCommand } from "../../types/textCommand";
import morseCode from "../../lib/morse-code";

export default {
  name: "morse",
  description: "Convert text to Morse code with interactive buttons",
  execute: async (message: Message, args: string[]) => {
    const text = args.join(" ").trim();

    if (!text) {
      await message.delete().catch(() => {});
      return;
    }

    const morseEncoded = morseCode.encode(text);
    await (message.channel as TextChannel).send({
      embeds: [
        {
          description: `**From:** <@${message.author.id}>\n\n\`${morseEncoded}\``,
          color: 0x89b4fa,
        },
      ],
      components: [
        {
          type: 1, // ActionRow
          components: [
            {
              type: 2, // Button
              style: 2, // Secondary
              label: "Show Translation",
              custom_id: `show-translation-${message.id}`,
            },
            {
              type: 2, // Button
              style: 4, // Danger
              label: "Delete",
              custom_id: `delete-morse-${message.id}-${message.author.id}`,
            },
          ],
        },
      ],
    });

    await message.delete().catch(() => {});
  },
} as TextCommand;