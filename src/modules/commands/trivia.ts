import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
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

// Timer map to track active trivia timers by message ID
// Now stores { timeout, interval, timeLeft }
const triviaTimers = new Map<string, { timeout: NodeJS.Timeout, interval: NodeJS.Timeout, timeLeft: number }>();

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

  const decodedIncorrect = question.incorrect_answers.map((a) =>
    decodeURIComponent(a)
  );
  const correctAnswer = decodeURIComponent(question.correct_answer);
  let allAnswers: string[];
  let labels: string[];
  let correctIndex: number;

  if (question.type === "boolean") {
    allAnswers = ["True", "False"];
    labels = ["True", "False"];
    correctIndex = correctAnswer.toLowerCase() === "true" ? 0 : 1;
  } else {
    allAnswers = [...decodedIncorrect, correctAnswer];
    for (let i = allAnswers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp: string = allAnswers[i]!;
      allAnswers[i] = allAnswers[j]!;
      allAnswers[j] = temp;
    }
    labels = ["A", "B", "C", "D"];
    correctIndex = allAnswers.indexOf(correctAnswer);
  }
  const decodedCategory = decodeURIComponent(question.category);

  const embed = new EmbedBuilder()
    .setTitle("🎲 Trivia Time!")
    .setDescription(
      `**${decodeURIComponent(question.question)}**` +
        `\n\n⏳ **Time left: 15s**`
    )
    .addFields({
      name: "",
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
        }\n\n\n`,
      ].join("\n"),
    })
    .setColor(0x1d2439);

  if (question.type === "multiple") {
    embed.addFields({
      name: "Options",
      value: allAnswers
        .map(
          (answer, idx) =>
            `**${labels[idx] ?? String.fromCharCode(65 + idx)}**: ${answer}`
        )
        .join("\n"),
    });
  }

  const optionsRow = new ActionRowBuilder<ButtonBuilder>();
  for (let i = 0; i < allAnswers.length; i++) {
    let style = ButtonStyle.Primary;
    if (question.type === "boolean") {
      style = i === 0 ? ButtonStyle.Success : ButtonStyle.Danger;
    }
    optionsRow.addComponents(
      new ButtonBuilder()
        .setCustomId(
          `trivia_answer_${i}_${i === correctIndex ? "correct" : "wrong"}`
        )
        .setLabel(labels[i] ?? String.fromCharCode(65 + i))
        .setStyle(style)
    );
  }

  await interaction.editReply({
    embeds: [embed],
    components: [optionsRow.toJSON()],
  });

  const sentMsg = await interaction.fetchReply();
  const messageId = sentMsg.id;
  let timeLeft = 15;

  // Helper to update the timer in the embed
  const updateTimer = async () => {
    const timerEmbed = EmbedBuilder.from(embed.toJSON());
    // Replace the timer in the description using regex
    let desc = embed.data.description || "";
    desc = desc.replace(
      /⏳ \*\*Time left: \d+s\*\*/,
      `⏳ **Time left: ${timeLeft}s**`
    );
    timerEmbed.setDescription(desc);
    await sentMsg.edit({
      embeds: [timerEmbed],
      components: [optionsRow.toJSON()],
    });
  };

  // Start interval for countdown
  const interval = setInterval(async () => {
    timeLeft--;
    if (timeLeft > 0) {
      await updateTimer();
    }
  }, 1000);

  // Timeout for when time runs out
  const timeout = setTimeout(async () => {
    if (!triviaTimers.has(messageId)) return;
    triviaTimers.delete(messageId);
    clearInterval(interval);
    // Prepare the timeout embed and disabled buttons
    const timeoutEmbed = EmbedBuilder.from(embed.toJSON());
    // Remove timer and add time's up
    let desc = embed.data.description || "";
    desc = desc.replace(/⏳ \*\*Time left: \d+s\*\*/, `⏰ **Time's up!**`);
    timeoutEmbed.setColor(0xe67e22);
    timeoutEmbed.setDescription(desc);
    const rows = [optionsRow.toJSON()].map((row) => {
      return {
        ...row,
        components: row.components.map((comp: any, idx: number) => {
          const isBtnCorrect =
            comp.custom_id && comp.custom_id.endsWith("_correct");
          return {
            ...comp,
            style: isBtnCorrect ? ButtonStyle.Success : ButtonStyle.Secondary,
            disabled: true,
          };
        }),
      };
    });
    await sentMsg.edit({
      embeds: [timeoutEmbed],
      components: rows,
    });
  }, 15000);
  triviaTimers.set(messageId, { timeout, interval, timeLeft });
  // Initial timer display
  await updateTimer();
}

async function handleButton(
  interaction: import("discord.js").ButtonInteraction
) {
  if (!interaction.customId.startsWith("trivia_answer_")) return;

  if (interaction.replied || interaction.deferred) {
    return;
  }

  // Clear the timer and interval if someone answers
  const messageId = interaction.message.id;
  if (triviaTimers.has(messageId)) {
    const { timeout, interval } = triviaTimers.get(messageId)!;
    clearTimeout(timeout);
    clearInterval(interval);
    triviaTimers.delete(messageId);
  }

  const parts = interaction.customId.split("_");
  const answerIdx = Number(parts[2]);
  const isCorrect = parts[3] === "correct";

  const originalEmbed = interaction.message.embeds[0];
  if (!originalEmbed) return;
  const updatedEmbed = EmbedBuilder.from(originalEmbed.toJSON());

  let resultText = isCorrect
    ? `**Answered correctly by <@${interaction.user.id}>!**`
    : `**Answered incorrectly by <@${interaction.user.id}>!**`;

  let correctAnswerText = "";
  const optionsField = originalEmbed.fields?.find((f) => f.name === "Options");
  if (optionsField && !isCorrect) {
    const correctLine = optionsField.value
      .split("\n")
      .find((line) => line.includes("**: "));
    if (correctLine)
      correctAnswerText = `\n**Correct answer:** ${correctLine.split(": ")[1]}`;
  }
  if (!optionsField && !isCorrect) {
    correctAnswerText = `\n**Correct answer:** ${
      answerIdx === 0 ? "False" : "True"
    }`;
  }

  updatedEmbed.setColor(isCorrect ? 0x2ecc40 : 0xe74c3c);
  updatedEmbed.setDescription(
    (originalEmbed.description || "") +
      `\n\n${resultText}${!isCorrect ? correctAnswerText : ""}`
  );

  const rows = interaction.message.components
    .filter(
      (row) => "components" in row && Array.isArray((row as any).components)
    )
    .map((row) => {
      const actionRow = row as any;
      return {
        ...row.toJSON(),
        components: actionRow.components.map((comp: any, idx: number) => {
          const isBtnCorrect =
            comp.customId && comp.customId.endsWith("_correct");
          const isBtnPressed = idx === answerIdx;
          let style = ButtonStyle.Secondary;
          if (isBtnCorrect) {
            style = ButtonStyle.Success;
          } else if (isBtnPressed && !isCorrect) {
            style = ButtonStyle.Danger;
          }
          return {
            ...comp.toJSON(),
            style,
            disabled: true,
          };
        }),
      };
    });

  await interaction.message.edit({
    embeds: [updatedEmbed],
    components: rows,
  });

  const feedbackEmbed = new EmbedBuilder()
    .setTitle(isCorrect ? "✅ Correct!" : "❌ Wrong!")
    .setColor(isCorrect ? 0x2ecc40 : 0xe74c3c)
    .setDescription(
      isCorrect
        ? "You selected the correct answer. Well done!"
        : "That was not the correct answer. " + (await getInsult(0))
    );

  await interaction.reply({
    embeds: [feedbackEmbed],
    flags: MessageFlags.Ephemeral,
  });
}

export default {
  data,
  execute,
  cooldown: 5,
  handleButton,
};
