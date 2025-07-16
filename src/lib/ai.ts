import { GoogleGenAI } from "@google/genai";
import db from "../db";
import { insertTimestamp } from "./utils";
import { AI_GEN_COOLDOWN } from "./constants";
import { WordInfoResponseSchema, WordInfoResponseZodSchema } from "../types/ai";
import type { WordInfoResponse } from "../types/ai";

class AI {
  private client: GoogleGenAI;
  private static key = "gemini" as const;
  private static instance: AI | null = null;

  private constructor() {
    this.client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  public static getInstance(): AI {
    if (!AI.instance) {
      AI.instance = new AI();
    }
    return AI.instance;
  }

  private async canGenerate(): Promise<boolean> {
    const currentTime = Date.now();
    const cooldownTime = AI_GEN_COOLDOWN;
    const cooldownEndTime = currentTime - cooldownTime;

    const recentTimestamps = await db.query.keyValTimestamps.findMany({
      where: (table, { and, eq, gte }) =>
        and(eq(table.key, AI.key), gte(table.timestamp, cooldownEndTime)),
    });

    return recentTimestamps.length === 0;
  }

  private async recordTimestamp() {
    const currentTime = Date.now();
    await insertTimestamp(AI.key, "true", currentTime);
  }

  private async generateContent(
    systemPrompt: string,
    prompt: string,
    schema?: object
  ): Promise<string> {
    if (!schema) {
      const response = await this.client.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          systemInstruction: systemPrompt,
        },
        contents: [
          {
            text: prompt,
          },
        ],
      });

      return response.text || "Huh... seems like google is having a bad day.";
    } else {
      const response = await this.client.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: schema,
        },
        contents: [
          {
            text: prompt,
          },
        ],
      });

      if (response.text) {
        return response.text;
      } else {
        throw new Error("No text returned from AI response");
      }
    }
  }

  public async generateQuantumPhysicsFact(): Promise<string> {
    console.log("AI: generateQuantumPhysicsFact called");
    try {
      // Check if we can generate content (rate limiting)
      console.log("AI: Checking rate limiting...");
      if (!(await this.canGenerate())) {
        console.log("AI: Rate limited, returning early");
        return "I'm taking a quantum break! Please wait a moment before asking for another fact.";
      }

      console.log("AI: Rate limit check passed, generating content...");

      const systemPrompt = `You are a physics researcher tasked with sharing lesser-known quantum facts. Avoid common knowledge. Be concise, specific, and unafraid to include facts that may be re-evaluated in the future.`;

      const prompt = `Generate a niche, lesser-known quantum physics fact. 
Prioritize obscure or speculative phenomena—things on the edge of current understanding, 
possibly debated or not widely known. Avoid generic summaries like superposition or wave-particle duality. 
Instead, give a fact that feels strange, specific, and possibly subject to change with future discoveries. 
Keep it concise, ideally one or two sentences.`;

      const fact = await this.generateContent(systemPrompt, prompt);
      console.log("AI: Content generated successfully");

      // Record timestamp only after successful generation
      await this.recordTimestamp();
      console.log("AI: Timestamp recorded");

      return fact;
    } catch (error) {
      console.error("Error generating quantum physics fact:", error);
      return "The quantum realm is experiencing some interference right now. Try again later!";
    }
  }
  public async generateWordInfo(
    word: string
  ): Promise<WordInfoResponse | string> {
    console.log("AI: generateWordInfo called for word:", word);
    try {
      // Check if we can generate content (rate limiting)
      console.log("AI: Checking rate limiting...");
      if (!(await this.canGenerate())) {
        console.log("AI: Rate limited, returning early");
        return "I'm taking a quantum break! Please wait a moment before asking for another word.";
      }

      console.log("AI: Rate limit check passed, generating content...");

      const systemPrompt = `You are a language expert providing detailed information about words.
Your task is to give comprehensive definitions, including parts of speech, pronunciation, synonyms, antonyms, examples, and etymology.
Be thorough and precise, ensuring the information is accurate and well-structured.`;

      const prompt = `Provide detailed information about the word "${word}".`;

      const wordInfo = await this.generateContent(
        systemPrompt,
        prompt,
        WordInfoResponseSchema
      );
      console.log("AI: Content generated successfully");

      // Record timestamp only after successful generation
      await this.recordTimestamp();
      console.log("AI: Timestamp recorded");

      const parsedInfo = JSON.parse(wordInfo);
      const zodSchema = WordInfoResponseZodSchema;
      const validationResult = zodSchema.safeParse(parsedInfo);
      if (!validationResult.success) {
        console.error(
          "Error validating word information:",
          validationResult.error
        );
        return "The quantum realm is experiencing some interference right now. Try again later!";
      }

      return validationResult.data;
    } catch (error) {
      console.error("Error generating word information:", error);
      return "The quantum realm is experiencing some interference right now. Try again later!";
    }
  }
}

export default AI.getInstance();
