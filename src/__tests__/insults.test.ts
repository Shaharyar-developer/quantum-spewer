import { describe, it, mock, expect, beforeEach, jest } from "bun:test";
import { getInsult } from "../modules/insults";
import axios from "axios";

mock.module("axios", () => ({
  default: {
    get: jest.fn(),
  },
}));

describe("Insults", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Math.random to ensure predictable behavior
    jest.spyOn(Math, "random").mockRestore();
  });

  describe("getInsult", () => {
    it("should fetch corporate insult when ratio is met", async () => {
      jest.spyOn(Math, "random").mockReturnValue(0.5); // Less than default 0.65
      const mockResponse = { status: 200, data: "Corporate insult here" };
      (axios.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getInsult();
      expect(result).toBe("Corporate insult here");
      expect(axios.get).toHaveBeenCalledWith(
        "https://insult.mattbas.org/api/insult?lang=en_corporate"
      );
    });

    it("should fetch regular insult when ratio is not met", async () => {
      jest.spyOn(Math, "random").mockReturnValue(0.8); // Greater than default 0.65
      const mockResponse = { status: 200, data: "Regular insult here" };
      (axios.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getInsult();
      expect(result).toBe("Regular insult here");
      expect(axios.get).toHaveBeenCalledWith(
        "https://evilinsult.com/generate_insult.php?lang=en"
      );
    });

    it("should use custom ratio parameter", async () => {
      jest.spyOn(Math, "random").mockReturnValue(0.3);
      const mockResponse = { status: 200, data: "Corporate insult" };
      (axios.get as jest.Mock).mockResolvedValue(mockResponse);

      await getInsult(0.5); // 0.3 < 0.5, should use corporate
      expect(axios.get).toHaveBeenCalledWith(
        "https://insult.mattbas.org/api/insult?lang=en_corporate"
      );

      jest.spyOn(Math, "random").mockReturnValue(0.7);
      await getInsult(0.5); // 0.7 > 0.5, should use regular
      expect(axios.get).toHaveBeenCalledWith(
        "https://evilinsult.com/generate_insult.php?lang=en"
      );
    });

    it("should return fallback insult when API fails", async () => {
      jest.spyOn(Math, "random").mockReturnValue(0.5);
      (axios.get as jest.Mock).mockRejectedValue(new Error("Network error"));

      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const result = await getInsult();
      expect(result).toBe(
        "Let's circle back and touch base offline about your bandwidth."
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error fetching insult:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it("should return fallback insult when API returns non-200 status", async () => {
      jest.spyOn(Math, "random").mockReturnValue(0.5);
      const mockResponse = { status: 404, data: null };
      (axios.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getInsult();
      expect(result).toBe(
        "Let's circle back and touch base offline about your bandwidth."
      );
    });

    it("should return fallback insult when API returns empty data", async () => {
      jest.spyOn(Math, "random").mockReturnValue(0.5);
      const mockResponse = { status: 200, data: null };
      (axios.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getInsult();
      expect(result).toBe(
        "Let's circle back and touch base offline about your bandwidth."
      );
    });

    it("should return fallback insult when API returns empty string", async () => {
      jest.spyOn(Math, "random").mockReturnValue(0.5);
      const mockResponse = { status: 200, data: "" };
      (axios.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getInsult();
      expect(result).toBe(
        "Let's circle back and touch base offline about your bandwidth."
      );
    });

    it("should handle different response formats", async () => {
      jest.spyOn(Math, "random").mockReturnValue(0.5);
      const mockResponse = {
        status: 200,
        data: "   Valid insult with spaces   ",
      };
      (axios.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getInsult();
      expect(result).toBe("   Valid insult with spaces   ");
    });

    it("should work with ratio 0 (always use regular insults)", async () => {
      jest.spyOn(Math, "random").mockReturnValue(0.5);
      const mockResponse = { status: 200, data: "Regular insult" };
      (axios.get as jest.Mock).mockResolvedValue(mockResponse);

      await getInsult(0);
      expect(axios.get).toHaveBeenCalledWith(
        "https://evilinsult.com/generate_insult.php?lang=en"
      );
    });

    it("should work with ratio 1 (always use corporate insults)", async () => {
      jest.spyOn(Math, "random").mockReturnValue(0.5);
      const mockResponse = { status: 200, data: "Corporate insult" };
      (axios.get as jest.Mock).mockResolvedValue(mockResponse);

      await getInsult(1);
      expect(axios.get).toHaveBeenCalledWith(
        "https://insult.mattbas.org/api/insult?lang=en_corporate"
      );
    });
  });
});
