import { createFileRoute } from "@tanstack/react-router";
import { Plus, Save, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLive } from "@/context/live-context";
import { supabase } from "@/integrations/supabase/client";
import type { GiftConfigRow } from "@/lib/live/types";
import { exportJson } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/gifts")({
  head: () => ({
    meta: [
      { title: "Gift Manager — LIVE AI INTERACTION" },
      {
        name: "description",
        content:
          "Kelola katalog gift TikTok: koin, kategori VIP, poin, pengali, dan durasi animasi popup.",
      },
      { property: "og:title", content: "Gift Manager — LIVE AI INTERACTION" },
      {
        property: "og:description",
        content: "Atur koin, kategori VIP, poin, dan animasi untuk setiap gift.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GiftsPage,
});

const CATEGORIES = ["Normal", "Special", "VIP", "Super VIP", "Ultra VIP"];
const ANIMATIONS = ["Small", "Medium", "Large", "Huge", "Massive"];

const NEW_GIFT = {
  gift_id: "",
  gift_name: "",
  coins: 1,
  category: "Normal",
  vip_level: 1,
  points: 1,
  multiplier: 1,
  animation: "Small",
  animation_duration: 2500,
  emoji: "🎁",
};

function GiftsPage() {
  const { giftCatalog, refreshCatalog } = useLive();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [draft, setDraft] = useState<Record<string, Partial<GiftConfigRow>>>({});
  const [creating, setCreating] = useState({ ...NEW_GIFT });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return giftCatalog.filter((gift) => {
      if (category !== "all" && gift.category !== category) return false;
      if (!q) return true;
      return (
        gift.gift_name.toLowerCase().includes(q) || gift.gift_id.toLowerCase().includes(q)
      );
    });
  }, [giftCatalog, query, category]);

  function edit(giftId: string, patch: Partial<GiftConfigRow>) {
    setDraft((prev) => ({ ...prev, [giftId]: { ...prev[giftId], ...patch } }));
  }

  async function save(gift: GiftConfigRow) {
    const patch = draft[gift.gift_id];
    if (!patch) return;
    const { error } = await supabase
      .from("gift_config")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("gift_id", gift.gift_id);
    if (error) {
      toast.error(`Gagal menyimpan: ${error.message}`);
      return;
    }
    setDraft((prev) => {
      const next = { ...prev };
      delete next[gift.gift_id];
      return next;
    });
    toast.success(`${gift.gift_name} diperbarui`);
    void refreshCatalog();
  }

  async function toggle(gift: GiftConfigRow, enabled: boolean) {
    const { error } = await supabase
      .from("gift_config")
      .update({ enabled })
      .eq("gift_id", gift.gift_id);
    if (error) {
      toast.error(error.message);
      return;
    }
    void refreshCatalog();
  }

  async function create() {
    if (!creating.gift_id.trim() || !creating.gift_name.trim()) {
      toast.error("ID dan nama gift wajib diisi");
      return;
    }
    const { error } = await supabase.from("gift_config").insert({
      ...creating,
      gift_id: creating.gift_id.trim().toLowerCase().replace(/\s+/g, "_"),
    });
    if (error) {
      toast.error(`Gagal menambah gift: ${error.message}`);
      return;
    }
    setCreating({ ...NEW_GIFT });
    toast.success("Gift ditambahkan");
    void refreshCatalog();
  }

  async function remove(gift: GiftConfigRow) {
    await supabase.from("gift_config").delete().eq("gift_id", gift.gift_id);
    void refreshCatalog();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Gift Manager</h1>
          <p className="text-sm text-muted-foreground">
            {giftCatalog.length} gift tersimpan di database dan dipakai langsung oleh pipeline
            event.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => exportJson("katalog-gift", giftCatalog)}
        >
          Ekspor katalog
        </Button>
      </div>

      <section className="glass-panel space-y-3 p-4">
        <h2 className="text-sm font-semibold">Tambah gift baru</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>ID gift</Label>
            <Input
              value={creating.gift_id}
              onChange={(e) => setCreating({ ...creating, gift_id: e.target.value })}
              placeholder="contoh: rose_gold"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Nama</Label>
            <Input
              value={creating.gift_name}
              onChange={(e) => setCreating({ ...creating, gift_name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Koin</Label>
            <Input
              type="number"
              min={0}
              value={creating.coins}
              onChange={(e) => setCreating({ ...creating, coins: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Emoji</Label>
            <Input
              value={creating.emoji}
              onChange={(e) => setCreating({ ...creating, emoji: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Kategori</Label>
            <Select
              value={creating.category}
              onValueChange={(v) => setCreating({ ...creating, category: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Animasi</Label>
            <Select
              value={creating.animation}
              onValueChange={(v) => setCreating({ ...creating, animation: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANIMATIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Poin</Label>
            <Input
              type="number"
              min={0}
              value={creating.points}
              onChange={(e) => setCreating({ ...creating, points: Number(e.target.value) })}
            />
          </div>
          <div className="flex items-end">
            <Button className="w-full gap-2" onClick={create}>
              <Plus className="size-4" /> Tambah
            </Button>
          </div>
        </div>
      </section>

      <div className="glass-panel flex flex-wrap items-center gap-3 p-4">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cari gift…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua kategori</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <section className="glass-panel overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gift</TableHead>
              <TableHead className="w-24">Koin</TableHead>
              <TableHead className="w-36">Kategori</TableHead>
              <TableHead className="w-20">VIP</TableHead>
              <TableHead className="w-24">Poin</TableHead>
              <TableHead className="w-24">Pengali</TableHead>
              <TableHead className="w-32">Animasi</TableHead>
              <TableHead className="w-24">Durasi</TableHead>
              <TableHead className="w-20">Aktif</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((gift) => {
              const patch = draft[gift.gift_id] ?? {};
              const value = { ...gift, ...patch };
              return (
                <TableRow key={gift.gift_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{gift.emoji ?? "🎁"}</span>
                      <div>
                        <p className="font-medium">{gift.gift_name}</p>
                        <p className="text-xs text-muted-foreground">{gift.gift_id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-20"
                      type="number"
                      value={value.coins}
                      onChange={(e) =>
                        edit(gift.gift_id, { coins: Number(e.target.value) })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={value.category}
                      onValueChange={(v) => edit(gift.gift_id, { category: v })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-16"
                      type="number"
                      min={1}
                      max={5}
                      value={value.vip_level}
                      onChange={(e) =>
                        edit(gift.gift_id, { vip_level: Number(e.target.value) })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-20"
                      type="number"
                      value={value.points}
                      onChange={(e) =>
                        edit(gift.gift_id, { points: Number(e.target.value) })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-20"
                      type="number"
                      step="0.1"
                      value={value.multiplier}
                      onChange={(e) =>
                        edit(gift.gift_id, { multiplier: Number(e.target.value) })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={value.animation}
                      onValueChange={(v) => edit(gift.gift_id, { animation: v })}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ANIMATIONS.map((a) => (
                          <SelectItem key={a} value={a}>
                            {a}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-20"
                      type="number"
                      step={250}
                      value={value.animation_duration}
                      onChange={(e) =>
                        edit(gift.gift_id, {
                          animation_duration: Number(e.target.value),
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={gift.enabled}
                      onCheckedChange={(v) => toggle(gift, v)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {draft[gift.gift_id] ? (
                      <Button size="sm" className="gap-1" onClick={() => save(gift)}>
                        <Save className="size-4" />
                      </Button>
                    ) : (
                      <Badge className="bg-secondary text-muted-foreground">tersimpan</Badge>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => remove(gift)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
