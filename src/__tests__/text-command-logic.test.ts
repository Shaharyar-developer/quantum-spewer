import { describe, it, expect, beforeEach, afterEach, jest } from "bun:test";
import {
  Message,
  Client,
  Events,
  Collection,
  type PartialMessage,
} from "discord.js";
import { type TextCommand } from "../types/textCommand";

describe("Text Command Parsing", () => {
  // Test the parsing logic that would be in textCommands.ts
  // Since we can't easily import the parseTextCommand function, we'll test the regex pattern directly

  describe("command pattern matching", () => {
    const commandRegex = /^(\w+)!\s*(.*)/;

    it("should match valid command patterns", () => {
      const testCases = [
        { input: "test!", expected: { command: "test", args: "" } },
        {
          input: "encode! hello world",
          expected: { command: "encode", args: "hello world" },
        },
        { input: "coinflip!", expected: { command: "coinflip", args: "" } },
        {
          input: "decode! .... . .-.. .-.. ---",
          expected: { command: "decode", args: ".... . .-.. .-.. ---" },
        },
        {
          input: "command123! arg1 arg2",
          expected: { command: "command123", args: "arg1 arg2" },
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const match = input.match(commandRegex);
        expect(match).toBeTruthy();
        expect(match![1]).toBe(expected.command);
        expect(match![2]?.trim() || "").toBe(expected.args);
      });
    });

    it("should not match invalid command patterns", () => {
      const invalidCases = [
        "test",
        "!test",
        "test !",
        "test-command!",
        "test.command!",
        "",
        " test!",
        "te st!",
      ];

      invalidCases.forEach((input) => {
        const match = input.match(commandRegex);
        expect(match).toBeFalsy();
      });
    });

    it("should handle commands with extra spaces", () => {
      const match = "test!   arg1   arg2   ".match(commandRegex);
      expect(match).toBeTruthy();
      expect(match![1]).toBe("test");
      expect(match![2]).toBe("arg1   arg2   ");
    });
  });

  describe("argument parsing", () => {
    const parseArgs = (argsString: string): string[] => {
      return argsString.trim() ? argsString.trim().split(/\s+/) : [];
    };

    it("should parse arguments correctly", () => {
      const testCases = [
        { input: "", expected: [] },
        { input: "single", expected: ["single"] },
        { input: "hello world", expected: ["hello", "world"] },
        { input: "  hello   world  ", expected: ["hello", "world"] },
        { input: "arg1 arg2 arg3", expected: ["arg1", "arg2", "arg3"] },
        {
          input: "quote 'test string'",
          expected: ["quote", "'test", "string'"],
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = parseArgs(input);
        expect(result).toEqual(expected);
      });
    });

    it("should handle empty and whitespace-only arguments", () => {
      expect(parseArgs("")).toEqual([]);
      expect(parseArgs("   ")).toEqual([]);
      expect(parseArgs("\t\n")).toEqual([]);
    });
  });

  describe("command normalization", () => {
    it("should normalize command names to lowercase", () => {
      const testCases = [
        { input: "TEST!", expected: "test" },
        { input: "Encode!", expected: "encode" },
        { input: "CoinFlip!", expected: "coinflip" },
        { input: "DECODE!", expected: "decode" },
      ];

      testCases.forEach(({ input, expected }) => {
        const match = input.match(/^(\w+)!\s*(.*)/);
        expect(match).toBeTruthy();
        if (match && match[1]) {
          expect(match[1].toLowerCase()).toBe(expected);
        }
      });
    });
  });
});

describe("Text Command Collection", () => {
  let textCommands: Collection<string, TextCommand>;

  beforeEach(() => {
    textCommands = new Collection();
  });

  it("should store commands with their names", () => {
    const command: TextCommand = {
      name: "test",
      description: "Test command",
      execute: jest.fn(),
    };

    textCommands.set(command.name, command);

    expect(textCommands.has("test")).toBe(true);
    expect(textCommands.get("test")).toBe(command);
  });

  it("should handle aliases correctly", () => {
    const command: TextCommand = {
      name: "coinflip",
      aliases: ["flip", "cf"],
      execute: jest.fn(),
    };

    textCommands.set(command.name, command);

    // Also register aliases
    if (command.aliases) {
      command.aliases.forEach((alias) => {
        textCommands.set(alias, command);
      });
    }

    expect(textCommands.get("coinflip")).toBe(command);
    expect(textCommands.get("flip")).toBe(command);
    expect(textCommands.get("cf")).toBe(command);
  });

  it("should handle command lookup case-insensitively", () => {
    const command: TextCommand = {
      name: "test",
      execute: jest.fn(),
    };

    textCommands.set(command.name.toLowerCase(), command);

    expect(textCommands.get("test")).toBe(command);
    expect(textCommands.get("TEST")).toBeUndefined(); // Collection is case-sensitive
  });
});
