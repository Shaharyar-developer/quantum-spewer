// Morse code mapping for letters, digits, and common punctuation
const codes: Record<string, string> = {
  "0": "-----",
  "1": ".----",
  "2": "..---",
  "3": "...--",
  "4": "....-",
  "5": ".....",
  "6": "-....",
  "7": "--...",
  "8": "---..",
  "9": "----.",
  a: ".-",
  b: "-...",
  c: "-.-.",
  d: "-..",
  e: ".",
  f: "..-.",
  g: "--.",
  h: "....",
  i: "..",
  j: ".---",
  k: "-.-",
  l: ".-..",
  m: "--",
  n: "-.",
  o: "---",
  p: ".--.",
  q: "--.-",
  r: ".-.",
  s: "...",
  t: "-",
  u: "..-",
  v: "...-",
  w: ".--",
  x: "-..-",
  y: "-.--",
  z: "--..",
  ".": ".-.-.-",
  ",": "--..--",
  "?": "..--..",
  "!": "-.-.--",
  "-": "-....-",
  "/": "-..-.",
  "@": ".--.-.",
  "(": "-.--.",
  ")": "-.--.-",
  "'": ".----.",
  '"': ".-..-.",
  ":": "---...",
  ";": "-.-.-.",
  "=": "-...-",
  "+": ".-.-.",
  _: "..--.-",
  $: "...-..-",
  "&": ".-...",
  " ": "/", // Space between words
};

// Reverse mapping for decoding
const reverseCodes: Record<string, string> = Object.fromEntries(
  Object.entries(codes).map(([k, v]) => [v, k])
);

/**
 * Encode a string to Morse code.
 * @param text The text to encode.
 * @returns Morse code string.
 */
export function encodeMorse(text: string): string {
  return text
    .toLowerCase()
    .split("")
    .map((char) => codes[char] || "")
    .filter(Boolean)
    .join(" ");
}

/**
 * Decode a Morse code string to plain text.
 * @param morse The Morse code string.
 * @returns Decoded plain text.
 */
export function decodeMorse(morse: string): string {
  return morse
    .split(" ")
    .map((code) => reverseCodes[code] || "")
    .join("")
    .replace(/\//g, " "); // Replace / with space
}

export default {
  encode: encodeMorse,
  decode: decodeMorse,
  codes,
  reverseCodes,
};
