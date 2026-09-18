import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { exportCsv, exportJson } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Riwayat & Laporan — LIVE AI INTERACTION" },
      {
        name: "description",
        content:
          "Riwayat sesi TikTok LIVE lengkap dengan ringkasan komentar, gift, koin, dan unduhan laporan.",
      },
      { property: "og:title", content: "Riwayat & Laporan — LIVE AI INTERACTION" },
      {
        property: "og:description",
        content: "Ringkasan tiap sesi LIVE dan unduhan laporan CSV/JSON.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

interface Summary {
  session: Tables<"live_sessions">;
  comments: number;
  gifts: number;
  coins: number;
  viewers: number;
}

function HistoryPage() {
  const [rows, setRows] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: sessions } = await supabase
      .from("live_sessions")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(50);

    const result: Summary[] = [];
    for (const session of sessions ?? []) {
      const { data: parts } = await supabase
        .from("participants")
        .select("comment_count, gift_count, gift_coins")
        .eq("session_id", session.id);
      result.push({
        session,
        comments: (parts ?? []).reduce((s, p) => s + p.comment_count, 0),
        gifts: (parts ?? []).reduce((s, p) => s + p.gift_count, 0),
        coins: (parts ?? []).reduce((s, p) => s + p.gift_coins, 0),
        viewers: (parts ?? []).length,
      });
    }
    setRows(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function report(summary: Summary) {
    const [events, parts, ai] = await Promise.all([
      supabase.from("live_events").select("*").eq("session_id", summary.session.id),
      supabase.from("participants").select("*").eq("session_id", summary.session.id),
      supabase.from("ai_responses").select("*").eq("session_id", summary.session.id),
    ]);
    exportJson(`laporan-${summary.session.account_username}-${summary.session.id.slice(0, 8)}`, {
      sesi: summary.session,
      ringkasan: {
        komentar: summary.comments,
        gift: summary.gifts,
        koin: summary.coins,
        penonton: summary.viewers,
        jawaban_ai: ai.data?.length ?? 0,
      },
      peserta: parts.data ?? [],
      event: events.data ?? [],
      jawaban_ai: ai.data ?? [],
    });
    toast.success("Laporan diunduh");
  }

  async function remove(id: string) {
    const { error } = await supabase.from("live_sessions").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    void load();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Riwayat & Laporan</h1>
          <p className="text-sm text-muted-foreground">{rows.length} sesi tersimpan</p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() =>
            exportCsv(
              "riwayat-sesi",
              rows.map((row) => ({
                username: row.session.account_username,
                provider: row.session.provider,
                mulai: row.session.started_at,
                selesai: row.session.ended_at ?? "",
                komentar: row.comments,
                gift: row.gifts,
                koin: row.coins,
                penonton: row.viewers,
              })),
            )
          }
        >
          <Download className="size-4" /> Ekspor semua
        </Button>
      </div>

      <section className="glass-panel overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Akun</TableHead>
              <TableHead>Mulai</TableHead>
              <TableHead>Durasi</TableHead>
              <TableHead className="text-right">Penonton</TableHead>
              <TableHead className="text-right">Komentar</TableHead>
              <TableHead className="text-right">Gift</TableHead>
              <TableHead className="text-right">Koin</TableHead>
              <TableHead className="w-32 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const start = new Date(row.session.started_at).getTime();
              const end = row.session.ended_at
                ? new Date(row.session.ended_at).getTime()
                : Date.now();
              const minutes = Math.max(1, Math.round((end - start) / 60000));
              return (
                <TableRow key={row.session.id}>
                  <TableCell>
                    <p className="font-medium">@{row.session.account_username}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.session.provider === "demo" ? "DEMO MODE" : "Bridge pihak ketiga"}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(row.session.started_at).toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-sm">
                    {minutes} menit {row.session.ended_at ? "" : "(berjalan)"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.viewers}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.comments}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.gifts}</TableCell>
                  <TableCell className="text-right tabular-nums text-vip">
                    {row.coins.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => report(row)}>
                      <FileText className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(row.session.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {!rows.length && !loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                  Belum ada sesi tersimpan.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
