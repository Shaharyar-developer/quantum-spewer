import { Events, Client, Message, TextChannel } from "discord.js";
import LanguageModeration from "../modules/mod/lang";
import assert from "assert/strict";
import { v4 as uuidv4 } from "uuid";

assert(
  process.env.LOG_CHANNEL_ID,
  "LOG_CHANNEL_ID must be set in environment variables"
);

export default function handler(client: Client) {
  client.on(Events.MessageUpdate, async (_oldMessage, newMessage) => {
    if (newMessage.partial || !newMessage.content) {
      return;
    }
    if (!client.user) {
      return;
    }
    if (newMessage.author?.id === client.user.id) {
      return;
    }
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
      const warningMsg = await(newMessage.channel as TextChannel)
        .send({
          content: `<@${newMessage.author?.id}>,`,
          embeds: [embed],
        })
        .catch(() => {
          return undefined;
        });
      if (warningMsg && typeof warningMsg.delete === "function") {
        setTimeout(() => {
          warningMsg.delete().catch(() => {});
        }, 5000);
      }
      try {
        const logChannelId = process.env.LOG_CHANNEL_ID;
        if (
          logChannelId &&
          newMessage.guild &&
          newMessage.guild.channels.cache.has(logChannelId)
        ) {
          const logChannel = await newMessage.guild.channels.fetch(
            logChannelId
          );
          if (logChannel && logChannel.isTextBased()) {
            const logEmbed = {
              title: "🚨 Edited Message Censored",
              description: `An edited message was censored for banned content.`,
              color: 0xff5555,
              fields: [
                {
                  name: "User",
                  value: `<@${newMessage.author?.id}> (${newMessage.author?.tag})`,
                  inline: true,
                },
                {
                  name: "Channel",
                  value: `<#${newMessage.channel.id}>`,
                  inline: true,
                },
                {
                  name: "Message ID",
                  value: newMessage.id,
                  inline: true,
                },
                {
                  name: "Message Content",
                  value: `\u200B${newMessage.content}`,
                },
              ],
              timestamp: new Date().toISOString(),
              footer: {
                text: `User ID: ${newMessage.author?.id}`,
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
