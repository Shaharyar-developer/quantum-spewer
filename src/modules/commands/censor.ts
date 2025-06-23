import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import LanguageModeration from "../mod/lang";
import { hasModerationRole } from "../../lib/utils";

const data = new SlashCommandBuilder()
  .setName("censor")
  .setDescription("Censor Management Operations")
  .addSubcommand((sub) =>
    sub
      .setName("add")
      .setDescription("Add word(s) to the banned list (comma-separated)")
      .addStringOption((opt) =>
        opt
          .setName("words")
          .setDescription("The word(s) to ban, comma-separated NO WHITESPACE")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("remove")
      .setDescription("Remove a word from the banned list")
      .addStringOption((opt) =>
        opt
          .setName("word")
          .setDescription("The word to unban")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub.setName("list").setDescription("List all banned words")
  )
  .addSubcommand((sub) =>
    sub
      .setName("search")
      .setDescription("Search for a word in the banned list")
      .addStringOption((opt) =>
        opt
          .setName("word")
          .setDescription("The word to search for")
          .setRequired(true)
      )
  );

async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const subcommand = interaction.options.getSubcommand(true);
  const word = interaction.options.getString("word");

  switch (subcommand) {
    case "add": {
      if (!hasModerationRole(interaction)) {
        const embed = new EmbedBuilder()
          .setTitle(":no_entry: Insufficient Permissions")
          .setDescription("You do not have permission to use this command.")
          .setColor(0xff0000);
        return await interaction.editReply({ embeds: [embed] });
      }
      if (!word) {
        const embed = new EmbedBuilder()
          .setTitle(":warning: Missing Word")
          .setDescription("Please provide word(s) to ban.")
          .setColor(0xffcc00);
        return await interaction.editReply({ embeds: [embed] });
      }
      // Split by comma, trim whitespace, filter out empty strings, deduplicate
      const words = word
        .split(",")
        .map((w) => w.trim())
        .filter((w, i, arr) => w.length > 0 && arr.indexOf(w) === i);
      if (words.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle(":warning: No Valid Words")
          .setDescription("No valid words provided to ban.")
          .setColor(0xffcc00);
        return await interaction.editReply({ embeds: [embed] });
      }
      const added = await LanguageModeration.addBannedWord(words);
      let addedWords: string[] = [];
      let alreadyBanned: string[] = [];
      if (Array.isArray(added)) {
        // If addBannedWord returns an array of booleans for each word
        added.forEach((result, idx) => {
          const w = words[idx] ?? "";
          if (result && w) addedWords.push(w);
          else if (w) alreadyBanned.push(w);
        });
      } else if (typeof added === "boolean") {
        if (added) addedWords = words;
        else alreadyBanned = words;
      }
      const embed = new EmbedBuilder()
        .setTitle(":no_entry: Word(s) Banned")
        .setDescription(
          (addedWords.length > 0
            ? `The following word(s) have been **added** to the banned list: **${addedWords.join(
                ", "
              )}**\n`
            : "") +
            (alreadyBanned.length > 0
              ? `The following word(s) were already banned or could not be added: **${alreadyBanned.join(
                  ", "
                )}**`
              : "")
        )
        .setColor(addedWords.length > 0 ? 0xff0000 : 0x1d2439);
      return await interaction.editReply({ embeds: [embed] });
    }
    case "remove": {
      if (!hasModerationRole(interaction)) {
        const embed = new EmbedBuilder()
          .setTitle(":no_entry: Insufficient Permissions")
          .setDescription("You do not have permission to use this command.")
          .setColor(0xff0000);
        return await interaction.editReply({ embeds: [embed] });
      }
      if (!word) {
        const embed = new EmbedBuilder()
          .setTitle(":warning: Missing Word")
          .setDescription("Please provide a word to unban.")
          .setColor(0xffcc00);
        return await interaction.editReply({ embeds: [embed] });
      }
      const removed = await LanguageModeration.removeBannedWord(word);
      const embed = new EmbedBuilder()
        .setTitle(
          removed
            ? ":white_check_mark: Word Unbanned"
            : ":information_source: Not Banned"
        )
        .setDescription(
          removed
            ? `The word **${word}** has been **removed** from the banned list.`
            : `The word **${word}** is not banned or could not be removed.`
        )
        .setColor(removed ? 0x00ff00 : 0x1d2439);
      return await interaction.editReply({ embeds: [embed] });
    }
    case "list": {
      if (!hasModerationRole(interaction)) {
        const embed = new EmbedBuilder()
          .setTitle(":no_entry: Insufficient Permissions")
          .setDescription("You do not have permission to use this command.")
          .setColor(0xff0000);
        return await interaction.editReply({ embeds: [embed] });
      }
      const bannedWords = LanguageModeration.getBannedWords();
      if (bannedWords.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle(":white_check_mark: No Banned Words")
          .setDescription("No words are currently banned.")
          .setColor(0x00ff00);
        return await interaction.editReply({ embeds: [embed] });
      }
      const embed = new EmbedBuilder()
        .setTitle(":no_entry: Banned Words")
        .setDescription(
          "```\n" +
            bannedWords.map((w, i) => `${i + 1}. ${w}`).join("\n") +
            "\n```"
        )
        .setColor(0xff0000)
        .setFooter({ text: `Total: ${bannedWords.length}` });
      return await interaction.editReply({ embeds: [embed] });
    }
    case "search": {
      if (!hasModerationRole(interaction)) {
        const embed = new EmbedBuilder()
          .setTitle(":no_entry: Insufficient Permissions")
          .setDescription("You do not have permission to use this command.")
          .setColor(0xff0000);
        return await interaction.editReply({ embeds: [embed] });
      }
      if (!word) {
        const embed = new EmbedBuilder()
          .setTitle(":warning: Missing Word")
          .setDescription("Please provide a word to search for.")
          .setColor(0xffcc00);
        return await interaction.editReply({ embeds: [embed] });
      }
      const bannedWords = LanguageModeration.getBannedWords();
      const exactMatch = bannedWords.includes(word);
      let found: string | null = null;
      if (!exactMatch) {
        found = await LanguageModeration.fuzzyFindBannedWord(word);
      }

      let embed: EmbedBuilder;
      if (exactMatch) {
        embed = new EmbedBuilder()
          .setTitle(":no_entry: Exact Word Banned")
          .setDescription(`The word **${word}** is **banned**.`)
          .setColor(0xff0000);
      } else if (found) {
        embed = new EmbedBuilder()
          .setTitle(":warning: Similar Word Banned")
          .setDescription(
            `The word **${word}** is not banned, but a similar word **${found}** is **banned**.`
          )
          .setColor(0xffcc00);
      } else {
        embed = new EmbedBuilder()
          .setTitle(":white_check_mark: Not Banned")
          .setDescription(`The word **${word}** is **not banned**.`)
          .setColor(0x00ff00);
      }
      return await interaction.editReply({ embeds: [embed] });
    }
    default: {
      const embed = new EmbedBuilder()
        .setTitle(":grey_question: Unknown Subcommand")
        .setDescription("Unknown subcommand.")
        .setColor(0x808080);
      return await interaction.editReply({ embeds: [embed] });
    }
  }
}

export default { data, execute, cooldown: 3 } as const;
