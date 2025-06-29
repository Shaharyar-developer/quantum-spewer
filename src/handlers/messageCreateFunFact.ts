import { Events, Client } from "discord.js";
import { MASTER_IDS, MODERATION_ROLE_IDS } from "../lib/constants";
import { gloat } from "../lib/utils";

export default function handler(client: Client) {
  client.on(Events.MessageCreate, async (message) => {
    if (!client.user) return;
    if (message.author.id === client.user.id) return;
    message.mentions.members?.forEach(async (element) => {
      const isMaster = MASTER_IDS.includes(element.user.id);
      let isMod = false;
      if (
        element.roles &&
        element.roles.cache &&
        typeof element.roles.cache.has === "function"
      ) {
        isMod = MODERATION_ROLE_IDS.some((roleId) =>
          element.roles.cache.has(roleId)
        );
      }
      if ((isMaster || isMod) && !message.reference) {
        const displayName = element.displayName || element.user.username;
        await message.reply({
          embeds: [
            {
              title: "Fun Fact!",
              description: await gloat(displayName),
              color: 0xcba6f7,
            },
          ],
        });
      }
    });
  });
}
