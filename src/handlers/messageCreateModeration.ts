import { Events, Client, Message } from "discord.js";
import LanguageModeration from "../modules/mod/lang";

export default function handleMessageCreateModeration(client: Client) {
  client.on(Events.MessageCreate, async (message: Message) => {
    if (!client.user) return;
    if (message.author.id === client.user.id) return;
    const moderationResult = await LanguageModeration.isContentSafe(
      message.content
    );
    if (!moderationResult) {
      await message.delete();
      const embed = {
        title: ":no_entry: Thy Missive Hath Been Expunged",
        description: `Verily, thy utterance hath transgressed the bounds of permitted discourse and thus hath been consigned to oblivion. Refrain henceforth from employing such forbidden parlance, lest graver consequences befall thee.`,
        color: 0xff0000,
      };
      let warningMsg: Message<boolean> | undefined;
      if (
        "send" in message.channel &&
        typeof message.channel.send === "function"
      ) {
        const sentMsg = await message.channel
          .send({
            content: `<@${message.author.id}>,`,
            embeds: [embed],
          })
          .catch(console.error);
        if (sentMsg && typeof sentMsg.delete === "function") {
          warningMsg = sentMsg;
          setTimeout(() => {
            warningMsg!.delete().catch(() => {});
          }, 5000);
        }
      }
    }
  });
}
