import ai from "../../lib/ai";
import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { type TextCommand } from "../../types/textCommand";

const melancholicWhimsyCommand: TextCommand = {
  name: "melancholic-whimsy",
  description:
    "Generate a melancholic poem given a text prompt in Fenryx's style.",
  aliases: ["melancholy", "sad-poetry"],
  cooldown: 60,
  execute: async (message: Message, args: string[]) => {
    console.log("=== MELANCHOLIC-WHIMSY COMMAND EXECUTED ===");
    console.log("User:", message.author.username);
    console.log("Channel:", message.channel.id);
    console.log("Args:", args);

    // Validate input
    const text = args.join(" ");
    if (!text || text.trim().length === 0) {
      console.log("ERROR: No text provided for melancholic whimsy");
      const errorEmbed = new EmbedBuilder()
        .setColor(0xf38ba8) // Error color
        .setTitle("⚠️ Error")
        .setDescription(
          "Please provide some text for the melancholic poem generation."
        )
        .setTimestamp();

      // Safe channel send helper for validation error
      if (
        "send" in message.channel &&
        typeof message.channel.send === "function"
      ) {
        await message.channel.send({ embeds: [errorEmbed] });
      }
      return;
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
      .setTitle("🖋️ Melancholic Poem Request Initializing...")
      .setDescription(
        "Preparing your melancholic poem request for the AI processing queue..."
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
      console.log("Adding melancholic whimsy generation task to AI queue...");
      console.log("AI Queue Status:", ai.getQueueStatus());

      // Generate a melancholic poem (now uses queue system with status updates)
      const result = await ai.generateMelancholicWhimsy(
        text,
        thinkingMessage || undefined,
        message.author.username,
        message.author.displayAvatarURL()
      );
      console.log(
        "AI queue task completed, poem received:",
        result.substring(0, 100) + "..."
      );

      // Create an embed for the poem
      const embed = new EmbedBuilder()
        .setColor(0x6c757d) // Melancholic gray color
        .setTitle("🌙 Melancholic Poem")
        .setDescription(`${text.trim()}\n***\n${result}`)
        .setTimestamp()
        .setFooter({
          text: `Requested by ${message.author.username} • Processed via AI Queue`,
          iconURL: message.author.displayAvatarURL(),
        });

      console.log("Updating thinking message with poem...");
      // Update the thinking message with the actual poem
      if (thinkingMessage && "edit" in thinkingMessage) {
        await thinkingMessage.edit({ embeds: [embed] });
        console.log("Thinking message updated successfully");
      } else {
        console.log("Fallback: sending new message");
        await sendToChannel({ embeds: [embed] });
      }
    } catch (error) {
      console.error("Error generating melancholic poem:", error);

      // Error embed for consistency
      const errorEmbed = new EmbedBuilder()
        .setColor(0xf38ba8) // Error color
        .setTitle("⚠️ Error")
        .setDescription(
          "An error occurred while processing your melancholic poem request in the AI queue. This may be due to rate limiting or AI service issues. Please try again later."
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
    console.log("=== MELANCHOLIC-WHIMSY COMMAND COMPLETED ===");
  },
};

export default melancholicWhimsyCommand;
