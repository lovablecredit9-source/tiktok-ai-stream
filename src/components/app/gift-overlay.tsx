import { useLive } from "@/context/live-context";
import { cn } from "@/lib/utils";

const SIZE: Record<string, string> = {
  Small: "text-4xl",
  Medium: "text-5xl",
  Large: "text-6xl",
  Huge: "text-7xl",
  Massive: "text-8xl",
};

const TONE: Record<string, string> = {
  Normal: "glow-primary",
  Special: "glow-primary",
  VIP: "glow-accent",
  "Super VIP": "glow-vip",
  "Ultra VIP": "glow-vip",
};

export function GiftOverlay() {
  const { overlay } = useLive();
  if (!overlay) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4">
      <div
        className={cn(
          "animate-pop-in glass-panel flex items-center gap-4 bg-card/90 px-6 py-4",
          TONE[overlay.category] ?? "glow-primary",
        )}
      >
        <span className={cn(SIZE[overlay.animation] ?? "text-4xl", "leading-none")}>
          {overlay.emoji}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {overlay.nickname}{" "}
            <span className="font-normal text-muted-foreground">@{overlay.username}</span>
          </p>
          <p className="truncate text-lg font-bold text-gradient">
            {overlay.giftName} x{overlay.count}
          </p>
          <p className="text-xs font-medium text-vip">
            {overlay.coins.toLocaleString("id-ID")} koin · {overlay.category} · VIP{" "}
            {overlay.vipLevel}
          </p>
        </div>
      </div>
    </div>
  );
}
