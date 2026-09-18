export interface TtsOptions {
  voice?: string | null;
  rate?: number;
  pitch?: number;
  volume?: number;
}

const queue: Array<{ text: string; options: TtsOptions }> = [];
let speaking = false;

function available() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function listVoices(): SpeechSynthesisVoice[] {
  if (!available()) return [];
  return window.speechSynthesis.getVoices();
}

function next() {
  if (!available() || speaking) return;
  const item = queue.shift();
  if (!item) return;
  speaking = true;
  const utterance = new SpeechSynthesisUtterance(item.text.slice(0, 400));
  const voices = window.speechSynthesis.getVoices();
  const voice =
    voices.find((v) => v.name === item.options.voice) ??
    voices.find((v) => v.lang.toLowerCase().startsWith("id")) ??
    null;
  if (voice) utterance.voice = voice;
  utterance.lang = voice?.lang ?? "id-ID";
  utterance.rate = item.options.rate ?? 1;
  utterance.pitch = item.options.pitch ?? 1;
  utterance.volume = item.options.volume ?? 1;
  utterance.onend = () => {
    speaking = false;
    next();
  };
  utterance.onerror = () => {
    speaking = false;
    next();
  };
  window.speechSynthesis.speak(utterance);
}

/** Queues text so multiple reads never overlap. */
export function speak(text: string, options: TtsOptions = {}) {
  if (!available() || !text.trim()) return;
  if (queue.length > 8) queue.shift();
  queue.push({ text, options });
  next();
}

export function stopSpeaking() {
  queue.length = 0;
  speaking = false;
  if (available()) window.speechSynthesis.cancel();
}

export function ttsSupported() {
  return available();
}
