import {
  Message,
  EmbedBuilder,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ButtonInteraction,
  User,
} from "discord.js";
import { type TextCommand } from "../../types/textCommand";
import { MASTER_IDS } from "../../lib/constants";

interface GameState {
  player1: User;
  player2: User;
  currentTurn: User;
  chambers: boolean[]; // true = bullet, false = empty
  currentChamber: number;
  gameMessage: Message;
  turnTimeout?: NodeJS.Timeout;
}

// Store active games by channel ID
const activeGames = new Map<string, GameState>();

// Global interaction handler for stray button presses
export const handleGlobalRussianRouletteInteraction = async (
  interaction: ButtonInteraction
) => {
  if (!interaction.customId.startsWith("rr_")) return false;

  const parts = interaction.customId.split("_");
  if (parts.length < 2) return false;

  const action = parts[1];

  // Handle stray interactions from old games
  if (action === "pull" || action === "forfeit") {
    const channelId = parts[2];
    if (!channelId || !activeGames.has(channelId)) {
      await interaction.reply({
        content: `🚫 **ANCIENT CURSE!** ${interaction.user}, this game has already ended! The spirits of the dead revolver haunt these buttons...`,
      });
      return true;
    }
  }

  return false;
};

export default {
  name: "russian-roulette",
  description: "Play Russian Roulette with another person. Win... or die.",
  aliases: ["rr"],
  cooldown: 5,
  execute: async (message: Message, args: string[]) => {
    await message.delete().catch(() => {});

    const channel = message.channel as TextChannel;

    // Check if there's already an active game in this channel
    if (activeGames.has(channel.id)) {
      const errorEmbed = new EmbedBuilder()
        .setTitle("🚫 Game Already Active")
        .setDescription(
          "There's already a Russian Roulette game in progress in this channel!"
        )
        .setColor(0xff6b6b);

      await channel.send({ embeds: [errorEmbed] });
      return;
    }

    // Check if user mentioned someone
    const mention = message.mentions.users.first();
    if (!mention) {
      const helpEmbed = new EmbedBuilder()
        .setTitle("🔫 Russian Roulette")
        .setDescription(
          "Challenge someone to a deadly game of Russian Roulette!\n\n**Usage:** `rr @username`"
        )
        .addFields(
          {
            name: "🎯 How to Play",
            value:
              "• 6-chamber revolver with 1 bullet\n• Take turns pulling the trigger\n• Get the bullet = you lose\n• Last person standing wins!",
          },
          {
            name: "⚠️ Rules",
            value:
              "• 30 seconds per turn\n• No backing out once accepted\n• Winner takes all the glory!",
          }
        )
        .setColor(0xff0000)
        .setFooter({ text: "Good luck... you'll need it." });

      await channel.send({ embeds: [helpEmbed] });
      return;
    }

    // Safety checks
    if (mention.id === message.author.id) {
      const errorEmbed = new EmbedBuilder()
        .setTitle("🤔 Self-Destruction?")
        .setDescription(
          "You can't play Russian Roulette with yourself! Find someone else to challenge."
        )
        .setColor(0xff6b6b);

      await channel.send({ embeds: [errorEmbed] });
      return;
    }

    if (mention.bot) {
      const errorEmbed = new EmbedBuilder()
        .setTitle("🤖 Bot Protection")
        .setDescription(
          "Bots are immune to bullets! Challenge a human instead."
        )
        .setColor(0xff6b6b);

      await channel.send({ embeds: [errorEmbed] });
      return;
    }

    if (MASTER_IDS.includes(mention.id)) {
      const errorEmbed = new EmbedBuilder()
        .setTitle("👑 Master Protection")
        .setDescription(
          "You cannot challenge the bot's master! They're too powerful."
        )
        .setColor(0xff6b6b);

      await channel.send({ embeds: [errorEmbed] });
      return;
    }

    // Create invitation embed
    const inviteEmbed = new EmbedBuilder()
      .setTitle("🔫 Russian Roulette Challenge!")
      .setDescription(
        `${message.author} has challenged ${mention} to a deadly game of Russian Roulette!\n\n**${mention.username}**, do you accept this challenge?`
      )
      .addFields(
        {
          name: "🎯 The Stakes",
          value: "One bullet, six chambers. Winner takes all!",
          inline: true,
        },
        { name: "⏰ Time Limit", value: "30 seconds to accept", inline: true },
        {
          name: "⚠️ Warning",
          value: "This is a game of life and death!",
          inline: false,
        }
      )
      .setColor(0xff0000)
      .setThumbnail(
        "https://img.freepik.com/premium-psd/revolver-isolated-transparent-background-png_1073071-4459.jpg?w=1380"
      )
      .setFooter({
        text: "Click Accept to begin... or Decline to live another day.",
      });

    const acceptButton = new ButtonBuilder()
      .setCustomId(`rr_accept_${message.author.id}_${mention.id}`)
      .setLabel("Accept Challenge")
      .setEmoji("💀")
      .setStyle(ButtonStyle.Danger);

    const declineButton = new ButtonBuilder()
      .setCustomId(`rr_decline_${message.author.id}_${mention.id}`)
      .setLabel("Decline")
      .setEmoji("🏃")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      acceptButton,
      declineButton
    );

    const inviteMessage = await channel.send({
      embeds: [inviteEmbed],
      components: [row],
    });

    // Create collector for invitation response
    const inviteCollector = inviteMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30000,
      filter: (i) => i.user.id === mention.id,
    });

    inviteCollector.on("collect", async (interaction: ButtonInteraction) => {
      // Security check - only the mentioned user can respond
      if (interaction.user.id !== mention.id) {
        await interaction.reply({
          content: `🚫 **SACRILEGE!** ${interaction.user}, only the challenged player can respond to this invitation!`,
        });
        return;
      }

      if (interaction.customId.startsWith("rr_accept_")) {
        await startGame(interaction, message.author, mention, channel);
      } else if (interaction.customId.startsWith("rr_decline_")) {
        const declineEmbed = new EmbedBuilder()
          .setTitle("🏃 Challenge Declined")
          .setDescription(
            `${mention} has declined the challenge. They live to fight another day!`
          )
          .setColor(0xffeb3b);

        await interaction.update({ embeds: [declineEmbed], components: [] });
      }
    });

    inviteCollector.on("end", async (collected) => {
      if (collected.size === 0) {
        const timeoutEmbed = new EmbedBuilder()
          .setTitle("⏰ Challenge Expired")
          .setDescription(
            `${mention} didn't respond in time. The challenge has expired.`
          )
          .setColor(0x808080);

        await inviteMessage.edit({ embeds: [timeoutEmbed], components: [] });
      }
    });
  },
} as TextCommand;

async function startGame(
  interaction: ButtonInteraction,
  player1: User,
  player2: User,
  channel: TextChannel
) {
  // Create game state
  const chambers = [false, false, false, false, false, false]; // 6 chambers, all empty initially

  // *cough* Special treatment for master ID holders *cough*
  const isMasterGame =
    MASTER_IDS.includes(player1.id) || MASTER_IDS.includes(player2.id);
  let bulletPosition: number;

  if (isMasterGame) {
    // If a master is playing, they get... favorable odds
    const masterPlayer = MASTER_IDS.includes(player1.id) ? player1 : player2;
    const normalPlayer = masterPlayer === player1 ? player2 : player1;

    // The bullet will be placed in a chamber that the master won't hit first
    // Masters get to go second, and bullet is placed in positions 1, 3, or 5 (opponent's turns)
    const opponentChambers = [0, 2, 4]; // Chambers 1, 3, 5 (opponent's turns)
    bulletPosition =
      opponentChambers[Math.floor(Math.random() * opponentChambers.length)]!;
  } else {
    // Normal random placement for non-master games
    bulletPosition = Math.floor(Math.random() * 6);
  }

  chambers[bulletPosition] = true; // Place the bullet

  const gameState: GameState = {
    player1,
    player2,
    currentTurn: isMasterGame
      ? MASTER_IDS.includes(player1.id)
        ? player2
        : player1 // Master goes second for better odds
      : Math.random() < 0.5
      ? player1
      : player2, // Random for normal games
    chambers,
    currentChamber: 0,
    gameMessage: interaction.message as Message,
  };

  // Store the game state
  activeGames.set(channel.id, gameState);

  // Create initial game embed
  const gameEmbed = new EmbedBuilder()
    .setTitle("🔫 Russian Roulette - Game Started!")
    .setDescription(
      `**Players:** ${player1.username} vs ${
        player2.username
      }\n\n**Current Turn:** ${
        gameState.currentTurn.username
      }\n\n🔄 The chamber is loaded and spinning...\n6 chambers, 1 bullet, infinite tension.${
        isMasterGame
          ? "\n\n👑 **Master's Game** - The odds favor the chosen one..."
          : ""
      }`
    )
    .addFields(
      {
        name: "🎯 Chamber Status",
        value: `**Chamber:** ${
          gameState.currentChamber + 1
        }/6\n**Shots Fired:** 0`,
        inline: true,
      },
      { name: "⚡ Turn Timer", value: "30 seconds", inline: true },
      {
        name: "🎮 Your Move",
        value: `${gameState.currentTurn.username}, aim the gun at your head and pull the trigger!`,
        inline: false,
      }
    )
    .setColor(isMasterGame ? 0xffd700 : 0xff0000) // Gold for master games, red for normal
    .setFooter({ text: "May the odds be ever in your favor..." });
  const pullTriggerButton = new ButtonBuilder()
    .setCustomId(`rr_pull_${channel.id}`)
    .setLabel("Aim & Fire")
    .setEmoji("🔫")
    .setStyle(ButtonStyle.Danger);

  const forfeitButton = new ButtonBuilder()
    .setCustomId(`rr_forfeit_${channel.id}`)
    .setLabel("Forfeit")
    .setEmoji("🏃")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    pullTriggerButton,
    forfeitButton
  );

  await interaction.update({
    embeds: [gameEmbed],
    components: [row],
  });

  // Start the game loop
  startGameLoop(channel);

  // Set up turn timeout
  startTurnTimeout(channel);

  // Secret debug info for masters only *wink wink*
  if (isMasterGame) {
    const masterPlayer = MASTER_IDS.includes(player1.id) ? player1 : player2;
    try {
      await masterPlayer.send(
        `🔍 **Master Debug Info**\n🎯 Bullet Position: Chamber ${
          bulletPosition + 1
        }/6\n👑 You're going second for better odds!\n🤫 This message will self-destruct in 30 seconds...`
      );

      // Delete the debug message after 30 seconds
      setTimeout(async () => {
        try {
          const dmChannel = await masterPlayer.createDM();
          const messages = await dmChannel.messages.fetch({ limit: 1 });
          const lastMessage = messages.first();
          if (
            lastMessage &&
            lastMessage.author.id === interaction.client.user.id
          ) {
            await lastMessage.delete();
          }
        } catch (error) {
          // Silently fail if we can't delete the message
        }
      }, 30000);
    } catch (error) {
      // Silently fail if we can't send DM
    }
  }
}

async function startGameLoop(channel: TextChannel) {
  const gameState = activeGames.get(channel.id);
  if (!gameState) return;

  const collector = gameState.gameMessage.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 300000, // 5 minutes total game time
    filter: (i) => {
      // Only allow players in the game to interact
      return (
        i.user.id === gameState.player1.id || i.user.id === gameState.player2.id
      );
    },
  });

  collector.on("collect", async (interaction: ButtonInteraction) => {
    const currentGameState = activeGames.get(channel.id);
    if (!currentGameState) {
      await interaction.reply({
        content: `🚫 **ANCIENT CURSE!** ${interaction.user}, this game has already ended! Start a new one.`,
        ephemeral: true,
      });
      return;
    }

    // Check if it's the correct player's turn
    if (interaction.user.id !== currentGameState.currentTurn.id) {
      await interaction.reply({
        content: `🚫 **BLASPHEMY!** ${interaction.user}, it's not your turn! The sacred game of Russian Roulette demands order!`,
        ephemeral: true,
      });
      return;
    }

    if (interaction.customId === `rr_pull_${channel.id}`) {
      await handleTriggerPull(interaction, channel);
    } else if (interaction.customId === `rr_forfeit_${channel.id}`) {
      await handleForfeit(interaction, channel);
    }
  });

  collector.on("end", async (collected, reason) => {
    const currentGameState = activeGames.get(channel.id);
    if (currentGameState && reason === "time") {
      await handleTimeout(channel);
    }
  });
}

function startTurnTimeout(channel: TextChannel) {
  const gameState = activeGames.get(channel.id);
  if (!gameState) return;

  // Clear any existing timeout
  if (gameState.turnTimeout) {
    clearTimeout(gameState.turnTimeout);
  }

  // Set new timeout for 30 seconds
  gameState.turnTimeout = setTimeout(async () => {
    await handleTimeout(channel);
  }, 30000);
}

function clearTurnTimeout(channel: TextChannel) {
  const gameState = activeGames.get(channel.id);
  if (gameState && gameState.turnTimeout) {
    clearTimeout(gameState.turnTimeout);
    gameState.turnTimeout = undefined;
  }
}

async function handleTriggerPull(
  interaction: ButtonInteraction,
  channel: TextChannel
) {
  const gameState = activeGames.get(channel.id);
  if (!gameState) return;

  // Clear the turn timeout since player acted
  clearTurnTimeout(channel);

  const currentChamber = gameState.currentChamber;
  const isBullet = gameState.chambers[currentChamber];

  if (isBullet) {
    // Player got the bullet - they lose!
    const winner =
      gameState.currentTurn.id === gameState.player1.id
        ? gameState.player2
        : gameState.player1;
    const loser = gameState.currentTurn;

    const deathEmbed = new EmbedBuilder()
      .setTitle("💀 BANG! Game Over!")
      .setDescription(
        `**${loser.username}** pressed the revolver to their temple and pulled the trigger!\n\n🏆 **${winner.username}** wins by surviving the ultimate test!\n\n*The gun was aimed... the trigger pulled...* 💥 **BANG!**`
      )
      .addFields(
        { name: "💀 Fallen Player", value: loser.username, inline: true },
        { name: "🏆 Survivor", value: winner.username, inline: true },
        {
          name: "🔫 Fatal Chamber",
          value: `${currentChamber + 1}/6`,
          inline: true,
        }
      )
      .setColor(0x000000)
      .setFooter({ text: "The ultimate gamble... and the ultimate price." });

    await interaction.update({
      embeds: [deathEmbed],
      components: [],
    });

    // Clean up the game
    activeGames.delete(channel.id);
  } else {
    // Empty chamber - switch turns
    gameState.currentChamber++;
    gameState.currentTurn =
      gameState.currentTurn.id === gameState.player1.id
        ? gameState.player2
        : gameState.player1;

    const continueEmbed = new EmbedBuilder()
      .setTitle("🔫 Russian Roulette - Empty Chamber!")
      .setDescription(
        `**${interaction.user.username}** aimed at their head and pulled the trigger... *Click!*\n\n💨 Empty chamber! You live to see another turn...\n\n**${gameState.currentTurn.username}**, the gun is now yours...`
      )
      .addFields(
        {
          name: "🎯 Chamber Status",
          value: `**Chamber:** ${
            gameState.currentChamber + 1
          }/6\n**Shots Fired:** ${gameState.currentChamber}`,
          inline: true,
        },
        { name: "⚡ Turn Timer", value: "30 seconds", inline: true },
        {
          name: "🎮 Your Move",
          value: `${gameState.currentTurn.username}, aim the gun at your head and pull the trigger!`,
          inline: false,
        }
      )
      .setColor(0xffeb3b)
      .setFooter({ text: "The cold metal against your temple..." });

    const pullTriggerButton = new ButtonBuilder()
      .setCustomId(`rr_pull_${channel.id}`)
      .setLabel("Aim & Fire")
      .setEmoji("🔫")
      .setStyle(ButtonStyle.Danger);

    const forfeitButton = new ButtonBuilder()
      .setCustomId(`rr_forfeit_${channel.id}`)
      .setLabel("Forfeit")
      .setEmoji("🏃")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      pullTriggerButton,
      forfeitButton
    );

    await interaction.update({
      embeds: [continueEmbed],
      components: [row],
    });

    // Start timeout for next turn
    startTurnTimeout(channel);
  }
}

async function handleForfeit(
  interaction: ButtonInteraction,
  channel: TextChannel
) {
  const gameState = activeGames.get(channel.id);
  if (!gameState) return;

  // Clear the turn timeout since game is ending
  clearTurnTimeout(channel);

  const forfeiter = gameState.currentTurn;
  const winner =
    gameState.currentTurn.id === gameState.player1.id
      ? gameState.player2
      : gameState.player1;

  const forfeitEmbed = new EmbedBuilder()
    .setTitle("🏃 Forfeit - Game Over!")
    .setDescription(
      `**${forfeiter.username}** has forfeited the game!\n\n🏆 **${winner.username}** wins by default!\n\n*Sometimes discretion is the better part of valor...*`
    )
    .addFields(
      { name: "🏃 Forfeiter", value: forfeiter.username, inline: true },
      { name: "🏆 Winner", value: winner.username, inline: true },
      {
        name: "🔫 Chambers Remaining",
        value: `${6 - gameState.currentChamber}`,
        inline: true,
      }
    )
    .setColor(0x808080)
    .setFooter({ text: "Live to fight another day!" });

  await interaction.update({
    embeds: [forfeitEmbed],
    components: [],
  });

  // Clean up the game
  activeGames.delete(channel.id);
}

async function handleTimeout(channel: TextChannel) {
  const gameState = activeGames.get(channel.id);
  if (!gameState) return;

  // Clear any remaining timeout
  clearTurnTimeout(channel);

  const timedOutPlayer = gameState.currentTurn;
  const winner =
    gameState.currentTurn.id === gameState.player1.id
      ? gameState.player2
      : gameState.player1;

  const timeoutEmbed = new EmbedBuilder()
    .setTitle("⏰ Timeout - Game Over!")
    .setDescription(
      `**${timedOutPlayer.username}** took too long to make a decision!\n\n🏆 **${winner.username}** wins by default!\n\n*In Russian Roulette, hesitation can be deadly...*`
    )
    .addFields(
      { name: "⏰ Timed Out", value: timedOutPlayer.username, inline: true },
      { name: "🏆 Winner", value: winner.username, inline: true },
      {
        name: "🔫 Chambers Remaining",
        value: `${6 - gameState.currentChamber}`,
        inline: true,
      }
    )
    .setColor(0x808080)
    .setFooter({ text: "Time waits for no one!" });

  await gameState.gameMessage.edit({
    embeds: [timeoutEmbed],
    components: [],
  });

  // Clean up the game
  activeGames.delete(channel.id);
}
