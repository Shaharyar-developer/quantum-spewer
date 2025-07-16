import { Type } from "@google/genai";
import { z } from "zod";

// Generic interface for task validation
export interface TaskValidation<T> {
  genAiSchema: object;
  zodSchema: z.ZodSchema<T>;
  validator: (response: string) => T;
}

// Word Info schemas and validation
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
        required: ["definition", "partOfSpeech"],
      },
    },
  },
  required: ["word", "definitions"],
  propertyOrdering: ["word", "definitions"],
};

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

export type WordInfoResponse = z.infer<typeof WordInfoResponseZodSchema>;

// Word Morphology schemas and validation
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

export const WordMorphologyResponseZodSchema = z.object({
  word: z.string(),
  breakdown: z.object({
    prefixes: z
      .array(
        z.object({
          morpheme: z.string(),
          meaning: z.string(),
          synonyms: z.array(z.string()).optional(),
          origin: z.string().optional(),
        })
      )
      .optional(),
    root: z.object({
      morpheme: z.string(),
      meaning: z.string(),
      synonyms: z.array(z.string()).optional(),
      origin: z.string().optional(),
    }),
    suffixes: z
      .array(
        z.object({
          morpheme: z.string(),
          meaning: z.string(),
          synonyms: z.array(z.string()).optional(),
          origin: z.string().optional(),
        })
      )
      .optional(),
  }),
  derivedMeaning: z.string(),
});

export type WordMorphologyResponse = z.infer<typeof WordMorphologyResponseZodSchema>;

// Validation functions
export const validateWordInfo = (response: string): WordInfoResponse => {
  const parsedInfo = JSON.parse(response);
  const validationResult = WordInfoResponseZodSchema.safeParse(parsedInfo);
  if (!validationResult.success) {
    throw new Error("Invalid word information format");
  }
  return validationResult.data;
};

export const validateWordMorphology = (response: string): WordMorphologyResponse => {
  const parsedInfo = JSON.parse(response);
  const validationResult = WordMorphologyResponseZodSchema.safeParse(parsedInfo);
  if (!validationResult.success) {
    throw new Error("Invalid morphology information format");
  }
  return validationResult.data;
};

// Task validation configurations
export const TASK_VALIDATIONS: Record<string, TaskValidation<any>> = {
  "word-info": {
    genAiSchema: WordInfoResponseSchema,
    zodSchema: WordInfoResponseZodSchema,
    validator: validateWordInfo,
  },
  "word-morphology": {
    genAiSchema: WordMorphologyResponseSchema,
    zodSchema: WordMorphologyResponseZodSchema,
    validator: validateWordMorphology,
  },
};
