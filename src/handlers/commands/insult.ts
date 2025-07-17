import { Message } from "discord.js";
import { type TextCommand } from "../../types/textCommand";
import { getInsult } from "../../modules/insults";
import { MASTER_IDS } from "../../lib/constants";

export default {
  name: "insult",
  description: "Insult a mentioned user",
  execute: async (message: Message, args: string[]) => {
    await message.delete().catch(() => {});

    const sendMsg = async (content: string) => {
      if (
        message.channel &&
        "send" in message.channel &&
        typeof (message.channel as any).send === "function"
      ) {
        await (message.channel as any).send(content);
      }
    };

    // Extract the first user mention from the message
    const mention = message.mentions.users.first();
    if (!mention) {
      await sendMsg(
        "Please mention a user to insult, e.g. `insult! @username`"
      );
      return;
    }

    // Prevent insulting yourself
    if (mention.id === message.author.id) {
      await sendMsg("You can't insult yourself! (Or can you?)");
      return;
    }

    if (MASTER_IDS.includes(mention.id)) {
      await sendMsg(
        "You can't insult someone who is potentially the bot's creator!"
      );
      return;
    }

    // Prevent insulting the bot
    if (message.client.user && mention.id === message.client.user.id) {
      await sendMsg("Nice try, but I won't insult myself!");
      return;
    }

    // Try to fetch the user by ID from the guild
    try {
      const member = await message.guild?.members.fetch(mention.id);
      if (!member) {
        await sendMsg("Couldn't find that user in this server.");
        return;
      }

      // Insult the pinged user (send message, mention user)
      if (message.channel && message.channel.type === 0) {
        // 0 = GuildText (TextChannel)
        await (message.channel as import("discord.js").TextChannel).send({
          content: `${mention}, ${await getInsult(0)}`,
        });
      } else {
        await sendMsg(`${mention}, ${await getInsult(0)}`);
      }
    } catch {
      await sendMsg("Couldn't find that user in this server.");
    }
  },
} as TextCommand;