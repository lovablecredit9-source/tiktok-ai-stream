import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EventFeed } from "@/components/app/feeds";
import { useLive } from "@/context/live-context";
import { exportJson } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/events")({
  head: () => ({
    meta: [
      { title: "Event LIVE — LIVE AI INTERACTION" },
      {
        name: "description",
        content:
          "Telusuri semua event LIVE: komentar, gift, follow, like, dan share dengan filter dan pencarian.",
      },
      { property: "og:title", content: "Event LIVE — LIVE AI INTERACTION" },
      {
        property: "og:description",
        content: "Telusuri komentar, gift, follow, like, dan share dari sesi LIVE.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const { events } = useLive();
  const [type, setType] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((row) => {
      if (type !== "all" && row.event_type !== type) return false;
      if (!q) return true;
      return (
        row.username.toLowerCase().includes(q) ||
        (row.comment ?? "").toLowerCase().includes(q) ||
        (row.gift_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [events, type, query]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Event LIVE</h1>
        <p className="text-sm text-muted-foreground">
          {filtered.length} dari {events.length} event
        </p>
      </div>

      <div className="glass-panel flex flex-wrap items-center gap-3 p-4">
        <Input
          className="max-w-xs"
          placeholder="Cari username, komentar, atau gift…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua jenis</SelectItem>
            <SelectItem value="comment">Komentar</SelectItem>
            <SelectItem value="gift">Gift</SelectItem>
            <SelectItem value="follow">Follow</SelectItem>
            <SelectItem value="like">Like</SelectItem>
            <SelectItem value="share">Share</SelectItem>
            <SelectItem value="join">Join</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => exportJson("event-live", filtered)}
        >
          <Download className="size-4" /> Ekspor JSON
        </Button>
      </div>

      <section className="glass-panel overflow-hidden">
        <EventFeed events={filtered} height="h-[620px]" />
      </section>
    </div>
  );
}
