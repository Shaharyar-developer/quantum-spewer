import { Message, TextChannel, EmbedBuilder } from "discord.js";
import { type TextCommand } from "../../types/textCommand";

interface CurrencyResponse {
  date: string;
  [key: string]: string | Record<string, number>;
}

interface CurrencyListResponse {
  [key: string]: string;
}

// Cache for currency list to avoid repeated API calls
let currencyListCache: CurrencyListResponse | null = null;
let cacheExpiry: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const API_CONFIG = {
  primary: "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1",
  fallback: "https://latest.currency-api.pages.dev/v1",
  timeout: 10000, // 10 seconds
};

const COLORS = {
  success: 0x89b4fa,
  error: 0xf38ba8,
  warning: 0xfab387,
} as const;

const POPULAR_CURRENCIES = [
  "usd",
  "eur",
  "gbp",
  "jpy",
  "cad",
  "aud",
  "chf",
  "cny",
  "inr",
  "btc",
  "eth",
  "ltc",
  "xrp",
] as const;

class CurrencyError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "CurrencyError";
  }
}

const currencyCommand: TextCommand = {
  name: "currency",
  description:
    "Get currency exchange rates. Usage: currency! <from> <to> [amount] or currency! list",
  aliases: ["currency", "exchange", "rate"],
  cooldown: 5,
  execute: async (message: Message, args: string[]) => {
    await safeDelete(message);

    try {
      if (args.length === 0) {
        await sendHelpEmbed(message);
        return;
      }

      if (args[0]?.toLowerCase() === "list") {
        await handleCurrencyList(message);
        return;
      }

      await handleCurrencyConversion(message, args);
    } catch (error) {
      console.error("Currency command error:", error);
      await sendErrorEmbed(
        message,
        "An unexpected error occurred. Please try again later."
      );
    }
  },
};

async function safeDelete(message: Message): Promise<void> {
  try {
    await message.delete();
  } catch (error) {
    // Ignore deletion errors (message might already be deleted, bot lacks permissions, etc.)
  }
}

async function sendToChannel(
  message: Message,
  embed: EmbedBuilder
): Promise<void> {
  if ("send" in message.channel && typeof message.channel.send === "function") {
    await (message.channel as TextChannel).send({ embeds: [embed] });
  }
}

async function sendHelpEmbed(message: Message): Promise<void> {
  const embed = new EmbedBuilder()
    .setTitle("💱 Currency Exchange Help")
    .setDescription(
      "**Usage:**\n" +
        "`currency! <from> <to> [amount]` - Convert currency\n" +
        "`currency! list` - Show available currencies\n\n" +
        "**Examples:**\n" +
        "`currency! usd eur` - USD to EUR (1 unit)\n" +
        "`currency! usd eur 100` - Convert 100 USD to EUR\n" +
        "`currency! btc usd` - Bitcoin to USD\n" +
        "`currency! eth btc 2.5` - Convert 2.5 ETH to BTC"
    )
    .setColor(COLORS.success)
    .setTimestamp()
    .setFooter({
      text: "Supports 200+ currencies including cryptocurrencies & metals",
    });

  await sendToChannel(message, embed);
}

async function sendErrorEmbed(
  message: Message,
  description: string,
  title = "❌ Error"
): Promise<void> {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(COLORS.error)
    .setTimestamp();

  await sendToChannel(message, embed);
}

async function handleCurrencyList(message: Message): Promise<void> {
  try {
    const currencies = await getCurrencyList();
    const popularList = POPULAR_CURRENCIES.filter((code) => currencies[code])
      .map((code) => `**${code.toUpperCase()}** - ${currencies[code]}`)
      .join("\n");

    const totalCount = Object.keys(currencies).length;

    const embed = new EmbedBuilder()
      .setTitle("💱 Available Currencies")
      .setDescription(
        `**Popular Currencies:**\n${popularList}\n\n` +
          `**Total Available:** ${totalCount} currencies\n\n` +
          `Use \`currency! <from> <to> [amount]\` to convert between any supported currencies.`
      )
      .setColor(COLORS.success)
      .setTimestamp()
      .setFooter({
        text: "Data cached for 24 hours • Includes cryptocurrencies & metals",
      });

    await sendToChannel(message, embed);
  } catch (error) {
    console.error("Error fetching currency list:", error);
    await sendErrorEmbed(
      message,
      "Failed to fetch the currency list. Please try again later.",
      "❌ Currency List Error"
    );
  }
}

async function handleCurrencyConversion(
  message: Message,
  args: string[]
): Promise<void> {
  if (args.length < 2) {
    await sendErrorEmbed(
      message,
      "Please provide both FROM and TO currencies.\nExample: `currency! usd eur 100`",
      "❌ Invalid Usage"
    );
    return;
  }

  const fromCurrency = args[0]!.toLowerCase();
  const toCurrency = args[1]!.toLowerCase();
  const amount = args[2] ? parseFloat(args[2]) : 1;

  if (isNaN(amount) || amount <= 0) {
    await sendErrorEmbed(
      message,
      "Please provide a valid positive number for the amount.",
      "❌ Invalid Amount"
    );
    return;
  }

  try {
    const exchangeRate = await getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = amount * exchangeRate;

    // Format numbers nicely
    const formattedAmount = formatCurrency(amount);
    const formattedConverted = formatCurrency(convertedAmount);
    const formattedRate = formatCurrency(exchangeRate);

    const embed = new EmbedBuilder()
      .setTitle("💱 Currency Exchange")
      .setDescription(
        `**${formattedAmount} ${fromCurrency.toUpperCase()}** = **${formattedConverted} ${toCurrency.toUpperCase()}**\n\n` +
          `📈 Exchange Rate: 1 ${fromCurrency.toUpperCase()} = ${formattedRate} ${toCurrency.toUpperCase()}`
      )
      .setColor(COLORS.success)
      .setTimestamp()
      .setFooter({
        text: `Requested by ${message.author.username} • Data updated daily`,
        iconURL: message.author.displayAvatarURL(),
      });

    await sendToChannel(message, embed);
  } catch (error) {
    if (error instanceof CurrencyError) {
      if (error.code === "CURRENCY_NOT_FOUND") {
        await sendErrorEmbed(
          message,
          `One or both currencies (${fromCurrency.toUpperCase()}, ${toCurrency.toUpperCase()}) are not supported.\nUse \`currency! list\` to see available currencies.`,
          "❌ Currency Not Found"
        );
      } else {
        await sendErrorEmbed(message, error.message);
      }
    } else {
      console.error("Currency conversion error:", error);
      await sendErrorEmbed(
        message,
        "Failed to fetch exchange rates. Please try again later.",
        "❌ Exchange Rate Error"
      );
    }
  }
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(2) + "M";
  } else if (value >= 1000) {
    return (value / 1000).toFixed(2) + "K";
  } else if (value >= 1) {
    return value.toFixed(2);
  } else if (value >= 0.01) {
    return value.toFixed(4);
  } else {
    return value.toFixed(8);
  }
}

async function fetchWithFallback(endpoint: string): Promise<Response> {
  const primaryUrl = `${API_CONFIG.primary}/${endpoint}`;
  const fallbackUrl = `${API_CONFIG.fallback}/${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  try {
    // Try primary URL first
    let response = await fetch(primaryUrl, { signal: controller.signal });

    if (!response.ok) {
      // If primary fails, try fallback
      response = await fetch(fallbackUrl, { signal: controller.signal });
    }

    if (!response.ok) {
      throw new CurrencyError(
        `API request failed with status ${response.status}`,
        "API_ERROR"
      );
    }

    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new CurrencyError("Request timed out", "TIMEOUT");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getCurrencyList(): Promise<CurrencyListResponse> {
  const now = Date.now();

  // Return cached data if still valid
  if (currencyListCache && now < cacheExpiry) {
    return currencyListCache;
  }

  const response = await fetchWithFallback("currencies.json");
  const data = (await response.json()) as CurrencyListResponse;

  // Validate response structure
  if (!data || typeof data !== "object") {
    throw new CurrencyError(
      "Invalid currency list response",
      "INVALID_RESPONSE"
    );
  }

  // Update cache
  currencyListCache = data;
  cacheExpiry = now + CACHE_DURATION;

  return data;
}

async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  const response = await fetchWithFallback(`currencies/${fromCurrency}.json`);
  const data = (await response.json()) as CurrencyResponse;

  // Validate response structure
  if (!data || typeof data !== "object") {
    throw new CurrencyError(
      "Invalid exchange rate response",
      "INVALID_RESPONSE"
    );
  }

  const rates = data[fromCurrency];

  if (!rates || typeof rates !== "object") {
    throw new CurrencyError(
      `Currency ${fromCurrency.toUpperCase()} not found`,
      "CURRENCY_NOT_FOUND"
    );
  }

  const rate = rates[toCurrency];

  if (typeof rate !== "number") {
    throw new CurrencyError(
      `Exchange rate for ${fromCurrency.toUpperCase()} to ${toCurrency.toUpperCase()} not found`,
      "CURRENCY_NOT_FOUND"
    );
  }

  return rate;
}

export default currencyCommand;
