import { Type } from "@google/genai";
import { z } from "zod";

export const WordInfoResponseSchema = {
  type: Type.OBJECT,
  properties: {
    word: {
      type: Type.STRING,
    },
    definitions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          definition: {
            type: Type.STRING,
          },
          partOfSpeech: {
            type: Type.STRING,
          },
          pronunciation: {
            type: Type.STRING,
          },
          synonyms: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
          },
          antonyms: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
          },
          examples: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
          },
          etymology: {
            type: Type.STRING,
          },
        },
        required: ["definition", "partOfSpeech"], // Core required fields
      },
    },
  },
  required: ["word", "definitions"], // Top-level required fields
  propertyOrdering: ["word", "definitions"],
};

// Dynamically create Zod schema from GenAI schema
export const WordInfoResponseZodSchema = z.object({
  word: z.string(),
  definitions: z.array(
    z.object({
      definition: z.string(),
      partOfSpeech: z.string(),
      pronunciation: z.string().optional(),
      synonyms: z.array(z.string()).optional(),
      antonyms: z.array(z.string()).optional(),
      examples: z.array(z.string()).optional(),
      etymology: z.string().optional(),
    })
  ),
});

// TypeScript inferred type
export type WordInfoResponse = z.infer<typeof WordInfoResponseZodSchema>;
