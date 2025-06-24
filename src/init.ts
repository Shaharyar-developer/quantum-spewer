import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  Collection,
  Client,
  GatewayIntentBits,
  Events,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  MessageFlags,
} from "discord.js";
import { getInsult } from "./modules/insults";
import trivia from "./modules/commands/trivia";
import { gloat } from "./lib/utils";
import { MASTER_IDS, MODERATION_ROLE_IDS } from "./lib/constants";
import LanguageModeration from "./modules/mod/lang";

export type Command = {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  cooldown?: number;
};

const commands = new Collection<string, Command>();
const cooldowns = new Collection<string, Collection<string, number>>();
export { commands, cooldowns };

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamically load command files
const commandsPath = path.join(__dirname, "modules", "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js") || file.endsWith(".ts"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const { default: command }: { default: Command } = await import(
    `file://${filePath}`
  );
  if (
    command &&
    typeof command.data !== "undefined" &&
    typeof command.execute === "function"
  ) {
    commands.set(command.data.name, command);
  } else {
    console.error(
      `The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

export const init = (token: string) => {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  });

  client.on(Events.MessageCreate, async (message) => {
    if (!client.user) return console.error("Client user is not defined.");
    if (message.author.id === client.user.id) return;

    // Fun fact for master/mod mentions
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

    // Insult for bot/role mention (unless master/mod)
    if (
      message.mentions.has(client.user) ||
      message.content.includes("<@&1386122719938216040>")
    ) {
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
        const targetUserId = "881043694554337361";
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

    // Moderation: banned words
    const moderationResult = await LanguageModeration.isContentSafe(
      message.content
    );
    if (!moderationResult) {
      await message.delete();
      const embed = {
        title: ":no_entry: Thy Missive Hath Been Expunged",
        description: `Verily, thy utterance hath transgressed the bounds of permitted discourse and thus hath been consigned to oblivion. Refrain henceforth from employing such forbidden parlance, lest graver consequences befall thee. ${await getInsult(
          0
        )}`,
        color: 0xff0000,
      };
      await message.channel
        .send({
          content: `<@${message.author.id}>,`,
          embeds: [embed],
        })
        .catch(console.error);
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) {
      await trivia.handleButton(interaction);
      return;
    }
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    if (!cooldowns.has(command.data.name)) {
      cooldowns.set(command.data.name, new Collection());
    }
    const now = Date.now();
    const timestamps = cooldowns.get(command.data.name)!;
    const cooldownAmount = (command.cooldown ?? 3) * 1000;

    if (timestamps.has(interaction.user.id)) {
      const expirationTime =
        timestamps.get(interaction.user.id)! + cooldownAmount;
      if (now < expirationTime) {
        const expiredTimestamp = Math.round(expirationTime / 1000);
        return interaction.reply({
          content: `Pray, thou must wait ere thou usest the \`${command.data.name}\` command again. Return <t:${expiredTimestamp}:R>, good traveler.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(
        `Error executing command ${interaction.commandName}:`,
        error
      );
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  });

  client.login(token);
};
