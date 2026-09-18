import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: "primary" | "accent" | "vip" | "success";
}) {
  const toneClass = {
    primary: "text-primary",
    accent: "text-accent",
    vip: "text-vip",
    success: "text-success",
  }[tone];

  return (
    <div className="glass-panel relative overflow-hidden p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{value}</p>
          {hint ? <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <span className={cn("rounded-xl bg-secondary p-2", toneClass)}>
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  );
}
