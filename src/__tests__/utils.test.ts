import { describe, it, expect, beforeEach, jest, mock } from "bun:test";
import { gloat, hasModerationRole, getRandomWord } from "../lib/utils";
import { getRandomChuckNorrisJoke } from "../modules/chuck-norris";
import { MASTER_IDS, MODERATION_ROLE_IDS } from "../lib/constants";
import axios from "axios";

// Mock modules
mock.module("../modules/chuck-norris", () => ({
  getRandomChuckNorrisJoke: jest.fn(),
}));

mock.module("axios", () => ({
  default: {
    get: jest.fn(),
  },
}));

describe("Utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("gloat", () => {
    it("should replace Chuck Norris with the provided name", async () => {
      const mockJoke = "Chuck Norris can divide by zero";
      (getRandomChuckNorrisJoke as jest.Mock).mockResolvedValue(mockJoke);

      const result = await gloat("John");
      expect(result).toBe("John can divide by zero");
    });

    it("should handle case-insensitive replacement", async () => {
      const mockJoke = "chuck norris and Chuck Norris and CHUCK NORRIS";
      (getRandomChuckNorrisJoke as jest.Mock).mockResolvedValue(mockJoke);

      const result = await gloat("Jane");
      expect(result).toBe("Jane and Jane and Jane");
    });

    it("should handle jokes with just 'Norris'", async () => {
      const mockJoke = "Norris doesn't sleep, he waits";
      (getRandomChuckNorrisJoke as jest.Mock).mockResolvedValue(mockJoke);

      const result = await gloat("Bob");
      expect(result).toBe("Bob doesn't sleep, he waits");
    });

    it("should handle jokes with just 'Chuck'", async () => {
      const mockJoke = "Chuck doesn't need a compass";
      (getRandomChuckNorrisJoke as jest.Mock).mockResolvedValue(mockJoke);

      const result = await gloat("Alice");
      expect(result).toBe("Alice doesn't need a compass");
    });
  });

  describe("hasModerationRole", () => {
    it("should return true for master users", () => {
      const mockInteraction = {
        user: { id: MASTER_IDS[0] },
        member: null,
      } as any;

      const result = hasModerationRole(mockInteraction);
      expect(result).toBe(true);
    });

    it("should return false when no member data", () => {
      const mockInteraction = {
        user: { id: "123456789" },
        member: null,
      } as any;

      const result = hasModerationRole(mockInteraction);
      expect(result).toBe(false);
    });

    it("should return false when member has no roles property", () => {
      const mockInteraction = {
        user: { id: "123456789" },
        member: {},
      } as any;

      const result = hasModerationRole(mockInteraction);
      expect(result).toBe(false);
    });

    it("should return true for users with moderation roles (array format)", () => {
      const mockInteraction = {
        user: { id: "123456789" },
        member: { roles: [MODERATION_ROLE_IDS[0], "otherId"] },
      } as any;

      const result = hasModerationRole(mockInteraction);
      expect(result).toBe(true);
    });

    it("should return false for users without moderation roles (array format)", () => {
      const mockInteraction = {
        user: { id: "123456789" },
        member: { roles: ["otherId1", "otherId2"] },
      } as any;

      const result = hasModerationRole(mockInteraction);
      expect(result).toBe(false);
    });

    it("should return true for users with moderation roles (cache format)", () => {
      const mockInteraction = {
        user: { id: "123456789" },
        member: {
          roles: {
            cache: {
              has: jest
                .fn()
                .mockImplementation((roleId) =>
                  MODERATION_ROLE_IDS.includes(roleId)
                ),
            },
          },
        },
      } as any;

      const result = hasModerationRole(mockInteraction);
      expect(result).toBe(true);
    });

    it("should return false for users without moderation roles (cache format)", () => {
      const mockInteraction = {
        user: { id: "123456789" },
        member: {
          roles: {
            cache: {
              has: jest.fn().mockReturnValue(false),
            },
          },
        },
      } as any;

      const result = hasModerationRole(mockInteraction);
      expect(result).toBe(false);
    });
  });

  describe("getRandomWord", () => {
    it("should return a word from the API", async () => {
      const mockResponse = { data: ["testword"] };
      (axios.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getRandomWord();
      expect(result).toBe("testword");
      expect(axios.get).toHaveBeenCalledWith(
        "https://random-word.ryanrk.com/api/en/word/random"
      );
    });

    it("should handle API errors gracefully", async () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      (axios.get as jest.Mock).mockRejectedValue(new Error("API Error"));

      const result = await getRandomWord();
      expect(result).toBe("nickname");
      expect(consoleSpy).toHaveBeenCalledWith(
        "[getRandomWord] Error fetching random word:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it("should handle invalid API response", async () => {
      const mockResponse = { data: null };
      (axios.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getRandomWord();
      expect(result).toBe("nickname");
    });

    it("should handle empty API response", async () => {
      const mockResponse = { data: [] };
      (axios.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getRandomWord();
      expect(result).toBe("nickname");
    });
  });
});
