import { Bot, Gift, HelpCircle, Heart, MessageCircle, Share2, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AiResponseRow, EventRow } from "@/context/live-context";
import { cn } from "@/lib/utils";

function time(value: string) {
  return new Date(value).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function Avatar({ name, src }: { name: string; src?: string | null }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="size-9 shrink-0 rounded-full border border-border object-cover"
      />
    );
  }
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function CommentFeed({
  comments,
  onSelect,
}: {
  comments: EventRow[];
  onSelect?: (username: string) => void;
}) {
  if (!comments.length) {
    return (
      <p className="p-6 text-center text-sm text-muted-foreground">
        Belum ada komentar. Mulai LIVE untuk melihat aktivitas.
      </p>
    );
  }
  return (
    <ScrollArea className="h-[420px]">
      <div className="space-y-2 p-3">
        {comments.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => onSelect?.(row.username)}
            className="animate-slide-in-left flex w-full items-start gap-3 rounded-xl border border-border/60 bg-card/60 p-3 text-left transition-colors hover:bg-secondary/60"
          >
            <Avatar name={row.nickname ?? row.username} src={row.avatar} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-foreground">
                  {row.nickname ?? row.username}
                </span>
                <span className="truncate text-xs text-muted-foreground">@{row.username}</span>
                {row.is_question ? (
                  <Badge className="gap-1 bg-primary/15 text-primary">
                    <HelpCircle className="size-3" /> Tanya
                  </Badge>
                ) : null}
                {row.is_answered ? (
                  <Badge className="gap-1 bg-success/15 text-success">
                    <Bot className="size-3" /> Dijawab
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 break-words text-sm text-foreground/90">{row.comment}</p>
            </div>
            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
              {time(row.created_at)}
            </span>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}

export function AiFeed({ responses }: { responses: AiResponseRow[] }) {
  if (!responses.length) {
    return (
      <p className="p-6 text-center text-sm text-muted-foreground">
        Belum ada jawaban AI. AI otomatis menjawab komentar yang berupa pertanyaan.
      </p>
    );
  }
  return (
    <ScrollArea className="h-[420px]">
      <div className="space-y-3 p-3">
        {responses.map((row) => (
          <div
            key={row.id}
            className="animate-slide-in-left rounded-xl border border-primary/25 bg-primary/5 p-3"
          >
            <p className="text-xs font-medium text-muted-foreground">
              @{row.username} · {time(row.created_at)}
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">{row.question}</p>
            <div className="mt-2 flex gap-2">
              <Bot className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-sm text-foreground/90">{row.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

const ICON = {
  comment: MessageCircle,
  gift: Gift,
  follow: UserPlus,
  like: Heart,
  share: Share2,
  join: UserPlus,
  system: Bot,
};

export function EventFeed({ events, height = "h-[520px]" }: { events: EventRow[]; height?: string }) {
  if (!events.length) {
    return <p className="p-6 text-center text-sm text-muted-foreground">Belum ada event.</p>;
  }
  return (
    <ScrollArea className={height}>
      <div className="divide-y divide-border/60">
        {events.map((row) => {
          const Icon = ICON[row.event_type as keyof typeof ICON] ?? Bot;
          return (
            <div key={row.id} className="flex items-center gap-3 px-3 py-2.5">
              <span
                className={cn(
                  "rounded-lg bg-secondary p-1.5",
                  row.event_type === "gift" && "text-vip",
                  row.event_type === "comment" && "text-primary",
                  row.event_type === "follow" && "text-success",
                  row.event_type === "like" && "text-accent",
                )}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">
                  <span className="font-semibold">@{row.username}</span>{" "}
                  {row.event_type === "comment"
                    ? row.comment
                    : row.event_type === "gift"
                      ? `mengirim ${row.gift_name} x${row.gift_count} (${row.gift_coins} koin)`
                      : row.event_type === "follow"
                        ? "mulai mengikuti"
                        : row.event_type === "like"
                          ? "memberi like"
                          : row.event_type === "share"
                            ? "membagikan LIVE"
                            : "bergabung"}
                </p>
              </div>
              <Badge className="shrink-0 bg-secondary text-muted-foreground">
                +{row.points}
              </Badge>
              <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                {time(row.created_at)}
              </span>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
