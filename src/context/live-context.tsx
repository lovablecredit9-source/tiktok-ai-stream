import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { askAi } from "@/lib/ai.functions";
import { createAiQueue, type AiQueue } from "@/lib/live/ai-queue";
import { createDemoAdapter } from "@/lib/live/demo-adapter";
import { createProcessor, type Processor } from "@/lib/live/processor";
import { createWsAdapter } from "@/lib/live/ws-adapter";
import type {
  ConnectionStatus,
  GiftConfigRow,
  GiftPopupPayload,
  LiveAdapter,
  NormalizedEvent,
} from "@/lib/live/types";
import { speak, stopSpeaking } from "@/lib/tts";

export type EventRow = Tables<"live_events">;
export type ParticipantRow = Tables<"participants">;
export type AiResponseRow = Tables<"ai_responses">;
export type LogRow = Tables<"system_logs">;
export type SessionRow = Tables<"live_sessions">;
export type QuestionRow = Tables<"quiz_questions">;
export type AppSettingsRow = Tables<"app_settings">;
export type AiSettingsRow = Tables<"ai_settings">;

interface LiveContextValue {
  session: SessionRow | null;
  status: ConnectionStatus;
  statusMessage: string;
  providerLabel: string;
  providerOfficial: boolean;
  events: EventRow[];
  comments: EventRow[];
  gifts: EventRow[];
  participants: ParticipantRow[];
  aiResponses: AiResponseRow[];
  logs: LogRow[];
  giftCatalog: GiftConfigRow[];
  settings: AppSettingsRow | null;
  aiSettings: AiSettingsRow | null;
  activeQuestion: QuestionRow | null;
  overlay: GiftPopupPayload | null;
  paused: boolean;
  aiQueueSize: number;
  aiMuted: boolean;
  totals: {
    comments: number;
    gifts: number;
    coins: number;
    follows: number;
    likes: number;
    shares: number;
    viewers: number;
    aiAnswers: number;
  };
  connect: (username: string, mode: "demo" | "bridge", endpoint?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  setPaused: (value: boolean) => void;
  setAiMuted: (value: boolean) => void;
  clearFeed: () => void;
  injectDemoEvent: (event: NormalizedEvent) => void;
  refreshCatalog: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  reloadActiveQuestion: () => Promise<void>;
}

const LiveContext = createContext<LiveContextValue | null>(null);

const MAX_FEED = 250;

export function LiveProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionRow | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [statusMessage, setStatusMessage] = useState("");
  const [events, setEvents] = useState<EventRow[]>([]);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [aiResponses, setAiResponses] = useState<AiResponseRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [giftCatalog, setGiftCatalog] = useState<GiftConfigRow[]>([]);
  const [settings, setSettings] = useState<AppSettingsRow | null>(null);
  const [aiSettings, setAiSettings] = useState<AiSettingsRow | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<QuestionRow | null>(null);
  const [overlay, setOverlay] = useState<GiftPopupPayload | null>(null);
  const [paused, setPausedState] = useState(false);
  const [aiMuted, setAiMutedState] = useState(false);
  const [aiQueueSize, setAiQueueSize] = useState(0);
  const [providerLabel, setProviderLabel] = useState("Belum terhubung");
  const [providerOfficial, setProviderOfficial] = useState(false);

  const adapterRef = useRef<LiveAdapter | null>(null);
  const processorRef = useRef<Processor | null>(null);
  const aiQueueRef = useRef<AiQueue | null>(null);
  const sessionRef = useRef<SessionRow | null>(null);
  const settingsRef = useRef<AppSettingsRow | null>(null);
  const questionRef = useRef<QuestionRow | null>(null);
  const catalogRef = useRef<GiftConfigRow[]>([]);
  const pausedRef = useRef(false);
  const mutedRef = useRef(false);
  const overlayQueueRef = useRef<GiftPopupPayload[]>([]);
  const overlayBusyRef = useRef(false);
  const comboRef = useRef(new Map<string, { count: number; at: number }>());

  sessionRef.current = session;
  settingsRef.current = settings;
  questionRef.current = activeQuestion;
  catalogRef.current = giftCatalog;

  // ---------------- logging ----------------
  const log = useCallback(
    (level: "INFO" | "WARN" | "ERROR", message: string, source = "system") => {
      void supabase
        .from("system_logs")
        .insert({
          session_id: sessionRef.current?.id ?? null,
          level,
          source,
          message: message.slice(0, 500),
        })
        .then(({ error }) => {
          if (error) console.warn("log gagal", error.message);
        });
    },
    [],
  );

  // ---------------- data loading ----------------
  const refreshCatalog = useCallback(async () => {
    const { data, error } = await supabase
      .from("gift_config")
      .select(
        "gift_id, gift_name, gift_alias, coins, category, vip_level, points, multiplier, animation, animation_duration, emoji, icon_url, enabled",
      )
      .order("coins", { ascending: true });
    if (error) {
      toast.error("Gagal memuat katalog gift");
      return;
    }
    setGiftCatalog((data ?? []) as GiftConfigRow[]);
  }, []);

  const refreshSettings = useCallback(async () => {
    const [app, ai] = await Promise.all([
      supabase.from("app_settings").select("*").maybeSingle(),
      supabase.from("ai_settings").select("*").maybeSingle(),
    ]);

    if (!app.data) {
      const created = await supabase.from("app_settings").insert({}).select("*").maybeSingle();
      setSettings(created.data ?? null);
    } else {
      setSettings(app.data);
    }

    if (!ai.data) {
      const created = await supabase.from("ai_settings").insert({}).select("*").maybeSingle();
      setAiSettings(created.data ?? null);
    } else {
      setAiSettings(ai.data);
    }
  }, []);

  const reloadActiveQuestion = useCallback(async () => {
    const { data } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setActiveQuestion(data ?? null);
  }, []);

  useEffect(() => {
    void refreshCatalog();
    void refreshSettings();
    void reloadActiveQuestion();
  }, [refreshCatalog, refreshSettings, reloadActiveQuestion]);

  const [pendingResume, setPendingResume] = useState<SessionRow | null>(null);

  // restore an already-running session on reload
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("live_sessions")
        .select("*")
        .is("ended_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled && data) {
        setSession(data);
        sessionRef.current = data;
        setPendingResume(data);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);


  // ---------------- gift helpers ----------------
  const getGift = useCallback(
    (giftId?: string | null, giftName?: string | null): GiftConfigRow | null => {
      const list = catalogRef.current;
      if (giftId) {
        const byId = list.find((g) => g.gift_id === giftId);
        if (byId) return byId;
      }
      if (giftName) {
        const lower = giftName.toLowerCase();
        return (
          list.find((g) => g.gift_name.toLowerCase() === lower) ??
          list.find((g) => (g.gift_alias ?? "").toLowerCase() === lower) ??
          null
        );
      }
      return null;
    },
    [],
  );

  // ---------------- overlay queue ----------------
  const pumpOverlay = useCallback(() => {
    if (overlayBusyRef.current) return;
    const next = overlayQueueRef.current.shift();
    if (!next) return;
    overlayBusyRef.current = true;
    setOverlay(next);
    setTimeout(() => {
      setOverlay(null);
      overlayBusyRef.current = false;
      setTimeout(pumpOverlay, 120);
    }, next.duration);
  }, []);

  const pushOverlay = useCallback(
    (payload: GiftPopupPayload) => {
      if (overlayQueueRef.current.length > 12) overlayQueueRef.current.shift();
      overlayQueueRef.current.push(payload);
      pumpOverlay();
    },
    [pumpOverlay],
  );

  // ---------------- AI queue ----------------
  useEffect(() => {
    aiQueueRef.current = createAiQueue({
      maxPerMinute: aiSettings?.max_requests_per_minute ?? 20,
      cooldownSeconds: aiSettings?.cooldown_seconds ?? 15,
      ask: async (item) => {
        const result = await askAi({
          data: { question: item.question, username: item.username },
        });
        return result.answer;
      },
      onAnswer: async (item, answer) => {
        const sessionId = sessionRef.current?.id ?? null;
        await supabase.from("ai_responses").insert({
          session_id: sessionId,
          event_id: item.eventId,
          username: item.username,
          question: item.question,
          answer,
        });
        await supabase.from("live_events").update({ is_answered: true }).eq("id", item.eventId);
        setAiQueueSize(aiQueueRef.current?.size ?? 0);
      },
      onError: (item, message) => {
        log("ERROR", `AI gagal untuk @${item.username}: ${message}`, "ai");
        toast.error(`AI gagal: ${message}`);
        setAiQueueSize(aiQueueRef.current?.size ?? 0);
      },
    });
    return () => aiQueueRef.current?.clear();
  }, [aiSettings?.max_requests_per_minute, aiSettings?.cooldown_seconds, log]);

  // ---------------- processor ----------------
  useEffect(() => {
    processorRef.current = createProcessor({
      getSessionId: () => sessionRef.current?.id ?? null,
      getGift,
      getScoring: () => ({
        point_comment: settingsRef.current?.point_comment ?? 1,
        point_follow: settingsRef.current?.point_follow ?? 5,
        point_correct_answer: settingsRef.current?.point_correct_answer ?? 10,
        coin_to_point: Number(settingsRef.current?.coin_to_point ?? 1),
        ai_enabled: (settingsRef.current?.ai_enabled ?? true) && !mutedRef.current,
      }),
      getActiveQuestion: () =>
        questionRef.current
          ? { id: questionRef.current.id, correct_answer: questionRef.current.correct_answer }
          : null,
      aiQueue: {
        push: (item) => {
          const result = aiQueueRef.current?.push(item) ?? "disabled";
          setAiQueueSize(aiQueueRef.current?.size ?? 0);
          return result;
        },
        setEnabled: (v) => aiQueueRef.current?.setEnabled(v),
        update: (v) => aiQueueRef.current?.update(v),
        clear: () => aiQueueRef.current?.clear(),
        get size() {
          return aiQueueRef.current?.size ?? 0;
        },
        get busy() {
          return aiQueueRef.current?.busy ?? false;
        },
      } as AiQueue,
      log,
    });
  }, [getGift, log]);

  // ---------------- realtime ----------------
  useEffect(() => {
    if (!session) {
      setEvents([]);
      setParticipants([]);
      setAiResponses([]);
      return;
    }
    let active = true;

    void (async () => {
      const [ev, pa, ai, lg] = await Promise.all([
        supabase
          .from("live_events")
          .select("*")
          .eq("session_id", session.id)
          .order("created_at", { ascending: false })
          .limit(MAX_FEED),
        supabase
          .from("participants")
          .select("*")
          .eq("session_id", session.id)
          .order("score", { ascending: false }),
        supabase
          .from("ai_responses")
          .select("*")
          .eq("session_id", session.id)
          .order("created_at", { ascending: false })
          .limit(60),
        supabase
          .from("system_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(120),
      ]);
      if (!active) return;
      setEvents(ev.data ?? []);
      setParticipants(pa.data ?? []);
      setAiResponses(ai.data ?? []);
      setLogs(lg.data ?? []);
      processorRef.current?.seedCounters(
        (pa.data ?? []).map((row) => ({
          username: row.username,
          comment_count: row.comment_count,
          correct_answers: row.correct_answers,
          wrong_answers: row.wrong_answers,
          follow_count: row.follow_count,
          gift_count: row.gift_count,
          gift_coins: row.gift_coins,
          score: row.score,
          nickname: row.nickname,
          avatar: row.avatar,
        })),
      );
    })();

    const channel = supabase
      .channel(`live-${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_events",
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          const row = payload.new as EventRow;
          setEvents((prev) =>
            prev.some((e) => e.id === row.id) ? prev : [row, ...prev].slice(0, MAX_FEED),
          );
          handleSideEffects(row);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          const row = payload.new as ParticipantRow;
          if (!row?.id) return;
          setParticipants((prev) => {
            const rest = prev.filter((p) => p.id !== row.id);
            return [...rest, row].sort((a, b) => b.score - a.score);
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ai_responses",
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          const row = payload.new as AiResponseRow;
          setAiResponses((prev) => [row, ...prev].slice(0, 60));
          const s = settingsRef.current;
          if (s?.tts_enabled && s.tts_auto_read) {
            speak(row.answer, {
              voice: s.tts_voice,
              rate: Number(s.tts_rate),
              pitch: Number(s.tts_pitch),
              volume: Number(s.tts_volume),
            });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "system_logs" },
        (payload) => {
          setLogs((prev) => [payload.new as LogRow, ...prev].slice(0, 200));
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  // side effects for incoming events (overlay, follower alert, tts)
  const handleSideEffects = useCallback(
    (row: EventRow) => {
      const s = settingsRef.current;
      if (row.event_type === "follow") {
        toast.success(`✨ @${row.username} baru saja follow!`, { duration: 4000 });
      }
      if (row.event_type === "gift") {
        const min = s?.min_coins_popup ?? 10;
        const config = getGift(row.gift_id, row.gift_name);
        const key = `${row.username}:${row.gift_id ?? row.gift_name}`;
        const now = Date.now();
        const prev = comboRef.current.get(key);
        const combo = prev && now - prev.at < 4000 ? prev.count + row.gift_count : row.gift_count;
        comboRef.current.set(key, { count: combo, at: now });
        if (row.gift_coins >= min) {
          pushOverlay({
            id: row.id,
            username: row.username,
            nickname: row.nickname ?? row.username,
            avatar: row.avatar,
            giftName: row.gift_name ?? "Gift",
            emoji: config?.emoji ?? "🎁",
            count: combo,
            coins: row.gift_coins,
            category: row.gift_category ?? "Normal",
            vipLevel: config?.vip_level ?? 1,
            animation: config?.animation ?? "Small",
            duration: config?.animation_duration ?? 2500,
          });
        }
      }
      if (
        row.event_type === "comment" &&
        row.comment &&
        s?.tts_enabled &&
        s.tts_auto_read &&
        row.is_question
      ) {
        speak(row.comment, {
          voice: s.tts_voice,
          rate: Number(s.tts_rate),
          pitch: Number(s.tts_pitch),
          volume: Number(s.tts_volume),
        });
      }
    },
    [getGift, pushOverlay],
  );

  // ---------------- connection control ----------------
  const attachAdapter = useCallback(
    async (clean: string, mode: "demo" | "bridge", endpoint?: string) => {
      adapterRef.current?.disconnect();

      const callbacks = {
        onEvent: (event: NormalizedEvent) => {
          if (pausedRef.current) return;
          void processorRef.current?.process(event);
        },
        onStatus: (next: ConnectionStatus, message?: string) => {
          setStatus(next);
          setStatusMessage(message ?? "");
        },
        onLog: (level: "INFO" | "WARN" | "ERROR", message: string) => log(level, message, "provider"),
      };

      const adapter =
        mode === "demo" || !endpoint?.startsWith("ws")
          ? createDemoAdapter(callbacks)
          : createWsAdapter(endpoint, callbacks);
      adapterRef.current = adapter;
      setProviderLabel(adapter.name);
      setProviderOfficial(adapter.official);
      await adapter.connect(clean);
    },
    [log],
  );

  const connect = useCallback(
    async (username: string, mode: "demo" | "bridge", endpoint?: string) => {
      const clean = username.trim().replace(/^@/, "");
      if (!clean) {
        toast.error("Username TikTok wajib diisi");
        return;
      }
      if (mode === "bridge" && !endpoint?.startsWith("ws")) {
        toast.error("Endpoint bridge harus berupa URL WebSocket (ws:// atau wss://)");
        return;
      }

      adapterRef.current?.disconnect();
      processorRef.current?.reset();

      const { data, error } = await supabase
        .from("live_sessions")
        .insert({
          account_username: clean,
          provider: mode,
          live_url: `https://www.tiktok.com/@${clean}/live`,
          status: "live",
        })
        .select("*")
        .single();

      if (error || !data) {
        toast.error(`Gagal membuat sesi: ${error?.message ?? "unknown"}`);
        return;
      }
      setSession(data);
      sessionRef.current = data;
      setPausedState(false);
      pausedRef.current = false;

      await attachAdapter(clean, mode, endpoint);
      toast.success(
        mode === "demo"
          ? "DEMO MODE aktif — semua data disimulasikan"
          : "Menghubungkan ke bridge pihak ketiga (tidak resmi)",
      );
    },
    [attachAdapter],
  );

  const disconnect = useCallback(async () => {
    adapterRef.current?.disconnect();
    adapterRef.current = null;
    stopSpeaking();
    aiQueueRef.current?.clear();
    setAiQueueSize(0);
    const current = sessionRef.current;
    if (current) {
      await supabase
        .from("live_sessions")
        .update({ ended_at: new Date().toISOString(), status: "ended" })
        .eq("id", current.id);
      log("INFO", `Sesi @${current.account_username} diakhiri`);
    }
    setSession(null);
    setStatus("disconnected");
    setStatusMessage("");
    setProviderLabel("Belum terhubung");
    processorRef.current?.reset();
  }, [log]);

  const setPaused = useCallback((value: boolean) => {
    pausedRef.current = value;
    setPausedState(value);
  }, []);

  const setAiMuted = useCallback((value: boolean) => {
    mutedRef.current = value;
    setAiMutedState(value);
    aiQueueRef.current?.setEnabled(!value);
    if (value) stopSpeaking();
  }, []);

  const clearFeed = useCallback(() => {
    setEvents([]);
    setAiResponses([]);
  }, []);

  const injectDemoEvent = useCallback((event: NormalizedEvent) => {
    if (adapterRef.current?.inject) adapterRef.current.inject(event);
    else void processorRef.current?.process(event);
  }, []);

  const comments = useMemo(
    () => events.filter((e) => e.event_type === "comment"),
    [events],
  );
  const gifts = useMemo(() => events.filter((e) => e.event_type === "gift"), [events]);

  const totals = useMemo(() => {
    let coins = 0;
    let giftCount = 0;
    let follows = 0;
    let likes = 0;
    let shares = 0;
    for (const p of participants) {
      coins += p.gift_coins;
      giftCount += p.gift_count;
      follows += p.follow_count;
    }
    for (const e of events) {
      if (e.event_type === "like") likes += 1;
      if (e.event_type === "share") shares += 1;
    }
    return {
      comments: participants.reduce((sum, p) => sum + p.comment_count, 0),
      gifts: giftCount,
      coins,
      follows,
      likes,
      shares,
      viewers: participants.length,
      aiAnswers: aiResponses.length,
    };
  }, [participants, events, aiResponses.length]);

  const value: LiveContextValue = {
    session,
    status,
    statusMessage,
    providerLabel,
    providerOfficial,
    events,
    comments,
    gifts,
    participants,
    aiResponses,
    logs,
    giftCatalog,
    settings,
    aiSettings,
    activeQuestion,
    overlay,
    paused,
    aiQueueSize,
    aiMuted,
    totals,
    connect,
    disconnect,
    setPaused,
    setAiMuted,
    clearFeed,
    injectDemoEvent,
    refreshCatalog,
    refreshSettings,
    reloadActiveQuestion,
  };

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useLive() {
  const ctx = useContext(LiveContext);
  if (!ctx) throw new Error("useLive harus dipakai di dalam LiveProvider");
  return ctx;
}
