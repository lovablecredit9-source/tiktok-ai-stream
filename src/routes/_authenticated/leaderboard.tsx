import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LeaderboardTable } from "@/components/app/leaderboard-table";
import { ParticipantDialog } from "@/components/app/participant-dialog";
import { useLive } from "@/context/live-context";
import { exportCsv } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — LIVE AI INTERACTION" },
      {
        name: "description",
        content:
          "Peringkat penonton LIVE berdasarkan komentar, jawaban kuis benar, follow, dan total koin gift.",
      },
      { property: "og:title", content: "Leaderboard — LIVE AI INTERACTION" },
      {
        property: "og:description",
        content: "Peringkat penonton berdasarkan komentar, kuis, dan gift.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { participants, session } = useLive();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">
            {session ? `Sesi @${session.account_username}` : "Belum ada sesi aktif"} ·{" "}
            {participants.length} penonton
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() =>
            exportCsv(
              `leaderboard-${session?.account_username ?? "sesi"}`,
              participants.map((p, index) => ({
                peringkat: index + 1,
                username: p.username,
                nickname: p.nickname,
                komentar: p.comment_count,
                benar: p.correct_answers,
                salah: p.wrong_answers,
                follow: p.follow_count,
                gift: p.gift_count,
                koin: p.gift_coins,
                skor: p.score,
              })),
            )
          }
        >
          <Download className="size-4" /> Ekspor CSV
        </Button>
      </div>

      <section className="glass-panel overflow-hidden">
        <LeaderboardTable rows={participants} onSelect={setSelected} />
      </section>

      <ParticipantDialog username={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
