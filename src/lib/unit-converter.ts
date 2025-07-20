// Extracted unit conversion logic
export interface ConversionUnit {
  name: string;
  aliases: string[];
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
  symbol: string;
  type: string;
}

export const conversionUnits: ConversionUnit[] = [
  // Temperature
  {
    name: "Celsius",
    aliases: ["celsius", "c", "°c", "celcius"],
    toBase: (c) => c + 273.15, // to Kelvin
    fromBase: (k) => k - 273.15,
    symbol: "°C",
    type: "temperature",
  },
  {
    name: "Fahrenheit",
    aliases: ["fahrenheit", "f", "°f", "farenheit"],
    toBase: (f) => ((f - 32) * 5) / 9 + 273.15, // to Kelvin
    fromBase: (k) => ((k - 273.15) * 9) / 5 + 32,
    symbol: "°F",
    type: "temperature",
  },
  {
    name: "Kelvin",
    aliases: ["kelvin", "k"],
    toBase: (k) => k,
    fromBase: (k) => k,
    symbol: "K",
    type: "temperature",
  },

  // Length
  {
    name: "Meters",
    aliases: ["meter", "meters", "m", "metre", "metres"],
    toBase: (m) => m,
    fromBase: (m) => m,
    symbol: "m",
    type: "length",
  },
  {
    name: "Feet",
    aliases: ["feet", "foot", "ft"],
    toBase: (ft) => ft * 0.3048,
    fromBase: (m) => m / 0.3048,
    symbol: "ft",
    type: "length",
  },
  {
    name: "Inches",
    aliases: ["inch", "inches", "in", '"'],
    toBase: (inch) => inch * 0.0254,
    fromBase: (m) => m / 0.0254,
    symbol: "in",
    type: "length",
  },
  {
    name: "Kilometers",
    aliases: ["kilometer", "kilometers", "km", "kilometre", "kilometres"],
    toBase: (km) => km * 1000,
    fromBase: (m) => m / 1000,
    symbol: "km",
    type: "length",
  },
  {
    name: "Miles",
    aliases: ["mile", "miles", "mi"],
    toBase: (mi) => mi * 1609.344,
    fromBase: (m) => m / 1609.344,
    symbol: "mi",
    type: "length",
  },
  {
    name: "Centimeters",
    aliases: ["centimeter", "centimeters", "cm", "centimetre", "centimetres"],
    toBase: (cm) => cm / 100,
    fromBase: (m) => m * 100,
    symbol: "cm",
    type: "length",
  },
  {
    name: "Yards",
    aliases: ["yard", "yards", "yd"],
    toBase: (yd) => yd * 0.9144,
    fromBase: (m) => m / 0.9144,
    symbol: "yd",
    type: "length",
  },

  // Astronomical distances
  {
    name: "Light Years",
    aliases: ["light year", "light years", "ly", "lightyear", "lightyears"],
    toBase: (ly) => ly * 9.461e15, // to meters
    fromBase: (m) => m / 9.461e15,
    symbol: "ly",
    type: "length",
  },
  {
    name: "Astronomical Units",
    aliases: ["astronomical unit", "astronomical units", "au"],
    toBase: (au) => au * 1.496e11, // to meters
    fromBase: (m) => m / 1.496e11,
    symbol: "AU",
    type: "length",
  },
  {
    name: "Parsecs",
    aliases: ["parsec", "parsecs", "pc"],
    toBase: (pc) => pc * 3.086e16, // to meters
    fromBase: (m) => m / 3.086e16,
    symbol: "pc",
    type: "length",
  },
  {
    name: "Nautical Miles",
    aliases: ["nautical mile", "nautical miles", "nmi", "nm"],
    toBase: (nmi) => nmi * 1852, // to meters
    fromBase: (m) => m / 1852,
    symbol: "nmi",
    type: "length",
  },

  // Fun/unconventional length units
  {
    name: "Football Fields",
    aliases: [
      "football field",
      "football fields",
      "ff",
      "field",
      "fields",
      "football_field",
      "football_fields",
    ],
    toBase: (ff) => ff * 109.728, // American football field including end zones (120 yards)
    fromBase: (m) => m / 109.728,
    symbol: "🏈",
    type: "length",
  },
  {
    name: "Empire State Buildings",
    aliases: ["empire state building", "empire state buildings", "esb"],
    toBase: (esb) => esb * 381, // height in meters
    fromBase: (m) => m / 381,
    symbol: "🏢",
    type: "length",
  },
  {
    name: "Bananas",
    aliases: ["banana", "bananas", "🍌"],
    toBase: (banana) => banana * 0.175, // average banana length
    fromBase: (m) => m / 0.175,
    symbol: "🍌",
    type: "length",
  },

  // Weight/Mass
  {
    name: "Kilograms",
    aliases: ["kilogram", "kilograms", "kg", "kilo", "kilos"],
    toBase: (kg) => kg,
    fromBase: (kg) => kg,
    symbol: "kg",
    type: "weight",
  },
  {
    name: "Pounds",
    aliases: ["pound", "pounds", "lb", "lbs"],
    toBase: (lb) => lb * 0.453592,
    fromBase: (kg) => kg / 0.453592,
    symbol: "lbs",
    type: "weight",
  },
  {
    name: "Grams",
    aliases: ["gram", "grams", "g"],
    toBase: (g) => g / 1000,
    fromBase: (kg) => kg * 1000,
    symbol: "g",
    type: "weight",
  },
  {
    name: "Ounces",
    aliases: ["ounce", "ounces", "oz"],
    toBase: (oz) => oz * 0.0283495,
    fromBase: (kg) => kg / 0.0283495,
    symbol: "oz",
    type: "weight",
  },
  {
    name: "Tons",
    aliases: ["ton", "tons", "tonne", "tonnes", "t"],
    toBase: (t) => t * 1000,
    fromBase: (kg) => kg / 1000,
    symbol: "t",
    type: "weight",
  },

  // Volume (with more specific units)
  {
    name: "Liters",
    aliases: ["liter", "liters", "l", "litre", "litres"],
    toBase: (l) => l,
    fromBase: (l) => l,
    symbol: "L",
    type: "volume",
  },
  {
    name: "US Gallons",
    aliases: [
      "us gallon",
      "us gallons",
      "usgal",
      "gal",
      "gallon",
      "gallons",
      "us_gallon",
      "us_gallons",
    ],
    toBase: (gal) => gal * 3.78541,
    fromBase: (l) => l / 3.78541,
    symbol: "US gal",
    type: "volume",
  },
  {
    name: "Imperial Gallons",
    aliases: [
      "imperial gallon",
      "imperial gallons",
      "imp gal",
      "uk gallon",
      "uk gallons",
      "imperial_gallon",
      "imperial_gallons",
    ],
    toBase: (gal) => gal * 4.54609,
    fromBase: (l) => l / 4.54609,
    symbol: "UK gal",
    type: "volume",
  },
  {
    name: "Milliliters",
    aliases: ["milliliter", "milliliters", "ml", "millilitre", "millilitres"],
    toBase: (ml) => ml / 1000,
    fromBase: (l) => l * 1000,
    symbol: "mL",
    type: "volume",
  },
  {
    name: "Cups",
    aliases: ["cup", "cups", "c"],
    toBase: (c) => c * 0.236588,
    fromBase: (l) => l / 0.236588,
    symbol: "cups",
    type: "volume",
  },
  {
    name: "Pints",
    aliases: ["pint", "pints", "pt"],
    toBase: (pt) => pt * 0.473176,
    fromBase: (l) => l / 0.473176,
    symbol: "pt",
    type: "volume",
  },
  {
    name: "Quarts",
    aliases: ["quart", "quarts", "qt"],
    toBase: (qt) => qt * 0.946353,
    fromBase: (l) => l / 0.946353,
    symbol: "qt",
    type: "volume",
  },
  {
    name: "Fluid Ounces (US)",
    aliases: ["fluid ounce", "fluid ounces", "fl oz", "floz"],
    toBase: (floz) => floz * 0.0295735,
    fromBase: (l) => l / 0.0295735,
    symbol: "fl oz",
    type: "volume",
  },
  {
    name: "Tablespoons",
    aliases: ["tablespoon", "tablespoons", "tbsp", "tbl"],
    toBase: (tbsp) => tbsp * 0.0147868,
    fromBase: (l) => l / 0.0147868,
    symbol: "tbsp",
    type: "volume",
  },
  {
    name: "Teaspoons",
    aliases: ["teaspoon", "teaspoons", "tsp"],
    toBase: (tsp) => tsp * 0.00492892,
    fromBase: (l) => l / 0.00492892,
    symbol: "tsp",
    type: "volume",
  },

  // Speed
  {
    name: "Meters per second",
    aliases: ["mps", "m/s", "meters per second", "metres per second"],
    toBase: (mps) => mps,
    fromBase: (mps) => mps,
    symbol: "m/s",
    type: "speed",
  },
  {
    name: "Kilometers per hour",
    aliases: [
      "kph",
      "km/h",
      "kmh",
      "kilometers per hour",
      "kilometres per hour",
    ],
    toBase: (kph) => kph / 3.6,
    fromBase: (mps) => mps * 3.6,
    symbol: "km/h",
    type: "speed",
  },
  {
    name: "Miles per hour",
    aliases: ["mph", "mi/h", "miles per hour"],
    toBase: (mph) => mph * 0.44704,
    fromBase: (mps) => mps / 0.44704,
    symbol: "mph",
    type: "speed",
  },
  {
    name: "Feet per second",
    aliases: ["fps", "ft/s", "feet per second"],
    toBase: (fps) => fps * 0.3048,
    fromBase: (mps) => mps / 0.3048,
    symbol: "ft/s",
    type: "speed",
  },

  // Speed of light related units
  {
    name: "Speed of Light",
    aliases: ["speed of light", "light speed", "lightspeed", "sol"],
    toBase: (c) => c * 299792458, // to m/s
    fromBase: (mps) => mps / 299792458,
    symbol: "c",
    type: "speed",
  },
  {
    name: "Mach",
    aliases: ["mach", "mach number"],
    toBase: (mach) => mach * 343, // speed of sound at sea level
    fromBase: (mps) => mps / 343,
    symbol: "Ma",
    type: "speed",
  },
  {
    name: "Knots",
    aliases: ["knot", "knots", "kt", "kts"],
    toBase: (kt) => kt * 0.514444, // to m/s
    fromBase: (mps) => mps / 0.514444,
    symbol: "kt",
    type: "speed",
  },

  // Area
  {
    name: "Square meters",
    aliases: ["sqm", "m²", "square meters", "square metres", "m2"],
    toBase: (sqm) => sqm,
    fromBase: (sqm) => sqm,
    symbol: "m²",
    type: "area",
  },
  {
    name: "Square feet",
    aliases: ["sqft", "ft²", "square feet", "ft2"],
    toBase: (sqft) => sqft * 0.092903,
    fromBase: (sqm) => sqm / 0.092903,
    symbol: "ft²",
    type: "area",
  },
  {
    name: "Acres",
    aliases: ["acre", "acres", "ac"],
    toBase: (ac) => ac * 4046.86,
    fromBase: (sqm) => sqm / 4046.86,
    symbol: "acres",
    type: "area",
  },
  {
    name: "Hectares",
    aliases: ["hectare", "hectares", "ha"],
    toBase: (ha) => ha * 10000,
    fromBase: (sqm) => sqm / 10000,
    symbol: "ha",
    type: "area",
  },

  // Energy
  {
    name: "Joules",
    aliases: ["joule", "joules", "j"],
    toBase: (j) => j,
    fromBase: (j) => j,
    symbol: "J",
    type: "energy",
  },
  {
    name: "Kilojoules",
    aliases: ["kilojoule", "kilojoules", "kj"],
    toBase: (kj) => kj * 1000,
    fromBase: (j) => j / 1000,
    symbol: "kJ",
    type: "energy",
  },
  {
    name: "Calories",
    aliases: ["calorie", "calories", "cal"],
    toBase: (cal) => cal * 4.184,
    fromBase: (j) => j / 4.184,
    symbol: "cal",
    type: "energy",
  },
  {
    name: "Kilocalories",
    aliases: [
      "kilocalorie",
      "kilocalories",
      "kcal",
      "food calorie",
      "food calories",
    ],
    toBase: (kcal) => kcal * 4184,
    fromBase: (j) => j / 4184,
    symbol: "kcal",
    type: "energy",
  },
  {
    name: "British Thermal Units",
    aliases: ["btu", "btus", "british thermal unit", "british thermal units"],
    toBase: (btu) => btu * 1055.06,
    fromBase: (j) => j / 1055.06,
    symbol: "BTU",
    type: "energy",
  },
  {
    name: "Kilowatt-hours",
    aliases: [
      "kilowatt hour",
      "kilowatt hours",
      "kwh",
      "kw-h",
      "kilowatt-hour",
      "kilowatt-hours",
    ],
    toBase: (kwh) => kwh * 3600000,
    fromBase: (j) => j / 3600000,
    symbol: "kWh",
    type: "energy",
  },
  {
    name: "Watt-hours",
    aliases: [
      "watt hour",
      "watt hours",
      "wh",
      "w-h",
      "watt-hour",
      "watt-hours",
    ],
    toBase: (wh) => wh * 3600,
    fromBase: (j) => j / 3600,
    symbol: "Wh",
    type: "energy",
  },
  {
    name: "Electron Volts",
    aliases: [
      "electron volt",
      "electron volts",
      "ev",
      "electronvolt",
      "electronvolts",
    ],
    toBase: (ev) => ev * 1.602176634e-19,
    fromBase: (j) => j / 1.602176634e-19,
    symbol: "eV",
    type: "energy",
  },
  {
    name: "Foot-pounds",
    aliases: ["foot pound", "foot pounds", "ft-lb", "ftlb", "ft·lb"],
    toBase: (ftlb) => ftlb * 1.35582,
    fromBase: (j) => j / 1.35582,
    symbol: "ft·lb",
    type: "energy",
  },
  {
    name: "Therms",
    aliases: ["therm", "therms"],
    toBase: (therm) => therm * 105505600,
    fromBase: (j) => j / 105505600,
    symbol: "thm",
    type: "energy",
  },
  {
    name: "Ergs",
    aliases: ["erg", "ergs"],
    toBase: (erg) => erg * 1e-7,
    fromBase: (j) => j / 1e-7,
    symbol: "erg",
    type: "energy",
  },
];

// Number base conversion interface
export interface NumberBase {
  name: string;
  aliases: string[];
  base: number;
  symbol: string;
  type: "number";
}

export const numberBases: NumberBase[] = [
  {
    name: "Binary",
    aliases: ["binary", "bin", "base2", "b2", "b"],
    base: 2,
    symbol: "₂",
    type: "number",
  },
  {
    name: "Octal",
    aliases: ["octal", "oct", "base8", "b8"],
    base: 8,
    symbol: "₈",
    type: "number",
  },
  {
    name: "Decimal",
    aliases: ["decimal", "dec", "denary", "base10", "b10"],
    base: 10,
    symbol: "₁₀",
    type: "number",
  },
  {
    name: "Hexadecimal",
    aliases: ["hexadecimal", "hex", "base16", "b16"],
    base: 16,
    symbol: "₁₆",
    type: "number",
  },
];

export function normalizeUnit(unit: string): string {
  return unit.toLowerCase().replace(/[°"']/g, "").trim();
}

export function findUnit(unitStr: string): ConversionUnit | NumberBase | null {
  const normalized = normalizeUnit(unitStr);

  // First check regular conversion units
  const unit = conversionUnits.find((unit) =>
    unit.aliases.some((alias) => normalizeUnit(alias) === normalized)
  );

  if (unit) return unit;

  // Then check number bases
  const base = numberBases.find((base) =>
    base.aliases.some((alias) => normalizeUnit(alias) === normalized)
  );

  return base || null;
}

export function parseConversionInput(args: string[]): {
  value: number | string;
  fromUnit: string;
  toUnit: string;
  isNumberBase?: boolean;
} | null {
  // Handle both "convert 1 lb kg" and "convert 1lb kg" formats
  if (args.length < 2) return null;

  let valueStr: string;
  let fromUnit: string;
  let toUnit: string;

  if (args.length >= 3) {
    // Standard format: "convert 1 lb kg"
    const arg0 = args[0];
    const arg1 = args[1];
    const arg2 = args[2];

    if (!arg0 || !arg1 || !arg2) return null;

    valueStr = arg0;
    fromUnit = arg1;
    toUnit = arg2;
  } else if (args.length === 2) {
    // Compact format: "convert 1lb kg" - need to split first arg
    const firstArg = args[0];
    const secondArg = args[1];

    if (!firstArg || !secondArg) return null;

    // Try to extract value and unit from first argument
    const match = firstArg.match(
      /^([+-]?(?:\d*\.?\d+(?:[eE][+-]?\d+)?|[0-9A-Fa-f]+))([a-zA-Z°'"]+)$/
    );
    if (match && match[1] && match[2]) {
      valueStr = match[1];
      fromUnit = match[2];
      toUnit = secondArg;
    } else {
      return null;
    }
  } else {
    return null;
  }

  if (!valueStr || !fromUnit || !toUnit) return null;

  // Check if this is a number base conversion
  const fromBase = findNumberBase(fromUnit);
  const toBase = findNumberBase(toUnit);

  if (fromBase && toBase) {
    // For number base conversion, keep value as string
    if (!isValidNumberForBase(valueStr, fromBase.base)) {
      throw new Error(`"${valueStr}" is not a valid ${fromBase.name} number`);
    }
    return { value: valueStr, fromUnit, toUnit, isNumberBase: true };
  }

  // For regular conversions, parse as number
  const value = parseFloat(valueStr);
  if (isNaN(value)) return null;

  return { value, fromUnit, toUnit, isNumberBase: false };
}

export function convertValue(
  value: number | string,
  fromUnit: ConversionUnit | NumberBase,
  toUnit: ConversionUnit | NumberBase
): number | string {
  // Handle number base conversions
  if (fromUnit.type === "number" && toUnit.type === "number") {
    const fromBase = fromUnit as NumberBase;
    const toBase = toUnit as NumberBase;
    return convertNumberBase(value as string, fromBase.base, toBase.base);
  }

  // Handle regular unit conversions
  if (fromUnit.type !== "number" && toUnit.type !== "number") {
    const from = fromUnit as ConversionUnit;
    const to = toUnit as ConversionUnit;

    if (from.type !== to.type) {
      throw new Error(`Cannot convert between ${from.type} and ${to.type}`);
    }

    const numValue = value as number;
    const baseValue = from.toBase(numValue);

    // Validate absolute zero for temperature
    if (from.type === "temperature" && baseValue < 0) {
      throw new Error(
        "Temperature cannot be below absolute zero (0 K / -273.15°C / -459.67°F)"
      );
    }

    return to.fromBase(baseValue);
  }

  throw new Error("Cannot convert between number bases and physical units");
}

export function formatResult(
  value: number | string,
  options?: { scientific?: boolean }
): string {
  // Handle string results (number base conversions)
  if (typeof value === "string") {
    return value;
  }

  // Handle scientific notation
  if (options?.scientific) {
    return formatScientificNotation(value);
  }

  // Dynamic precision based on magnitude
  const absValue = Math.abs(value);
  let precision: number;

  if (absValue >= 1000) {
    precision = 2;
  } else if (absValue >= 1) {
    precision = 4;
  } else if (absValue >= 0.001) {
    precision = 6;
  } else {
    precision = 8;
  }

  return value.toFixed(precision).replace(/\.?0+$/, "");
}

export function getAvailableUnits(): string {
  const groupedUnits: Record<string, string[]> = {};

  // Add regular conversion units
  conversionUnits.forEach((unit) => {
    if (!groupedUnits[unit.type]) {
      groupedUnits[unit.type] = [];
    }
    groupedUnits[unit.type]!.push(
      `${unit.name} (${unit.aliases.slice(0, 3).join(", ")})`
    );
  });

  // Add number bases
  groupedUnits["number"] = numberBases.map(
    (base) => `${base.name} (${base.aliases.slice(0, 3).join(", ")})`
  );

  return Object.entries(groupedUnits)
    .map(
      ([type, units]) =>
        `**${type.charAt(0).toUpperCase() + type.slice(1)}:**\n${units.join(
          "\n"
        )}`
    )
    .join("\n\n");
}

// Number base conversion functions
export function convertNumberBase(
  value: string,
  fromBase: number,
  toBase: number
): string {
  // Validate input for the source base
  if (!isValidNumberForBase(value, fromBase)) {
    throw new Error(`Invalid number "${value}" for base ${fromBase}`);
  }

  // Convert from any base to decimal first
  const decimalValue = parseInt(value, fromBase);
  if (isNaN(decimalValue)) {
    throw new Error(`Invalid number "${value}" for base ${fromBase}`);
  }

  // Convert from decimal to target base
  return decimalValue.toString(toBase).toUpperCase();
}

export function findNumberBase(baseStr: string): NumberBase | null {
  const normalized = normalizeUnit(baseStr);
  return (
    numberBases.find((base) =>
      base.aliases.some((alias) => normalizeUnit(alias) === normalized)
    ) || null
  );
}

export function isValidNumberForBase(value: string, base: number): boolean {
  // Remove any prefix indicators like 0x, 0b, etc.
  const cleanValue = value.replace(/^0[xbo]/i, "");

  const validChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".slice(0, base);
  return cleanValue
    .split("")
    .every((char) => validChars.includes(char.toUpperCase()));
}

// Scientific notation formatting
export function formatScientificNotation(
  value: number,
  precision: number = 3
): string {
  return value.toExponential(precision);
}

export function parseScientificNotation(value: string): number {
  const parsed = parseFloat(value);
  if (isNaN(parsed)) {
    throw new Error(`Invalid scientific notation: ${value}`);
  }
  return parsed;
}
