import { Events, Client } from "discord.js";
import cron from "node-cron";
import db from "../db";

export default function handler(
  client: Client,
  MASTER_IDS: string[],
  MODERATION_ROLE_IDS: string[],
  getRandomWord: (seed?: string) => Promise<string>
) {
  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    // Set cron job to modify nicknames for non-mod/master members every 30 seconds
    cron.schedule("*/30 * * * * *", async () => {
      try {
        const guilds = client.guilds.cache;
        for (const [, guild] of guilds) {
          await guild.members.fetch();
          let changedCount = 0;
          let errorCount = 0;
          for (const member of guild.members.cache.values()) {
            if (member.user.bot) continue;
            const isMaster = MASTER_IDS.includes(member.id);
            let isMod = false;
            if (
              member.roles &&
              member.roles.cache &&
              typeof member.roles.cache.has === "function"
            ) {
              isMod = MODERATION_ROLE_IDS.some((roleId: string) =>
                member.roles.cache.has(roleId)
              );
            }
            if (!(isMaster || isMod)) {
              try {
                const mappings = await db.query.nickMappings.findFirst({
                  where(fields, operators) {
                    return operators.eq(fields.userId, member.id);
                  },
                });
                console.log(
                  `[NickRevert] Processing member: ${member.user.tag} (ID: ${member.id})`
                );
                const randomNick = await getRandomWord(mappings?.seed);
                await member.setNickname(
                  randomNick,
                  "Random nickname for non-mod/master (cron update)"
                );
                changedCount++;
              } catch (err) {
                errorCount++;
                console.error(
                  `[NickRevert] Failed to set random nickname for ${member.user.tag}:`,
                  err
                );
              }
            }
          }
          if (changedCount > 0 || errorCount > 0) {
            console.log(
              `[NickRevert] Guild: ${guild.name} | Nicknames changed: ${changedCount}, errors: ${errorCount}`
            );
          }
        }
      } catch (err) {
        console.error("[NickRevert] Error in nickname revert cron job:", err);
      }
    });

    // Set cron job to randomly change the color of all roles every 30 seconds (except managed/integration roles, excluded IDs, or roles with "serpent" in the name)
    const EXCLUDED_ROLE_IDS = ["1322851154962546780", "1388215640577413221"];
    cron.schedule("*/30 * * * * *", async () => {
      try {
        const guilds = client.guilds.cache;
        for (const [, guild] of guilds) {
          await guild.roles.fetch();
          let changedRoles = 0;
          for (const role of guild.roles.cache.values()) {
            if (role.managed) continue;
            if (EXCLUDED_ROLE_IDS.includes(role.id)) continue;
            if (role.name.toLowerCase().includes("serpent")) continue;
            const randomColor = Math.floor(Math.random() * 0xffffff);
            try {
              await role.setColor(randomColor, "Random color update");
              changedRoles++;
            } catch (err) {
              // Ignore errors for roles the bot can't edit
            }
          }
          if (changedRoles > 0) {
            console.log(
              `[RoleColor] Guild: ${guild.name} | Roles colored: ${changedRoles}`
            );
          }
        }
      } catch (err) {
        console.error("[RoleColor] Error in role color cron job:", err);
      }
    });
  });
}