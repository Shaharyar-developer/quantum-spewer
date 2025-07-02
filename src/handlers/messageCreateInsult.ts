import { Events, Client, Message } from "discord.js";
import { getInsult } from "../modules/insults";
import { MASTER_IDS, MODERATION_ROLE_IDS } from "../lib/constants";

export default function handler(client: Client) {
  client.on(Events.MessageCreate, async (message: Message) => {
    if (!client.user) return;
    if (message.author.id === client.user.id) return;

      if (message.content.startsWith("insult!")) {
        await message.delete().catch(() => {});

        const sendMsg = async (content: string) => {
          if (
            message.channel &&
            "send" in message.channel &&
            typeof (message.channel as any).send === "function"
          ) {
            await (message.channel as any).send(content);
          }
        };
        // Extract the first user mention from the message
        const mention = message.mentions.users.first();
        if (!mention) {
          await sendMsg(
            "Please mention a user to insult, e.g. `insult! @username`"
          );
          return;
        }

        // Prevent insulting yourself
        if (mention.id === message.author.id) {
          await sendMsg("You can't insult yourself! (Or can you?)");
          return;
        }
        if (MASTER_IDS.includes(mention.id)) {
          await sendMsg(
            "You can't insult someone who is potentially the bot's creator!"
          );
          return;
        }

        // Prevent insulting the bot
        if (client.user && mention.id === client.user.id) {
          await sendMsg("Nice try, but I won't insult myself!");
          return;
        }

        // Try to fetch the user by ID from the guild
        try {
          const member = await message.guild?.members.fetch(mention.id);
          if (!member) {
            await sendMsg("Couldn't find that user in this server.");
            return;
          }
          // Insult the pinged user (send message, mention user)
          if (message.channel && message.channel.type === 0) {
            // 0 = GuildText (TextChannel)
            await(message.channel as import("discord.js").TextChannel).send({
              content: `${mention}, ${await getInsult(0)}`,
            });
          } else {
            await sendMsg(`${mention}, ${await getInsult(0)}`);
          }
        } catch {
          await sendMsg("Couldn't find that user in this server.");
        }
        return;
      }

    if (message.mentions.has(client.user)) {
      const isMaster = MASTER_IDS.includes(message.author.id);
      let isMod = false;
      if (
        message.member?.roles?.cache &&
        typeof message.member.roles.cache.has === "function"
      ) {
        isMod = MODERATION_ROLE_IDS.some((roleId) =>
          message.member?.roles?.cache?.has(roleId)
        );
      }
      if (!(isMaster || isMod)) {
        const targetUserId = message.author.id;
        let targetName = targetUserId;
        try {
          const member = await message.guild?.members.fetch(targetUserId);
          if (member) {
            targetName = member.displayName || member.user.username;
          }
        } catch {
          targetName = message.author.displayName || message.author.username;
        }
        await message.reply({
          content: `${targetName}, ${await getInsult(0)}`,
        });
      }
    }
  });
}
