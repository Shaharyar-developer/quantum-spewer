import ai from "../../lib/ai";
import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { type TextCommand } from "../../types/textCommand";
import { MASTER_IDS } from "../../lib/constants";

export default {
  name: "myth",
  description: "Generate a myth about yourself based on your name.",
  aliases: ["mythos", "mythic"],
  cooldown: 60, // 1 minute cooldown
  execute: async (message: Message, args: string[]) => {
    console.log("=== MYTH COMMAND EXECUTED ===");
    console.log("User:", message.author.username);
    console.log("Channel:", message.channel.id);
    console.log("Args:", args);

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
      .setTitle("🌌 Myth Generation Request Initializing...")
      .setDescription(
        "Preparing your myth generation request for the AI processing queue..."
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
      console.log("Adding myth generation task to AI queue...");
      console.log("AI Queue Status:", ai.getQueueStatus());

      // Generate a myth about the user based on their name
      const isMod = MASTER_IDS.includes(message.author.id);
      const myth = await ai.generateMyth(
        {
          username: message.author.displayName,
          isMod,
        },
        thinkingMessage || undefined,
        message.author.displayName,
        message.author.displayAvatarURL()
      );

      if (!myth) {
        throw new Error("Myth generation failed or returned empty.");
      }

      console.log(
        "AI queue task completed, myth received:",
        myth.substring(0, 100) + "..."
      );

      // Create the final embed with the generated myth
      const mythEmbed = new EmbedBuilder()
        .setColor(0x6a0dad) // Mythical color
        .setTitle(`🌌 Myth of ${message.author.username}`)
        .setDescription(myth)
        .setTimestamp()
        .setFooter({
          text: `Requested by ${message.author.username} • Processed via AI Queue`,
          iconURL: message.author.displayAvatarURL(),
        });

      console.log("Updating thinking message with myth...");
      // Update the thinking message with the actual myth
      if (thinkingMessage && "edit" in thinkingMessage) {
        await thinkingMessage.edit({ embeds: [mythEmbed] });
        console.log("Thinking message updated successfully");
      } else {
        console.log("Fallback: sending new message");
        await sendToChannel({ embeds: [mythEmbed] });
      }
    } catch (error) {
      console.error("Error generating myth:", error);

      // Error embed for consistency
      const errorEmbed = new EmbedBuilder()
        .setColor(0xf38ba8) // Error color
        .setTitle("⚠️ Error")
        .setDescription(
          "An error occurred while processing your myth generation request in the AI queue. This may be due to rate limiting or AI service issues. Please try again later."
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
    console.log("=== MYTH COMMAND COMPLETED ===");
  },
} as TextCommand;
