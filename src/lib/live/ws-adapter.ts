import type {
  LiveAdapter,
  LiveAdapterCallbacks,
  LiveEventType,
  NormalizedEvent,
} from "./types";

interface RawMessage {
  type?: string;
  event?: string;
  uniqueId?: string;
  userId?: string;
  username?: string;
  nickname?: string;
  profilePictureUrl?: string;
  avatar?: string;
  comment?: string;
  text?: string;
  giftId?: string | number;
  giftName?: string;
  repeatCount?: number;
  count?: number;
  likeCount?: number;
  msgId?: string;
  id?: string;
}

function mapType(value: string | undefined): LiveEventType | null {
  switch ((value ?? "").toLowerCase()) {
    case "chat":
    case "comment":
      return "comment";
    case "gift":
      return "gift";
    case "like":
											return "like";
    case "follow":
    case "social_follow":
      return "follow";
    case "share":
      return "share";
    case "member":
    case "join":
      return "join";
    default:
      return null;
  }
}

/**
 * Generic WebSocket adapter for a THIRD-PARTY (unofficial) TikTok LIVE bridge.
 * TikTok does not publish a public LIVE event API, so any endpoint used here is
 * community/unofficial and must be supplied by the operator.
 */
export function createWsAdapter(
  endpoint: string,
  cb: LiveAdapterCallbacks,
): LiveAdapter {
  let socket: WebSocket | null = null;
  let closedByUser = false;
  let attempts = 0;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let currentUser = "";

  function open() {
    const url = endpoint.replace("{username}", encodeURIComponent(currentUser));
    cb.onStatus(attempts === 0 ? "connecting" : "reconnecting");
    try {
      socket = new WebSocket(url);
    } catch (error) {
      cb.onStatus("error", String(error));
      scheduleRetry();
      return;
    }

    socket.onopen = () => {
      attempts = 0;
      cb.onStatus("connected");
      cb.onLog("INFO", `Terhubung ke bridge pihak ketiga (${url})`);
      socket?.send(JSON.stringify({ action: "subscribe", username: currentUser }));
    };

    socket.onmessage = (message) => {
      try {
        const payload = JSON.parse(String(message.data)) as RawMessage;
        const type = mapType(payload.type ?? payload.event);
        if (!type) return;
        const username =
          payload.uniqueId ?? payload.username ?? payload.userId ?? "unknown";
        const event: NormalizedEvent = {
          eventKey:
            payload.msgId ??
            payload.id ??
            `${type}-${username}-${payload.comment ?? payload.giftName ?? ""}-${Date.now()}`,
          type,
          username,
          nickname: payload.nickname ?? username,
          avatar: payload.profilePictureUrl ?? payload.avatar ?? null,
          comment: payload.comment ?? payload.text ?? null,
          giftId: payload.giftId != null ? String(payload.giftId) : null,
          giftName: payload.giftName ?? null,
          giftCount: payload.repeatCount ?? payload.count ?? 1,
          likeCount: payload.likeCount ?? 0,
          createdAt: new Date().toISOString(),
          raw: payload,
        };
        cb.onEvent(event);
      } catch {
        cb.onLog("WARN", "Pesan dari bridge tidak bisa dibaca (diabaikan)");
      }
    };

    socket.onerror = () => {
      cb.onLog("ERROR", "Koneksi bridge error");
      cb.onStatus("error", "Koneksi bridge error");
    };

    socket.onclose = () => {
      if (closedByUser) {
        cb.onStatus("disconnected");
        return;
      }
      scheduleRetry();
    };
  }

  function scheduleRetry() {
    if (closedByUser) return;
    attempts += 1;
    if (attempts > 6) {
      cb.onStatus("error", "Gagal terhubung setelah beberapa percobaan");
      cb.onLog("ERROR", "Auto-reconnect dihentikan setelah 6 percobaan");
      return;
    }
    const delay = Math.min(30000, 1500 * 2 ** (attempts - 1));
    cb.onStatus("reconnecting", `Mencoba ulang dalam ${Math.round(delay / 1000)}s`);
    retryTimer = setTimeout(open, delay);
  }

  return {
    name: "Bridge pihak ketiga (tidak resmi)",
    official: false,
    async connect(username: string) {
      closedByUser = false;
      attempts = 0;
      currentUser = username;
      open();
    },
    disconnect() {
      closedByUser = true;
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close();
      socket = null;
      cb.onStatus("disconnected");
    },
  };
}
