import ai from "../../lib/ai";
import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { type TextCommand } from "../../types/textCommand";
import { getRandomQuantumFactTopic } from "../../lib/constants";

export default {
  name: "quantum-mechanics-fact",
  description: "Generate a random quantum physics fact using Gemini AI.",
  aliases: ["qm-fact", "quantum-fact"],
  cooldown: 60, // 1 minute cooldown
  execute: async (message: Message, args: string[]) => {
    console.log("=== QM-FACT COMMAND EXECUTED ===");
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
      .setTitle("🧠 Quantum Fact Request Initializing...")
      .setDescription(
        "Preparing your quantum fact request for the AI processing queue..."
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
      console.log("Adding quantum fact generation task to AI queue...");
      console.log("AI Queue Status:", ai.getQueueStatus());

      // Generate a quantum physics fact (now uses queue system with status updates)
      const fact = await ai.generateQuantumPhysicsFact(
        getRandomQuantumFactTopic(),
        thinkingMessage || undefined,
        message.author.username,
        message.author.displayAvatarURL()
      );
      console.log(
        "AI queue task completed, fact received:",
        fact.substring(0, 100) + "..."
      );

      // Create an embed for the fact
      const embed = new EmbedBuilder()
        .setColor(0xcba6f7) // Use hex color format for consistency
        .setTitle("🔬 Quantum Physics Fact")
        .setDescription(fact)
        .setTimestamp()
        .setFooter({
          text: `Requested by ${message.author.username} • Processed via AI Queue`,
          iconURL: message.author.displayAvatarURL(),
        });

      console.log("Updating thinking message with fact...");
      // Update the thinking message with the actual fact
      if (thinkingMessage && "edit" in thinkingMessage) {
        await thinkingMessage.edit({ embeds: [embed] });
        console.log("Thinking message updated successfully");
      } else {
        console.log("Fallback: sending new message");
        await sendToChannel({ embeds: [embed] });
      }
    } catch (error) {
      console.error("Error generating quantum physics fact:", error);

      // Error embed for consistency
      const errorEmbed = new EmbedBuilder()
        .setColor(0xf38ba8) // Error color
        .setTitle("⚠️ Error")
        .setDescription(
          "An error occurred while processing your quantum physics fact request in the AI queue. This may be due to rate limiting or AI service issues. Please try again later."
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
    console.log("=== QM-FACT COMMAND COMPLETED ===");
  },
} as TextCommand;