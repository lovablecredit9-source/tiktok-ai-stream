import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/lib/live/types";

const LABEL: Record<ConnectionStatus, string> = {
  disconnected: "Terputus",
  connecting: "Menghubungkan",
  connected: "Terhubung",
  reconnecting: "Menyambung ulang",
  error: "Error",
};

export function StatusBadge({
  status,
  className,
}: {
  status: ConnectionStatus;
  className?: string;
}) {
  const tone =
    status === "connected"
      ? "bg-success/15 text-success"
      : status === "error"
        ? "bg-destructive/15 text-destructive"
        : status === "disconnected"
          ? "bg-muted text-muted-foreground"
          : "bg-warning/15 text-warning";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
        tone,
        className,
      )}
    >
      <span
        className={cn(
          "size-2 rounded-full bg-current",
          status === "connected" && "animate-pulse-ring",
        )}
      />
      {LABEL[status]}
    </span>
  );
}
