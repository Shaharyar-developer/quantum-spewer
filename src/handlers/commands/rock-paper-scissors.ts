import {
  Message,
  TextChannel,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ButtonInteraction,
} from "discord.js";
import { type TextCommand } from "../../types/textCommand";

export default {
  name: "RockPaperScissors",
  description: "Play a game of Rock, Paper, Scissors",
  aliases: ["rps", "rockpaperscissors"],
  cooldown: 5,
  execute: async (message: Message, args: string[]) => {
    const choices = ["rock", "paper", "scissors"];
    const emojis = { rock: "🪨", paper: "📄", scissors: "✂️" };

    // If no choice provided, show interactive buttons
    if (!args[0]) {
      const embed = new EmbedBuilder()
        .setTitle("🎮 Rock Paper Scissors")
        .setDescription("Choose your weapon! Click one of the buttons below.")
        .setColor(0x00ae86)
        .setFooter({ text: "You have 30 seconds to make your choice" });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("rps_rock")
          .setLabel("Rock")
          .setEmoji("🪨")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("rps_paper")
          .setLabel("Paper")
          .setEmoji("📄")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("rps_scissors")
          .setLabel("Scissors")
          .setEmoji("✂️")
          .setStyle(ButtonStyle.Secondary)
      );

      const response = await (message.channel as TextChannel).send({
        embeds: [embed],
        components: [row],
      });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 30000,
        filter: (i) => i.user.id === message.author.id,
      });

      collector.on("collect", async (interaction: ButtonInteraction) => {
        const userChoice = interaction.customId.split("_")[1];
        if (userChoice && choices.includes(userChoice)) {
          await playGame(interaction, userChoice, emojis, choices);
        }
      });

      collector.on("end", async (collected) => {
        if (collected.size === 0) {
          const timeoutEmbed = new EmbedBuilder()
            .setTitle("⏰ Time's Up!")
            .setDescription(
              "You took too long to make a choice. Game cancelled."
            )
            .setColor(0xff6b6b);

          await response.edit({ embeds: [timeoutEmbed], components: [] });
        }
      });

      await message.delete().catch(() => {});
      return;
    }

    // Handle text-based choice
    const userChoice = args[0].toLowerCase();
    if (!choices.includes(userChoice)) {
      const errorEmbed = new EmbedBuilder()
        .setTitle("❌ Invalid Choice")
        .setDescription(
          "Please choose either **rock**, **paper**, or **scissors**."
        )
        .setColor(0xff6b6b);

      (message.channel as TextChannel).send({ embeds: [errorEmbed] });
      return;
    }

    await playGameText(message, userChoice, emojis, choices);
  },
} satisfies TextCommand as TextCommand;

async function playGame(
  interaction: ButtonInteraction,
  userChoice: string,
  emojis: Record<string, string>,
  choices: string[]
) {
  const botChoice = choices[Math.floor(Math.random() * choices.length)]!;
  const result = getGameResult(userChoice, botChoice);

  const resultEmbed = new EmbedBuilder()
    .setTitle("🎮 Rock Paper Scissors - Results")
    .addFields(
      {
        name: "Your Choice",
        value: `${emojis[userChoice]} ${
          userChoice.charAt(0).toUpperCase() + userChoice.slice(1)
        }`,
        inline: true,
      },
      {
        name: "My Choice",
        value: `${emojis[botChoice]} ${
          botChoice.charAt(0).toUpperCase() + botChoice.slice(1)
        }`,
        inline: true,
      },
      { name: "Result", value: result.message, inline: false }
    )
    .setColor(result.color)
    .setFooter({ text: `Played by ${interaction.user.username}` });

  await interaction.update({ embeds: [resultEmbed], components: [] });
}

async function playGameText(
  message: Message,
  userChoice: string,
  emojis: Record<string, string>,
  choices: string[]
) {
  const botChoice = choices[Math.floor(Math.random() * choices.length)]!;
  const result = getGameResult(userChoice, botChoice);

  const resultEmbed = new EmbedBuilder()
    .setTitle("🎮 Rock Paper Scissors - Results")
    .addFields(
      {
        name: "Your Choice",
        value: `${emojis[userChoice]} ${
          userChoice.charAt(0).toUpperCase() + userChoice.slice(1)
        }`,
        inline: true,
      },
      {
        name: "My Choice",
        value: `${emojis[botChoice]} ${
          botChoice.charAt(0).toUpperCase() + botChoice.slice(1)
        }`,
        inline: true,
      },
      { name: "Result", value: result.message, inline: false }
    )
    .setColor(result.color)
    .setFooter({ text: `Played by ${message.author.username}` });

  await message.delete().catch(() => {});
  (message.channel as TextChannel).send({ embeds: [resultEmbed] });
}

function getGameResult(userChoice: string, botChoice: string) {
  if (userChoice === botChoice) {
    return {
      message: "🤝 It's a tie! Great minds think alike.",
      color: 0xffeb3b,
    };
  } else if (
    (userChoice === "rock" && botChoice === "scissors") ||
    (userChoice === "paper" && botChoice === "rock") ||
    (userChoice === "scissors" && botChoice === "paper")
  ) {
    return { message: "🎉 You win! Well played!", color: 0x4caf50 };
  } else {
    return { message: "😅 You lose! Better luck next time!", color: 0xf44336 };
  }
}
