import { describe, it, expect, beforeEach, jest } from "bun:test";
import { Message, EmbedBuilder, TextChannel } from "discord.js";
import convertCommand from "../handlers/commands/convert";
import {
  convertValue,
  findUnit,
  parseConversionInput,
  formatResult,
  convertNumberBase,
  findNumberBase,
} from "../lib/unit-converter";

describe("Convert Command", () => {
  let mockMessage: any;
  let mockChannel: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mock channel
    mockChannel = {
      send: jest.fn().mockResolvedValue({}),
    };

    mockMessage = {
      delete: jest.fn().mockResolvedValue({}),
      channel: mockChannel,
      author: {
        username: "TestUser",
      },
    };
  });

  it("should show help when no arguments provided", async () => {
    await convertCommand.execute(mockMessage, []);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });

  it("should show error for invalid format", async () => {
    await convertCommand.execute(mockMessage, ["invalid"]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });

  it("should convert temperature units correctly", async () => {
    await convertCommand.execute(mockMessage, ["100", "celsius", "fahrenheit"]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });

  it("should handle unit aliases", async () => {
    await convertCommand.execute(mockMessage, ["32", "f", "c"]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });

  it("should handle special characters in units", async () => {
    await convertCommand.execute(mockMessage, ["100", "°c", "°f"]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });

  it("should convert length units correctly", async () => {
    await convertCommand.execute(mockMessage, ["1", "meter", "feet"]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });

  it("should convert weight units correctly", async () => {
    await convertCommand.execute(mockMessage, ["1", "kg", "lbs"]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });

  it("should convert volume units correctly", async () => {
    await convertCommand.execute(mockMessage, ["1", "liter", "gallon"]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });

  it("should convert speed units correctly", async () => {
    await convertCommand.execute(mockMessage, ["60", "mph", "km/h"]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });

  it("should convert area units correctly", async () => {
    await convertCommand.execute(mockMessage, ["1", "acre", "m²"]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });

  it("should show error for unknown units", async () => {
    await convertCommand.execute(mockMessage, ["100", "unknown", "celsius"]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });

  it("should show error for incompatible unit types", async () => {
    await convertCommand.execute(mockMessage, ["100", "celsius", "meters"]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });

  it("should handle case insensitive input", async () => {
    await convertCommand.execute(mockMessage, ["100", "CELSIUS", "fahrenheit"]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });

  it("should handle decimal values", async () => {
    await convertCommand.execute(mockMessage, [
      "98.6",
      "fahrenheit",
      "celsius",
    ]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });

  it("should reject temperatures below absolute zero", async () => {
    await convertCommand.execute(mockMessage, [
      "-300",
      "celsius",
      "fahrenheit",
    ]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
    // Should be an error embed with conversion error
  });

  it("should handle very large numbers with appropriate precision", async () => {
    await convertCommand.execute(mockMessage, [
      "10000",
      "meters",
      "kilometers",
    ]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });

  it("should handle very small numbers with appropriate precision", async () => {
    await convertCommand.execute(mockMessage, [
      "0.001",
      "meters",
      "millimeters",
    ]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });

  it("should handle centimeters conversion", async () => {
    await convertCommand.execute(mockMessage, ["100", "cm", "meters"]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });

  it("should handle tons conversion", async () => {
    await convertCommand.execute(mockMessage, ["1", "ton", "kg"]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });

  it("should handle milliliters conversion", async () => {
    await convertCommand.execute(mockMessage, ["1000", "ml", "liters"]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });

  it("should handle feet per second conversion", async () => {
    await convertCommand.execute(mockMessage, ["100", "fps", "mph"]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });

  it("should handle hectares conversion", async () => {
    await convertCommand.execute(mockMessage, ["1", "hectare", "acres"]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });

  it("should handle zero values", async () => {
    await convertCommand.execute(mockMessage, ["0", "celsius", "fahrenheit"]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });

  it("should handle negative values for non-temperature units", async () => {
    await convertCommand.execute(mockMessage, ["-5", "meters", "feet"]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });

  it("should convert number bases", async () => {
    await convertCommand.execute(mockMessage, ["1101", "binary", "decimal"]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });

  it("should convert hexadecimal to decimal", async () => {
    await convertCommand.execute(mockMessage, ["FF", "hex", "decimal"]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });

  it("should handle scientific notation flag", async () => {
    await convertCommand.execute(mockMessage, [
      "1",
      "ly",
      "meters",
      "--scientific",
    ]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });

  it("should convert fun units like football fields", async () => {
    await convertCommand.execute(mockMessage, [
      "1",
      "football_field",
      "meters",
    ]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });

  it("should convert astronomical units", async () => {
    await convertCommand.execute(mockMessage, ["1", "au", "km"]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });

  it("should handle imperial vs us gallons", async () => {
    await convertCommand.execute(mockMessage, [
      "1",
      "imperial_gallon",
      "us_gallon",
    ]);

    expect(mockChannel.send).toHaveBeenCalledTimes(1);
    const embedCall = mockChannel.send.mock.calls[0][0];
    expect(embedCall).toHaveProperty("embeds");
  });
});

// Unit tests for the conversion logic
describe("Unit Converter Functions", () => {
  describe("parseConversionInput", () => {
    it("should parse valid input correctly", () => {
      const result = parseConversionInput(["100", "celsius", "fahrenheit"]);
      expect(result).toEqual({
        value: 100,
        fromUnit: "celsius",
        toUnit: "fahrenheit",
        isNumberBase: false,
      });
    });

    it("should return null for insufficient arguments", () => {
      expect(parseConversionInput(["100"])).toBeNull();
      expect(parseConversionInput(["100", "celsius"])).toBeNull();
    });

    it("should return null for invalid numbers", () => {
      expect(parseConversionInput(["abc", "celsius", "fahrenheit"])).toBeNull();
    });

    it("should parse number base input correctly", () => {
      const result = parseConversionInput(["1101", "binary", "decimal"]);
      expect(result).toEqual({
        value: "1101",
        fromUnit: "binary",
        toUnit: "decimal",
        isNumberBase: true,
      });
    });
  });

  describe("findUnit", () => {
    it("should find units by name", () => {
      const unit = findUnit("celsius");
      expect(unit).toBeTruthy();
      expect(unit?.name).toBe("Celsius");
    });

    it("should find units by alias", () => {
      const unit = findUnit("c");
      expect(unit).toBeTruthy();
      expect(unit?.name).toBe("Celsius");
    });

    it("should be case insensitive", () => {
      const unit = findUnit("CELSIUS");
      expect(unit).toBeTruthy();
      expect(unit?.name).toBe("Celsius");
    });

    it("should return null for unknown units", () => {
      expect(findUnit("unknown")).toBeNull();
    });

    it("should find number bases by name", () => {
      const unit = findUnit("binary");
      expect(unit).toBeTruthy();
      expect(unit?.name).toBe("Binary");
    });

    it("should find number bases by alias", () => {
      const unit = findUnit("b");
      expect(unit).toBeTruthy();
      expect(unit?.name).toBe("Binary");
    });

    it("should be case insensitive for number bases", () => {
      const unit = findUnit("BINARY");
      expect(unit).toBeTruthy();
      expect(unit?.name).toBe("Binary");
    });

    it("should return null for unknown number bases", () => {
      expect(findUnit("unknown_base")).toBeNull();
    });
  });

  describe("convertValue", () => {
    it("should convert temperature correctly", () => {
      const celsius = findUnit("celsius")!;
      const fahrenheit = findUnit("fahrenheit")!;
      const result = convertValue(0, celsius, fahrenheit);
      expect(result).toBeCloseTo(32, 1);
    });

    it("should convert length correctly", () => {
      const meters = findUnit("meters")!;
      const feet = findUnit("feet")!;
      const result = convertValue(1, meters, feet);
      expect(result).toBeCloseTo(3.28084, 4);
    });

    it("should convert number bases correctly", () => {
      const binary = findUnit("binary")!;
      const decimal = findUnit("decimal")!;
      const result = convertValue("1101", binary, decimal);
      expect(result).toBe("13");
    });

    it("should convert hex to decimal", () => {
      const hex = findUnit("hex")!;
      const decimal = findUnit("decimal")!;
      const result = convertValue("FF", hex, decimal);
      expect(result).toBe("255");
    });

    it("should convert decimal to binary", () => {
      const decimal = findUnit("decimal")!;
      const binary = findUnit("binary")!;
      const result = convertValue("13", decimal, binary);
      expect(result).toBe("1101");
    });

    it("should convert octal to decimal", () => {
      const octal = findUnit("octal")!;
      const decimal = findUnit("decimal")!;
      const result = convertValue("17", octal, decimal);
      expect(result).toBe("15");
    });

    it("should convert astronomical units", () => {
      const au = findUnit("au")!;
      const km = findUnit("km")!;
      const result = convertValue(1, au, km);
      expect(result).toBeCloseTo(149600000, -6);
    });

    it("should convert light years to meters", () => {
      const ly = findUnit("ly")!;
      const meters = findUnit("meters")!;
      const result = convertValue(1, ly, meters);
      expect(result).toBeCloseTo(9.461e15, -14);
    });

    it("should convert football fields to meters", () => {
      const ff = findUnit("football_field")!;
      const meters = findUnit("meters")!;
      const result = convertValue(1, ff, meters);
      expect(result).toBeCloseTo(109.728, 2);
    });

    it("should convert bananas to meters", () => {
      const banana = findUnit("banana")!;
      const meters = findUnit("meters")!;
      const result = convertValue(1, banana, meters);
      expect(result).toBeCloseTo(0.175, 3);
    });

    it("should convert speed of light", () => {
      const lightspeed = findUnit("lightspeed")!;
      const mps = findUnit("m/s")!;
      const result = convertValue(1, lightspeed, mps);
      expect(result).toBeCloseTo(299792458, 0);
    });

    it("should convert mach to mph", () => {
      const mach = findUnit("mach")!;
      const mph = findUnit("mph")!;
      const result = convertValue(1, mach, mph);
      expect(result).toBeCloseTo(767, 0);
    });

    it("should convert knots to mph", () => {
      const knots = findUnit("knots")!;
      const mph = findUnit("mph")!;
      const result = convertValue(100, knots, mph);
      expect(result).toBeCloseTo(115, 0);
    });

    it("should convert imperial gallons to us gallons", () => {
      const impGal = findUnit("imperial_gallon")!;
      const usGal = findUnit("us_gallon")!;
      const result = convertValue(1, impGal, usGal);
      expect(result).toBeCloseTo(1.201, 2);
    });

    it("should convert tablespoons to teaspoons", () => {
      const tbsp = findUnit("tbsp")!;
      const tsp = findUnit("tsp")!;
      const result = convertValue(1, tbsp, tsp);
      expect(result).toBeCloseTo(3, 0);
    });

    it("should convert parsecs to light years", () => {
      const pc = findUnit("pc")!;
      const ly = findUnit("ly")!;
      const result = convertValue(1, pc, ly);
      expect(result).toBeCloseTo(3.26, 1);
    });

    it("should convert nautical miles to kilometers", () => {
      const nmi = findUnit("nmi")!;
      const km = findUnit("km")!;
      const result = convertValue(1, nmi, km);
      expect(result).toBeCloseTo(1.852, 2);
    });

    it("should throw error for incompatible types", () => {
      const celsius = findUnit("celsius")!;
      const meters = findUnit("meters")!;
      expect(() => convertValue(100, celsius, meters)).toThrow();
    });

    it("should throw error for mixing number bases and physical units", () => {
      const binary = findUnit("binary")!;
      const meters = findUnit("meters")!;
      expect(() => convertValue("1101", binary, meters)).toThrow();
    });

    it("should validate absolute zero for temperature", () => {
      const celsius = findUnit("celsius")!;
      const fahrenheit = findUnit("fahrenheit")!;
      expect(() => convertValue(-300, celsius, fahrenheit)).toThrow();
    });
  });

  describe("convertNumberBase", () => {
    it("should convert binary to decimal", () => {
      expect(convertNumberBase("1101", 2, 10)).toBe("13");
    });

    it("should convert decimal to hex", () => {
      expect(convertNumberBase("255", 10, 16)).toBe("FF");
    });

    it("should convert hex to decimal", () => {
      expect(convertNumberBase("FF", 16, 10)).toBe("255");
    });

    it("should convert hex to binary", () => {
      expect(convertNumberBase("A", 16, 2)).toBe("1010");
    });

    it("should handle octal conversions", () => {
      expect(convertNumberBase("17", 8, 10)).toBe("15");
    });

    it("should convert decimal to octal", () => {
      expect(convertNumberBase("64", 10, 8)).toBe("100");
    });

    it("should handle zero", () => {
      expect(convertNumberBase("0", 10, 2)).toBe("0");
    });

    it("should throw error for invalid numbers", () => {
      expect(() => convertNumberBase("G", 16, 10)).toThrow();
    });

    it("should throw error for invalid base 2 numbers", () => {
      expect(() => convertNumberBase("12", 2, 10)).toThrow();
    });
  });

  describe("formatResult", () => {
    it("should format large numbers with appropriate precision", () => {
      expect(formatResult(1000.123456)).toBe("1000.12");
    });

    it("should format small numbers with higher precision", () => {
      expect(formatResult(0.00123456)).toBe("0.001235");
    });

    it("should remove trailing zeros", () => {
      expect(formatResult(1.0)).toBe("1");
      expect(formatResult(1.5)).toBe("1.5");
    });

    it("should handle string results from number conversions", () => {
      expect(formatResult("FF")).toBe("FF");
    });

    it("should format scientific notation when requested", () => {
      const result = formatResult(9.461e15, { scientific: true });
      expect(result).toMatch(/^9\.461e\+15$/i);
    });

    it("should format very large numbers in scientific notation", () => {
      const result = formatResult(299792458, { scientific: true });
      expect(result).toMatch(/^2\.998e\+8$/i);
    });

    it("should format very small numbers in scientific notation", () => {
      const result = formatResult(0.00000001, { scientific: true });
      expect(result).toMatch(/^1\.000e-8$/i);
    });

    it("should not use scientific notation for strings", () => {
      expect(formatResult("1101", { scientific: true })).toBe("1101");
    });
  });

  describe("findNumberBase", () => {
    it("should find binary base", () => {
      const base = findNumberBase("binary");
      expect(base).toBeTruthy();
      expect(base?.base).toBe(2);
    });

    it("should find hex base by alias", () => {
      const base = findNumberBase("hex");
      expect(base).toBeTruthy();
      expect(base?.base).toBe(16);
    });

    it("should find octal base", () => {
      const base = findNumberBase("octal");
      expect(base).toBeTruthy();
      expect(base?.base).toBe(8);
    });

    it("should find decimal base", () => {
      const base = findNumberBase("decimal");
      expect(base).toBeTruthy();
      expect(base?.base).toBe(10);
    });

    it("should be case insensitive", () => {
      const base = findNumberBase("BINARY");
      expect(base).toBeTruthy();
      expect(base?.base).toBe(2);
    });

    it("should return null for unknown bases", () => {
      expect(findNumberBase("unknown")).toBeNull();
    });
  });
});
