import { Crown, Medal, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ParticipantRow } from "@/context/live-context";
import { Avatar } from "@/components/app/feeds";

function rankIcon(index: number) {
  if (index === 0) return <Trophy className="size-4 text-vip" />;
  if (index === 1) return <Medal className="size-4 text-muted-foreground" />;
  if (index === 2) return <Medal className="size-4 text-accent" />;
  return <span className="text-xs text-muted-foreground">{index + 1}</span>;
}

export function LeaderboardTable({
  rows,
  onSelect,
  limit,
}: {
  rows: ParticipantRow[];
  onSelect?: (username: string) => void;
  limit?: number;
}) {
  const data = limit ? rows.slice(0, limit) : rows;

  if (!data.length) {
    return (
      <p className="p-6 text-center text-sm text-muted-foreground">
        Belum ada peserta pada sesi ini.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">#</TableHead>
          <TableHead>Penonton</TableHead>
          <TableHead className="text-right">Komentar</TableHead>
          <TableHead className="text-right">Benar</TableHead>
          <TableHead className="text-right">Koin</TableHead>
          <TableHead className="text-right">Skor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, index) => (
          <TableRow
            key={row.id}
            className="cursor-pointer"
            onClick={() => onSelect?.(row.username)}
          >
            <TableCell className="text-center">{rankIcon(index)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar name={row.nickname ?? row.username} src={row.avatar} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {row.nickname ?? row.username}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">@{row.username}</p>
                </div>
                {row.gift_coins >= 1000 ? (
                  <Badge className="gap-1 bg-vip/15 text-vip">
                    <Crown className="size-3" /> VIP
                  </Badge>
                ) : null}
              </div>
            </TableCell>
            <TableCell className="text-right tabular-nums">{row.comment_count}</TableCell>
            <TableCell className="text-right tabular-nums text-success">
              {row.correct_answers}
            </TableCell>
            <TableCell className="text-right tabular-nums text-vip">
              {row.gift_coins.toLocaleString("id-ID")}
            </TableCell>
            <TableCell className="text-right font-bold tabular-nums text-primary">
              {row.score.toLocaleString("id-ID")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
