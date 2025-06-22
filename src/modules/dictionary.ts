type Phonetic = {
  text?: string;
  audio?: string;
};

type Definition = {
  definition: string;
  synonyms: string[];
  antonyms: string[];
  example?: string;
};

type Meaning = {
  partOfSpeech: string;
  definitions: Definition[];
  synonyms: string[];
  antonyms: string[];
};

export type DictionaryEntry = {
  word: string;
  phonetic?: string;
  phonetics: Phonetic[];
  meanings: Meaning[];
};

export async function fetchDictionaryEntry(
  word: string
): Promise<DictionaryEntry | null> {
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Error fetching dictionary entry: ${response.statusText}`
      );
    }
    const data = (await response.json()) as DictionaryEntry[];
    return data[0] || null;
  } catch (error) {
    console.error("Error fetching dictionary entry:", error);
    return null;
  }
}
