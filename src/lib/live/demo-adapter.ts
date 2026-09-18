import type {
  LiveAdapter,
  LiveAdapterCallbacks,
  NormalizedEvent,
} from "./types";

const NAMES = [
  ["rizkyaja", "Rizky Aja"],
  ["dindaaa_", "Dinda"],
  ["om_bagas", "Om Bagas"],
  ["sitinur", "Siti Nur"],
  ["kevin.hrd", "Kevin"],
  ["mbak_yuli", "Mbak Yuli"],
  ["andre_99", "Andre"],
  ["nayla.p", "Nayla P"],
  ["pakde.sur", "Pakde Sur"],
  ["vinaaa", "Vina"],
  ["gilang_rmd", "Gilang"],
  ["tantri.ay", "Tantri"],
];

const QUESTIONS = [
  "Kak, gimana cara mulai belajar coding dari nol?",
  "Apa itu Supabase Realtime?",
  "Berapa lama belajar React sampai bisa kerja?",
  "Laptop 8GB RAM cukup buat ngoding gak?",
  "Kenapa TypeScript lebih bagus dari JavaScript?",
  "Bisa jelasin apa itu API?",
  "Tips biar konsisten belajar tiap hari dong",
  "Mending belajar frontend atau backend dulu?",
];

const QUIZ_ANSWERS = ["A", "B", "C", "D", "a", "b", "jawab A", "jawabannya C"];

const CHATTER = [
  "hadir kak 🔥",
  "keren banget",
  "mantap bang",
  "wah baru tau",
  "izin nyimak",
  "gas terus",
  "halo semua",
  "sound nya bagus",
  "up up up",
  "aku follow ya kak",
];

const GIFTS: Array<[string, string]> = [
  ["rose", "Rose"],
  ["heart_me", "Heart Me"],
  ["finger_heart", "Finger Heart"],
  ["rosa", "Rosa"],
  ["perfume", "Perfume"],
  ["little_crown", "Little Crown"],
  ["heart", "Heart"],
  ["butterfly", "Butterfly"],
  ["corgi", "Corgi"],
  ["money_gun", "Money Gun"],
  ["galaxy", "Galaxy"],
  ["fireworks", "Fireworks"],
  ["diving_whale", "Diving Whale"],
  ["jet", "Jet"],
  ["lion", "Lion"],
  ["tiktok_universe", "TikTok Universe"],
];

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]!;
}

let counter = 0;
function nextKey(prefix: string) {
  counter += 1;
  return `demo-${prefix}-${Date.now()}-${counter}`;
}

/**
 * DEMO / MOCK adapter. Generates realistic TikTok LIVE traffic locally.
 * No external service, no TikTok connection — clearly labeled as simulation.
 */
export function createDemoAdapter(cb: LiveAdapterCallbacks): LiveAdapter {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;

  function emit(event: NormalizedEvent) {
    cb.onEvent(event);
  }

  function base(type: NormalizedEvent["type"]): NormalizedEvent {
    const [username, nickname] = pick(NAMES);
    return {
      eventKey: nextKey(type),
      type,
      username: username!,
      nickname: nickname!,
      avatar: null,
      createdAt: new Date().toISOString(),
      raw: { demo: true },
    };
  }

  function tick() {
    if (!running) return;
    const roll = Math.random();

    if (roll < 0.42) {
      emit({ ...base("comment"), comment: pick(CHATTER) });
    } else if (roll < 0.62) {
      emit({ ...base("comment"), comment: pick(QUESTIONS) });
    } else if (roll < 0.7) {
      emit({ ...base("comment"), comment: pick(QUIZ_ANSWERS) });
    } else if (roll < 0.85) {
      const [giftId, giftName] = pick(GIFTS);
      emit({
        ...base("gift"),
        giftId,
        giftName,
        giftCount: Math.random() < 0.75 ? 1 : 1 + Math.floor(Math.random() * 9),
      });
    } else if (roll < 0.9) {
      emit({ ...base("follow") });
    } else if (roll < 0.95) {
      emit({ ...base("like"), likeCount: 1 + Math.floor(Math.random() * 30) });
    } else if (roll < 0.98) {
      emit({ ...base("share") });
    } else {
      emit({ ...base("join") });
    }

    timer = setTimeout(tick, 700 + Math.random() * 1800);
  }

  return {
    name: "DEMO MODE (simulasi lokal)",
    official: false,
    async connect(username: string) {
      cb.onStatus("connecting");
      cb.onLog("INFO", `DEMO MODE aktif untuk @${username} — data disimulasikan`);
      await new Promise((r) => setTimeout(r, 600));
      running = true;
      cb.onStatus("connected");
      timer = setTimeout(tick, 500);
    },
    disconnect() {
      running = false;
      if (timer) clearTimeout(timer);
      timer = null;
      cb.onStatus("disconnected");
      cb.onLog("INFO", "DEMO MODE dihentikan");
    },
    inject(event: NormalizedEvent) {
      if (!running) return;
      emit(event);
    },
  };
}
