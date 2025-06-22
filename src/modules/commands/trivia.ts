import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { CATEGORIES_TABLE, getTrivia } from "../trivia";
import { getInsult } from "../insults";

const data = new SlashCommandBuilder()
  .setName("trivia")
  .setDescription("Manage/Use Trivia Instance.")
  .addStringOption((option) =>
    option
      .setName("difficulty")
      .setDescription("Select a difficulty level")
      .addChoices(
        { name: "Easy", value: "easy" },
        { name: "Medium", value: "medium" },
        { name: "Hard", value: "hard" }
      )
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("type")
      .setDescription("Select a question type")
      .addChoices(
        { name: "Multiple Choice", value: "multiple" },
        { name: "True/False", value: "boolean" }
      )
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("category")
      .setDescription("Select a category")
      .addChoices(
        CATEGORIES_TABLE.map((category) => ({
          name: category.name,
          value: category.id.toString(),
        }))
      )
  );

async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const difficulty = interaction.options.getString("difficulty");
  const type = interaction.options.getString("type");
  const category = interaction.options.getString("category");
  if (!difficulty || !type) {
    return await interaction.editReply({
      content:
        "Please provide all required options: A difficulty and a type" +
        (await getInsult(0)),
    });
  }
  const params = {
    difficulty: difficulty as "easy" | "medium" | "hard",
    type: type as "multiple" | "boolean",
    category: category as string,
  };

  const triviaQuestion = await getTrivia(params);

  if (!triviaQuestion || triviaQuestion.length === 0) {
    return await interaction.editReply({
      content: "No trivia questions found for the given parameters.",
    });
  }

  const question = triviaQuestion[0];

  if (!question) {
    return await interaction.editReply({
      content: "No trivia question found.",
    });
  }

  // Prepare options: shuffle correct and incorrect answers
  const decodedIncorrect = question.incorrect_answers.map((a) =>
    decodeURIComponent(a)
  );
  const correctAnswer = decodeURIComponent(question.correct_answer);
  const allAnswers = [...decodedIncorrect, correctAnswer] as string[];
  // Shuffle answers
  for (let i = allAnswers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = allAnswers[i] ?? "";
    allAnswers[i] = allAnswers[j] ?? "";
    allAnswers[j] = temp;
  }

  // Map to button labels
  const labels = ["A", "B", "C", "D"];
  const correctIndex = allAnswers.indexOf(correctAnswer);

  const decodedQuestion = decodeURIComponent(question.question);
  const decodedCategory = question.category
    ? decodeURIComponent(question.category)
    : "Unknown";

  const embed = new EmbedBuilder()
    .setTitle("🎲 Trivia Time!")
    .setDescription(`**${decodedQuestion}**`)
    .addFields({
      name: "Info",
      value: [
        `**Category:** ${
          decodedCategory.charAt(0).toUpperCase() +
          decodedCategory.slice(1).toLowerCase()
        }`,
        `**Difficulty:** ${
          question.difficulty === "easy"
            ? "Easy"
            : question.difficulty === "medium"
            ? "Medium"
            : "Hard"
        }`,
        `**Type:** ${
          question.type === "multiple" ? "Multiple Choice" : "True/False"
        }\n\n\n **Select an answer below:**`,
      ].join("\n"),
    })
    .addFields({
      name: "Options",
      value: allAnswers
        .map(
          (answer, idx) =>
            `**${labels[idx] ?? String.fromCharCode(65 + idx)}**: ${answer}`
        )
        .join("\n"),
    })

    .setColor(0x1d2439)
    .setFooter({
      text: await getInsult(),
    });

  // Create answer buttons
  const optionsRow = new ActionRowBuilder<ButtonBuilder>();
  for (let i = 0; i < allAnswers.length; i++) {
    optionsRow.addComponents(
      new ButtonBuilder()
        .setCustomId(
          `trivia_answer_${i}_${i === correctIndex ? "correct" : "wrong"}`
        )
        .setLabel(labels[i] ?? String.fromCharCode(65 + i))
        .setStyle(ButtonStyle.Primary)
    );
  }

  await interaction.editReply({
    embeds: [embed],
    components: [optionsRow.toJSON()],
  });
}

export default {
  data,
  execute,
  cooldown: 5,
};
