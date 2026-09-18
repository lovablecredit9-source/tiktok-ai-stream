import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Save, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLive } from "@/context/live-context";
import { supabase } from "@/integrations/supabase/client";
import { listVoices, speak, ttsSupported } from "@/lib/tts";
import { testAiConnection } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Pengaturan — LIVE AI INTERACTION" },
      {
        name: "description",
        content:
          "Atur model AI, prompt sistem, batas permintaan, skor poin, suara TTS, dan sumber koneksi LIVE.",
      },
      { property: "og:title", content: "Pengaturan — LIVE AI INTERACTION" },
      {
        property: "og:description",
        content: "Atur AI, skor, suara TTS, dan sumber koneksi LIVE.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const MODELS = [
  "openai/gpt-6-astra",
  "openai/gpt-5.6-terra",
  "openai/gpt-5.6-luna",
  "google/gemini-3.8-flash",
];

function SettingsPage() {
  const { settings, aiSettings, refreshSettings } = useLive();
  const [ai, setAi] = useState(aiSettings);
  const [app, setApp] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [voices, setVoices] = useState<string[]>([]);

  useEffect(() => setAi(aiSettings), [aiSettings]);
  useEffect(() => setApp(settings), [settings]);

  useEffect(() => {
    if (!ttsSupported()) return;
    const read = () => setVoices(listVoices().map((v) => `${v.name}`));
    read();
    window.speechSynthesis.onvoiceschanged = read;
  }, []);

  async function saveAi() {
    if (!ai) return;
    setSaving(true);
    const { error } = await supabase
      .from("ai_settings")
      .update({
        provider: ai.provider,
        base_url: ai.base_url,
        model: ai.model,
        system_prompt: ai.system_prompt.slice(0, 2000),
        temperature: ai.temperature,
        max_tokens: ai.max_tokens,
        max_requests_per_minute: ai.max_requests_per_minute,
        cooldown_seconds: ai.cooldown_seconds,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ai.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Pengaturan AI disimpan");
    void refreshSettings();
  }

  async function saveApp() {
    if (!app) return;
    setSaving(true);
    const { error } = await supabase
      .from("app_settings")
      .update({
        point_comment: app.point_comment,
        point_follow: app.point_follow,
        point_correct_answer: app.point_correct_answer,
        coin_to_point: app.coin_to_point,
        min_coins_popup: app.min_coins_popup,
        tts_enabled: app.tts_enabled,
        tts_voice: app.tts_voice,
        tts_rate: app.tts_rate,
        tts_pitch: app.tts_pitch,
        tts_volume: app.tts_volume,
        tts_auto_read: app.tts_auto_read,
        ai_enabled: app.ai_enabled,
        provider_name: app.provider_name,
        provider_endpoint: app.provider_endpoint,
        updated_at: new Date().toISOString(),
      })
      .eq("id", app.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Pengaturan disimpan");
    void refreshSettings();
  }

  async function test() {
    const result = await testAiConnection();
    if (result.ok) toast.success(`AI OK · ${result.model} · ${result.latencyMs} ms`);
    else toast.error(result.message);
  }

  if (!ai || !app) {
    return <p className="text-sm text-muted-foreground">Memuat pengaturan…</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">
          Konfigurasi AI, skor, suara, dan sumber koneksi LIVE.
        </p>
      </div>

      <Tabs defaultValue="ai">
        <TabsList>
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="score">Skor</TabsTrigger>
          <TabsTrigger value="tts">Suara</TabsTrigger>
          <TabsTrigger value="source">Sumber LIVE</TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="mt-4">
          <section className="glass-panel space-y-4 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Penyedia AI</Label>
                <Select
                  value={ai.provider}
                  onValueChange={(v) => setAi({ ...ai, provider: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lovable">Lovable AI (tanpa kunci)</SelectItem>
                    <SelectItem value="custom">Router custom (butuh kunci server)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Model</Label>
                {ai.provider === "lovable" ? (
                  <Select value={ai.model} onValueChange={(v) => setAi({ ...ai, model: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODELS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={ai.model}
                    onChange={(e) => setAi({ ...ai, model: e.target.value })}
                  />
                )}
              </div>
            </div>

            {ai.provider === "custom" ? (
              <div className="space-y-1.5">
                <Label>Base URL</Label>
                <Input
                  placeholder="https://openrouter.ai/api/v1"
                  value={ai.base_url ?? ""}
                  onChange={(e) => setAi({ ...ai, base_url: e.target.value })}
                />
                <p className="flex items-start gap-2 text-xs text-muted-foreground">
                  <KeyRound className="mt-0.5 size-3.5 shrink-0" />
                  Kunci API disimpan sebagai rahasia server bernama CUSTOM_AI_API_KEY dan tidak
                  pernah dikirim ke browser. Minta bantuan untuk menambahkannya bila belum ada.
                </p>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label>Prompt sistem</Label>
              <Textarea
                rows={5}
                value={ai.system_prompt}
                onChange={(e) => setAi({ ...ai, system_prompt: e.target.value })}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label>Temperature</Label>
                <Input
                  type="number"
                  step="0.1"
                  min={0}
                  max={2}
                  value={ai.temperature}
                  onChange={(e) => setAi({ ...ai, temperature: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Maks token</Label>
                <Input
                  type="number"
                  value={ai.max_tokens}
                  onChange={(e) => setAi({ ...ai, max_tokens: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Maks permintaan / menit</Label>
                <Input
                  type="number"
                  min={1}
                  value={ai.max_requests_per_minute}
                  onChange={(e) =>
                    setAi({ ...ai, max_requests_per_minute: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cooldown per penonton (detik)</Label>
                <Input
                  type="number"
                  min={0}
                  value={ai.cooldown_seconds}
                  onChange={(e) => setAi({ ...ai, cooldown_seconds: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={saveAi} disabled={saving} className="gap-2">
                <Save className="size-4" /> Simpan
              </Button>
              <Button variant="outline" onClick={test}>
                Uji koneksi AI
              </Button>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="score" className="mt-4">
          <section className="glass-panel space-y-4 p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Poin per komentar</Label>
                <Input
                  type="number"
                  value={app.point_comment}
                  onChange={(e) => setApp({ ...app, point_comment: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Poin per follow</Label>
                <Input
                  type="number"
                  value={app.point_follow}
                  onChange={(e) => setApp({ ...app, point_follow: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Poin jawaban benar</Label>
                <Input
                  type="number"
                  value={app.point_correct_answer}
                  onChange={(e) =>
                    setApp({ ...app, point_correct_answer: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Konversi koin ke poin</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={app.coin_to_point}
                  onChange={(e) => setApp({ ...app, coin_to_point: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Minimum koin untuk popup</Label>
                <Input
                  type="number"
                  value={app.min_coins_popup}
                  onChange={(e) => setApp({ ...app, min_coins_popup: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-3">
                <Label htmlFor="ai-enabled">AI jawab otomatis</Label>
                <Switch
                  id="ai-enabled"
                  checked={app.ai_enabled}
                  onCheckedChange={(v) => setApp({ ...app, ai_enabled: v })}
                />
              </div>
            </div>
            <Button onClick={saveApp} disabled={saving} className="gap-2">
              <Save className="size-4" /> Simpan
            </Button>
          </section>
        </TabsContent>

        <TabsContent value="tts" className="mt-4">
          <section className="glass-panel space-y-4 p-4">
            {!ttsSupported() ? (
              <p className="text-sm text-warning">
                Browser ini tidak mendukung pembacaan suara.
              </p>
            ) : null}
            <div className="flex items-center justify-between rounded-xl bg-secondary/50 p-3">
              <Label htmlFor="tts">Aktifkan suara</Label>
              <Switch
                id="tts"
                checked={app.tts_enabled}
                onCheckedChange={(v) => setApp({ ...app, tts_enabled: v })}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-secondary/50 p-3">
              <Label htmlFor="tts-auto">Baca otomatis jawaban AI & pertanyaan</Label>
              <Switch
                id="tts-auto"
                checked={app.tts_auto_read}
                onCheckedChange={(v) => setApp({ ...app, tts_auto_read: v })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Suara</Label>
              <Select
                value={app.tts_voice ?? "default"}
                onValueChange={(v) => setApp({ ...app, tts_voice: v === "default" ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Otomatis (Bahasa Indonesia)</SelectItem>
                  {voices.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(
              [
                ["Kecepatan", "tts_rate", 0.5, 2],
                ["Nada", "tts_pitch", 0, 2],
                ["Volume", "tts_volume", 0, 1],
              ] as const
            ).map(([label, key, min, max]) => (
              <div key={key} className="space-y-2">
                <Label>
                  {label}: {Number(app[key]).toFixed(1)}
                </Label>
                <Slider
                  min={min}
                  max={max}
                  step={0.1}
                  value={[Number(app[key])]}
                  onValueChange={([v]) => setApp({ ...app, [key]: v ?? 1 })}
                />
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button onClick={saveApp} disabled={saving} className="gap-2">
                <Save className="size-4" /> Simpan
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() =>
                  speak("Halo, ini contoh suara untuk LIVE AI INTERACTION.", {
                    voice: app.tts_voice,
                    rate: Number(app.tts_rate),
                    pitch: Number(app.tts_pitch),
                    volume: Number(app.tts_volume),
                  })
                }
              >
                <Volume2 className="size-4" /> Tes suara
              </Button>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="source" className="mt-4">
          <section className="glass-panel space-y-4 p-4">
            <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
              TikTok tidak menyediakan API publik untuk event LIVE. Aplikasi ini memakai DEMO
              MODE (simulasi lokal) atau bridge pihak ketiga yang Anda sediakan sendiri —
              keduanya bukan koneksi resmi TikTok.
            </div>
            <div className="space-y-1.5">
              <Label>Nama provider</Label>
              <Select
                value={app.provider_name}
                onValueChange={(v) => setApp({ ...app, provider_name: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="demo">DEMO MODE (simulasi lokal)</SelectItem>
                  <SelectItem value="bridge">Bridge pihak ketiga</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Endpoint WebSocket bridge (opsional)</Label>
              <Input
                placeholder="wss://bridge-anda.example/live?user={username}"
                value={app.provider_endpoint ?? ""}
                onChange={(e) => setApp({ ...app, provider_endpoint: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Gunakan {"{username}"} sebagai placeholder untuk akun TikTok.
              </p>
            </div>
            <Button onClick={saveApp} disabled={saving} className="gap-2">
              <Save className="size-4" /> Simpan
            </Button>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
