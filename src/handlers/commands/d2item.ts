import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { type TextCommand } from "../../types/textCommand";
import { DestinyItemFinder } from "../../lib/destiny";

export default {
  name: "d2item",
  description: "Get details of a Destiny 2 item by its hash",
  aliases: ["d2i", "destiny2item"],
  cooldown: 5,
  execute: async (message: Message, args: string[]) => {
    const finder = new DestinyItemFinder();

    if (args.length === 0) {
      if (
        "send" in message.channel &&
        typeof message.channel.send === "function"
      ) {
        return (message.channel as TextChannel).send(
          "Please provide an item hash to search for."
        );
      }
      return;
    }

    const itemHash = parseInt(args[0] || "", 10);
    if (isNaN(itemHash)) {
      if (
        "send" in message.channel &&
        typeof message.channel.send === "function"
      ) {
        return (message.channel as TextChannel).send(
          "Invalid item hash provided."
        );
      }
      return;
    }

    await message.delete().catch(() => {});

    const itemDetails = await finder.getItemDetails(itemHash);
    if (!itemDetails) {
      if (
        "send" in message.channel &&
        typeof message.channel.send === "function"
      ) {
        return (message.channel as TextChannel).send(
          `No item found with hash: **${itemHash}**`
        );
      }
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`🛡️ ${itemDetails.displayProperties.name}`)
      .setDescription(itemDetails.flavorText || "No description available.")
      .setColor(0x89b4fa)
      .setTimestamp()
      .setFooter({
        text: `Requested by ${message.author.username}`,
        iconURL: message.author.displayAvatarURL(),
      });

    // Add item icon if available
    if (itemDetails.displayProperties.icon) {
      embed.setThumbnail(
        `https://www.bungie.net${itemDetails.displayProperties.icon}`
      );
    }

    // Basic Information
    embed.addFields(
      {
        name: "📋 Basic Info",
        value: [
          `**Hash:** \`${itemDetails.hash}\``,
          `**Type:** ${itemDetails.mappings.itemType}`,
          `**Subtype:** ${itemDetails.mappings.itemSubType}`,
          `**Tier:** ${itemDetails.inventory.tierTypeName}`,
        ].join("\n"),
        inline: true,
      },
      {
        name: "⚔️ Combat Info",
        value: [
          `**Damage Type:** ${itemDetails.mappings.damageType}`,
          itemDetails.mappings.ammoType
            ? `**Ammo Type:** ${itemDetails.mappings.ammoType}`
            : null,
          `**Class:** ${itemDetails.mappings.classType}`,
        ]
          .filter(Boolean)
          .join("\n"),
        inline: true,
      },
      {
        name: "📦 Item Details",
        value: [
          `**Max Stack:** ${itemDetails.inventory.maxStackSize}`,
          `**Redacted:** ${itemDetails.redacted ? "Yes" : "No"}`,
          `**Blacklisted:** ${itemDetails.blacklisted ? "Yes" : "No"}`,
        ].join("\n"),
        inline: true,
      }
    );

    // Add perks if available
    if (itemDetails.perks && itemDetails.perks.length > 0) {
      const perksDisplay = itemDetails.perks
        .slice(0, 3) // Limit to first 3 perks
        .map((perk) => `\`${perk.perkHash}\``)
        .join(", ");

      embed.addFields({
        name: "🔮 Perks",
        value: perksDisplay,
        inline: false,
      });
    }

    if (
      "send" in message.channel &&
      typeof message.channel.send === "function"
    ) {
      await (message.channel as TextChannel).send({ embeds: [embed] });
    }
  },
} as TextCommand;
