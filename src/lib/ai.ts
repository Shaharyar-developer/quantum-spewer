import { GoogleGenAI } from "@google/genai";
import { aiTaskQueue } from "./ai-queue";
import { Message } from "discord.js";
import type { WordInfoResponse, WordMorphologyResponse } from "../types/ai";

class AI {
  private client: GoogleGenAI;
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

  // Public method to generate content (used by queue)
  public async generateContent(
    systemPrompt: string,
    prompt: string,
    schema?: object
  ): Promise<string> {
    const config: any = {
      systemInstruction: systemPrompt,
    };

    if (schema) {
      config.responseMimeType = "application/json";
      config.responseSchema = schema;
    }

    const response = await this.client.models.generateContent({
      model: "gemini-2.5-pro",
      config,
      contents: [{ text: prompt }],
    });

    if (response.text) {
      return response.text;
    } else {
      throw new Error("No text returned from AI response");
    }
  }

  // Public methods that use the queue system
  public async generateQuantumPhysicsFact(
    discordMessage?: Message,
    authorUsername?: string,
    authorAvatarURL?: string
  ): Promise<string> {
    return aiTaskQueue.addTask(
      "quantum-fact",
      {},
      1,
      3,
      discordMessage,
      authorUsername,
      authorAvatarURL
    );
  }

  public async generateWordInfo(
    word: string,
    discordMessage?: Message,
    authorUsername?: string,
    authorAvatarURL?: string
  ): Promise<WordInfoResponse | string> {
    return aiTaskQueue.addTask(
      "word-info",
      { word },
      0,
      3,
      discordMessage,
      authorUsername,
      authorAvatarURL
    );
  }

  public async generateWordMorphology(
    word: string,
    discordMessage?: Message,
    authorUsername?: string,
    authorAvatarURL?: string
  ): Promise<WordMorphologyResponse | string> {
    return aiTaskQueue.addTask(
      "word-morphology",
      { word },
      0,
      3,
      discordMessage,
      authorUsername,
      authorAvatarURL
    );
  }

  public async generateMelancholicWhimsy(
    text: string,
    discordMessage?: Message,
    authorUsername?: string,
    authorAvatarURL?: string
  ): Promise<string> {
    return aiTaskQueue.addTask(
      "melancholic-whimsy",
      { topic: text },
      0,
      3,
      discordMessage,
      authorUsername,
      authorAvatarURL
    );
  }

  // Generic method to add new AI tasks dynamically
  public async addAITask(
    type: string,
    payload: any,
    priority: number = 0,
    maxRetries: number = 3,
    discordMessage?: Message,
    authorUsername?: string,
    authorAvatarURL?: string
  ): Promise<any> {
    return aiTaskQueue.addTask(
      type,
      payload,
      priority,
      maxRetries,
      discordMessage,
      authorUsername,
      authorAvatarURL
    );
  }

  // Queue management methods
  public getQueueStatus() {
    return aiTaskQueue.getQueueStatus();
  }

  public clearQueue() {
    aiTaskQueue.clearQueue();
  }

  public removeTaskFromQueue(taskId: string) {
    return aiTaskQueue.removeTask(taskId);
  }
}

export default AI.getInstance();
