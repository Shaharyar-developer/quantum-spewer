import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { type TextCommand } from "../../types/textCommand";
import {
  type ConversionUnit,
  type NumberBase,
  findUnit,
  parseConversionInput,
  convertValue,
  formatResult,
  getAvailableUnits,
} from "../../lib/unit-converter";

// Constants for better maintainability
const COLORS = {
  SUCCESS: 0x4caf50,
  INFO: 0x00ae86,
  ERROR: 0xff6b6b,
} as const;

const MESSAGES = {
  HELP_TITLE: "🔄 Unit Converter",
  HELP_DESCRIPTION:
    "Convert between different units and number bases!\n\n" +
    "**Usage:** `convert <value> <from_unit> <to_unit> [--scientific]`\n" +
    "**Examples:**\n" +
    "• `convert 100 celsius fahrenheit`\n" +
    "• `convert 5 feet meters`\n" +
    "• `convert 60 mph km/h`\n" +
    "• `convert 1101 binary decimal` (number bases)\n" +
    "• `convert FF hex decimal`\n" +
    "• `convert 1 ly meters --scientific` (scientific notation)\n" +
    "• `convert 2 football_fields meters` (fun units)\n\n" +
    "**Available Units:**\n",
  HELP_FOOTER:
    "Units are case-insensitive and support multiple aliases! Use --scientific for large numbers.",
  INVALID_FORMAT_TITLE: "❌ Invalid Format",
  INVALID_FORMAT_DESC:
    "Please use the format: `convert <value> <from_unit> <to_unit>`\n" +
    "Example: `convert 100 celsius fahrenheit`",
  UNKNOWN_UNIT_TITLE: "❌ Unknown Unit",
  CONVERSION_ERROR_TITLE: "❌ Conversion Error",
  RESULT_TITLE: "🔄 Conversion Result",
} as const;

/**
 * Creates a help embed for the convert command
 */
function createHelpEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(MESSAGES.HELP_TITLE)
    .setDescription(MESSAGES.HELP_DESCRIPTION + getAvailableUnits())
    .setColor(COLORS.INFO)
    .setFooter({ text: MESSAGES.HELP_FOOTER });
}

/**
 * Creates an error embed with the given title and description
 */
function createErrorEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(COLORS.ERROR);
}

/**
 * Creates a success embed for conversion results
 */
function createSuccessEmbed(
  value: number | string,
  fromUnit: ConversionUnit | NumberBase,
  toUnit: ConversionUnit | NumberBase,
  convertedValue: number | string,
  username: string,
  useScientific: boolean = false
): EmbedBuilder {
  const formattedResult = formatResult(convertedValue, {
    scientific: useScientific && typeof convertedValue === "number",
  });
  const formattedInput =
    typeof value === "string"
      ? value
      : formatResult(value, { scientific: useScientific });

  const isNumberConversion = fromUnit.type === "number";
  const fromSymbol = isNumberConversion
    ? (fromUnit as NumberBase).symbol
    : (fromUnit as ConversionUnit).symbol;
  const toSymbol = isNumberConversion
    ? (toUnit as NumberBase).symbol
    : (toUnit as ConversionUnit).symbol;

  return new EmbedBuilder()
    .setTitle(MESSAGES.RESULT_TITLE)
    .addFields(
      {
        name: "From",
        value: `${formattedInput}${fromSymbol}`,
        inline: true,
      },
      {
        name: "To",
        value: `${formattedResult}${toSymbol}`,
        inline: true,
      },
      {
        name: "Conversion",
        value: `${formattedInput} ${fromUnit.name} = ${formattedResult} ${toUnit.name}`,
        inline: false,
      }
    )
    .setColor(COLORS.SUCCESS)
    .setFooter({
      text: `Converted by ${username}${
        useScientific ? " • Scientific notation" : ""
      }`,
    });
}

export default {
  name: "convert",
  description:
    "Convert different units of measurement (temperature, length, weight, volume, speed, area) and number bases (binary, octal, decimal, hex)",
  aliases: ["convert", "conversion", "conv"],
  cooldown: 3,
  execute: async (message: Message, args: string[]) => {
    // Check for scientific notation flag
    const useScientific = args.includes("--scientific") || args.includes("-s");
    const filteredArgs = args.filter(
      (arg) => arg !== "--scientific" && arg !== "-s"
    );

    if (filteredArgs.length === 0) {
      const helpEmbed = createHelpEmbed();
      (message.channel as TextChannel).send({ embeds: [helpEmbed] });
      return;
    }

    try {
      const input = parseConversionInput(filteredArgs);
      if (!input) {
        const errorEmbed = createErrorEmbed(
          MESSAGES.INVALID_FORMAT_TITLE,
          MESSAGES.INVALID_FORMAT_DESC +
            "\n\nAdd `--scientific` or `-s` for scientific notation output."
        );
        (message.channel as TextChannel).send({ embeds: [errorEmbed] });
        return;
      }

      const fromUnit = findUnit(input.fromUnit);
      const toUnit = findUnit(input.toUnit);

      if (!fromUnit) {
        const errorEmbed = createErrorEmbed(
          MESSAGES.UNKNOWN_UNIT_TITLE,
          `I don't recognize the unit "${input.fromUnit}". Use \`convert\` without arguments to see available units.`
        );
        (message.channel as TextChannel).send({ embeds: [errorEmbed] });
        return;
      }

      if (!toUnit) {
        const errorEmbed = createErrorEmbed(
          MESSAGES.UNKNOWN_UNIT_TITLE,
          `I don't recognize the unit "${input.toUnit}". Use \`convert\` without arguments to see available units.`
        );
        (message.channel as TextChannel).send({ embeds: [errorEmbed] });
        return;
      }

      const convertedValue = convertValue(input.value, fromUnit, toUnit);
      const resultEmbed = createSuccessEmbed(
        input.value,
        fromUnit,
        toUnit,
        convertedValue,
        message.author.username,
        useScientific
      );
      (message.channel as TextChannel).send({ embeds: [resultEmbed] });
    } catch (error) {
      const errorEmbed = createErrorEmbed(
        MESSAGES.CONVERSION_ERROR_TITLE,
        error instanceof Error
          ? error.message
          : "An error occurred during conversion"
      );
      (message.channel as TextChannel).send({ embeds: [errorEmbed] });
    }
  },
} satisfies TextCommand as TextCommand;
