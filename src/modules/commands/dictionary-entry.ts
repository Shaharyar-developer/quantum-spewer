import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { getInsult } from "../insults";
import { fetchDictionaryEntry } from "../dictionary";

const data = new SlashCommandBuilder()
  .setName("dictionary")
  .setDescription("Get a random dictionary entry.")
  .addStringOption((option) =>
    option
      .setName("word")
      .setDescription("The word to look up in the dictionary")
      .setRequired(true)
  );

async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const word = interaction.options.getString("word", true);
  const entry = await fetchDictionaryEntry(word);

  if (!entry) {
    return await interaction.editReply({
      content: `No dictionary entry found for "${word}".`,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle(entry.word)
    .setColor(0x1d2439)
    .setFooter({
      text: await getInsult(),
    });

  // Add phonetic if available
  if (entry.phonetic) {
    embed.setDescription(`Phonetic: ${entry.phonetic}`);
  }

  if (entry.meanings && entry.meanings.length > 0) {
    entry.meanings.forEach((meaning) => {
      let value = meaning.definitions
        .map((def, i) => {
          let str = `• ${def.definition}`;
          if (def.example) str += `\n  _Example_: ${def.example}`;
          if (def.synonyms && def.synonyms.length > 0)
            str += `\n  _Synonyms_: ${def.synonyms.join(", ")}`;
          if (def.antonyms && def.antonyms.length > 0)
            str += `\n  _Antonyms_: ${def.antonyms.join(", ")}`;
          return str;
        })
        .join("\n\n");
      embed.addFields({
        name: meaning.partOfSpeech,
        value: value.length > 0 ? value : "No definitions found.",
      });
    });
  }

  const audio = entry.phonetics?.find((p) => p.audio)?.audio;
  if (audio) {
    embed.addFields({
      name: "Audio Pronunciation",
      value: `[Listen](${audio})`,
    });
  }

  await interaction.editReply({ embeds: [embed] });
}

export default { data, execute, cooldown: 10 } as const;
