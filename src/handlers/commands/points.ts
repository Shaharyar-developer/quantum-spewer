import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { type TextCommand } from "../../types/textCommand";
import { getUserPoints } from "../../lib/utils";

const pointsCommand: TextCommand = {
  name: "points",
  description: "View user points (your own or mention someone else)",
  aliases: ["points", "point", "pts"],
  cooldown: 3,
  execute: async (message: Message, args: string[]) => {
    // Delete the command message for cleaner chat
    await message.delete().catch(() => {});

    let targetUser = message.author;
    let targetUserId = message.author.id;

    // Check if a user was mentioned
    if (message.mentions.users.size > 0) {
      targetUser = message.mentions.users.first()!;
      targetUserId = targetUser.id;
    } else if (args.length > 0 && args[0] && args[0].match(/^\d+$/)) {
      // If a user ID was provided as argument
      try {
        targetUser = await message.client.users.fetch(args[0]);
        targetUserId = args[0];
      } catch (error) {
        const errorEmbed = new EmbedBuilder()
          .setTitle("❌ User Not Found")
          .setDescription("Could not find a user with that ID.")
          .setColor(0xf38ba8)
          .setTimestamp()
          .setFooter({
            text: `Requested by ${message.author.username}`,
            iconURL: message.author.displayAvatarURL(),
          });

        if (
          "send" in message.channel &&
          typeof message.channel.send === "function"
        ) {
          await (message.channel as TextChannel).send({ embeds: [errorEmbed] });
        }
        return;
      }
    }

    try {
      const userPoints = await getUserPoints(targetUserId);

      const isOwnPoints = targetUserId === message.author.id;
      const title = isOwnPoints
        ? "💰 Your Points"
        : `💰 ${targetUser.username}'s Points`;

      // Create different descriptions based on point count
      let description = `**${userPoints.toLocaleString()}** points`;
      let pointsEmoji = "💎";

      if (userPoints === 0) {
        description +=
          "\n\n*No points yet! Try playing some games to earn points.*";
        pointsEmoji = "🔸";
      } else if (userPoints < 10) {
        description += "\n\n*Just getting started! Keep playing to earn more.*";
        pointsEmoji = "🔹";
      } else if (userPoints < 50) {
        description +=
          "\n\n*Making progress! You're building up your collection.*";
        pointsEmoji = "💠";
      } else if (userPoints < 100) {
        description +=
          "\n\n*Looking good! You've got a solid amount of points.*";
        pointsEmoji = "💎";
      } else {
        description += "\n\n*Impressive! You're a true point collector.*";
        pointsEmoji = "👑";
      }

      const embed = new EmbedBuilder()
        .setTitle(`${pointsEmoji} ${title}`)
        .setDescription(description)
        .setColor(0x89b4fa)
        .setTimestamp()
        .setThumbnail(targetUser.displayAvatarURL())
        .setFooter({
          text: `Requested by ${message.author.username}`,
          iconURL: message.author.displayAvatarURL(),
        });

      if (
        "send" in message.channel &&
        typeof message.channel.send === "function"
      ) {
        await (message.channel as TextChannel).send({ embeds: [embed] });
      }
    } catch (error) {
      console.error("Error fetching user points:", error);

      const errorEmbed = new EmbedBuilder()
        .setTitle("❌ Error")
        .setDescription(
          "Something went wrong while fetching the points. Please try again later."
        )
        .setColor(0xf38ba8)
        .setTimestamp()
        .setFooter({
          text: `Requested by ${message.author.username}`,
          iconURL: message.author.displayAvatarURL(),
        });

      if (
        "send" in message.channel &&
        typeof message.channel.send === "function"
      ) {
        await (message.channel as TextChannel).send({ embeds: [errorEmbed] });
      }
    }
  },
};

export default pointsCommand;
