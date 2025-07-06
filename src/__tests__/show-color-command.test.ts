import { describe, it, expect, beforeEach, jest, mock } from "bun:test";
import { Message, EmbedBuilder, TextChannel } from "discord.js";
import showColorCommand from "../handlers/commands/show-color";

// Mock Discord.js
mock.module("discord.js", () => ({
  EmbedBuilder: jest.fn().mockImplementation(() => ({
    setTitle: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    setColor: jest.fn().mockReturnThis(),
    setTimestamp: jest.fn().mockReturnThis(),
    setFooter: jest.fn().mockReturnThis(),
    setImage: jest.fn().mockReturnThis(),
    addFields: jest.fn().mockReturnThis(),
  })),
  TextChannel: function MockTextChannel() {
    return {
      send: jest.fn().mockResolvedValue({}),
    };
  },
  NewsChannel: function MockNewsChannel() {
    return {
      send: jest.fn().mockResolvedValue({}),
    };
  },
}));

describe("Show Color Command", () => {
  let mockMessage: any;
  let mockChannel: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mock channel
    mockChannel = {
      send: jest.fn().mockResolvedValue({
        delete: jest.fn().mockResolvedValue({}),
      }),
    };

    mockMessage = {
      delete: jest.fn().mockResolvedValue({}),
      channel: mockChannel,
      author: {
        username: "testuser",
        displayAvatarURL: jest.fn().mockReturnValue("http://avatar.url"),
        id: "123456789",
      },
    };
  });

  it("should have correct command properties", () => {
    expect(showColorCommand.name).toBe("showcolor");
    expect(showColorCommand.description).toContain(
      "Show color from various formats"
    );
    expect(showColorCommand.aliases).toEqual(["color"]);
    expect(showColorCommand.cooldown).toBe(5);
    expect(typeof showColorCommand.execute).toBe("function");
  });

  describe("hex color parsing", () => {
    it("should parse 6-digit hex colors", async () => {
      await showColorCommand.execute(mockMessage as Message, ["#ff0000"]);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalledWith({
        embeds: [expect.any(Object)],
      });
    });

    it("should parse 3-digit hex colors", async () => {
      await showColorCommand.execute(mockMessage as Message, ["#f00"]);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalledWith({
        embeds: [expect.any(Object)],
      });
    });

    it("should parse hex colors without #", async () => {
      await showColorCommand.execute(mockMessage as Message, ["ff0000"]);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalledWith({
        embeds: [expect.any(Object)],
      });
    });

    it("should handle invalid hex colors", async () => {
      await showColorCommand.execute(mockMessage as Message, ["#gggggg"]);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.stringContaining("Invalid color format")
      );
    });
  });

  describe("RGB color parsing", () => {
    it("should parse RGB colors", async () => {
      await showColorCommand.execute(mockMessage as Message, ["255,0,0"]);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalled();
    });

    it("should parse RGB colors with spaces", async () => {
      await showColorCommand.execute(mockMessage as Message, ["255, 0, 0"]);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalled();
    });

    it("should parse rgb() format", async () => {
      await showColorCommand.execute(mockMessage as Message, ["rgb(255,0,0)"]);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalled();
    });

    it("should handle invalid RGB values", async () => {
      await showColorCommand.execute(mockMessage as Message, ["256,0,0"]);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.stringContaining("Invalid color format")
      );
    });
  });

  describe("HSL color parsing", () => {
    it("should parse HSL colors", async () => {
      await showColorCommand.execute(mockMessage as Message, [
        "hsl(0,100%,50%)",
      ]);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalled();
    });

    it("should handle invalid HSL values", async () => {
      await showColorCommand.execute(mockMessage as Message, [
        "hsl(361,100%,50%)",
      ]);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.stringContaining("Invalid color format")
      );
    });
  });

  describe("HSV color parsing", () => {
    it("should parse HSV colors", async () => {
      await showColorCommand.execute(mockMessage as Message, [
        "hsv(0,100%,100%)",
      ]);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalled();
    });

    it("should handle invalid HSV values", async () => {
      await showColorCommand.execute(mockMessage as Message, [
        "hsv(0,101%,100%)",
      ]);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.stringContaining("Invalid color format")
      );
    });
  });

  describe("CMYK color parsing", () => {
    it("should parse CMYK colors", async () => {
      await showColorCommand.execute(mockMessage as Message, [
        "cmyk(0%,100%,100%,0%)",
      ]);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalled();
    });

    it("should handle invalid CMYK values", async () => {
      await showColorCommand.execute(mockMessage as Message, [
        "cmyk(0%,101%,100%,0%)",
      ]);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.stringContaining("Invalid color format")
      );
    });
  });

  describe("LAB color parsing", () => {
    it("should parse LAB colors", async () => {
      await showColorCommand.execute(mockMessage as Message, ["lab(50,0,0)"]);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalled();
    });

    it("should handle invalid LAB values", async () => {
      await showColorCommand.execute(mockMessage as Message, ["lab(101,0,0)"]);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.stringContaining("Invalid color format")
      );
    });
  });

  describe("OKLCH color parsing", () => {
    it("should parse OKLCH colors", async () => {
      await showColorCommand.execute(mockMessage as Message, [
        "oklch(0.5,0.1,180)",
      ]);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalled();
    });

    it("should handle invalid OKLCH values", async () => {
      await showColorCommand.execute(mockMessage as Message, [
        "oklch(1.5,0.1,180)",
      ]);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.stringContaining("Invalid color format")
      );
    });
  });

  describe("named color parsing", () => {
    it("should parse named colors", async () => {
      await showColorCommand.execute(mockMessage as Message, ["red"]);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalledWith({
        embeds: [expect.any(Object)],
      });
    });

    it("should handle case-insensitive named colors", async () => {
      await showColorCommand.execute(mockMessage as Message, ["RED"]);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalledWith({
        embeds: [expect.any(Object)],
      });
    });

    it("should handle unknown named colors", async () => {
      await showColorCommand.execute(mockMessage as Message, ["unknowncolor"]);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.stringContaining("Invalid color format")
      );
    });
  });

  describe("help functionality", () => {
    it("should show help when no arguments provided", async () => {
      await showColorCommand.execute(mockMessage as Message, []);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalledWith({
        embeds: [expect.any(Object)],
      });
      expect(EmbedBuilder).toHaveBeenCalled();
    });

    it("should show help when empty string provided", async () => {
      await showColorCommand.execute(mockMessage as Message, [""]);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalledWith({
        embeds: [expect.any(Object)],
      });
    });

    it("should show help when whitespace provided", async () => {
      await showColorCommand.execute(mockMessage as Message, ["   "]);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalledWith({
        embeds: [expect.any(Object)],
      });
    });
  });

  describe("channel compatibility", () => {
    it("should handle channels that don't support sending", async () => {
      const mockChannelNoSend = {};
      const mockMessageNoSend = {
        ...mockMessage,
        channel: mockChannelNoSend,
      };

      await showColorCommand.execute(mockMessageNoSend as Message, ["red"]);

      expect(mockMessageNoSend.delete).toHaveBeenCalled();
      // Should not throw error
    });

    it("should handle TextChannel", async () => {
      // Create a mock TextChannel-like object
      const mockTextChannel = {
        send: jest.fn().mockResolvedValue({}),
      };

      const mockMessageWithChannel = {
        ...mockMessage,
        channel: mockTextChannel,
      };

      await showColorCommand.execute(mockMessageWithChannel as Message, [
        "red",
      ]);

      expect(mockTextChannel.send).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should handle message deletion errors gracefully", async () => {
      mockMessage.delete = jest
        .fn()
        .mockRejectedValue(new Error("Delete failed"));

      await showColorCommand.execute(mockMessage as Message, ["red"]);

      // Should not throw error
      expect(mockChannel.send).toHaveBeenCalled();
    });

    it("should handle channel send errors gracefully", async () => {
      mockChannel.send = jest.fn().mockRejectedValue(new Error("Send failed"));

      await expect(
        showColorCommand.execute(mockMessage as Message, ["red"])
      ).rejects.toThrow("Send failed");
    });
  });

  describe("multiple word input handling", () => {
    it("should join multiple arguments", async () => {
      await showColorCommand.execute(mockMessage as Message, [
        "rgb(255,",
        "0,",
        "0)",
      ]);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.stringContaining("Invalid color format")
      );
    });

    it("should handle complex color strings", async () => {
      await showColorCommand.execute(mockMessage as Message, [
        "hsl(120,",
        "100%,",
        "50%)",
      ]);

      expect(mockMessage.delete).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.stringContaining("Invalid color format")
      );
    });
  });
});
