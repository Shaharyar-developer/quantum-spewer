import { expect, jest, describe, afterEach, it } from "bun:test";
import { UselessFact } from "../modules/facts";

describe("UselessFact", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getRandomFact", () => {
    it("returns mocked fact text", async () => {
      jest
        .spyOn(UselessFact, "getRandomFact")
        .mockResolvedValue("Mocked random fact");

      const fact = await UselessFact.getRandomFact();
      expect(fact).toBe("Mocked random fact");
    });
  });

  describe("getTodayFact", () => {
    it("returns mocked fact text", async () => {
      jest
        .spyOn(UselessFact, "getTodayFact")
        .mockResolvedValue("Mocked today fact");

      const fact = await UselessFact.getTodayFact();
      expect(fact).toBe("Mocked today fact");
    });
  });
});
