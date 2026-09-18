import { supabase } from "@/integrations/supabase/client";
import type { AiQueue } from "./ai-queue";
import { isQuestion, parseQuizAnswer } from "./ai-queue";
import type { GiftConfigRow, NormalizedEvent } from "./types";

export interface ScoringSettings {
  point_comment: number;
  point_follow: number;
  point_correct_answer: number;
  coin_to_point: number;
  ai_enabled: boolean;
}

export interface ActiveQuestion {
  id: string;
  correct_answer: string;
}

interface Counters {
  comment_count: number;
  correct_answers: number;
  wrong_answers: number;
  follow_count: number;
  gift_count: number;
  gift_coins: number;
  score: number;
  nickname: string | null;
  avatar: string | null;
}

export interface ProcessorDeps {
  getSessionId: () => string | null;
  getGift: (giftId: string | null | undefined, giftName: string | null | undefined) => GiftConfigRow | null;
  getScoring: () => ScoringSettings;
  getActiveQuestion: () => ActiveQuestion | null;
  aiQueue: AiQueue;
  log: (level: "INFO" | "WARN" | "ERROR", message: string) => void;
}

/**
 * The single event-processing pipeline. Every provider event flows through
 * here: dedupe -> normalize -> score -> persist -> side effects.
 * Each stage is isolated so one failure never stops the stream.
 */
export function createProcessor(deps: ProcessorDeps) {
  const seen = new Set<string>();
  const counters = new Map<string, Counters>();

  function blank(nickname: string | null, avatar: string | null): Counters {
    return {
      comment_count: 0,
      correct_answers: 0,
      wrong_answers: 0,
      follow_count: 0,
      gift_count: 0,
      gift_coins: 0,
      score: 0,
      nickname,
      avatar,
    };
  }

  async function syncParticipant(sessionId: string, username: string, c: Counters) {
    const { error } = await supabase.from("participants").upsert(
      {
        session_id: sessionId,
        username,
        nickname: c.nickname,
        avatar: c.avatar,
        comment_count: c.comment_count,
        correct_answers: c.correct_answers,
        wrong_answers: c.wrong_answers,
        follow_count: c.follow_count,
        gift_count: c.gift_count,
        gift_coins: c.gift_coins,
        score: c.score,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "session_id,username" },
    );
    if (error) deps.log("WARN", `Gagal update peserta @${username}: ${error.message}`);
  }

  async function handle(event: NormalizedEvent) {
    const sessionId = deps.getSessionId();
    if (!sessionId) return;

    // ---- stage 1: dedupe ----
    if (seen.has(event.eventKey)) return;
    seen.add(event.eventKey);
    if (seen.size > 5000) {
      const first = seen.values().next().value;
      if (first) seen.delete(first);
    }

    const scoring = deps.getScoring();
    const username = event.username.slice(0, 120);
    const current =
      counters.get(username) ?? blank(event.nickname ?? username, event.avatar ?? null);
    if (event.nickname) current.nickname = event.nickname;
    if (event.avatar) current.avatar = event.avatar;

    // ---- stage 2: classify + score ----
    let points = 0;
    let giftCoins = 0;
    let giftCategory: string | null = null;
    let giftName = event.giftName ?? null;
    let question = false;
    let quizLetter: string | null = null;
    const comment = event.comment ? event.comment.slice(0, 500) : null;

    if (event.type === "comment" && comment) {
      current.comment_count += 1;
      points = scoring.point_comment;
      quizLetter = parseQuizAnswer(comment);
      question = !quizLetter && isQuestion(comment);
    } else if (event.type === "follow") {
      current.follow_count += 1;
      points = scoring.point_follow;
    } else if (event.type === "gift") {
      const count = Math.max(1, event.giftCount ?? 1);
      const config = deps.getGift(event.giftId, event.giftName);
      const coins = (config?.coins ?? 1) * count;
      giftCoins = coins;
      giftCategory = config?.category ?? "Normal";
      giftName = config?.gift_name ?? event.giftName ?? "Gift";
      points = Math.round((config?.points ?? coins) * count * Number(config?.multiplier ?? 1));
      current.gift_count += count;
      current.gift_coins += coins;
      if (config && !config.enabled) {
        points = 0;
        giftCoins = 0;
      }
    }

    current.score += points;
    counters.set(username, current);

    // ---- stage 3: persist event ----
    let eventId: string | null = null;
    try {
      const { data, error } = await supabase
        .from("live_events")
        .insert({
          session_id: sessionId,
          event_key: event.eventKey,
          event_type: event.type,
          username,
          nickname: current.nickname,
          avatar: current.avatar,
          comment,
          gift_id: event.giftId ?? null,
          gift_name: giftName,
          gift_count: event.type === "gift" ? Math.max(1, event.giftCount ?? 1) : 0,
          gift_coins: giftCoins,
          gift_category: giftCategory,
          is_question: question,
          points,
          raw_data: (event.raw ?? null) as never,
        })
        .select("id")
        .single();
      if (error) {
        if (error.code === "23505" || error.code === "23514" || error.code === "23000") {
          return; // duplicate key — already stored
        }
        if (error.code === "23503") {
          deps.log("WARN", "Sesi tidak ditemukan, event dilewati");
          return;
        }
        deps.log("WARN", `Event gagal disimpan: ${error.message}`);
      } else {
        eventId = data?.id ?? null;
      }
    } catch (error) {
      deps.log("ERROR", `Error simpan event: ${String(error)}`);
    }

    // ---- stage 4: participant aggregate ----
    void syncParticipant(sessionId, username, current);

    // ---- stage 5: quiz answer ----
    if (quizLetter) {
      const active = deps.getActiveQuestion();
      if (active) {
        const correct = active.correct_answer.trim().toUpperCase() === quizLetter;
        const gained = correct ? scoring.point_correct_answer : 0;
        const { error } = await supabase.from("quiz_answers").upsert(
          {
            question_id: active.id,
            session_id: sessionId,
            username,
            answer: quizLetter,
            is_correct: correct,
            points: gained,
          },
          { onConflict: "question_id,username", ignoreDuplicates: true },
        );
        if (!error) {
          if (correct) current.correct_answers += 1;
          else current.wrong_answers += 1;
          current.score += gained;
          counters.set(username, current);
          void syncParticipant(sessionId, username, current);
        }
      }
    }

    // ---- stage 6: AI queue ----
    if (question && scoring.ai_enabled && comment && eventId) {
      const result = deps.aiQueue.push({ eventId, username, question: comment });
      if (result === "cooldown") {
        deps.log("INFO", `@${username} masih cooldown, pertanyaan dilewati`);
      } else if (result === "duplicate") {
        deps.log("INFO", "Pertanyaan duplikat dilewati");
      } else if (result === "full") {
        deps.log("WARN", "Antrian AI penuh, pertanyaan dilewati");
      }
    }
  }

  return {
    /** Never throws — errors are logged so the stream keeps running. */
    async process(event: NormalizedEvent) {
      try {
        await handle(event);
      } catch (error) {
        deps.log("ERROR", `Pipeline error: ${String(error)}`);
      }
    },
    reset() {
      seen.clear();
      counters.clear();
    },
    seedCounters(rows: Array<Counters & { username: string }>) {
      for (const row of rows) counters.set(row.username, { ...row });
    },
  };
}

export type Processor = ReturnType<typeof createProcessor>;
