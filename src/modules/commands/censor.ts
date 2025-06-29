import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  type ButtonInteraction,
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

/**
 * Creates pagination buttons for the banned words list
 * @param currentPage Current page number (0-indexed)
 * @param totalPages Total number of pages
 * @param disabled Whether buttons should be disabled
 * @returns ActionRowBuilder with navigation buttons
 */
function createPaginationButtons(
  currentPage: number,
  totalPages: number,
  disabled: boolean = false
): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>();

  // Previous button
  row.addComponents(
    new ButtonBuilder()
      .setCustomId("censor_list_prev")
      .setLabel("◀ Previous")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || currentPage === 0)
  );

  // Page indicator
  row.addComponents(
    new ButtonBuilder()
      .setCustomId("censor_list_page")
      .setLabel(`${currentPage + 1}/${totalPages}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true)
  );

  // Next button
  row.addComponents(
    new ButtonBuilder()
      .setCustomId("censor_list_next")
      .setLabel("Next ▶")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || currentPage === totalPages - 1)
  );

  return row;
}

/**
 * Creates an embed for a specific page of banned words
 * @param bannedWords Array of all banned words
 * @param page Current page number (0-indexed)
 * @param wordsPerPage Number of words to show per page
 * @returns EmbedBuilder for the current page
 */
function createBannedWordsEmbed(
  bannedWords: string[],
  page: number,
  wordsPerPage: number = 50
): EmbedBuilder {
  const totalPages = Math.ceil(bannedWords.length / wordsPerPage);
  const start = page * wordsPerPage;
  const end = Math.min(start + wordsPerPage, bannedWords.length);
  const pageWords = bannedWords.slice(start, end);

  const embed = new EmbedBuilder()
    .setTitle(":no_entry: Banned Words")
    .setDescription(
      "```\n" +
        pageWords.map((w, i) => `${start + i + 1}. ${w}`).join("\n") +
        "\n```"
    )
    .setColor(0xff0000)
    .setFooter({
      text: `Page ${page + 1}/${totalPages} • Total: ${
        bannedWords.length
      } words`,
    });

  return embed;
}

async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const subcommand = interaction.options.getSubcommand(true);
  const word =
    interaction.options.getString("words") ||
    interaction.options.getString("word");
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
          .setDescription("Please provide word(s) to unban.")
          .setColor(0xffcc00);
        return await interaction.editReply({ embeds: [embed] });
      }
      // Support comma-separated words for removal
      const words = word
        .split(",")
        .map((w) => w.trim())
        .filter((w, i, arr) => w.length > 0 && arr.indexOf(w) === i);
      if (words.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle(":warning: No Valid Words")
          .setDescription("No valid words provided to unban.")
          .setColor(0xffcc00);
        return await interaction.editReply({ embeds: [embed] });
      }
      let removed: boolean[] = [];
      if (words.length === 1) {
        // For single word, use the original method for backward compatibility
        removed = [await LanguageModeration.removeBannedWord(words[0]!)];
      } else {
        removed = await LanguageModeration.removeBannedWords(words);
      }
      let removedWords: string[] = [];
      let notBanned: string[] = [];
      removed.forEach((result, idx) => {
        const w = words[idx] ?? "";
        if (result && w) removedWords.push(w);
        else if (w) notBanned.push(w);
      });
      const embed = new EmbedBuilder()
        .setTitle(
          removedWords.length > 0
            ? ":white_check_mark: Word(s) Unbanned"
            : ":information_source: Not Banned"
        )
        .setDescription(
          (removedWords.length > 0
            ? `The following word(s) have been **removed** from the banned list: **${removedWords.join(
                ", "
              )}**\n`
            : "") +
            (notBanned.length > 0
              ? `The following word(s) were not banned or could not be removed: **${notBanned.join(
                  ", "
                )}**`
              : "")
        )
        .setColor(removedWords.length > 0 ? 0x00ff00 : 0x1d2439);
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

      const wordsPerPage = 50;
      const totalPages = Math.ceil(bannedWords.length / wordsPerPage);
      let currentPage = 0;

      // If there's only one page, don't show pagination buttons
      if (totalPages === 1) {
        const embed = createBannedWordsEmbed(bannedWords, 0, wordsPerPage);
        return await interaction.editReply({ embeds: [embed] });
      }

      // Create initial embed and buttons
      const embed = createBannedWordsEmbed(
        bannedWords,
        currentPage,
        wordsPerPage
      );
      const buttons = createPaginationButtons(currentPage, totalPages);

      const response = await interaction.editReply({
        embeds: [embed],
        components: [buttons],
      });

      // Create button collector
      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300_000, // 5 minutes
        filter: (buttonInteraction: ButtonInteraction) =>
          buttonInteraction.user.id === interaction.user.id,
      });

      collector.on("collect", async (buttonInteraction: ButtonInteraction) => {
        // Check permissions again for button interactions
        if (!hasModerationRole(interaction)) {
          const permissionEmbed = new EmbedBuilder()
            .setTitle(":no_entry: Insufficient Permissions")
            .setDescription("You do not have permission to use this command.")
            .setColor(0xff0000);
          return await buttonInteraction.reply({
            embeds: [permissionEmbed],
            flags: MessageFlags.Ephemeral,
          });
        }

        if (
          buttonInteraction.customId === "censor_list_prev" &&
          currentPage > 0
        ) {
          currentPage--;
        } else if (
          buttonInteraction.customId === "censor_list_next" &&
          currentPage < totalPages - 1
        ) {
          currentPage++;
        } else {
          // Page indicator button or invalid action
          return await buttonInteraction.deferUpdate();
        }

        const newEmbed = createBannedWordsEmbed(
          bannedWords,
          currentPage,
          wordsPerPage
        );
        const newButtons = createPaginationButtons(currentPage, totalPages);

        await buttonInteraction.update({
          embeds: [newEmbed],
          components: [newButtons],
        });
      });

      collector.on("end", async () => {
        // Disable buttons when collector expires
        const disabledButtons = createPaginationButtons(
          currentPage,
          totalPages,
          true
        );
        try {
          await interaction.editReply({
            components: [disabledButtons],
          });
        } catch {
          // Ignore errors if message was deleted
        }
      });

      return;
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
