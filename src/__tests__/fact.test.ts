import { expect, jest, describe, afterEach, it, mock } from "bun:test";

// Mock the facts module
mock.module("../modules/facts", () => ({
  UselessFact: {
    getRandomFact: jest.fn(),
    getTodayFact: jest.fn(),
  },
}));

import { UselessFact } from "../modules/facts";

describe("UselessFact", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getRandomFact", () => {
    it("returns mocked fact text", async () => {
      (UselessFact.getRandomFact as jest.Mock).mockResolvedValue(
        "Mocked random fact"
      );

      const fact = await UselessFact.getRandomFact();
      expect(fact).toBe("Mocked random fact");
    });
  });

  describe("getTodayFact", () => {
    it("returns mocked fact text", async () => {
      (UselessFact.getTodayFact as jest.Mock).mockResolvedValue(
        "Mocked today fact"
      );

      const fact = await UselessFact.getTodayFact();
      expect(fact).toBe("Mocked today fact");
    });
  });
});
