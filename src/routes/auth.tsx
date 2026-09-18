import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Bot, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Masuk — LIVE AI INTERACTION" },
      {
        name: "description",
        content:
          "Masuk ke LIVE AI INTERACTION untuk mengelola dashboard interaksi TikTok LIVE realtime dengan AI, kuis, dan gift.",
      },
      { property: "og:title", content: "Masuk — LIVE AI INTERACTION" },
      {
        property: "og:description",
        content: "Dashboard interaksi TikTok LIVE realtime dengan AI, kuis, dan gift.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void router.navigate({ to: "/dashboard" });
    });
  }, [router]);

  async function signIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    void router.navigate({ to: "/dashboard" });
  }

  async function signUp() {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      void router.navigate({ to: "/dashboard" });
      return;
    }
    toast.success("Akun dibuat. Cek email Anda untuk konfirmasi.");
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Gagal masuk dengan Google");
      return;
    }
    if (result.redirected) return;
    void router.navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary glow-primary">
            <Bot className="size-6" />
          </span>
          <h1 className="text-2xl font-bold text-gradient">LIVE AI INTERACTION</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Dashboard interaksi TikTok LIVE realtime
          </p>
        </div>

        <div className="glass-panel p-5">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Masuk</TabsTrigger>
              <TabsTrigger value="signup">Daftar</TabsTrigger>
            </TabsList>

            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Kata sandi</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                />
              </div>
            </div>

            <TabsContent value="signin" className="mt-4">
              <Button className="w-full" disabled={loading} onClick={signIn}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Masuk"}
              </Button>
            </TabsContent>
            <TabsContent value="signup" className="mt-4">
              <Button className="w-full" disabled={loading} onClick={signUp}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Buat akun"}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> atau{" "}
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={google}>
            Lanjutkan dengan Google
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Aplikasi ini tidak berafiliasi dengan TikTok. Koneksi LIVE menggunakan DEMO MODE
          atau bridge pihak ketiga yang tidak resmi.
        </p>
      </div>
    </div>
  );
}
