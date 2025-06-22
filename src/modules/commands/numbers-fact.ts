import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import { getRandomNumberFact } from "../numbers";
import { getCorpoInsult } from "../insults";

export type NumbersCommandType = "math" | "trivia" | "date";

const data = new SlashCommandBuilder()
  .setName("numbers")
  .setDescription("Thingy to do with numbers idk.")
  .addStringOption((opt) =>
    opt
      .setName("type")
      .setDescription("Type of API call.")
      .setRequired(true)
      .addChoices(
        {
          name: "Math",
          value: "math",
        },
        {
          name: "Trivia",
          value: "trivia",
        },
        {
          name: "Date",
          value: "date",
        }
      )
  )
  .addStringOption((opt) =>
    opt
      .setName("value")
      .setDescription(
        "Either; a number, or a date in MM/DD format, or 'random'"
      )
      .setRequired(true)
  );

// Helper to create error embeds
function createErrorEmbed(title: string, description: string) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(0xed4245);
}

async function execute(interaction: ChatInputCommandInteraction) {
  const type = interaction.options.getString(
    "type",
    true
  ) as NumbersCommandType;
  const _value = interaction.options.getString("value", true).trim();
  const value = _value.toLowerCase() === "random" ? "random" : _value;

  if (!value || !type) {
    const missingPropEmbed = createErrorEmbed(
      "Missing Property",
      "You must provide a type and a value for the command. Either a number, a date in MM/DD format, or 'random'."
    );
    await interaction.reply({
      embeds: [missingPropEmbed],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const { fact, error } = await handleCommand(type, value);

  if (error) {
    const errorEmbed = createErrorEmbed("Input Error", fact);
    await interaction.reply({
      embeds: [errorEmbed],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const insult = await getCorpoInsult();

  const embed = new EmbedBuilder()
    .setTitle("Number Fact")
    .setDescription(`**Fact:** ${fact}`)
    .setFooter({ text: insult })
    .setColor(0x7289da);

  await interaction.reply({ embeds: [embed] });
}

export default { data, execute, cooldown: 10 } as const;

function isValidDateMMDD(dateStr: string): boolean {
  const [monthStr, dayStr] = dateStr.split("/");
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!month || !day) return false;
  const daysInMonth = [
    31,
    new Date().getFullYear() % 4 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  if (month < 1 || month > 12) return false;
  const maxDay = daysInMonth[month - 1];
  if (day < 1 || maxDay === undefined || day > maxDay) return false;
  return true;
}

async function handleCommand(
  commandType: NumbersCommandType,
  numberOption: string
): Promise<{ fact: string; error: boolean }> {
  if (numberOption.toLowerCase() === "random") {
    try {
      const fact = await getRandomNumberFact(commandType, "random");
      return { fact, error: false };
    } catch (error) {
      console.error("Error fetching number fact:", error);
      return {
        fact: "An error occurred while fetching the number fact. Please try again later.",
        error: true,
      };
    }
  }

  if (commandType === "date") {
    // Validate MM/DD format and valid day for month
    const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/;
    if (!dateRegex.test(numberOption) || !isValidDateMMDD(numberOption)) {
      return {
        fact: "Please provide a valid date in MM/DD format (e.g., 02/28).",
        error: true,
      };
    }
  } else {
    const number = Number(numberOption);
    if (isNaN(number) || !Number.isInteger(number)) {
      return {
        fact: "Please provide a valid integer number.",
        error: true,
      };
    }
  }
  try {
    const fact = await getRandomNumberFact(commandType, numberOption);
    return { fact, error: false };
  } catch (error) {
    console.error("Error fetching number fact:", error);
    return {
      fact: "An error occurred while fetching the number fact. Please try again later.",
      error: true,
    };
  }
}
