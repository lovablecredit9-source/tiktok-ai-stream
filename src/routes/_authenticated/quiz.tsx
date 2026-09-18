import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Plus, Power, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLive, type QuestionRow } from "@/context/live-context";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/quiz")({
  head: () => ({
    meta: [
      { title: "Kuis — LIVE AI INTERACTION" },
      {
        name: "description",
        content:
          "Buat soal kuis pilihan ganda, aktifkan satu soal, dan hitung jawaban penonton LIVE secara otomatis.",
      },
      { property: "og:title", content: "Kuis — LIVE AI INTERACTION" },
      {
        property: "og:description",
        content: "Soal pilihan ganda otomatis dinilai dari komentar penonton LIVE.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuizPage,
});

const EMPTY = {
  question: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_answer: "A",
  explanation: "",
};

function QuizPage() {
  const { session, activeQuestion, reloadActiveQuestion } = useLive();
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [answers, setAnswers] = useState<Array<Tables<"quiz_answers">>>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("quiz_questions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setQuestions(data ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!activeQuestion) {
      setAnswers([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("quiz_answers")
        .select("*")
        .eq("question_id", activeQuestion.id)
        .order("created_at", { ascending: false });
      if (!cancelled) setAnswers(data ?? []);
    })();

    const channel = supabase
      .channel(`quiz-${activeQuestion.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "quiz_answers",
          filter: `question_id=eq.${activeQuestion.id}`,
        },
        (payload) => {
          setAnswers((prev) => [payload.new as Tables<"quiz_answers">, ...prev]);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [activeQuestion?.id]);

  async function create() {
    if (!form.question.trim()) {
      toast.error("Pertanyaan wajib diisi");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("quiz_questions").insert({
      session_id: session?.id ?? null,
      question: form.question.trim().slice(0, 500),
      option_a: form.option_a.slice(0, 200),
      option_b: form.option_b.slice(0, 200),
      option_c: form.option_c.slice(0, 200),
      option_d: form.option_d.slice(0, 200),
      correct_answer: form.correct_answer.toUpperCase().slice(0, 1),
      explanation: form.explanation.slice(0, 500),
    });
    setSaving(false);
    if (error) {
      toast.error(`Gagal menyimpan soal: ${error.message}`);
      return;
    }
    setForm({ ...EMPTY });
    toast.success("Soal ditambahkan");
    void load();
  }

  async function activate(row: QuestionRow) {
    await supabase.from("quiz_questions").update({ is_active: false }).eq("is_active", true);
    const { error } = await supabase
      .from("quiz_questions")
      .update({ is_active: true, session_id: session?.id ?? row.session_id })
      .eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Soal aktif — jawaban A/B/C/D dari komentar akan dihitung");
    void load();
    void reloadActiveQuestion();
  }

  async function deactivate() {
    await supabase.from("quiz_questions").update({ is_active: false }).eq("is_active", true);
    void load();
    void reloadActiveQuestion();
  }

  async function remove(id: string) {
    await supabase.from("quiz_questions").delete().eq("id", id);
    void load();
    void reloadActiveQuestion();
  }

  const correctCount = answers.filter((a) => a.is_correct).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Kuis</h1>
        <p className="text-sm text-muted-foreground">
          Penonton menjawab dengan menulis A, B, C, atau D di komentar.
        </p>
      </div>

      {activeQuestion ? (
        <section className="glass-panel glow-primary p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <Badge className="bg-success/15 text-success">Soal aktif</Badge>
              <p className="mt-2 text-lg font-semibold">{activeQuestion.question}</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {(["A", "B", "C", "D"] as const).map((letter) => {
                  const value = activeQuestion[
                    `option_${letter.toLowerCase()}` as "option_a"
                  ];
                  if (!value) return null;
                  return (
                    <li key={letter}>
                      <span className="font-semibold text-foreground">{letter}.</span> {value}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{answers.length}</p>
              <p className="text-xs text-muted-foreground">jawaban masuk</p>
              <p className="mt-1 text-sm text-success">{correctCount} benar</p>
              <Button variant="outline" size="sm" className="mt-2 gap-2" onClick={deactivate}>
                <Power className="size-4" /> Nonaktifkan
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <div className="rounded-xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">
          Belum ada soal aktif. Aktifkan satu soal agar jawaban penonton dihitung.
        </div>
      )}

      <section className="glass-panel space-y-3 p-4">
        <h2 className="text-sm font-semibold">Tambah soal</h2>
        <div className="space-y-1.5">
          <Label htmlFor="q">Pertanyaan</Label>
          <Textarea
            id="q"
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            placeholder="Tulis pertanyaan kuis…"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["a", "b", "c", "d"] as const).map((key) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`opt-${key}`}>Opsi {key.toUpperCase()}</Label>
              <Input
                id={`opt-${key}`}
                value={form[`option_${key}` as "option_a"]}
                onChange={(e) => setForm({ ...form, [`option_${key}`]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
          <div className="space-y-1.5">
            <Label htmlFor="correct">Jawaban benar</Label>
            <Input
              id="correct"
              maxLength={1}
              value={form.correct_answer}
              onChange={(e) =>
                setForm({ ...form, correct_answer: e.target.value.toUpperCase() })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exp">Penjelasan (opsional)</Label>
            <Input
              id="exp"
              value={form.explanation}
              onChange={(e) => setForm({ ...form, explanation: e.target.value })}
            />
          </div>
        </div>
        <Button onClick={create} disabled={saving} className="gap-2">
          <Plus className="size-4" /> Simpan soal
        </Button>
      </section>

      <section className="glass-panel overflow-hidden">
        <header className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Bank soal</h2>
        </header>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pertanyaan</TableHead>
              <TableHead className="w-24">Benar</TableHead>
              <TableHead className="w-40 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <p className="font-medium">{row.question}</p>
                  {row.is_active ? (
                    <Badge className="mt-1 bg-success/15 text-success">Aktif</Badge>
                  ) : null}
                </TableCell>
                <TableCell>{row.correct_answer}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={() => activate(row)}
                  >
                    <CheckCircle2 className="size-4" /> Aktifkan
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(row.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!questions.length ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                  Belum ada soal.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </section>

      {activeQuestion ? (
        <section className="glass-panel overflow-hidden">
          <header className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Jawaban masuk</h2>
          </header>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Penonton</TableHead>
                <TableHead>Jawaban</TableHead>
                <TableHead className="text-right">Poin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {answers.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>@{row.username}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        row.is_correct
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive"
                      }
                    >
                      {row.answer}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.points}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      ) : null}
    </div>
  );
}
