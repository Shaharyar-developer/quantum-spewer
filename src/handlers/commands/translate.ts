import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { type TextCommand } from "../../types/textCommand";

interface TranslationResponse {
  translatedText: string;
  detectedLanguage: {
    language: string;
    confidence: number;
  };
  alternatives?: string[];
}

// Google Translate API response type
type GoogleTranslateResponse = [
  [[string, string, null, null, number, null, null, any[], any[]][]],
  null,
  string,
  null,
  null,
  null,
  number,
  any[],
  [string[], null, number[], string[]][]
];

// Fallback translation using a simple mock for when LibreTranslate is down
async function fallbackTranslate(text: string): Promise<TranslationResponse> {
  return {
    translatedText: `[Fallback] Unable to translate: "${text}" - LibreTranslate service unavailable`,
    detectedLanguage: {
      language: "unknown",
      confidence: 0,
    },
    alternatives: [],
  };
}

async function translateText(
  text: string,
  targetLang: string = "en"
): Promise<TranslationResponse> {
  // Clean the text - remove extra whitespace and trim
  const cleanText = text.trim().replace(/\s+/g, " ");

  // Validate input length
  if (cleanText.length === 0) {
    throw new Error("Text to translate cannot be empty");
  }

  if (cleanText.length > 5000) {
    throw new Error("Text is too long to translate (max 5000 characters)");
  }

  // Encode the text for URL
  const encodedText = encodeURIComponent(cleanText);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodedText}`;

  console.log(`[translate] Request URL:`, url);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    console.log(
      `[translate] Response status: ${response.status} ${response.statusText}`
    );

    if (!response.ok) {
      let errorMessage = `Translation API error: ${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.text();
        console.log(`[translate] Error response body:`, errorBody);

        // Handle specific error cases
        if (response.status === 400) {
          errorMessage =
            "Invalid request - the text might contain unsupported characters or be too long";
        } else if (response.status === 429) {
          errorMessage = "Rate limit exceeded - too many translation requests";
        } else if (response.status === 503) {
          errorMessage = "Translation service temporarily unavailable";
        }

        errorMessage += ` (${errorBody})`;
      } catch (e) {
        console.log(`[translate] Could not read error response body`);
      }
      throw new Error(errorMessage);
    }

    const googleResult = (await response.json()) as GoogleTranslateResponse;
    console.log(
      `[translate] Google API response:`,
      JSON.stringify(googleResult, null, 2)
    );

    // Parse Google Translate response
    const firstTranslation = googleResult[0]?.[0];
    const translatedText =
      Array.isArray(firstTranslation) && typeof firstTranslation[0] === "string"
        ? firstTranslation[0]
        : "Translation failed";
    const originalText =
      Array.isArray(firstTranslation) && typeof firstTranslation[1] === "string"
        ? firstTranslation[1]
        : cleanText;
    const detectedLanguage = googleResult[2] || "unknown";
    const confidence = (googleResult[6] || 0) * 100; // Convert to percentage

    // Extract alternatives if available
    const alternatives: string[] = [];
    if (googleResult[0] && googleResult[0].length > 1) {
      for (let i = 1; i < Math.min(googleResult[0].length, 4); i++) {
        const alternative = googleResult[0][i];
        if (
          alternative &&
          Array.isArray(alternative) &&
          alternative[0] &&
          typeof alternative[0] === "string"
        ) {
          alternatives.push(alternative[0]);
        }
      }
    }

    const result: TranslationResponse = {
      translatedText,
      detectedLanguage: {
        language: detectedLanguage,
        confidence: Math.round(confidence),
      },
      alternatives: alternatives.length > 0 ? alternatives : undefined,
    };

    console.log(`[translate] Parsed result:`, JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error(`[translate] Primary translation failed:`, error);

    // For network errors or service unavailable, try to provide a helpful message
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Unable to connect to translation service - please check your internet connection"
      );
    }

    // Re-throw other errors
    throw error;
  }
}

export default {
  name: "translate",
  description:
    "Translate text from any language to English (or other languages). Usage: !translate <text> or !translate <target_lang> <text>. Examples: !translate Hola mundo, !translate fr Hello world",
  aliases: ["tr"],
  async execute(message, args) {
    console.log(
      `[translate] Command executed by user ${message.author.id} (${message.author.username}) with args:`,
      args
    );

    if (args.length === 0) {
      await message.reply(
        "Please provide text to translate. Usage: `!translate <text>` or `!translate <target_lang> <text>`"
      );
      return;
    }

    // Check if first argument is a language code
    const possibleLangCode = args[0]?.toLowerCase() || "";
    const languageCodes = [
      "en",
      "es",
      "fr",
      "de",
      "it",
      "pt",
      "ru",
      "ja",
      "ko",
      "zh",
      "ar",
      "hi",
      "tr",
      "pl",
      "nl",
      "sv",
      "da",
      "no",
      "fi",
      "cs",
      "sk",
      "hu",
      "ro",
      "bg",
      "hr",
      "sl",
      "et",
      "lv",
      "lt",
      "mt",
      "cy",
      "ga",
      "eu",
      "ca",
      "gl",
      "fa",
      "he",
      "th",
      "vi",
      "id",
      "ms",
      "tl",
      "sw",
      "am",
      "my",
      "km",
      "lo",
      "si",
      "ne",
      "bn",
      "ur",
      "pa",
      "gu",
      "ta",
      "te",
      "kn",
      "ml",
      "or",
      "as",
      "mr",
      "sd",
      "ks",
      "dv",
      "bo",
      "ug",
      "kk",
      "ky",
      "tg",
      "tk",
      "uz",
      "mn",
      "ka",
      "hy",
      "az",
      "be",
      "uk",
      "mk",
      "sq",
      "bs",
      "sr",
      "me",
      "is",
      "fo",
      "br",
      "gd",
      "co",
      "eo",
      "la",
      "jw",
      "su",
      "mg",
      "ny",
      "sn",
      "yo",
      "zu",
      "af",
      "xh",
      "st",
      "nso",
      "tn",
      "ss",
      "ve",
      "ts",
      "nr",
    ];

    let targetLang = "en";
    let textToTranslate: string;

    if (languageCodes.includes(possibleLangCode) && args.length > 1) {
      targetLang = possibleLangCode;
      textToTranslate = args.slice(1).join(" ");
    } else {
      textToTranslate = args.join(" ");
    }
    console.log(
      `[translate] Text to translate: "${textToTranslate}", Target language: ${targetLang}`
    );

    try {
      const result = await translateText(textToTranslate, targetLang);
      console.log(`[translate] Translation result:`, result);

      // Get language name from code
      const languageNames: { [key: string]: string } = {
        en: "English",
        es: "Spanish",
        fr: "French",
        de: "German",
        it: "Italian",
        pt: "Portuguese",
        ru: "Russian",
        ja: "Japanese",
        ko: "Korean",
        zh: "Chinese",
        ar: "Arabic",
        hi: "Hindi",
        tr: "Turkish",
        pl: "Polish",
        nl: "Dutch",
        sv: "Swedish",
        da: "Danish",
        no: "Norwegian",
        fi: "Finnish",
        cs: "Czech",
        sk: "Slovak",
        hu: "Hungarian",
        ro: "Romanian",
        bg: "Bulgarian",
        hr: "Croatian",
        sl: "Slovenian",
        et: "Estonian",
        lv: "Latvian",
        lt: "Lithuanian",
        mt: "Maltese",
        cy: "Welsh",
        ga: "Irish",
        eu: "Basque",
        ca: "Catalan",
        gl: "Galician",
        fa: "Persian",
        he: "Hebrew",
        th: "Thai",
        vi: "Vietnamese",
        id: "Indonesian",
        ms: "Malay",
        tl: "Filipino",
        sw: "Swahili",
        am: "Amharic",
        my: "Myanmar",
        km: "Khmer",
        lo: "Lao",
        si: "Sinhala",
        ne: "Nepali",
        bn: "Bengali",
        ur: "Urdu",
        pa: "Punjabi",
        gu: "Gujarati",
        ta: "Tamil",
        te: "Telugu",
        kn: "Kannada",
        ml: "Malayalam",
        or: "Odia",
        as: "Assamese",
        mr: "Marathi",
        sd: "Sindhi",
        ks: "Kashmiri",
        dv: "Dhivehi",
        bo: "Tibetan",
        ug: "Uyghur",
        kk: "Kazakh",
        ky: "Kyrgyz",
        tg: "Tajik",
        tk: "Turkmen",
        uz: "Uzbek",
        mn: "Mongolian",
        ka: "Georgian",
        hy: "Armenian",
        az: "Azerbaijani",
        be: "Belarusian",
        uk: "Ukrainian",
        mk: "Macedonian",
        sq: "Albanian",
        bs: "Bosnian",
        sr: "Serbian",
        me: "Montenegrin",
        is: "Icelandic",
        fo: "Faroese",
        br: "Breton",
        gd: "Scottish Gaelic",
        co: "Corsican",
        eo: "Esperanto",
        la: "Latin",
        jw: "Javanese",
        su: "Sundanese",
        mg: "Malagasy",
        ny: "Chichewa",
        sn: "Shona",
        yo: "Yoruba",
        zu: "Zulu",
        af: "Afrikaans",
        xh: "Xhosa",
        st: "Sesotho",
        nso: "Northern Sotho",
        tn: "Tswana",
        ss: "Swati",
        ve: "Venda",
        ts: "Tsonga",
        nr: "Southern Ndebele",
        auto: "Auto-detected",
      };

      const detectedLangName =
        languageNames[result.detectedLanguage.language] ||
        result.detectedLanguage.language.toUpperCase();
      const targetLangName =
        languageNames[targetLang] || targetLang.toUpperCase();
      const confidence = result.detectedLanguage.confidence;

      const embed = new EmbedBuilder()
        .setTitle("Translation")
        .setColor("#4285f4")
        .addFields([
          {
            name: "Original",
            value: `${textToTranslate}`,
            inline: false,
          },
          {
            name: "Translation",
            value: `**${result.translatedText}**`,
            inline: false,
          },
          {
            name: "Language Detected",
            value: `${detectedLangName}\n${confidence}% confidence`,
            inline: true,
          },
          {
            name: "Target Language",
            value: targetLangName,
            inline: true,
          },
        ])
        .setTimestamp()
        .setFooter({ text: "Google Translate" });

      // Add alternatives if available
      if (result.alternatives && result.alternatives.length > 0) {
        const alternativeText = result.alternatives
          .slice(0, 3)
          .map((alt) => `• ${alt}`)
          .join("\n");

        embed.addFields([
          {
            name: "Alternative Translations",
            value: alternativeText,
            inline: false,
          },
        ]);
      }

      if (message.channel && "send" in message.channel) {
        await message.channel.send({ embeds: [embed] });
        console.log(
          `[translate] Successfully sent translation result to channel ${message.channel.id}`
        );
      }
    } catch (error) {
      console.error(`[translate] Error translating text:`, error);

      let errorTitle = "Translation Error";
      let errorDescription = "Sorry, I couldn't translate that text.";
      let errorDetails = "Unknown error occurred";

      if (error instanceof Error) {
        errorDetails = error.message;

        // Provide more user-friendly error messages
        if (error.message.includes("400")) {
          errorTitle = "Invalid Text";
          errorDescription =
            "The text you provided couldn't be processed. Try checking for special characters or reducing the length.";
        } else if (error.message.includes("429")) {
          errorTitle = "Too Many Requests";
          errorDescription =
            "I'm receiving too many translation requests right now. Please wait a moment and try again.";
        } else if (
          error.message.includes("503") ||
          error.message.includes("unavailable")
        ) {
          errorTitle = "Service Unavailable";
          errorDescription =
            "The translation service is temporarily down. Please try again in a few minutes.";
        } else if (
          error.message.includes("internet connection") ||
          error.message.includes("fetch")
        ) {
          errorTitle = "Connection Error";
          errorDescription =
            "I can't connect to the translation service right now. Please check your connection and try again.";
        } else if (error.message.includes("too long")) {
          errorTitle = "Text Too Long";
          errorDescription =
            "The text you want to translate is too long. Please try with shorter text (max 5000 characters).";
        } else if (error.message.includes("empty")) {
          errorTitle = "Empty Text";
          errorDescription = "Please provide some text to translate.";
        }
      }

      const errorEmbed = new EmbedBuilder()
        .setTitle(errorTitle)
        .setDescription(errorDescription)
        .setColor("#dc3545")
        .addFields([
          {
            name: "Error Details",
            value: `\`${errorDetails}\``,
            inline: false,
          },
          {
            name: "\u200b", // Empty field for spacing
            value: "\u200b",
            inline: false,
          },
          {
            name: "Suggestions",
            value:
              "• Try with shorter text\n• Check for special characters\n• Wait a moment and try again\n• Make sure the text is in a supported language",
            inline: false,
          },
        ])
        .setTimestamp();

      if (message.channel && "send" in message.channel) {
        await message.channel.send({ embeds: [errorEmbed] });
      }
    }
  },
} as TextCommand;
