import { Pause, Play, Power, Radio, Trash2, VolumeX, Volume2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLive } from "@/context/live-context";
import { stopSpeaking } from "@/lib/tts";

export function LiveControls({ compact = false }: { compact?: boolean }) {
  const {
    session,
    connect,
    disconnect,
    paused,
    setPaused,
    aiMuted,
    setAiMuted,
    clearFeed,
    settings,
  } = useLive();
  const [username, setUsername] = useState("");
  const [mode, setMode] = useState<"demo" | "bridge">("demo");
  const [endpoint, setEndpoint] = useState(settings?.provider_endpoint ?? "");
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    await connect(username, mode, endpoint);
    setBusy(false);
  }

  async function stop() {
    setBusy(true);
    stopSpeaking();
    await disconnect();
    setBusy(false);
  }

  return (
    <div className="glass-panel space-y-4 p-4">
      {!session ? (
        <div className="grid gap-3 md:grid-cols-[1fr_180px_auto] md:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="tiktok-username">Username TikTok</Label>
            <Input
              id="tiktok-username"
              placeholder="contoh: namaakun"
              value={username}
              maxLength={60}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Mode koneksi</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as "demo" | "bridge")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="demo">DEMO MODE (simulasi)</SelectItem>
                <SelectItem value="bridge">Bridge pihak ketiga</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={start} disabled={busy} className="gap-2">
            <Radio className="size-4" /> Mulai LIVE
          </Button>

          {mode === "bridge" ? (
            <div className="space-y-1.5 md:col-span-3">
              <Label htmlFor="bridge-endpoint">Endpoint WebSocket bridge</Label>
              <Input
                id="bridge-endpoint"
                placeholder="wss://bridge-anda.example/live?user={username}"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
              />
              <p className="text-xs text-warning">
                TikTok tidak menyediakan API LIVE publik. Endpoint ini milik pihak ketiga dan
                bukan koneksi resmi TikTok.
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground md:col-span-3">
              DEMO MODE menghasilkan komentar, gift, dan follower simulasi sehingga seluruh
              fitur bisa diuji tanpa koneksi eksternal.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="destructive" onClick={stop} disabled={busy} className="gap-2">
            <Power className="size-4" /> Akhiri LIVE
          </Button>
          <Button
            variant="outline"
            onClick={() => setPaused(!paused)}
            className="gap-2"
          >
            {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
            {paused ? "Lanjutkan" : "Jeda event"}
          </Button>
          <Button variant="outline" onClick={() => setAiMuted(!aiMuted)} className="gap-2">
            {aiMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            {aiMuted ? "AI nonaktif" : "AI aktif"}
          </Button>
          <Button variant="ghost" onClick={clearFeed} className="gap-2">
            <Trash2 className="size-4" /> Bersihkan feed
          </Button>
          {!compact ? (
            <span className="text-xs text-muted-foreground">
              Sesi: @{session.account_username} · provider {session.provider}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
