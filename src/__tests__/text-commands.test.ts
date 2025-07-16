import { describe, it, expect, beforeEach, jest, mock } from "bun:test";
import { Message, EmbedBuilder, TextChannel } from "discord.js";
import coinflipCommand from "../handlers/commands/coin-flip";
import encodeCommand from "../handlers/commands/encode";
import decodeCommand from "../handlers/commands/decode";
import morseCode from "../lib/morse-code";

// Mock Discord.js
mock.module("discord.js", () => ({
  EmbedBuilder: jest.fn().mockImplementation(() => ({
    setTitle: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    setColor: jest.fn().mockReturnThis(),
    setTimestamp: jest.fn().mockReturnThis(),
    setFooter: jest.fn().mockReturnThis(),
  })),
  TextChannel: jest.fn(),
}));

describe("Text Commands", () => {
  let mockMessage: Partial<Message>;
  let mockChannel: Partial<TextChannel>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockChannel = {
      send: jest.fn().mockResolvedValue({}),
      toString: jest.fn().mockReturnValue("<#123456789>"),
    } as unknown as Partial<TextChannel>;

    mockMessage = {
      delete: jest.fn().mockResolvedValue({}),
      channel: mockChannel as TextChannel,
      author: {
        username: "testuser",
        displayAvatarURL: jest.fn().mockReturnValue("http://avatar.url"),
        id: "123456789",
      } as any,
      id: "message123",
    } as unknown as Partial<Message>;
  });

  describe("coinflip command", () => {
    it("should have correct properties", () => {
      expect(coinflipCommand.name).toBe("coinflip");
      expect(coinflipCommand.description).toBe(
        "Flip a coin and see the result"
      );
      expect(coinflipCommand.aliases).toEqual(["flip", "cf"]);
      expect(coinflipCommand.cooldown).toBe(3);
      expect(typeof coinflipCommand.execute).toBe("function");
    });

    it("should execute coin flip and send embed", async () => {
      // Mock Math.random to return a predictable result
      jest.spyOn(Math, "random").mockReturnValue(0.3); // Should result in "Heads"

      await coinflipCommand.execute(mockMessage as Message, []);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalledWith({
        embeds: [expect.any(Object)],
      });
      expect(EmbedBuilder).toHaveBeenCalled();
    });

    it("should handle channel that doesn't support sending", async () => {
      const mockChannelNoSend = {};
      const mockMessageWithNoSendChannel = {
        ...mockMessage,
        channel: mockChannelNoSend as TextChannel,
      };

      await coinflipCommand.execute(
        mockMessageWithNoSendChannel as Message,
        []
      );

      expect(mockMessageWithNoSendChannel.delete).toHaveBeenCalled();
      // Should not throw error, just not send anything
    });

    it("should handle message delete errors gracefully", async () => {
      mockMessage.delete = jest
        .fn()
        .mockRejectedValue(new Error("Delete failed"));

      await coinflipCommand.execute(mockMessage as Message, []);

      // Should not throw error
      expect(mockChannel.send).toHaveBeenCalled();
    });
  });

  describe("encode command", () => {
    it("should have correct properties", () => {
      expect(encodeCommand.name).toBe("encode");
      expect(encodeCommand.description).toBe(
        "Encode text to Morse code with embed"
      );
      expect(typeof encodeCommand.execute).toBe("function");
    });

    it("should encode text to morse code", async () => {
      const mockArgs = ["hello", "world"];
      const expectedInput = "hello world";
      const expectedEncoded = morseCode.encode(expectedInput);

      // Mock the sent message to have a delete method
      const mockSentMessage = {
        delete: jest.fn().mockResolvedValue({}),
      };
      (mockChannel.send as jest.Mock).mockResolvedValue(mockSentMessage);

      await encodeCommand.execute(mockMessage as Message, mockArgs);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalledWith({
        embeds: [
          {
            title: "Morse Code Encoded",
            description: expect.stringContaining(expectedInput),
            color: 0x89b4fa,
          },
        ],
      });

      // Check that the sent message will be deleted after timeout
      expect(mockSentMessage.delete).not.toHaveBeenCalled(); // Not called immediately
    });

    it("should handle empty input", async () => {
      await encodeCommand.execute(mockMessage as Message, []);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).not.toHaveBeenCalled();
    });

    it("should handle whitespace-only input", async () => {
      await encodeCommand.execute(mockMessage as Message, ["   "]);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).not.toHaveBeenCalled();
    });
  });

  describe("decode command", () => {
    it("should have correct properties", () => {
      expect(decodeCommand.name).toBe("decode");
      expect(decodeCommand.description).toBe(
        "Decode Morse code to text with embed"
      );
      expect(typeof decodeCommand.execute).toBe("function");
    });

    it("should decode morse code to text", async () => {
      const morseInput = ".... . .-.. .-.. ---";
      const expectedDecoded = morseCode.decode(morseInput);
      const mockArgs = morseInput.split(" ");

      // Mock the sent message to have a delete method
      const mockSentMessage = {
        delete: jest.fn().mockResolvedValue({}),
      };
      (mockChannel.send as jest.Mock).mockResolvedValue(mockSentMessage);

      await decodeCommand.execute(mockMessage as Message, mockArgs);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalledWith({
        embeds: [
          {
            title: "Morse Code Decoded",
            description: expect.stringContaining(morseInput),
            color: 0xa6e3a1,
          },
        ],
      });
    });

    it("should handle empty input", async () => {
      await decodeCommand.execute(mockMessage as Message, []);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).not.toHaveBeenCalled();
    });

    it("should handle invalid morse code", async () => {
      const invalidMorse = "..--..--.."; // Invalid morse pattern
      const mockArgs = [invalidMorse];

      const mockSentMessage = {
        delete: jest.fn().mockResolvedValue({}),
      };
      (mockChannel.send as jest.Mock).mockResolvedValue(mockSentMessage);

      await decodeCommand.execute(mockMessage as Message, mockArgs);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalled();
    });
  });
});
