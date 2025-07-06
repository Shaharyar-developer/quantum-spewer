import { Events, Client, Message, TextChannel } from "discord.js";
import morseCode from "../lib/morse-code";

export default function handler(client: Client) {
  client.on(Events.MessageCreate, async (message: Message) => {
    if (!client.user) return;
    if (message.author.id === client.user.id) return;
    
    const MORSE_CODE_CHANNEL_ID = process.env.MORSE_CODE_CHANNEL_ID;

    // Handle messages in the dedicated morse code channel
    if (
      MORSE_CODE_CHANNEL_ID &&
      message.channel.id === MORSE_CODE_CHANNEL_ID &&
      message.content &&
      message.content.length > 0
    ) {
      const alphanumeric = message.content.replace(/[^a-zA-Z0-9 ]/g, "");
      if (alphanumeric.length > 0) {
        const morseEncoded = morseCode.encode(alphanumeric);
        await message.delete().catch(() => {});
        await(message.channel as TextChannel).send({
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
        return;
      } else {
        await message.delete().catch(() => {});
        await(message.channel as TextChannel).send({
          embeds: [
            {
              title: "🚫 Only Alphanumeric Allowed",
              description:
                "Please use **letters and numbers only** in this channel. Non-alphanumeric content is not permitted.",
              color: 0xff5555,
            },
          ],
        });
        return;
      }
    }
  });
}
