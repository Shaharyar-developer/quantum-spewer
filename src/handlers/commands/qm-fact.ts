import ai from "../../lib/ai";
import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { type TextCommand } from "../../types/textCommand";

const quantumFactCommand: TextCommand = {
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
      .setTitle("🧠 Generating Quantum Fact...")
      .setDescription(
        "The quantum AI is processing your request. This may take a moment..."
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
      console.log("Calling AI to generate quantum fact...");
      // Generate a quantum physics fact
      const fact = await ai.generateQuantumPhysicsFact();
      console.log("AI response received:", fact.substring(0, 100) + "...");

      // Create an embed for the fact
      const embed = new EmbedBuilder()
        .setColor(0xcba6f7) // Use hex color format for consistency
        .setTitle("🔬 Quantum Physics Fact")
        .setDescription(fact)
        .setTimestamp()
        .setFooter({
          text: `Requested by ${message.author.username} • Powered by Gemini AI`,
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
          "An error occurred while generating the quantum physics fact. Please try again later."
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
};

export default quantumFactCommand;
