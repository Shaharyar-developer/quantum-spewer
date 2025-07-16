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

// Schema for morphological breakdown
export const WordMorphologyResponseSchema = {
  type: Type.OBJECT,
  properties: {
    word: {
      type: Type.STRING,
    },
    breakdown: {
      type: Type.OBJECT,
      properties: {
        prefixes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              morpheme: {
                type: Type.STRING,
              },
              meaning: {
                type: Type.STRING,
              },
              synonyms: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
              },
              origin: {
                type: Type.STRING,
              },
            },
            required: ["morpheme", "meaning"],
          },
        },
        root: {
          type: Type.OBJECT,
          properties: {
            morpheme: {
              type: Type.STRING,
            },
            meaning: {
              type: Type.STRING,
            },
            synonyms: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
            },
            origin: {
              type: Type.STRING,
            },
          },
          required: ["morpheme", "meaning"],
        },
        suffixes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              morpheme: {
                type: Type.STRING,
              },
              meaning: {
                type: Type.STRING,
              },
              synonyms: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
              },
              origin: {
                type: Type.STRING,
              },
            },
            required: ["morpheme", "meaning"],
          },
        },
      },
      required: ["root"],
    },
    derivedMeaning: {
      type: Type.STRING,
    },
  },
  required: ["word", "breakdown", "derivedMeaning"],
  propertyOrdering: ["word", "breakdown", "derivedMeaning"],
};

// Zod schema for morphological breakdown
export const WordMorphologyResponseZodSchema = z.object({
  word: z.string(),
  breakdown: z.object({
    prefixes: z.array(
      z.object({
        morpheme: z.string(),
        meaning: z.string(),
        synonyms: z.array(z.string()).optional(),
        origin: z.string().optional(),
      })
    ).optional(),
    root: z.object({
      morpheme: z.string(),
      meaning: z.string(),
      synonyms: z.array(z.string()).optional(),
      origin: z.string().optional(),
    }),
    suffixes: z.array(
      z.object({
        morpheme: z.string(),
        meaning: z.string(),
        synonyms: z.array(z.string()).optional(),
        origin: z.string().optional(),
      })
    ).optional(),
  }),
  derivedMeaning: z.string(),
});

// TypeScript inferred type for morphological breakdown
export type WordMorphologyResponse = z.infer<typeof WordMorphologyResponseZodSchema>;
