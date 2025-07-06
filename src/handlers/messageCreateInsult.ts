import { Events, Client, Message } from "discord.js";
import { getInsult } from "../modules/insults";
import { MASTER_IDS, MODERATION_ROLE_IDS } from "../lib/constants";

export default function handler(client: Client) {
  client.on(Events.MessageCreate, async (message: Message) => {
    if (!client.user) return;
    if (message.author.id === client.user.id) return;

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
