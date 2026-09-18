import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLive } from "@/context/live-context";
import { exportJson } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/logs")({
  head: () => ({
    meta: [
      { title: "Log Sistem — LIVE AI INTERACTION" },
      {
        name: "description",
        content:
          "Log sistem realtime untuk koneksi LIVE, pemrosesan event, dan layanan AI beserta tingkat keparahannya.",
      },
      { property: "og:title", content: "Log Sistem — LIVE AI INTERACTION" },
      {
        property: "og:description",
        content: "Log realtime koneksi, pemrosesan event, dan layanan AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LogsPage,
});

function LogsPage() {
  const { logs } = useLive();
  const [level, setLevel] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((row) => {
      if (level !== "all" && row.level !== level) return false;
      return !q || row.message.toLowerCase().includes(q);
    });
  }, [logs, level, query]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Log Sistem</h1>
        <p className="text-sm text-muted-foreground">
          {filtered.length} entri · diperbarui realtime
        </p>
      </div>

      <div className="glass-panel flex flex-wrap items-center gap-3 p-4">
        <Input
          className="max-w-xs"
          placeholder="Cari pesan log…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua level</SelectItem>
            <SelectItem value="INFO">INFO</SelectItem>
            <SelectItem value="WARN">WARN</SelectItem>
            <SelectItem value="ERROR">ERROR</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2" onClick={() => exportJson("log-sistem", filtered)}>
          <Download className="size-4" /> Ekspor
        </Button>
      </div>

      <section className="glass-panel overflow-hidden">
        <ScrollArea className="h-[600px]">
          <div className="divide-y divide-border/60">
            {filtered.map((row) => (
              <div key={row.id} className="flex items-start gap-3 px-4 py-2.5 text-sm">
                <Badge
                  className={
                    row.level === "ERROR"
                      ? "bg-destructive/15 text-destructive"
                      : row.level === "WARN"
                        ? "bg-warning/15 text-warning"
                        : "bg-primary/15 text-primary"
                  }
                >
                  {row.level}
                </Badge>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {new Date(row.created_at).toLocaleTimeString("id-ID")}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{row.source}</span>
                <span className="flex-1 break-words">{row.message}</span>
              </div>
            ))}
            {!filtered.length ? (
              <p className="p-6 text-center text-sm text-muted-foreground">Belum ada log.</p>
            ) : null}
          </div>
        </ScrollArea>
      </section>
    </div>
  );
}
