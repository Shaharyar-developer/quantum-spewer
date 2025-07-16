import { EventEmitter } from "events";
import { EmbedBuilder, Message } from "discord.js";
import { TASK_VALIDATIONS } from "../types/ai";
import { AI_GEN_COOLDOWN } from "./constants";

export interface AITask {
  id: string;
  type: string;
  payload: any;
  resolve: (result: any) => void;
  reject: (error: Error) => void;
  priority: number;
  createdAt: number;
  retryCount: number;
  maxRetries: number;
  discordMessage?: Message;
  authorUsername?: string;
  authorAvatarURL?: string;
}

export interface TaskConfig {
  title: string;
  icon: string;
  systemPrompt: string;
  getUserPrompt: (payload: any) => string;
  getDescription: (payload: any) => string;
  hasStructuredResponse?: boolean;
}

// Single configuration object that can be extended at will
export const TASK_CONFIGS: Record<string, TaskConfig> = {
  "quantum-fact": {
    title: "Quantum Fact Request",
    icon: "🧠",
    systemPrompt: `You are a physics researcher tasked with sharing lesser-known quantum facts. Avoid common knowledge. Be concise, specific, and unafraid to include facts that may be re-evaluated in the future.`,
    getUserPrompt: () => `Generate a niche, lesser-known quantum physics fact. 
Prioritize obscure or speculative phenomena—things on the edge of current understanding, 
possibly debated or not widely known. Avoid generic summaries like superposition or wave-particle duality. 
Instead, give a fact that feels strange, specific, and possibly subject to change with future discoveries. 
Keep it concise, ideally one or two sentences.`,
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
    getUserPrompt: (payload) =>
      `Provide concise but comprehensive information about the word "${payload.word}". Keep explanations clear and brief.`,
    getDescription: (payload) =>
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
    getUserPrompt: (
      payload
    ) => `Break down the word "${payload.word}" into its morphological components (prefixes, root word, suffixes).

For each component, provide:
- The morpheme itself
- Its meaning (brief)
- Synonyms from different languages/origins (like Latin, Greek, Sanskrit, etc.)
- The origin/etymology (concise)

Then explain how these components combine to create the word's overall meaning.

Focus on accuracy and brevity. Include cross-linguistic synonyms where they exist.`,
    getDescription: (payload) =>
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
- If a character is implied, depict them obliquely—through what they’ve lost, not who they are.
- Do not resolve the tragedy. Leave it lingering.

Structure your response as a single free-verse poem, ideally between 20 to 80 lines. Begin immediately with no preamble or explanation.
`,
    getUserPrompt: (payload) =>
      `Write a short poem based on this topic: ${payload.topic}. Follow the style and tone you’ve been instructed to.
`,
    getDescription: (payload) =>
      `Melancholy poem request about "${payload.topic || "unknown theme"}"`,
    hasStructuredResponse: false,
  },
};

export class AITaskQueue extends EventEmitter {
  private queue: AITask[] = [];
  private processing = false;
  private processingDelay = AI_GEN_COOLDOWN; // 15 seconds delay between tasks
  private maxRetries = 3;
  private taskIdCounter = 0;

  constructor() {
    super();
    this.startProcessing();
  }

  public addTask(
    type: keyof typeof TASK_CONFIGS,
    payload: any,
    priority: number = 0,
    maxRetries: number = 3,
    discordMessage?: Message,
    authorUsername?: string,
    authorAvatarURL?: string
  ): Promise<any> {
    if (!TASK_CONFIGS[type]) {
      return Promise.reject(new Error(`Unknown task type: ${type}`));
    }
    return new Promise((resolve, reject) => {
      const task: AITask = {
        id: `task_${++this.taskIdCounter}_${Date.now()}`,
        type,
        payload,
        resolve,
        reject,
        priority,
        createdAt: Date.now(),
        retryCount: 0,
        maxRetries,
        discordMessage,
        authorUsername,
        authorAvatarURL,
      };

      this.queue.push(task);
      this.sortQueue();
      this.emit("taskAdded", task);
      this.updateDiscordMessage(task, "queued");

      console.log(
        `AI Queue: Added task ${task.id} (type: ${type}), queue length: ${this.queue.length}`
      );
    });
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // Higher priority first, then by creation time (FIFO for same priority)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.createdAt - b.createdAt;
    });
  }

  private async startProcessing(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (true) {
      if (this.queue.length === 0) {
        await this.sleep(1000); // Check every second for new tasks
        continue;
      }

      const task = this.queue.shift();
      if (!task) continue;

      try {
        console.log(
          `AI Queue: Processing task ${task.id} (type: ${task.type})`
        );
        this.emit("taskStarted", task);
        this.updateDiscordMessage(task, "processing");

        const result = await this.processTask(task);
        task.resolve(result);

        console.log(`AI Queue: Task ${task.id} completed successfully`);
        this.emit("taskCompleted", task);
        this.updateDiscordMessage(task, "completed");

        // Wait before processing next task to respect rate limits
        await this.sleep(this.processingDelay);
      } catch (error) {
        console.error(`AI Queue: Task ${task.id} failed:`, error);

        if (task.retryCount < task.maxRetries) {
          task.retryCount++;
          // Add some exponential backoff for retries
          const backoffDelay = Math.pow(2, task.retryCount) * 1000;

          console.log(
            `AI Queue: Retrying task ${task.id} (attempt ${task.retryCount}/${task.maxRetries}) after ${backoffDelay}ms`
          );
          this.updateDiscordMessage(task, "retrying");

          setTimeout(() => {
            this.queue.unshift(task); // Put back at the front with higher priority
            this.sortQueue();
          }, backoffDelay);
        } else {
          console.error(
            `AI Queue: Task ${task.id} failed after ${task.maxRetries} attempts`
          );
          task.reject(error as Error);
          this.emit("taskFailed", task, error);
          this.updateDiscordMessage(task, "failed");
        }
      }
    }
  }

  private async processTask(task: AITask): Promise<any> {
    const taskConfig = TASK_CONFIGS[task.type];
    if (!taskConfig) {
      throw new Error(`Unknown task type: ${task.type}`);
    }

    // Import AI dynamically to avoid circular dependencies
    const AI = await import("./ai");
    const aiInstance = AI.default;

    // Generate content using the prompts from the configuration
    const systemPrompt = taskConfig.systemPrompt;
    const userPrompt = taskConfig.getUserPrompt(task.payload);

    // Check if this task type requires structured response
    let schema: object | undefined;
    const taskValidation = TASK_VALIDATIONS[task.type];
    if (taskConfig.hasStructuredResponse && taskValidation) {
      schema = taskValidation.genAiSchema;
    }

    // Call the AI's generateContent method directly
    const result = await aiInstance.generateContent(
      systemPrompt,
      userPrompt,
      schema
    );

    // If there's a validator for this task type, use it
    if (taskConfig.hasStructuredResponse && taskValidation) {
      return taskValidation.validator(result);
    }

    return result;
  }

  private async updateDiscordMessage(
    task: AITask,
    status: string
  ): Promise<void> {
    if (!task.discordMessage || !("edit" in task.discordMessage)) {
      return;
    }

    try {
      let embed: EmbedBuilder;
      const queuePosition = this.queue.findIndex((t) => t.id === task.id) + 1;
      const queueLength = this.queue.length;

      switch (status) {
        case "queued":
          embed = new EmbedBuilder()
            .setColor(0xfab387) // Warning/thinking color
            .setTitle(this.getStatusTitle(task.type, status))
            .setDescription(
              this.getStatusDescription(
                task,
                status,
                queuePosition,
                queueLength
              )
            )
            .setTimestamp()
            .setFooter({
              text: `Requested by ${task.authorUsername} • Queue Position: ${queuePosition}/${queueLength}`,
              iconURL: task.authorAvatarURL,
            });
          break;

        case "processing":
          embed = new EmbedBuilder()
            .setColor(0x74c0fc) // Processing color
            .setTitle(this.getStatusTitle(task.type, status))
            .setDescription(this.getStatusDescription(task, status))
            .setTimestamp()
            .setFooter({
              text: `Requested by ${task.authorUsername} • Now Processing...`,
              iconURL: task.authorAvatarURL,
            });
          break;

        case "retrying":
          embed = new EmbedBuilder()
            .setColor(0xffec8b) // Retry color
            .setTitle(this.getStatusTitle(task.type, status))
            .setDescription(this.getStatusDescription(task, status))
            .setTimestamp()
            .setFooter({
              text: `Requested by ${task.authorUsername} • Retry ${task.retryCount}/${task.maxRetries}`,
              iconURL: task.authorAvatarURL,
            });
          break;

        case "failed":
          embed = new EmbedBuilder()
            .setColor(0xf38ba8) // Error color
            .setTitle("⚠️ Error")
            .setDescription(
              "An error occurred while processing your request in the AI queue. This may be due to rate limiting or AI service issues. Please try again later."
            )
            .setTimestamp()
            .setFooter({
              text: `Requested by ${task.authorUsername} • Failed after ${task.maxRetries} attempts`,
              iconURL: task.authorAvatarURL,
            });
          break;

        case "completed":
          // Don't update for completed status as the result will be handled by the command
          return;

        default:
          return;
      }

      await task.discordMessage.edit({ embeds: [embed] });
    } catch (error) {
      console.error(
        `Failed to update Discord message for task ${task.id}:`,
        error
      );
    }
  }

  private getStatusTitle(taskType: string, status: string): string {
    const taskConfig = TASK_CONFIGS[taskType];
    const title = taskConfig
      ? `${taskConfig.icon} ${taskConfig.title}`
      : `❓ Unknown Task`;

    const statusSuffixes: Record<string, string> = {
      queued: "Queued...",
      processing: "Processing...",
      retrying: "Retrying...",
    };

    return `${title} ${statusSuffixes[status] || ""}`;
  }

  private getStatusDescription(
    task: AITask,
    status: string,
    queuePosition?: number,
    queueLength?: number
  ): string {
    const taskConfig = TASK_CONFIGS[task.type];
    const baseDescription = taskConfig
      ? taskConfig.getDescription(task.payload)
      : "Your request";

    switch (status) {
      case "queued":
        if (queuePosition && queueLength) {
          if (queuePosition === 1) {
            return `${baseDescription} is next in line! Due to rate limiting, this may take 15-30 seconds to process...`;
          } else {
            return `${baseDescription} has been added to the AI processing queue. You are currently position ${queuePosition} of ${queueLength}. Due to rate limiting, this may take ${Math.ceil(
              queuePosition * 0.5
            )} minute(s) to process...`;
          }
        }
        return `${baseDescription} has been added to the AI processing queue. Due to rate limiting, this may take some time to process...`;

      case "processing":
        return `${baseDescription} is now being processed by the AI. This should complete within 15-30 seconds...`;

      case "retrying":
        return `${baseDescription} encountered an error and is being retried. Please wait while we attempt to process it again...`;

      default:
        return `${baseDescription} is being processed...`;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public getQueueStatus(): {
    queueLength: number;
    processing: boolean;
    nextTask: AITask | null;
  } {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      nextTask: this.queue[0] || null,
    };
  }

  public clearQueue(): void {
    console.log(`AI Queue: Clearing queue with ${this.queue.length} tasks`);
    this.queue.forEach((task) => {
      task.reject(new Error("Queue cleared"));
    });
    this.queue = [];
    this.emit("queueCleared");
  }

  public removeTask(taskId: string): boolean {
    const index = this.queue.findIndex((task) => task.id === taskId);
    if (index !== -1) {
      const [task] = this.queue.splice(index, 1);
      if (task) {
        task.reject(new Error("Task removed from queue"));
        console.log(`AI Queue: Removed task ${taskId}`);
        this.emit("taskRemoved", task);
      }
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const aiTaskQueue = new AITaskQueue();
