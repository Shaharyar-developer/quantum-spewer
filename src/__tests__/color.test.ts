import { describe, it, expect } from "bun:test";

// We'll need to extract the parseColor function for testing
// For now, let's test the color conversions directly

describe("Color Conversions", () => {
  // Helper functions from the color command
  const colorUtils = {
    hslToRgb: (h: number, s: number, l: number): [number, number, number] => {
      h /= 360;
      s /= 100;
      l /= 100;
      const a = s * Math.min(l, 1 - l);
      const f = (n: number) => {
        const k = (n + h / (1 / 12)) % 12;
        return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      };
      return [
        Math.round(f(0) * 255),
        Math.round(f(8) * 255),
        Math.round(f(4) * 255),
      ];
    },

    hsvToRgb: (h: number, s: number, v: number): [number, number, number] => {
      h /= 360;
      s /= 100;
      v /= 100;
      const c = v * s;
      const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
      const m = v - c;
      let r = 0,
        g = 0,
        b = 0;
      if (h < 1 / 6) [r, g, b] = [c, x, 0];
      else if (h < 2 / 6) [r, g, b] = [x, c, 0];
      else if (h < 3 / 6) [r, g, b] = [0, c, x];
      else if (h < 4 / 6) [r, g, b] = [0, x, c];
      else if (h < 5 / 6) [r, g, b] = [x, 0, c];
      else [r, g, b] = [c, 0, x];
      return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255),
      ];
    },

    cmykToRgb: (
      c: number,
      m: number,
      y: number,
      k: number
    ): [number, number, number] => {
      c /= 100;
      m /= 100;
      y /= 100;
      k /= 100;
      const r = 255 * (1 - c) * (1 - k);
      const g = 255 * (1 - m) * (1 - k);
      const b = 255 * (1 - y) * (1 - k);
      return [Math.round(r), Math.round(g), Math.round(b)];
    },

    rgbToHex: (r: number, g: number, b: number): string => {
      return `#${[r, g, b]
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("")}`;
    },
  };

  describe("HSL to RGB conversion", () => {
    it("should convert pure red HSL to RGB", () => {
      const result = colorUtils.hslToRgb(0, 100, 50);
      expect(result).toEqual([255, 0, 0]);
    });

    it("should convert pure green HSL to RGB", () => {
      const result = colorUtils.hslToRgb(120, 100, 50);
      expect(result).toEqual([0, 255, 0]);
    });

    it("should convert pure blue HSL to RGB", () => {
      const result = colorUtils.hslToRgb(240, 100, 50);
      expect(result).toEqual([0, 0, 255]);
    });

    it("should convert white HSL to RGB", () => {
      const result = colorUtils.hslToRgb(0, 0, 100);
      expect(result).toEqual([255, 255, 255]);
    });

    it("should convert black HSL to RGB", () => {
      const result = colorUtils.hslToRgb(0, 0, 0);
      expect(result).toEqual([0, 0, 0]);
    });
  });

  describe("HSV to RGB conversion", () => {
    it("should convert pure red HSV to RGB", () => {
      const result = colorUtils.hsvToRgb(0, 100, 100);
      expect(result).toEqual([255, 0, 0]);
    });

    it("should convert pure green HSV to RGB", () => {
      const result = colorUtils.hsvToRgb(120, 100, 100);
      expect(result).toEqual([0, 255, 0]);
    });

    it("should convert pure blue HSV to RGB", () => {
      const result = colorUtils.hsvToRgb(240, 100, 100);
      expect(result).toEqual([0, 0, 255]);
    });
  });

  describe("CMYK to RGB conversion", () => {
    it("should convert pure red CMYK to RGB", () => {
      const result = colorUtils.cmykToRgb(0, 100, 100, 0);
      expect(result).toEqual([255, 0, 0]);
    });

    it("should convert pure green CMYK to RGB", () => {
      const result = colorUtils.cmykToRgb(100, 0, 100, 0);
      expect(result).toEqual([0, 255, 0]);
    });

    it("should convert pure blue CMYK to RGB", () => {
      const result = colorUtils.cmykToRgb(100, 100, 0, 0);
      expect(result).toEqual([0, 0, 255]);
    });

    it("should convert black CMYK to RGB", () => {
      const result = colorUtils.cmykToRgb(0, 0, 0, 100);
      expect(result).toEqual([0, 0, 0]);
    });

    it("should convert white CMYK to RGB", () => {
      const result = colorUtils.cmykToRgb(0, 0, 0, 0);
      expect(result).toEqual([255, 255, 255]);
    });
  });

  describe("RGB to Hex conversion", () => {
    it("should convert red RGB to hex", () => {
      const result = colorUtils.rgbToHex(255, 0, 0);
      expect(result).toBe("#ff0000");
    });

    it("should convert green RGB to hex", () => {
      const result = colorUtils.rgbToHex(0, 255, 0);
      expect(result).toBe("#00ff00");
    });

    it("should convert blue RGB to hex", () => {
      const result = colorUtils.rgbToHex(0, 0, 255);
      expect(result).toBe("#0000ff");
    });

    it("should convert white RGB to hex", () => {
      const result = colorUtils.rgbToHex(255, 255, 255);
      expect(result).toBe("#ffffff");
    });

    it("should convert black RGB to hex", () => {
      const result = colorUtils.rgbToHex(0, 0, 0);
      expect(result).toBe("#000000");
    });
  });
});
