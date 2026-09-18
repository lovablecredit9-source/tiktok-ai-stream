export interface AiQueueItem {
  eventId: string;
  username: string;
  question: string;
}

export interface AiQueueOptions {
  maxPerMinute: number;
  cooldownSeconds: number;
  onAnswer: (item: AiQueueItem, answer: string) => void | Promise<void>;
  onError: (item: AiQueueItem, message: string) => void;
  ask: (item: AiQueueItem) => Promise<string>;
}

const QUESTION_WORDS = [
  "apa",
  "apakah",
  "kenapa",
  "mengapa",
  "gimana",
  "bagaimana",
  "kapan",
  "dimana",
  "di mana",
  "siapa",
  "berapa",
  "bisakah",
  "bolehkah",
  "mending",
  "kah ",
  "how",
  "what",
  "why",
  "when",
  "where",
  "who",
  "which",
  "can i",
  "is it",
];

const QUIZ_ANSWER = /^(jawab(an)?(nya)?\s*)?[abcd]$/i;

/** True when the comment looks like a real question worth answering. */
export function isQuestion(comment: string): boolean {
  const text = comment.trim().toLowerCase();
  if (text.length < 4) return false;
  if (QUIZ_ANSWER.test(text)) return false;
  if (text.includes("?")) return true;
  return QUESTION_WORDS.some((word) => text.startsWith(word) || text.includes(` ${word}`));
}

/** True when the comment is a quiz answer (A/B/C/D). */
export function parseQuizAnswer(comment: string): string | null {
  const text = comment.trim();
  const match = QUIZ_ANSWER.exec(text);
  if (!match) return null;
  const letter = text.replace(/[^abcdABCD]/g, "").slice(-1);
  return letter ? letter.toUpperCase() : null;
}

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Sequential AI queue with rate limit, per-user cooldown and duplicate
 * question detection. One question is processed at a time.
 */
export function createAiQueue(options: AiQueueOptions) {
  const queue: AiQueueItem[] = [];
  const lastAsked = new Map<string, number>();
  const answeredQuestions = new Map<string, string>();
  const timestamps: number[] = [];
  let running = false;
  let enabled = true;
  let opts = options;

  function update(next: Partial<Pick<AiQueueOptions, "maxPerMinute" | "cooldownSeconds">>) {
    opts = { ...opts, ...next };
  }

  function rateLimited() {
    const now = Date.now();
    while (timestamps.length && now - timestamps[0]! > 60_000) timestamps.shift();
    return timestamps.length >= opts.maxPerMinute;
  }

  async function drain() {
    if (running) return;
    running = true;
    try {
      while (queue.length) {
        if (!enabled) {
          queue.length = 0;
          break;
        }
        if (rateLimited()) {
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }
        const item = queue.shift()!;
        const key = normalize(item.question);
        const cached = answeredQuestions.get(key);
        if (cached) {
          await opts.onAnswer(item, cached);
          continue;
        }
        timestamps.push(Date.now());
        try {
          const answer = await opts.ask(item);
          answeredQuestions.set(key, answer);
          if (answeredQuestions.size > 200) {
            const first = answeredQuestions.keys().next().value;
            if (first) answeredQuestions.delete(first);
          }
          await opts.onAnswer(item, answer);
        } catch (error) {
          opts.onError(
            item,
            error instanceof Error ? error.message : "Gagal memproses AI",
          );
        }
        await new Promise((r) => setTimeout(r, 400));
      }
    } finally {
      running = false;
    }
  }

  return {
    push(item: AiQueueItem): "queued" | "cooldown" | "duplicate" | "disabled" | "full" {
      if (!enabled) return "disabled";
      if (queue.length >= 40) return "full";
      const last = lastAsked.get(item.username) ?? 0;
      if (Date.now() - last < opts.cooldownSeconds * 1000) return "cooldown";
      const key = normalize(item.question);
      if (queue.some((q) => normalize(q.question) === key)) return "duplicate";
      lastAsked.set(item.username, Date.now());
      queue.push(item);
      void drain();
      return "queued";
    },
    setEnabled(value: boolean) {
      enabled = value;
      if (!value) queue.length = 0;
    },
    update,
    get size() {
      return queue.length;
    },
    get busy() {
      return running;
    },
    clear() {
      queue.length = 0;
    },
  };
}

export type AiQueue = ReturnType<typeof createAiQueue>;
