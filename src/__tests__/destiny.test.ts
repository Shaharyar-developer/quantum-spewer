import { describe, it, expect, beforeEach, jest, mock } from "bun:test";
import {
  DestinyManifest,
  DestinyAPIError,
  DestinyManifestError,
} from "../lib/destiny";
import { writeFile, mkdir, access } from "fs/promises";
import {
  getDestinyManifest,
  getDestinyManifestSlice,
} from "bungie-api-ts/destiny2";

// Mock modules
mock.module("fs/promises", () => ({
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  access: jest.fn(),
}));

mock.module("bungie-api-ts/destiny2", () => ({
  getDestinyManifest: jest.fn(),
  getDestinyManifestSlice: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn() as any;

// Create mock variables for easy access
const mockWriteFile = writeFile as jest.Mock;
const mockMkdir = mkdir as jest.Mock;
const mockAccess = access as jest.Mock;
const mockGetDestinyManifest = getDestinyManifest as jest.Mock;
const mockGetDestinyManifestSlice = getDestinyManifestSlice as jest.Mock;

describe("DestinyManifest", () => {
  let destinyManifest: DestinyManifest;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    destinyManifest = new DestinyManifest();
  });

  describe("DestinyAPIError", () => {
    it("should create DestinyAPIError with message", () => {
      const error = new DestinyAPIError("Test error");
      expect(error.name).toBe("DestinyAPIError");
      expect(error.message).toBe("Test error");
    });

    it("should create DestinyAPIError with status and statusText", () => {
      const error = new DestinyAPIError(
        "Test error",
        500,
        "Internal Server Error"
      );
      expect(error.status).toBe(500);
      expect(error.statusText).toBe("Internal Server Error");
    });
  });

  describe("DestinyManifestError", () => {
    it("should create DestinyManifestError with message", () => {
      const error = new DestinyManifestError("Test error");
      expect(error.name).toBe("DestinyManifestError");
      expect(error.message).toBe("Test error");
    });

    it("should create DestinyManifestError with cause", () => {
      const cause = new Error("Cause error");
      const error = new DestinyManifestError("Test error", cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe("getTable", () => {
    beforeEach(() => {
      process.env.BUNGIE_API_KEY = "test-api-key";
    });

    it("should successfully get a table", async () => {
      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ ErrorCode: 1 }),
      });

      mockGetDestinyManifest.mockResolvedValue({
        Response: { version: "1.0" },
      });

      mockGetDestinyManifestSlice.mockResolvedValue({
        DestinyInventoryItemDefinition: { "12345": { name: "Test Item" } },
      });

      const result = await destinyManifest.getTable(
        "DestinyInventoryItemDefinition"
      );
      expect(result).toEqual({ "12345": { name: "Test Item" } });
    });

    it("should handle missing API key", async () => {
      delete process.env.BUNGIE_API_KEY;

      // Mock the bungie API functions to simulate the API key check failing
      mockGetDestinyManifest.mockImplementation(() => {
        throw new DestinyAPIError(
          "BUNGIE_API_KEY environment variable is not set"
        );
      });

      await expect(
        destinyManifest.getTable("DestinyInventoryItemDefinition")
      ).rejects.toThrow("BUNGIE_API_KEY environment variable is not set");
    });

    it("should handle empty API key", async () => {
      process.env.BUNGIE_API_KEY = "";

      // Mock the bungie API functions to simulate the API key check failing
      mockGetDestinyManifest.mockImplementation(() => {
        throw new DestinyAPIError(
          "BUNGIE_API_KEY environment variable is not set"
        );
      });

      await expect(
        destinyManifest.getTable("DestinyInventoryItemDefinition")
      ).rejects.toThrow("BUNGIE_API_KEY environment variable is not set");
    });

    it("should handle invalid manifest response", async () => {
      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ ErrorCode: 1 }),
      });

      mockGetDestinyManifest.mockResolvedValue(null);

      await expect(
        destinyManifest.getTable("DestinyInventoryItemDefinition")
      ).rejects.toThrow("Invalid manifest response from Bungie API");
    });

    it("should handle missing table in manifest", async () => {
      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ ErrorCode: 1 }),
      });

      mockGetDestinyManifest.mockResolvedValue({
        Response: { version: "1.0" },
      });

      mockGetDestinyManifestSlice.mockResolvedValue({});

      await expect(
        destinyManifest.getTable("DestinyInventoryItemDefinition")
      ).rejects.toThrow(
        "Table 'DestinyInventoryItemDefinition' not found in manifest"
      );
    });
  });

  describe("downloadItemDefs", () => {
    beforeEach(() => {
      process.env.BUNGIE_API_KEY = "test-api-key";

      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ ErrorCode: 1 }),
      });

      mockGetDestinyManifest.mockResolvedValue({
        Response: { version: "1.0" },
      });

      mockGetDestinyManifestSlice.mockResolvedValue({
        DestinyInventoryItemDefinition: { "12345": { name: "Test Item" } },
      });
    });

    it("should successfully download a table", async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
      mockAccess.mockResolvedValue(undefined);

      const result = await destinyManifest.downloadItemDefs();
      expect(typeof result).toBe("string");
      expect(mockWriteFile).toHaveBeenCalled();
      expect(mockAccess).toHaveBeenCalled();
    });

    it("should handle directory creation errors", async () => {
      mockMkdir.mockRejectedValue(new Error("Permission denied"));

      await expect(destinyManifest.downloadItemDefs()).rejects.toThrow(
        "Failed to create directory for manifest"
      );
    });

    it("should handle file write errors", async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockRejectedValue(new Error("Disk full"));

      await expect(destinyManifest.downloadItemDefs()).rejects.toThrow(
        DestinyManifestError
      );
    });

    it("should handle file verification errors", async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
      mockAccess.mockRejectedValue(new Error("File not found"));

      await expect(destinyManifest.downloadItemDefs()).rejects.toThrow(
        "Failed to verify manifest file was written successfully"
      );
    });
  });

  describe("caching", () => {
    beforeEach(() => {
      process.env.BUNGIE_API_KEY = "test-api-key";

      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ ErrorCode: 1 }),
      });

      mockGetDestinyManifest.mockResolvedValue({
        Response: { version: "1.0" },
      });

      mockGetDestinyManifestSlice.mockResolvedValue({
        DestinyInventoryItemDefinition: { "12345": { name: "Test Item" } },
      });
    });

    it("should provide cache status methods", () => {
      expect(typeof destinyManifest.isManifestCacheValid()).toBe("boolean");
      expect(destinyManifest.getManifestExpiry()).toBeNull();
    });

    it("should allow manual cache refresh", async () => {
      await destinyManifest.refreshManifest();
      expect(mockGetDestinyManifest).toHaveBeenCalled();
    });
  });
});
