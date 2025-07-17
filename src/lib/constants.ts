import type { TaskConfig } from "./ai-queue";

export const MASTER_IDS = ["756921583494234152", "800720974890270752"];
export const BOT_ID = "1386071447621075086";

export const MODERATION_ROLE_IDS = ["1323030261788704868"];

export const BANNED_CHARACTERS_SET = new Set(
  "Èėēéêîìïīíóôöòœøōõæãàáâäāåßzçñń".split("")
);

export const BANNED_CHARACTERS_ARRAY = Array.from(BANNED_CHARACTERS_SET);

export const AI_GEN_COOLDOWN = 15 * 1000; // 15 seconds in milliseconds

export const POINTS_TABLE = {
  russian_roulette: 10,
} as const;

export const getRandomQuantumFactTopic = () => {
  const topics = [
    "weak measurement",
    "quantum decoherence",
    "retrocausality",
    "non-Hermitian Hamiltonians",
    "quantum thermodynamics",
    "black hole information paradox",
    "many-worlds implications",
    "time symmetry in quantum mechanics",
    "quantum Zeno effect",
    "quantum tunneling anomalies",
    "quantum contextuality",
    "gravitational decoherence",
    "pilot wave theory oddities",
    "emergent space-time from entanglement",
    "quantum error correction in holography",
    "delayed choice experiments",
    "anomalous weak values",
    "quantum Darwinism",
    "superdeterminism",
    "quantum entanglement entropy",
  ] as const;

  const index = Math.floor(Math.random() * topics.length);
  return topics[index] as string;
};

// Single configuration object that can be extended at will
export const TASK_CONFIGS: Record<string, TaskConfig> = {
  "quantum-fact": {
    title: "Quantum Fact Request",
    icon: "🧠",
    systemPrompt: `You are a quantum physics researcher specializing in fringe theory, experimental anomalies, and conceptual edges. Always provide a unique, lesser-known fact. Avoid anything common or well-established. Keep facts specific, concise, and potentially controversial or speculative.`,

    getUserPrompt: (payload: {
      topic?: string;
    }) => `Generate a **unique** and obscure quantum physics fact.
Focus on the following topic: **${
      payload.topic || "any strange or niche domain"
    }**.

Avoid generic concepts like superposition, wave-particle duality, or entanglement unless presenting a radically lesser-known angle. 
Choose ideas from fringe theories, quantum information, exotic states of matter, foundational paradoxes, time symmetry, or gravity-related quantum mechanics.

**Requirements:**
- The fact must be unique and unlikely to repeat across runs.
- Keep it concise: 1–2 sentences max.
- Add a brief, layman-friendly explanation below it.

Use this format:
\`\`\`markdown
<fact>

---

**Explanation:**
<explanation>
\`\`\``,

    getDescription: () => "Your quantum fact request",
    hasStructuredResponse: false,
  },

  "word-info": {
    title: "Word Information Request",
    icon: "📚",
    systemPrompt: `You are a language expert providing concise but comprehensive information about words.
Your task is to give clear definitions, including parts of speech, pronunciation, synonyms, antonyms, examples, and etymology.
Be precise and concise - avoid overly verbose explanations. Keep examples short and relevant.
Use markdown features like **bold**, *italics*, and \`backticks\` for inline-code-style formatting to enhance readability.
Prioritize clarity and brevity while maintaining accuracy.`,
    getUserPrompt: (payload: { word: string }) =>
      `Provide concise but comprehensive information about the word "${payload.word}". Keep explanations clear and brief.`,
    getDescription: (payload: { word: string }) =>
      `Your word information request for "${payload.word || "unknown word"}"`,
    hasStructuredResponse: true,
  },
  "word-morphology": {
    title: "Word Morphology Analysis",
    icon: "🔬",
    systemPrompt: `You are a linguistic expert specializing in etymology and morphology.
Your task is to break down words into their morphological components (prefixes, root, suffixes) and provide:
1. The meaning of each morpheme
2. Synonyms for each morpheme from different languages/origins where applicable
3. The origin/etymology of each morpheme
4. How these components combine to form the word's meaning

Be precise and concise in your analysis. Include cross-linguistic synonyms when available.
Keep explanations brief but informative. Use markdown formatting for emphasis and clarity.`,
    getUserPrompt: (payload: {
      word: string;
    }) => `Break down the word "${payload.word}" into its morphological components (prefixes, root word, suffixes).

For each component, provide:
- The morpheme itself
- Its meaning (brief)
- Synonyms from different languages/origins (like Latin, Greek, Sanskrit, etc.)
- The origin/etymology (concise)

Then explain how these components combine to create the word's overall meaning.

Focus on accuracy and brevity. Include cross-linguistic synonyms where they exist.`,
    getDescription: (payload: { word: string }) =>
      `Your morphology analysis request for "${
        payload.word || "unknown word"
      }"`,
    hasStructuredResponse: true,
  },
  "melancholic-whimsy": {
    title: "Melancholic Verse Generator",
    icon: "🕯️",
    systemPrompt: `You are a poetic writing assistant trained to generate short narrative poems (20–80 lines) in a somber, tragic, and atmospheric style. The user prefers a tone that is emotionally understated yet viscerally powerful—relying on symbolism, metaphor, contrast, and evocative imagery rather than overt emotional declarations.

Key stylistic characteristics to follow:
- Use **rhythmic enjambment**, subtle repetition, and **layered metaphor**.
- Avoid direct sentimentality; imply emotion through **silence**, **visual motifs**, and **environmental decay**.
- Themes often include **memory**, **loss**, **solitude**, **futility**, and **sacrifice**.
- Favor minimalist but lyrical descriptions that build atmosphere over exposition.
- Treat time and space abstractly—bleed the physical with the metaphysical.
- If a character is implied, depict them obliquely—through what they've lost, not who they are.
- Do not resolve the tragedy. Leave it lingering.

Structure your response as a single free-verse poem, ideally between 20 to 80 lines. Begin immediately with no preamble or explanation.
`,
    getUserPrompt: (payload: { topic: string }) =>
      `Write a short poem based on this topic: ${payload.topic}. Follow the style and tone you've been instructed to.
`,
    getDescription: (payload: { topic: string }) =>
      `Melancholy poem request about "${payload.topic || "unknown theme"}"`,
    hasStructuredResponse: false,
  },
};
