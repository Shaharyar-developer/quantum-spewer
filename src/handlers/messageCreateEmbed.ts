import { Client, Events, EmbedBuilder, Message } from "discord.js";
import LanguageModeration from "../modules/mod/lang";

export default function handleMessageCreateEmbed(client: Client) {
  client.on(Events.MessageCreate, async (message: Message) => {
    if (!client.user) return;
    if (message.author.id === client.user.id) return;
    if (!message.content.startsWith("embed! ")) return;

    const toEmbed = message.content.slice(7).trim();
    const isSafe = await LanguageModeration.isContentSafe(toEmbed);
    if (!isSafe) {
      await message.delete().catch(() => {});
      if (
        "send" in message.channel &&
        typeof message.channel.send === "function"
      ) {
        const warnMsg = await message.channel.send({
          embeds: [
            {
              title: ":no_entry: Thy Missive Hath Been Expunged",
              description: `Verily, thy utterance hath transgressed the bounds of permitted discourse and thus hath been consigned to oblivion. Refrain henceforth from employing such forbidden parlance, lest graver consequences befall thee.`,
              color: 0xff0000,
            },
          ],
        });
        setTimeout(() => warnMsg.delete().catch(() => {}), 5000);
      }
      return;
    }
    const embed = new EmbedBuilder()
      .setDescription(toEmbed)
      .setColor(0x89b4fa)
      .setTimestamp()
      .setAuthor({
        name: message.author.username,
        iconURL: message.author.displayAvatarURL(),
      })
      .setFooter({ text: message.author.id });
    if (
      toEmbed.length > 0 &&
      "send" in message.channel &&
      typeof message.channel.send === "function"
    ) {
      const components = [
        {
          type: 1, // ActionRow
          components: [
            {
              type: 2, // Button
              style: 4, // Danger
              label: "Delete",
              custom_id: `delete-embed-${message.author.id}`,
            },
            {
              type: 2, // Button
              style: 1, // Primary
              label: "Edit",
              custom_id: `edit-embed-${message.author.id}`,
            },
          ],
        },
      ];
      const sendOptions: any = {
        embeds: [embed],
        components,
      };
      if (message.reference?.messageId) {
        sendOptions.reply = { messageReference: message.reference.messageId };
      }
      await message.channel.send(sendOptions);
    }
    message.delete().catch(() => {});
  });
}
