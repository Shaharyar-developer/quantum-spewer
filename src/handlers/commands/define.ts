import { Message, TextChannel, EmbedBuilder } from "discord.js";
import { type TextCommand } from "../../types/textCommand";
import { fetchDictionaryEntry } from "../../modules/dictionary";
import { getInsult } from "../../modules/insults";

export default {
  name: "Define",
  description: "Get the definition of a word",
  aliases: ["define", "definition", "dict", "dictionary"],
  cooldown: 5,
  execute: async (message: Message, args: string[]) => {
    if (args.length === 0) {
      return message.reply(
        "Please provide a word to define. Usage: `!define <word>`"
      );
    }

    const word = args.join(" ").toLowerCase().trim();

    if (!word) {
      return message.reply("Please provide a valid word to define.");
    }

    try {
      const entry = await fetchDictionaryEntry(word);

      if (!entry) {
        return message.reply(`No dictionary entry found for "${word}".`);
      }

      const embed = new EmbedBuilder()
        .setTitle(entry.word)
        .setColor(0x1d2439)
        .setFooter({
          text: await getInsult(),
        });

      // Add phonetic if available
      if (entry.phonetic) {
        embed.setDescription(`**Phonetic:** ${entry.phonetic}`);
      }

      if (entry.meanings && entry.meanings.length > 0) {
        // Limit to first 2-3 meanings to keep embed concise
        const limitedMeanings = entry.meanings.slice(0, 3);

        limitedMeanings.forEach((meaning) => {
          // Limit definitions per part of speech to keep it concise
          const limitedDefinitions = meaning.definitions.slice(0, 2);

          let value = limitedDefinitions
            .map((def, i) => {
              let str = `• ${def.definition}`;
              if (def.example) str += `\n  _Example:_ ${def.example}`;
              return str;
            })
            .join("\n\n");

          // Add synonyms and antonyms at the end if available
          if (meaning.synonyms && meaning.synonyms.length > 0) {
            const synonymsText = meaning.synonyms.slice(0, 5).join(", ");
            value += `\n\n_Synonyms:_ ${synonymsText}`;
          }

          if (meaning.antonyms && meaning.antonyms.length > 0) {
            const antonymsText = meaning.antonyms.slice(0, 5).join(", ");
            value += `\n\n_Antonyms:_ ${antonymsText}`;
          }

          // Ensure value doesn't exceed Discord's 1024 character limit
          if (value.length > 1024) {
            value = value.substring(0, 1020) + "...";
          }

          embed.addFields({
            name: meaning.partOfSpeech,
            value: value || "No definitions found.",
            inline: false,
          });
        });

        // Add note if there are more meanings
        if (entry.meanings.length > 3) {
          embed.addFields({
            name: "📚 More Information",
            value: `This word has ${entry.meanings.length} total meanings. Use \`/dictionary ${word}\` in the bot commands channel for complete details.`,
            inline: false,
          });
        }
      }

      // Add audio pronunciation if available
      const audio = entry.phonetics?.find((p) => p.audio)?.audio;
      if (audio) {
        embed.addFields({
          name: "🔊 Audio Pronunciation",
          value: `[Listen](${audio})`,
          inline: true,
        });
      }

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error in define command:", error);
      await message.reply(
        "An error occurred while fetching the dictionary entry. Please try again later."
      );
    }
  },
} as TextCommand;
