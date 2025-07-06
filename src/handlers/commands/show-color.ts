import { Message, EmbedBuilder, TextChannel, NewsChannel } from "discord.js";
import { type TextCommand } from "../../types/textCommand";

// Color conversion utilities
const colorUtils = {
  // Convert HSL to RGB
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

  // Convert HSV to RGB
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

  // Convert CMYK to RGB
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

  // Convert LAB to RGB (simplified conversion)
  labToRgb: (l: number, a: number, b: number): [number, number, number] => {
    // Convert LAB to XYZ
    let y = (l + 16) / 116;
    let x = a / 500 + y;
    let z = y - b / 200;

    x = 0.95047 * (x * x * x > 0.008856 ? x * x * x : (x - 16 / 116) / 7.787);
    y = 1.0 * (y * y * y > 0.008856 ? y * y * y : (y - 16 / 116) / 7.787);
    z = 1.08883 * (z * z * z > 0.008856 ? z * z * z : (z - 16 / 116) / 7.787);

    // Convert XYZ to RGB
    let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
    let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
    let bi = x * 0.0557 + y * -0.204 + z * 1.057;

    r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
    g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
    bi = bi > 0.0031308 ? 1.055 * Math.pow(bi, 1 / 2.4) - 0.055 : 12.92 * bi;

    return [
      Math.max(0, Math.min(1, r)) * 255,
      Math.max(0, Math.min(1, g)) * 255,
      Math.max(0, Math.min(1, bi)) * 255,
    ].map(Math.round) as [number, number, number];
  },

  // Convert OKLCH to RGB (simplified)
  oklchToRgb: (l: number, c: number, h: number): [number, number, number] => {
    // Convert OKLCH to OKLAB
    const hRad = (h * Math.PI) / 180;
    const a = c * Math.cos(hRad);
    const b = c * Math.sin(hRad);

    // Convert OKLAB to RGB (simplified linear transformation)
    const lr = l + 0.3963377774 * a + 0.2158037573 * b;
    const mg = l - 0.1055613458 * a - 0.0638541728 * b;
    const sb = l - 0.0894841775 * a - 1.291485548 * b;

    const r = +4.0767416621 * lr - 3.3077115913 * mg + 0.2309699292 * sb;
    const g = -1.2684380046 * lr + 2.6097574011 * mg - 0.3413193965 * sb;
    const bi = -0.0041960863 * lr - 0.7034186147 * mg + 1.707614701 * sb;

    return [
      Math.max(0, Math.min(255, r * 255)),
      Math.max(0, Math.min(255, g * 255)),
      Math.max(0, Math.min(255, bi * 255)),
    ].map(Math.round) as [number, number, number];
  },

  // Convert RGB to hex
  rgbToHex: (r: number, g: number, b: number): string => {
    return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
  },

  // Named colors
  namedColors: {
    red: "#ff0000",
    green: "#008000",
    blue: "#0000ff",
    yellow: "#ffff00",
    cyan: "#00ffff",
    magenta: "#ff00ff",
    black: "#000000",
    white: "#ffffff",
    gray: "#808080",
    grey: "#808080",
    orange: "#ffa500",
    purple: "#800080",
    pink: "#ffc0cb",
    brown: "#a52a2a",
    lime: "#00ff00",
    navy: "#000080",
    maroon: "#800000",
    olive: "#808000",
    teal: "#008080",
    silver: "#c0c0c0",
    gold: "#ffd700",
    violet: "#ee82ee",
    indigo: "#4b0082",
    coral: "#ff7f50",
    salmon: "#fa8072",
    khaki: "#f0e68c",
    lavender: "#e6e6fa",
    turquoise: "#40e0d0",
  },
};

const parseColor = (input: string): [number, number, number] | null => {
  const trimmed = input.trim().toLowerCase();

  // Named colors
  if (trimmed in colorUtils.namedColors) {
    const hex =
      colorUtils.namedColors[trimmed as keyof typeof colorUtils.namedColors];
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  }

  // Hex colors (#fff, #ffffff, fff, ffffff)
  const hexMatch = trimmed.match(/^#?([a-f0-9]{3}|[a-f0-9]{6})$/i);
  if (hexMatch && hexMatch[1]) {
    let hex = hexMatch[1];
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return [r, g, b];
  }

  // RGB formats: rgb(255,0,0), rgba(255,0,0,1), 255,0,0
  const rgbMatch = trimmed.match(
    /^(?:rgba?\\()?([0-9]{1,3}),\\s*([0-9]{1,3}),\\s*([0-9]{1,3})(?:,\\s*[0-9.]+)?\\)?$/
  );
  if (rgbMatch && rgbMatch[1] && rgbMatch[2] && rgbMatch[3]) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    if ([r, g, b].every((v) => v >= 0 && v <= 255)) {
      return [r, g, b];
    }
  }

  // HSL: hsl(360,100%,50%)
  const hslMatch = trimmed.match(
    /^hsl\\(([0-9]{1,3}),\\s*([0-9]{1,3})%,\\s*([0-9]{1,3})%\\)$/
  );
  if (hslMatch && hslMatch[1] && hslMatch[2] && hslMatch[3]) {
    const h = parseInt(hslMatch[1]);
    const s = parseInt(hslMatch[2]);
    const l = parseInt(hslMatch[3]);
    if (h >= 0 && h <= 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100) {
      return colorUtils.hslToRgb(h, s, l);
    }
  }

  // HSV: hsv(360,100%,100%)
  const hsvMatch = trimmed.match(
    /^hsv\\(([0-9]{1,3}),\\s*([0-9]{1,3})%,\\s*([0-9]{1,3})%\\)$/
  );
  if (hsvMatch && hsvMatch[1] && hsvMatch[2] && hsvMatch[3]) {
    const h = parseInt(hsvMatch[1]);
    const s = parseInt(hsvMatch[2]);
    const v = parseInt(hsvMatch[3]);
    if (h >= 0 && h <= 360 && s >= 0 && s <= 100 && v >= 0 && v <= 100) {
      return colorUtils.hsvToRgb(h, s, v);
    }
  }

  // CMYK: cmyk(0%,100%,100%,0%)
  const cmykMatch = trimmed.match(
    /^cmyk\\(([0-9]{1,3})%,\\s*([0-9]{1,3})%,\\s*([0-9]{1,3})%,\\s*([0-9]{1,3})%\\)$/
  );
  if (
    cmykMatch &&
    cmykMatch[1] &&
    cmykMatch[2] &&
    cmykMatch[3] &&
    cmykMatch[4]
  ) {
    const c = parseInt(cmykMatch[1]);
    const m = parseInt(cmykMatch[2]);
    const y = parseInt(cmykMatch[3]);
    const k = parseInt(cmykMatch[4]);
    if ([c, m, y, k].every((v) => v >= 0 && v <= 100)) {
      return colorUtils.cmykToRgb(c, m, y, k);
    }
  }

  // LAB: lab(50,0,0)
  const labMatch = trimmed.match(
    /^lab\\(([0-9.-]+),\\s*([0-9.-]+),\\s*([0-9.-]+)\\)$/
  );
  if (labMatch && labMatch[1] && labMatch[2] && labMatch[3]) {
    const l = parseFloat(labMatch[1]);
    const a = parseFloat(labMatch[2]);
    const b = parseFloat(labMatch[3]);
    if (l >= 0 && l <= 100 && a >= -128 && a <= 127 && b >= -128 && b <= 127) {
      return colorUtils.labToRgb(l, a, b);
    }
  }

  // OKLCH: oklch(0.5,0.1,180)
  const oklchMatch = trimmed.match(
    /^oklch\\(([0-9.]+),\\s*([0-9.]+),\\s*([0-9.]+)\\)$/
  );
  if (oklchMatch && oklchMatch[1] && oklchMatch[2] && oklchMatch[3]) {
    const l = parseFloat(oklchMatch[1]);
    const c = parseFloat(oklchMatch[2]);
    const h = parseFloat(oklchMatch[3]);
    if (l >= 0 && l <= 1 && c >= 0 && c <= 1 && h >= 0 && h <= 360) {
      return colorUtils.oklchToRgb(l, c, h);
    }
  }

  return null;
};

const showColorCommand: TextCommand = {
  name: "showcolor",
  description:
    "Show color from various formats: hex, rgb, hsl, hsv, cmyk, lab, oklch, or named colors",
  aliases: ["color"],
  cooldown: 5,
  execute: async (message: Message, args: string[]) => {
    await message.delete().catch(() => {});
    const colorInput = args.join(" ").trim();

    // Helper to send a message only if channel supports .send
    const safeSend = async (content: string | object) => {
      if (
        message.channel &&
        "send" in message.channel &&
        (message.channel instanceof TextChannel ||
          message.channel instanceof NewsChannel)
      ) {
        await message.channel.send(content);
      }
    };

    if (!colorInput) {
      await safeSend({
        embeds: [
          new EmbedBuilder()
            .setTitle("🎨 Color Command Help")
            .setDescription("Provide a color in any of these formats:")
            .addFields(
              { name: "Hex", value: "#ff0000, #f00, ff0000", inline: true },
              { name: "RGB", value: "rgb(255,0,0), 255,0,0", inline: true },
              { name: "HSL", value: "hsl(0,100%,50%)", inline: true },
              { name: "HSV", value: "hsv(0,100%,100%)", inline: true },
              { name: "CMYK", value: "cmyk(0%,100%,100%,0%)", inline: true },
              { name: "LAB", value: "lab(53.23,80.11,67.22)", inline: true },
              {
                name: "OKLCH",
                value: "oklch(0.628,0.258,29.23)",
                inline: true,
              },
              { name: "Named", value: "red, blue, green, etc.", inline: true }
            )
            .setColor(0x7289da),
        ],
      });
      return;
    }

    const rgb = parseColor(colorInput);
    if (!rgb) {
      await safeSend(
        "Invalid color format. Use the help command to see supported formats."
      );
      return;
    }

    const [r, g, b] = rgb;
    const hexColor = colorUtils.rgbToHex(r, g, b);

    const embed = new EmbedBuilder()
      .setTitle("🎨 Color Preview")
      .setDescription(
        `**Input:** ${colorInput}\n**RGB:** ${r}, ${g}, ${b}\n**Hex:** ${hexColor}`
      )
      .setColor(parseInt(hexColor.replace("#", ""), 16))
      .setTimestamp()
      .setFooter({
        text: `Requested by ${message.author.username}`,
        iconURL: message.author.displayAvatarURL(),
      });

    embed.setImage(
      `https://singlecolorimage.com/get/${hexColor.slice(1)}/100x100`
    );

    await safeSend({ embeds: [embed] });
  },
};

export default showColorCommand;
