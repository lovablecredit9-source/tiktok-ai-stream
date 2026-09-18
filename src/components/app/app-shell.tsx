import { Link, useRouter } from "@tanstack/react-router";
import {
  Activity,
  Bot,
  Gift,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Menu,
  Radio,
  ScrollText,
  Settings,
  HelpCircle,
  History,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/app/status-badge";
import { GiftOverlay } from "@/components/app/gift-overlay";
import { useLive } from "@/context/live-context";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/live", label: "Kontrol LIVE", icon: Radio },
  { to: "/quiz", label: "Kuis", icon: HelpCircle },
  { to: "/leaderboard", label: "Leaderboard", icon: ListOrdered },
  { to: "/events", label: "Event", icon: Activity },
  { to: "/gifts", label: "Gift Manager", icon: Gift },
  { to: "/history", label: "Riwayat & Laporan", icon: History },
  { to: "/logs", label: "Log Sistem", icon: ScrollText },
  { to: "/settings", label: "Pengaturan", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { status, session, providerLabel, providerOfficial, aiQueueSize } = useLive();
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    void router.navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen">
      <GiftOverlay />

      {/* sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-sidebar-border bg-sidebar transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Bot className="size-5" />
            </span>
            <span className="text-sm font-bold leading-tight">
              <span className="block text-gradient">LIVE AI</span>
              <span className="block text-[11px] font-medium text-muted-foreground">
                INTERACTION
              </span>
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        <nav className="space-y-1 px-3 pb-6">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{
                className:
                  "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary",
              }}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mx-3 rounded-xl border border-border bg-card/60 p-3 text-xs">
          <p className="font-semibold text-foreground">Provider</p>
          <p className="mt-1 text-muted-foreground">{providerLabel}</p>
          {!providerOfficial ? (
            <p className="mt-2 text-[11px] leading-snug text-warning">
              Bukan koneksi resmi TikTok. Data berasal dari simulasi atau bridge pihak
              ketiga.
            </p>
          ) : null}
        </div>

        <div className="absolute inset-x-3 bottom-4">
          <Button variant="outline" className="w-full justify-start gap-2" onClick={signOut}>
            <LogOut className="size-4" /> Keluar
          </Button>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          aria-label="Tutup menu"
          className="fixed inset-0 z-30 bg-background/70 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      {/* main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {session ? `@${session.account_username}` : "Belum ada sesi LIVE"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {session
                ? `Mulai ${new Date(session.started_at).toLocaleTimeString("id-ID")}`
                : "Buka Kontrol LIVE untuk memulai"}
            </p>
          </div>
          {aiQueueSize > 0 ? (
            <span className="hidden rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent sm:inline">
              Antrian AI: {aiQueueSize}
            </span>
          ) : null}
          <StatusBadge status={status} />
        </header>

        <main className="p-4 pb-16 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
