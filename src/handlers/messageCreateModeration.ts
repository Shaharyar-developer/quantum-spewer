import { Events, Client, Message } from "discord.js";
import LanguageModeration from "../modules/mod/lang";
import { v4 as uuidv4 } from "uuid";
import { MASTER_IDS } from "../lib/constants";

export default function handler(client: Client) {
  client.on(Events.MessageCreate, async (message: Message) => {
    if (!client.user) {
      return;
    }
    if (message.author.id === client.user.id) {
      return;
    }
    if (MASTER_IDS.includes(message.author.id)) {
      return;
    }
    // Skip moderation for embed! messages, let messageCreateEmbed.ts handle those
    if (message.content.startsWith("embed! ")) {
      return;
    }
    const moderationResult = await LanguageModeration.isContentSafe(
      message.content.toLowerCase()
    );
    if (!moderationResult) {
      await message.delete().catch(() => {});
      const embed = {
        title: ":no_entry: Thy Missive Hath Been Expunged",
        description: `Verily, thy utterance hath transgressed the bounds of permitted discourse and thus hath been consigned to oblivion. Refrain henceforth from employing such forbidden parlance, lest graver consequences befall thee.`,
        color: 0xff0000,
        footer: { text: `Debug Trace: PID: ${process.pid}` },
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
          .catch(() => {
            return undefined;
          });
        if (sentMsg && typeof sentMsg.delete === "function") {
          setTimeout(() => {
            sentMsg!.delete().catch(() => {});
          }, 5000);
        }
      }
      try {
        const logChannelId = process.env.LOG_CHANNEL_ID;
        if (
          logChannelId &&
          message.guild &&
          message.guild.channels.cache.has(logChannelId)
        ) {
          const logChannel = await message.guild.channels.fetch(logChannelId);
          if (logChannel && logChannel.isTextBased()) {
            const logEmbed = {
              title: "🚨 Message Censored",
              description: `A message was censored for banned content.`,
              color: 0xff5555,
              fields: [
                {
                  name: "User",
                  value: `<@${message.author.id}> (${message.author.tag})`,
                  inline: true,
                },
                {
                  name: "Channel",
                  value: `<#${message.channel.id}>`,
                  inline: true,
                },
                {
                  name: "Message ID",
                  value: message.id,
                  inline: true,
                },
                {
                  name: "Message Content",
                  value: `\u200B${message.content}`,
                },
              ],
              timestamp: new Date().toISOString(),
              footer: {
                text: `User ID: ${message.author.id}`,
              },
            };
            await logChannel.send({ embeds: [logEmbed] });
          }
        }
      } catch (err) {
        // Logging failed, ignore
      }
    }
  });
}
