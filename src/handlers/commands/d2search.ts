import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { type TextCommand } from "../../types/textCommand";
import { DestinyItemFinder } from "../../lib/destiny";

export default {
  name: "d2search",
  description: "Fuzzy Search for Destiny 2 items by name",
  aliases: ["d2s", "destiny2search"],
  cooldown: 5,
  execute: async (message: Message, args: string[]) => {
    const finder = new DestinyItemFinder();

    if (args.length === 0) {
      return message.reply("Please provide an item name to search for.");
    }
    await message.delete().catch(() => {});

    const query = args.join(" ");
    const results = await finder.findItem(query, { maxResults: 5 });
    if (results.length === 0) {
      return message.reply(`No items found for query: **${query}**`);
    }
    const embed = new EmbedBuilder()
      .setTitle("🔍 Destiny 2 Item Search Results")
      .setDescription(`Results for: **${query}**`)
      .setColor(0x89b4fa)
      .setTimestamp()
      .setFooter({
        text: `Searched by ${message.author.username}`,
        iconURL: message.author.displayAvatarURL(),
      });

    // Add the first result's icon as the embed thumbnail
    if (results[0]?.displayProperties.icon) {
      embed.setThumbnail(
        `https://www.bungie.net${results[0].displayProperties.icon}`
      );
    }

    results.forEach((item, index) => {
      const iconUrl = item.displayProperties.icon
        ? `https://www.bungie.net${item.displayProperties.icon}`
        : null;

      embed.addFields({
        name: `Result ${index + 1}: ${item.displayProperties.name}`,
        value: `ID: ${item.hash}\nType: ${
          item.inventory.tierTypeName
        }\nDescription: ${item.flavorText || "No description available."}${
          iconUrl ? `\n[View Icon](${iconUrl})` : ""
        }`,
      });
    });
    if (
      "send" in message.channel &&
      typeof message.channel.send === "function"
    ) {
      await (message.channel as TextChannel).send({ embeds: [embed] });
    }
  },
} as TextCommand;
