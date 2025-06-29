import { Events, Client, Message, TextChannel } from "discord.js";
import LanguageModeration from "../modules/mod/lang";

export default function handler(client: Client) {
  client.on(Events.MessageUpdate, async (_oldMessage, newMessage) => {
    if (newMessage.partial || !newMessage.content) return;
    if (!client.user) return;
    if (newMessage.author?.id === client.user.id) return;
    const moderationResult = await LanguageModeration.isContentSafe(
      newMessage.content
    );
    if (!moderationResult) {
      await newMessage.delete();
      const embed = {
        title: ":no_entry: Thy Missive Hath Been Expunged",
        description: `Verily, thy edited utterance hath transgressed the bounds of permitted discourse and thus hath been consigned to oblivion. Refrain henceforth from employing such forbidden parlance, lest graver consequences befall thee.`,
        color: 0xff0000,
      };
      const warningMsg = await (newMessage.channel as TextChannel)
        .send({
          content: `<@${newMessage.author?.id}>,`,
          embeds: [embed],
        })
        .catch(console.error);
      if (warningMsg && typeof warningMsg.delete === "function") {
        setTimeout(() => {
          warningMsg.delete().catch(() => {});
        }, 5000);
      }
    }
  });
}
