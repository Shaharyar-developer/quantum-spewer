import { Message, EmbedBuilder } from "discord.js";
import { type TextCommand } from "../../types/textCommand";
import AI from "../../lib/ai";
import {
  type WordInfoResponse,
  type WordMorphologyResponse,
} from "../../types/ai";

export default {
  name: "word-info",
  description:
    "Get detailed information about a word using AI. Use --morph flag for morphological breakdown",
  aliases: ["wordinfo", "wi"],
  cooldown: 15,
  execute: async (message: Message, args: string[]) => {
    console.log("=== WORD-INFO COMMAND EXECUTED ===");
    console.log("User:", message.author.username);
    console.log("Channel:", message.channel.id);
    console.log("Args:", args);

    const word = args.join(" ").trim();
    const isMorphologyMode = word.includes("--morph");
    const cleanWord = word.replace("--morph", "").trim();

    if (!cleanWord) {
      return message.reply(
        "Please provide a word to get information about. Usage: `word-info! <word or phrase>` or `word-info! --morph <word>`"
      );
    }

    if (cleanWord.length < 1 || cleanWord.length > 50) {
      return message.reply(
        "Please provide a word between 1 and 50 characters long."
      );
    }

    // Check if word contains only letters and hyphens/apostrophes
    if (!/^[a-zA-Z' -]+$/.test(cleanWord)) {
          return message.reply(
            "Please provide a valid word (letters, hyphens, and apostrophes only)."
          );
        }

    // Delete the command message for cleaner chat
    await message.delete().catch(() => {});
    console.log("Command message deleted");

    // Helper function to split long content into multiple title-less fields
    const addFieldWithSplit = (
      embed: EmbedBuilder,
      name: string,
      value: string,
      inline: boolean = false
    ) => {
      const maxLength = 1024;

      if (value.length <= maxLength) {
        embed.addFields({
          name: name,
          value: value,
          inline: inline,
        });
        return;
      }

      // Split into chunks, trying to break at natural points
      const chunks: string[] = [];
      let remainingText = value;

      while (remainingText.length > maxLength) {
        let splitPoint = maxLength;

        // Try to find a good break point (newline, sentence, then word)
        const lastNewline = remainingText.lastIndexOf("\n", maxLength);
        const lastSentence = remainingText.lastIndexOf(".", maxLength);
        const lastSpace = remainingText.lastIndexOf(" ", maxLength);

        if (lastNewline > maxLength * 0.7) {
          splitPoint = lastNewline + 1;
        } else if (lastSentence > maxLength * 0.7) {
          splitPoint = lastSentence + 1;
        } else if (lastSpace > maxLength * 0.7) {
          splitPoint = lastSpace + 1;
        }

        chunks.push(remainingText.substring(0, splitPoint));
        remainingText = remainingText.substring(splitPoint);
      }

      if (remainingText.length > 0) {
        chunks.push(remainingText);
      }

      // Add the first chunk with the original name
      embed.addFields({
        name: name,
        value: `${chunks[0]}`,
        inline: inline,
      });

      // Add remaining chunks as title-less fields
      for (let i = 1; i < chunks.length; i++) {
        embed.addFields({
          name: "\u200b", // Zero-width space for "title-less" field
          value: `${chunks[i]}`,
          inline: inline,
        });
      }
    };

    // Safe channel send helper
    const sendToChannel = async (content: any) => {
      if (
        "send" in message.channel &&
        typeof message.channel.send === "function"
      ) {
        console.log("Sending message to channel...");
        return await message.channel.send(content);
      }
      console.log("ERROR: Cannot send to channel - channel.send not available");
      return null;
    };

    // Send initial "thinking" message
    const thinkingEmbed = new EmbedBuilder()
      .setColor(0xfab387) // Warning/thinking color
      .setTitle(
        isMorphologyMode
          ? "🔬 Word Analysis Initializing..."
          : "📚 Word Analysis Initializing..."
      )
      .setDescription(
        isMorphologyMode
          ? `Preparing morphological analysis of "${cleanWord}" for the AI processing queue...`
          : `Preparing word information lookup for "${cleanWord}" for the AI processing queue...`
      )
      .setTimestamp()
      .setFooter({
        text: `Requested by ${message.author.username}`,
        iconURL: message.author.displayAvatarURL(),
      });

    console.log("Sending thinking message...");
    const thinkingMessage = await sendToChannel({ embeds: [thinkingEmbed] });
    console.log("Thinking message sent:", !!thinkingMessage);

    try {
      console.log("Calling AI to generate word info...");
      const response: WordInfoResponse | WordMorphologyResponse | string =
        isMorphologyMode
          ? await AI.generateWordMorphology(
              cleanWord,
              thinkingMessage || undefined,
              message.author.username,
              message.author.displayAvatarURL()
            )
          : await AI.generateWordInfo(
              cleanWord,
              thinkingMessage || undefined,
              message.author.username,
              message.author.displayAvatarURL()
            );
      console.log("AI response received:", typeof response);

      if (!response || typeof response === "string") {
        // Error embed for consistency
        const errorEmbed = new EmbedBuilder()
          .setColor(0xf38ba8) // Error color
          .setTitle("⚠️ Word Not Found")
          .setDescription(
            response
              ? response
              : "Sorry, I couldn't find any information about that word."
          )
          .setTimestamp();

        console.log("Updating thinking message with error...");
        // Update the thinking message with the error, or send new message if update fails
        if (thinkingMessage && "edit" in thinkingMessage) {
          await thinkingMessage.edit({ embeds: [errorEmbed] }).catch(() => {
            console.log(
              "Failed to edit thinking message, sending new error message"
            );
            sendToChannel({ embeds: [errorEmbed] });
          });
        } else {
          console.log("Fallback: sending new error message");
          await sendToChannel({ embeds: [errorEmbed] });
        }
        return;
      }

      let embed: EmbedBuilder;

      if (isMorphologyMode) {
        // Handle morphology response
        const morphResponse = response as WordMorphologyResponse;
        embed = new EmbedBuilder()
          .setTitle(`🔬 Morphological Analysis: "${morphResponse.word}"`)
          .setColor(0x89b4fa)
          .setDescription(morphResponse.derivedMeaning)
          .setTimestamp()
          .setFooter({
            text: `Requested by ${message.author.username} • Quantum Spewer`,
            iconURL: message.author.displayAvatarURL(),
          });

        // Add prefixes if they exist
        if (
          morphResponse.breakdown.prefixes &&
          morphResponse.breakdown.prefixes.length > 0
        ) {
          morphResponse.breakdown.prefixes.forEach((prefix, index) => {
            let value = `**Morpheme:** \`${prefix.morpheme}\`\n**Meaning:** ${prefix.meaning}`;

            if (prefix.synonyms && prefix.synonyms.length > 0) {
              value += `\n**Synonyms:** ${prefix.synonyms.join(", ")}`;
            }

            if (prefix.origin) {
              value += `\n**Origin:** ${prefix.origin}`;
            }

            addFieldWithSplit(
              embed,
              `� Prefix ${
                morphResponse.breakdown.prefixes!.length > 1
                  ? `(${index + 1})`
                  : ""
              }`,
              value,
              false
            );
          });
        }

        // Add root word
        const root = morphResponse.breakdown.root;
        let rootValue = `**Morpheme:** \`${root.morpheme}\`\n**Meaning:** ${root.meaning}`;

        if (root.synonyms && root.synonyms.length > 0) {
          rootValue += `\n**Synonyms:** ${root.synonyms.join(", ")}`;
        }

        if (root.origin) {
          rootValue += `\n**Origin:** ${root.origin}`;
        }

        addFieldWithSplit(embed, "🌱 Root", rootValue, false);

        // Add suffixes if they exist
        if (
          morphResponse.breakdown.suffixes &&
          morphResponse.breakdown.suffixes.length > 0
        ) {
          morphResponse.breakdown.suffixes.forEach((suffix, index) => {
            let value = `**Morpheme:** \`${suffix.morpheme}\`\n**Meaning:** ${suffix.meaning}`;

            if (suffix.synonyms && suffix.synonyms.length > 0) {
              value += `\n**Synonyms:** ${suffix.synonyms.join(", ")}`;
            }

            if (suffix.origin) {
              value += `\n**Origin:** ${suffix.origin}`;
            }

            addFieldWithSplit(
              embed,
              `🔤 Suffix ${
                morphResponse.breakdown.suffixes!.length > 1
                  ? `(${index + 1})`
                  : ""
              }`,
              value,
              false
            );
          });
        }
      } else {
        // Handle regular word info response
        const wordResponse = response as WordInfoResponse;
        embed = new EmbedBuilder()
          .setTitle(`�📚 Information about "${wordResponse.word}"`)
          .setColor(0x00ae86)
          .setTimestamp()
          .setFooter({
            text: `Requested by ${message.author.username} • Powered by Gemini AI`,
            iconURL: message.author.displayAvatarURL(),
          });

        // Process each definition
        if (wordResponse.definitions && wordResponse.definitions.length > 0) {
          wordResponse.definitions.forEach((def, index) => {
            let value = `**Definition:** ${def.definition}`;

            // Add pronunciation if available
            if (def.pronunciation) {
              value += `\n**Pronunciation:** ${def.pronunciation}`;
            }

            // Add examples if available
            if (def.examples && def.examples.length > 0) {
              const exampleText = def.examples
                .map((ex) => `• ${ex}`)
                .join("\n");
              value += `\n**Examples:**\n${exampleText}`;
            }

            // Add synonyms if available
            if (def.synonyms && def.synonyms.length > 0) {
              const synonymsText = def.synonyms.join(", ");
              value += `\n**Synonyms:** ${synonymsText}`;
            }

            // Add antonyms if available
            if (def.antonyms && def.antonyms.length > 0) {
              const antonymsText = def.antonyms.join(", ");
              value += `\n**Antonyms:** ${antonymsText}`;
            }

            // Add etymology if available
            if (def.etymology) {
              value += `\n**Etymology:** ${def.etymology}`;
            }

            // Use the split function to handle long content
            addFieldWithSplit(
              embed,
              `${def.partOfSpeech}${
                wordResponse.definitions.length > 1 ? ` (${index + 1})` : ""
              }`,
              value,
              false
            );
          });
        } else {
          embed.addFields({
            name: "No Information Found",
            value:
              "Sorry, I couldn't find detailed information about this word.",
            inline: false,
          });
        }
      }

      console.log("Updating thinking message with word info...");
      // Update the thinking message with the actual word info
      if (thinkingMessage && "edit" in thinkingMessage) {
        await thinkingMessage.edit({ embeds: [embed] });
        console.log("Thinking message updated successfully");
      } else {
        console.log("Fallback: sending new message");
        await sendToChannel({ embeds: [embed] });
      }
    } catch (error) {
      console.error("Error in word-info command:", error);

      // Error embed for consistency
      const errorEmbed = new EmbedBuilder()
        .setColor(0xf38ba8) // Error color
        .setTitle("⚠️ Error")
        .setDescription(
          "An error occurred while fetching word information. Please try again later."
        )
        .setTimestamp();

      console.log("Updating thinking message with error...");
      // Update the thinking message with the error, or send new message if update fails
      if (thinkingMessage && "edit" in thinkingMessage) {
        await thinkingMessage.edit({ embeds: [errorEmbed] }).catch(() => {
          console.log(
            "Failed to edit thinking message, sending new error message"
          );
          sendToChannel({ embeds: [errorEmbed] });
        });
      } else {
        console.log("Fallback: sending new error message");
        await sendToChannel({ embeds: [errorEmbed] });
      }
    }
    console.log("=== WORD-INFO COMMAND COMPLETED ===");
  },
} as TextCommand;
