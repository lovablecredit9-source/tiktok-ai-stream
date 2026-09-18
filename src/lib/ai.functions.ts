import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const AskInput = z.object({
  question: z.string().min(1).max(500),
  username: z.string().min(1).max(120),
});

interface AiSettings {
  provider: string;
  base_url: string | null;
  model: string;
  system_prompt: string;
  temperature: number;
  max_tokens: number;
}

const DEFAULT_SETTINGS: AiSettings = {
  provider: "lovable",
  base_url: null,
  model: "openai/gpt-6-astra",
  system_prompt:
    "Anda adalah AI assistant untuk TikTok LIVE. Jawab komentar penonton secara singkat, ramah, dan natural seperti host LIVE.",
  temperature: 0.7,
  max_tokens: 200,
};

/** Reads the gateway SSE stream and returns the final text. */
async function readResponsesStream(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const payload = JSON.parse(data) as {
          type?: string;
          delta?: string;
          response?: { output_text?: string };
        };
        if (payload.type === "response.output_text.delta" && payload.delta) {
          text += payload.delta;
        } else if (
          payload.type === "response.completed" &&
          !text &&
          payload.response?.output_text
        ) {
          text = payload.response.output_text;
        }
      } catch {
        // ignore malformed keep-alive lines
      }
    }
  }
  return text.trim();
}

function friendlyError(status: number, body: string): string {
  if (status === 402)
    return "Kredit AI habis. Tambahkan kredit pada workspace untuk melanjutkan.";
  if (status === 429) return "Terlalu banyak permintaan AI. Coba lagi sebentar.";
  if (status === 401) return "Kunci API AI tidak valid atau belum diatur.";
  if (status === 403) return "Akses model AI ditolak.";
  return `Layanan AI gagal (${status}). ${body.slice(0, 160)}`;
}

async function callLovableAi(
  settings: AiSettings,
  question: string,
  username: string,
): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("LOVABLE_API_KEY belum tersedia di server.");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: settings.model || "openai/gpt-6-astra",
      instructions: settings.system_prompt,
      input: `Penonton @${username} berkomentar: "${question}"\n\nJawab maksimal 2-3 kalimat pendek dalam Bahasa Indonesia.`,
      stream: true,
      store: false,
      reasoning: { effort: "low", summary: "auto" },
      max_completion_tokens: Math.max(120, settings.max_tokens),
    }),
  });

  if (!response.ok) {
    throw new Error(friendlyError(response.status, await response.text().catch(() => "")));
  }
  const text = await readResponsesStream(response);
  return text || "Maaf, aku belum bisa menjawab itu sekarang.";
}

async function callCustomAi(
  settings: AiSettings,
  question: string,
  username: string,
): Promise<string> {
  const key = process.env["CUSTOM_AI_API_KEY"];
  if (!key)
    throw new Error(
      "Kunci API custom belum diatur di server. Tambahkan rahasia CUSTOM_AI_API_KEY.",
    );
  const baseUrl = (settings.base_url ?? "https://openrouter.ai/api/v1").replace(/\/$/, "");

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: settings.model,
      temperature: settings.temperature,
      max_tokens: settings.max_tokens,
      messages: [
        { role: "system", content: settings.system_prompt },
        {
          role: "user",
          content: `Penonton @${username} berkomentar: "${question}". Jawab singkat dalam Bahasa Indonesia.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(friendlyError(response.status, await response.text().catch(() => "")));
  }
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return (
    data.choices?.[0]?.message?.content?.trim() ||
    "Maaf, aku belum bisa menjawab itu sekarang."
  );
}

async function loadSettings(
  supabase: { from: (t: string) => any },
  userId: string,
): Promise<AiSettings> {
  const { data } = await supabase
    .from("ai_settings")
    .select("provider, base_url, model, system_prompt, temperature, max_tokens")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return DEFAULT_SETTINGS;
  return {
    provider: data.provider ?? "lovable",
    base_url: data.base_url ?? null,
    model: data.model ?? DEFAULT_SETTINGS.model,
    system_prompt: data.system_prompt ?? DEFAULT_SETTINGS.system_prompt,
    temperature: Number(data.temperature ?? 0.7),
    max_tokens: Number(data.max_tokens ?? 200),
  };
}

export const askAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AskInput.parse(input))
  .handler(async ({ data, context }) => {
    const settings = await loadSettings(context.supabase as never, context.userId);
    const answer =
      settings.provider === "custom"
        ? await callCustomAi(settings, data.question, data.username)
        : await callLovableAi(settings, data.question, data.username);
    return { answer, provider: settings.provider, model: settings.model };
  });

export const testAiConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const settings = await loadSettings(context.supabase as never, context.userId);
    const started = Date.now();
    try {
      const answer =
        settings.provider === "custom"
          ? await callCustomAi(settings, "Tes koneksi, balas 'OK'.", "tester")
          : await callLovableAi(settings, "Tes koneksi, balas 'OK'.", "tester");
      return {
        ok: true as const,
        latencyMs: Date.now() - started,
        model: settings.model,
        provider: settings.provider,
        sample: answer.slice(0, 120),
      };
    } catch (error) {
      return {
        ok: false as const,
        latencyMs: Date.now() - started,
        model: settings.model,
        provider: settings.provider,
        message: error instanceof Error ? error.message : "Gagal menghubungi AI",
      };
    }
  });
