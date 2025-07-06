import { describe, it, expect, beforeEach, jest, mock } from "bun:test";
import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import randomFactCommand from "../modules/commands/random-fact";
import chuckNorrisCommand from "../modules/commands/chuck-norris-joke";
import adviceCommand from "../modules/commands/advice";
import { UselessFact } from "../modules/facts";
import { getInsult } from "../modules/insults";
import { getRandomChuckNorrisJoke } from "../modules/chuck-norris";

// Mock dependencies
mock.module("../modules/facts", () => ({
  UselessFact: {
    getRandomFact: jest.fn(),
  },
}));

mock.module("../modules/insults", () => ({
  getInsult: jest.fn(),
}));

mock.module("../modules/chuck-norris", () => ({
  getRandomChuckNorrisJoke: jest.fn(),
}));

mock.module("discord.js", () => ({
  SlashCommandBuilder: jest.fn().mockImplementation(() => ({
    setName: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    addUserOption: jest.fn().mockReturnThis(),
    addStringOption: jest.fn().mockReturnThis(),
  })),
  EmbedBuilder: jest.fn().mockImplementation(() => ({
    setTitle: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    setColor: jest.fn().mockReturnThis(),
    setFooter: jest.fn().mockReturnThis(),
  })),
}));

describe("Slash Commands", () => {
  let mockInteraction: Partial<ChatInputCommandInteraction>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockInteraction = {
      deferReply: jest.fn().mockResolvedValue({}),
      editReply: jest.fn().mockResolvedValue({}),
      reply: jest.fn().mockResolvedValue({}),
      options: {
        getUser: jest.fn(),
        getString: jest.fn(),
      } as any,
      user: {
        id: "123456789",
        username: "testuser",
      } as any,
    } as any;
  });

  describe("random-fact command", () => {
    it("should have correct command structure", () => {
      expect(randomFactCommand.data).toBeDefined();
      expect(randomFactCommand.execute).toBeDefined();
      expect(randomFactCommand.cooldown).toBe(10);
    });

    it("should fetch and display a random fact", async () => {
      const mockFact = "Test fact about nothing";
      const mockInsult = "Test insult";

      (UselessFact.getRandomFact as jest.Mock).mockResolvedValue(mockFact);
      (getInsult as jest.Mock).mockResolvedValue(mockInsult);

      await randomFactCommand.execute(
        mockInteraction as ChatInputCommandInteraction
      );

      expect(mockInteraction.deferReply).toHaveBeenCalled();
      expect(UselessFact.getRandomFact).toHaveBeenCalled();
      expect(getInsult).toHaveBeenCalled();
      expect(mockInteraction.editReply).toHaveBeenCalledWith({
        embeds: [expect.any(Object)],
      });
      expect(EmbedBuilder).toHaveBeenCalled();
    });

    it("should handle API errors gracefully", async () => {
      (UselessFact.getRandomFact as jest.Mock).mockRejectedValue(
        new Error("API Error")
      );
      (getInsult as jest.Mock).mockResolvedValue("Test insult");

      await expect(
        randomFactCommand.execute(
          mockInteraction as ChatInputCommandInteraction
        )
      ).rejects.toThrow("API Error");
    });
  });

  describe("chuck-norris command", () => {
    it("should have correct command structure", () => {
      expect(chuckNorrisCommand.data).toBeDefined();
      expect(chuckNorrisCommand.execute).toBeDefined();
      expect(chuckNorrisCommand.cooldown).toBe(10);
    });

    it("should fetch and display a Chuck Norris joke", async () => {
      const mockJoke = "Chuck Norris can divide by zero";
      const mockInsult = "Test insult";

      (getRandomChuckNorrisJoke as jest.Mock).mockResolvedValue(mockJoke);
      (getInsult as jest.Mock).mockResolvedValue(mockInsult);

      await chuckNorrisCommand.execute(
        mockInteraction as ChatInputCommandInteraction
      );

      expect(mockInteraction.deferReply).toHaveBeenCalled();
      expect(getRandomChuckNorrisJoke).toHaveBeenCalled();
      expect(getInsult).toHaveBeenCalled();
      expect(mockInteraction.editReply).toHaveBeenCalledWith({
        embeds: [expect.any(Object)],
      });
    });
  });

  describe("advice command", () => {
    it("should have correct command structure", () => {
      expect(adviceCommand.data).toBeDefined();
      expect(adviceCommand.execute).toBeDefined();
      expect(adviceCommand.cooldown).toBe(3);
    });

    it("should handle user option correctly", async () => {
      const mockUser = { id: "987654321", username: "targetuser" };
      const mockAdvice = "Always test your code";
      const mockInsult = "Test insult";

      (mockInteraction.options!.getUser as jest.Mock).mockReturnValue(mockUser);
      (getInsult as jest.Mock).mockResolvedValue(mockInsult);

      // Mock axios for the advice API
      const axios = await import("axios");
      jest.spyOn(axios, "default").mockResolvedValue({
        data: { slip: { advice: mockAdvice } },
      });

      await adviceCommand.execute(
        mockInteraction as ChatInputCommandInteraction
      );

      expect(mockInteraction.options!.getUser).toHaveBeenCalledWith(
        "user",
        true
      );
      expect(mockInteraction.reply).toHaveBeenCalledWith({
        content: `<@${mockUser.id}>`,
        embeds: [expect.any(Object)],
      });
    });
  });

  describe("command cooldowns", () => {
    it("should have appropriate cooldown values", () => {
      expect(randomFactCommand.cooldown).toBe(10);
      expect(chuckNorrisCommand.cooldown).toBe(10);
      expect(adviceCommand.cooldown).toBe(3);
    });
  });

  describe("embed formatting", () => {
    it("should create embeds with correct color", async () => {
      const mockFact = "Test fact";
      const mockInsult = "Test insult";

      (UselessFact.getRandomFact as jest.Mock).mockResolvedValue(mockFact);
      (getInsult as jest.Mock).mockResolvedValue(mockInsult);

      const mockEmbed = {
        setTitle: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        setColor: jest.fn().mockReturnThis(),
        setFooter: jest.fn().mockReturnThis(),
      };
      (EmbedBuilder as unknown as jest.Mock).mockReturnValue(mockEmbed);

      await randomFactCommand.execute(
        mockInteraction as ChatInputCommandInteraction
      );

      expect(mockEmbed.setTitle).toHaveBeenCalledWith("Useless Fact");
      expect(mockEmbed.setDescription).toHaveBeenCalledWith(mockFact);
      expect(mockEmbed.setColor).toHaveBeenCalledWith(0xcba6f7);
      expect(mockEmbed.setFooter).toHaveBeenCalledWith({ text: mockInsult });
    });
  });

  describe("error handling", () => {
    it("should handle deferReply errors", async () => {
      mockInteraction.deferReply = jest
        .fn()
        .mockRejectedValue(new Error("Defer failed"));

      await expect(
        randomFactCommand.execute(
          mockInteraction as ChatInputCommandInteraction
        )
      ).rejects.toThrow("Defer failed");
    });

    it("should handle editReply errors", async () => {
      const mockFact = "Test fact";
      const mockInsult = "Test insult";

      (UselessFact.getRandomFact as jest.Mock).mockResolvedValue(mockFact);
      (getInsult as jest.Mock).mockResolvedValue(mockInsult);
      mockInteraction.editReply = jest
        .fn()
        .mockRejectedValue(new Error("Edit failed"));

      await expect(
        randomFactCommand.execute(
          mockInteraction as ChatInputCommandInteraction
        )
      ).rejects.toThrow("Edit failed");
    });
  });
});
