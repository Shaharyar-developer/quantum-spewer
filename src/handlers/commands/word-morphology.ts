import { Message, EmbedBuilder } from "discord.js";
import { type TextCommand } from "../../types/textCommand";
import AI from "../../lib/ai";
import { type WordMorphologyResponse } from "../../types/ai";

export default {
  name: "word-morphology",
  description:
    "Break down a word into its morphological components with synonyms",
  aliases: ["morphology", "morph", "breakdown", "etymology"],
  cooldown: 15,
  execute: async (message: Message, args: string[]) => {
    console.log("=== WORD-MORPHOLOGY COMMAND EXECUTED ===");
    console.log("User:", message.author.username);
    console.log("Channel:", message.channel.id);
    console.log("Args:", args);

    const word = args.join(" ").trim();
    if (!word) {
      return message.reply(
        "Please provide a word to analyze. Usage: `word-morphology! <word>`"
      );
    }

    if (word.length < 2 || word.length > 30) {
      return message.reply(
        "Please provide a word between 2 and 30 characters long."
      );
    }

    // Check if word contains only letters and hyphens
    if (!/^[a-zA-Z-]+$/.test(word)) {
      return message.reply(
        "Please provide a valid word (letters and hyphens only)."
      );
    }

    // Delete the command message for cleaner chat
    await message.delete().catch(() => {});
    console.log("Command message deleted");

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
      .setTitle("🔬 Analyzing Word Structure...")
      .setDescription(
        `Breaking down "${word}" into its morphological components. This may take a moment...`
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
      console.log("Calling AI to generate morphology breakdown...");
      const response: WordMorphologyResponse | string =
        await AI.generateWordMorphology(word);
      console.log("AI response received:", typeof response);

      if (!response || typeof response === "string") {
        // Error embed for consistency
        const errorEmbed = new EmbedBuilder()
          .setColor(0xf38ba8) // Error color
          .setTitle("⚠️ Analysis Failed")
          .setDescription(
            response
              ? response
              : "Sorry, I couldn't analyze the morphological structure of that word."
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

      const embed = new EmbedBuilder()
        .setTitle(`🔬 Morphological Analysis: "${response.word}"`)
        .setColor(0x89b4fa)
        .setDescription(response.derivedMeaning)
        .setTimestamp()
        .setFooter({
          text: `Requested by ${message.author.username} • Powered by Gemini AI`,
          iconURL: message.author.displayAvatarURL(),
        });

      // Add prefixes if they exist
      if (
        response.breakdown.prefixes &&
        response.breakdown.prefixes.length > 0
      ) {
        response.breakdown.prefixes.forEach((prefix, index) => {
          let value = `**Morpheme:** \`${prefix.morpheme}\`\n**Meaning:** ${prefix.meaning}`;

          if (prefix.synonyms && prefix.synonyms.length > 0) {
            value += `\n**Synonyms:** ${prefix.synonyms.join(", ")}`;
          }

          if (prefix.origin) {
            value += `\n**Origin:** ${prefix.origin}`;
          }

          embed.addFields({
            name: `🔤 Prefix ${
              response.breakdown.prefixes!.length > 1 ? `(${index + 1})` : ""
            }`,
            value: value,
            inline: true,
          });
        });
      }

      // Add root word
      const root = response.breakdown.root;
      let rootValue = `**Morpheme:** \`${root.morpheme}\`\n**Meaning:** ${root.meaning}`;

      if (root.synonyms && root.synonyms.length > 0) {
        rootValue += `\n**Synonyms:** ${root.synonyms.join(", ")}`;
      }

      if (root.origin) {
        rootValue += `\n**Origin:** ${root.origin}`;
      }

      embed.addFields({
        name: "🌱 Root",
        value: rootValue,
        inline: true,
      });

      // Add suffixes if they exist
      if (
        response.breakdown.suffixes &&
        response.breakdown.suffixes.length > 0
      ) {
        response.breakdown.suffixes.forEach((suffix, index) => {
          let value = `**Morpheme:** \`${suffix.morpheme}\`\n**Meaning:** ${suffix.meaning}`;

          if (suffix.synonyms && suffix.synonyms.length > 0) {
            value += `\n**Synonyms:** ${suffix.synonyms.join(", ")}`;
          }

          if (suffix.origin) {
            value += `\n**Origin:** ${suffix.origin}`;
          }

          embed.addFields({
            name: `🔤 Suffix ${
              response.breakdown.suffixes!.length > 1 ? `(${index + 1})` : ""
            }`,
            value: value,
            inline: true,
          });
        });
      }

      console.log("Updating thinking message with morphology breakdown...");
      // Update the thinking message with the actual morphology breakdown
      if (thinkingMessage && "edit" in thinkingMessage) {
        await thinkingMessage.edit({ embeds: [embed] });
        console.log("Thinking message updated successfully");
      } else {
        console.log("Fallback: sending new message");
        await sendToChannel({ embeds: [embed] });
      }
    } catch (error) {
      console.error("Error in word-morphology command:", error);

      // Error embed for consistency
      const errorEmbed = new EmbedBuilder()
        .setColor(0xf38ba8) // Error color
        .setTitle("⚠️ Error")
        .setDescription(
          "An error occurred while analyzing the word structure. Please try again later."
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
    console.log("=== WORD-MORPHOLOGY COMMAND COMPLETED ===");
  },
} as TextCommand;
