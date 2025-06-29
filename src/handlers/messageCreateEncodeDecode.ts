import { Events, Client, Message, TextChannel } from "discord.js";
import morse from "../lib/morse-code";

export default function handleMessageCreateEncodeDecode(client: Client) {
  client.on(Events.MessageCreate, async (message: Message) => {
    if (!client.user) return;
    if (message.author.id === client.user.id) return;
    // Morse code encode command
    if (message.content.startsWith("encode! ")) {
      const toEncode = message.content.slice(8).trim();
      if (toEncode.length > 0) {
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
      }
      message.delete().catch(() => {});
      return;
    }
    // Morse code decode command
    if (message.content.startsWith("decode! ")) {
      const toDecode = message.content.slice(8).trim();
      if (toDecode.length > 0) {
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
      }
      message.delete().catch(() => {});
      return;
    }
    // Plaintext encode command
    if (message.content.startsWith("encodep! ")) {
      const toEncode = message.content.slice(9).trim();
      if (toEncode.length > 0) {
        const encoded = morse.encode(toEncode);
        await (message.channel as TextChannel).send(encoded);
      }
      message.delete().catch(() => {});
      return;
    }
    // Plaintext decode command
    if (message.content.startsWith("decodep! ")) {
      const toDecode = message.content.slice(9).trim();
      if (toDecode.length > 0) {
        const decoded = morse.decode(toDecode);
        await (message.channel as TextChannel).send(decoded);
      }
      message.delete().catch(() => {});
      return;
    }
  });
}
