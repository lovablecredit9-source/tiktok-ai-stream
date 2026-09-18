import { createFileRoute } from "@tanstack/react-router";
import {
  Bot,
  Coins,
  Gift,
  Heart,
  MessageCircle,
  Share2,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { StatCard } from "@/components/app/stat-card";
import { AiFeed, CommentFeed } from "@/components/app/feeds";
import { LeaderboardTable } from "@/components/app/leaderboard-table";
import { ParticipantDialog } from "@/components/app/participant-dialog";
import { LiveControls } from "@/components/app/live-controls";
import { useLive } from "@/context/live-context";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — LIVE AI INTERACTION" },
      {
        name: "description",
        content:
          "Pantau komentar, gift, follower, dan jawaban AI dari TikTok LIVE secara realtime dalam satu dashboard.",
      },
      { property: "og:title", content: "Dashboard — LIVE AI INTERACTION" },
      {
        property: "og:description",
        content: "Pantau komentar, gift, follower, dan jawaban AI secara realtime.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { totals, comments, aiResponses, participants, providerOfficial, session } = useLive();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Semua interaksi LIVE dalam satu tampilan realtime.
        </p>
      </div>

      {!providerOfficial && session ? (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
          Data berasal dari DEMO MODE / bridge pihak ketiga — bukan koneksi resmi TikTok.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Komentar" value={totals.comments} icon={MessageCircle} />
        <StatCard label="Penonton aktif" value={totals.viewers} icon={Users} tone="accent" />
        <StatCard label="Gift" value={totals.gifts} icon={Gift} tone="vip" />
        <StatCard
          label="Total koin"
          value={totals.coins.toLocaleString("id-ID")}
          icon={Coins}
          tone="vip"
        />
        <StatCard label="Follower baru" value={totals.follows} icon={UserPlus} tone="success" />
        <StatCard label="Like" value={totals.likes} icon={Heart} tone="accent" />
        <StatCard label="Share" value={totals.shares} icon={Share2} />
        <StatCard label="Jawaban AI" value={totals.aiAnswers} icon={Bot} tone="primary" />
      </div>

      <LiveControls compact />

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="glass-panel overflow-hidden">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Komentar Realtime</h2>
            <span className="text-xs text-muted-foreground">{comments.length} terbaru</span>
          </header>
          <CommentFeed comments={comments} onSelect={setSelected} />
        </section>

        <section className="glass-panel overflow-hidden">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Jawaban AI</h2>
            <span className="text-xs text-muted-foreground">{aiResponses.length} jawaban</span>
          </header>
          <AiFeed responses={aiResponses} />
        </section>
      </div>

      <section className="glass-panel overflow-hidden">
        <header className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Top 10 Penonton</h2>
        </header>
        <LeaderboardTable rows={participants} limit={10} onSelect={setSelected} />
      </section>

      <ParticipantDialog username={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
