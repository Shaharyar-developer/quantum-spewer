import { describe, it, expect } from "bun:test";
import { encodeMorse, decodeMorse } from "../lib/morse-code";
import morseCode from "../lib/morse-code";

describe("Morse Code", () => {
  describe("encodeMorse", () => {
    it("should encode simple text to morse code", () => {
      const result = encodeMorse("hello");
      expect(result).toBe(".... . .-.. .-.. ---");
    });

    it("should encode text with numbers", () => {
      const result = encodeMorse("abc123");
      expect(result).toBe(".- -... -.-. .---- ..--- ...--");
    });

    it("should encode text with punctuation", () => {
      const result = encodeMorse("hello!");
      expect(result).toBe(".... . .-.. .-.. --- -.-.--");
    });

    it("should handle uppercase and lowercase", () => {
      const result1 = encodeMorse("Hello");
      const result2 = encodeMorse("HELLO");
      expect(result1).toBe(result2);
      expect(result1).toBe(".... . .-.. .-.. ---");
    });

    it("should handle spaces", () => {
      const result = encodeMorse("hello world");
      expect(result).toBe(".... . .-.. .-.. --- / .-- --- .-. .-.. -..");
    });

    it("should ignore unknown characters", () => {
      const result = encodeMorse("hello~world");
      expect(result).toBe(".... . .-.. .-.. --- .-- --- .-. .-.. -..");
    });

    it("should handle empty string", () => {
      const result = encodeMorse("");
      expect(result).toBe("");
    });
  });

  describe("decodeMorse", () => {
    it("should decode simple morse code to text", () => {
      const result = decodeMorse(".... . .-.. .-.. ---");
      expect(result).toBe("hello");
    });

    it("should decode morse code with numbers", () => {
      const result = decodeMorse(".- -... -.-. .---- ..--- ...--");
      expect(result).toBe("abc123");
    });

    it("should decode morse code with punctuation", () => {
      const result = decodeMorse(".... . .-.. .-.. --- -.-.--");
      expect(result).toBe("hello!");
    });

    it("should handle spaces (represented by /)", () => {
      const result = decodeMorse(".... . .-.. .-.. --- / .-- --- .-. .-.. -..");
      expect(result).toBe("hello world");
    });

    it("should handle unknown morse codes", () => {
      const result = decodeMorse(".... . .-.. .-.. --- .-.-.-."); // last code doesn't exist
      expect(result).toBe("hello");
    });

    it("should handle empty string", () => {
      const result = decodeMorse("");
      expect(result).toBe("");
    });

    it("should handle multiple spaces", () => {
      const result = decodeMorse("/ / /");
      expect(result).toBe("   ");
    });
  });

  describe("Round trip encoding/decoding", () => {
    it("should encode and decode simple text correctly", () => {
      const original = "hello world";
      const encoded = encodeMorse(original);
      const decoded = decodeMorse(encoded);
      expect(decoded).toBe(original);
    });

    it("should encode and decode text with numbers", () => {
      const original = "test123";
      const encoded = encodeMorse(original);
      const decoded = decodeMorse(encoded);
      expect(decoded).toBe(original);
    });

    it("should encode and decode text with punctuation", () => {
      const original = "hello, world!";
      const encoded = encodeMorse(original);
      const decoded = decodeMorse(encoded);
      expect(decoded).toBe(original);
    });

    it("should handle complex sentences", () => {
      const original = "sos this is a test";
      const encoded = encodeMorse(original);
      const decoded = decodeMorse(encoded);
      expect(decoded).toBe(original);
    });
  });

  describe("Default export", () => {
    it("should have encode and decode functions", () => {
      expect(typeof morseCode.encode).toBe("function");
      expect(typeof morseCode.decode).toBe("function");
    });

    it("should have codes and reverseCodes", () => {
      expect(typeof morseCode.codes).toBe("object");
      expect(typeof morseCode.reverseCodes).toBe("object");
    });

    it("should work with default export functions", () => {
      const encoded = morseCode.encode("hello");
      const decoded = morseCode.decode(encoded);
      expect(decoded).toBe("hello");
    });
  });

  describe("Code mappings", () => {
    it("should have correct mappings for common characters", () => {
      expect(morseCode.codes["a"]).toBe(".-");
      expect(morseCode.codes["b"]).toBe("-...");
      expect(morseCode.codes["c"]).toBe("-.-.");
      expect(morseCode.codes["0"]).toBe("-----");
      expect(morseCode.codes["1"]).toBe(".----");
      expect(morseCode.codes["!"]).toBe("-.-.--");
      expect(morseCode.codes["?"]).toBe("..--..");
      expect(morseCode.codes[" "]).toBe("/");
    });

    it("should have correct reverse mappings", () => {
      expect(morseCode.reverseCodes[".-"]).toBe("a");
      expect(morseCode.reverseCodes["-..."]).toBe("b");
      expect(morseCode.reverseCodes["-.-."]).toBe("c");
      expect(morseCode.reverseCodes["-----"]).toBe("0");
      expect(morseCode.reverseCodes[".----"]).toBe("1");
      expect(morseCode.reverseCodes["-.-.--"]).toBe("!");
      expect(morseCode.reverseCodes["..--.."]).toBe("?");
      expect(morseCode.reverseCodes["/"]).toBe(" ");
    });
  });
});
