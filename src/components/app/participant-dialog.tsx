import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/app/feeds";
import { useLive } from "@/context/live-context";

export function ParticipantDialog({
  username,
  onClose,
}: {
  username: string | null;
  onClose: () => void;
}) {
  const { participants, events } = useLive();
  const participant = participants.find((p) => p.username === username) ?? null;
  const history = events.filter((e) => e.username === username).slice(0, 40);

  return (
    <Dialog open={Boolean(username)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Profil Penonton</DialogTitle>
        </DialogHeader>
        {!participant ? (
          <p className="text-sm text-muted-foreground">Data penonton tidak ditemukan.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={participant.nickname ?? participant.username} src={participant.avatar} />
              <div>
                <p className="font-semibold">{participant.nickname ?? participant.username}</p>
                <p className="text-xs text-muted-foreground">@{participant.username}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ["Komentar", participant.comment_count],
                ["Jawaban benar", participant.correct_answers],
                ["Jawaban salah", participant.wrong_answers],
                ["Follow", participant.follow_count],
                ["Gift", participant.gift_count],
                ["Koin", participant.gift_coins],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl bg-secondary/60 p-3">
                  <p className="text-lg font-bold tabular-nums">
                    {Number(value).toLocaleString("id-ID")}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-primary/10 p-3 text-center">
              <p className="text-2xl font-bold text-primary">
                {participant.score.toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-muted-foreground">Total skor</p>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Riwayat aktivitas
              </p>
              <ScrollArea className="h-48 rounded-xl border border-border">
                <div className="divide-y divide-border/60">
                  {history.map((row) => (
                    <div key={row.id} className="px-3 py-2 text-sm">
                      <span className="text-muted-foreground">
                        {new Date(row.created_at).toLocaleTimeString("id-ID")}
                      </span>{" "}
                      {row.event_type === "comment"
                        ? row.comment
                        : row.event_type === "gift"
                          ? `${row.gift_name} x${row.gift_count}`
                          : row.event_type}
                    </div>
                  ))}
                  {!history.length ? (
                    <p className="p-3 text-sm text-muted-foreground">Belum ada aktivitas.</p>
                  ) : null}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
