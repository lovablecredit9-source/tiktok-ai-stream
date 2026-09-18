import { createFileRoute } from "@tanstack/react-router";
import { Gift, MessageCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { LiveControls } from "@/components/app/live-controls";
import { EventFeed } from "@/components/app/feeds";
import { useLive } from "@/context/live-context";
import { testAiConnection } from "@/lib/ai.functions";
import { toast } from "sonner";
import { ttsSupported } from "@/lib/tts";

export const Route = createFileRoute("/_authenticated/live")({
  head: () => ({
    meta: [
      { title: "Kontrol LIVE — LIVE AI INTERACTION" },
      {
        name: "description",
        content:
          "Mulai dan hentikan sesi TikTok LIVE, pilih DEMO MODE atau bridge pihak ketiga, dan pantau status layanan.",
      },
      { property: "og:title", content: "Kontrol LIVE — LIVE AI INTERACTION" },
      {
        property: "og:description",
        content: "Mulai sesi LIVE, atur mode koneksi, dan pantau status layanan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LivePage,
});

function LivePage() {
  const { events, session, status, statusMessage, providerLabel, injectDemoEvent } = useLive();
  const [manual, setManual] = useState("");
  const [aiStatus, setAiStatus] = useState<string>("Belum diuji");

  async function checkAi() {
    setAiStatus("Menguji…");
    const result = await testAiConnection();
    if (result.ok) {
      setAiStatus(`OK · ${result.model} · ${result.latencyMs} ms`);
      toast.success("Layanan AI siap");
    } else {
      setAiStatus(`Gagal · ${result.message}`);
      toast.error(result.message);
    }
  }

  function inject(type: "comment" | "gift" | "follow") {
    if (!session) {
      toast.error("Mulai sesi LIVE terlebih dahulu");
      return;
    }
    injectDemoEvent({
      eventKey: `manual-${type}-${Date.now()}`,
      type,
      username: "host_test",
      nickname: "Uji Manual",
      comment: type === "comment" ? manual || "Apa itu LIVE AI INTERACTION?" : null,
      giftId: type === "gift" ? "rose" : null,
      giftName: type === "gift" ? "Rose" : null,
      giftCount: 1,
      createdAt: new Date().toISOString(),
      raw: { manual: true },
    });
    setManual("");
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Kontrol LIVE</h1>
        <p className="text-sm text-muted-foreground">
          Kelola koneksi, uji layanan, dan pantau aliran event.
        </p>
      </div>

      <LiveControls />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass-panel space-y-2 p-4">
          <h2 className="text-sm font-semibold">Status layanan</h2>
          <p className="text-sm">
            Koneksi LIVE: <span className="font-medium">{status}</span>
            {statusMessage ? ` — ${statusMessage}` : ""}
          </p>
          <p className="text-sm">
            Provider: <span className="font-medium">{providerLabel}</span>
          </p>
          <p className="text-sm">
            Database: <span className="font-medium text-success">Terhubung</span>
          </p>
          <p className="text-sm">
            TTS browser:{" "}
            <span className="font-medium">
              {ttsSupported() ? "Tersedia" : "Tidak tersedia"}
            </span>
          </p>
          <p className="text-sm">
            Layanan AI: <span className="font-medium">{aiStatus}</span>
          </p>
          <Button variant="outline" size="sm" onClick={checkAi}>
            Uji koneksi AI
          </Button>
        </div>

        <div className="glass-panel space-y-3 p-4">
          <h2 className="text-sm font-semibold">Uji event manual</h2>
          <Input
            placeholder="Tulis komentar uji…"
            value={manual}
            maxLength={300}
            onChange={(e) => setManual(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="gap-2" onClick={() => inject("comment")}>
              <MessageCircle className="size-4" /> Komentar
            </Button>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => inject("gift")}>
              <Gift className="size-4" /> Gift
            </Button>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => inject("follow")}>
              <UserPlus className="size-4" /> Follow
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Event uji diproses melalui pipeline yang sama dengan event LIVE.
          </p>
        </div>

        <div className="glass-panel space-y-2 p-4">
          <h2 className="text-sm font-semibold">Catatan keamanan</h2>
          <p className="text-sm text-muted-foreground">
            Kunci API AI hanya disimpan di server dan tidak pernah dikirim ke browser.
            Seluruh data sesi dibatasi per akun melalui aturan akses database.
          </p>
          <p className="text-sm text-warning">
            Aplikasi ini tidak berafiliasi dengan TikTok dan tidak memakai API resmi TikTok.
          </p>
        </div>
      </div>

      <section className="glass-panel overflow-hidden">
        <header className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Aliran event</h2>
        </header>
        <EventFeed events={events} />
      </section>
    </div>
  );
}
