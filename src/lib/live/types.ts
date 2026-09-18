export type LiveEventType =
  | "comment"
  | "gift"
  | "like"
  | "follow"
  | "share"
  | "join"
  | "system";

/** Normalized event shape — every provider must map into this. */
export interface NormalizedEvent {
  eventKey: string;
  type: LiveEventType;
  username: string;
  nickname?: string | null;
  avatar?: string | null;
  comment?: string | null;
  giftId?: string | null;
  giftName?: string | null;
  giftCount?: number;
  likeCount?: number;
  createdAt: string;
  raw?: unknown;
}

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

export interface LiveAdapterCallbacks {
  onEvent: (event: NormalizedEvent) => void;
  onStatus: (status: ConnectionStatus, message?: string) => void;
  onLog: (level: "INFO" | "WARN" | "ERROR", message: string) => void;
}

export interface LiveAdapter {
  readonly name: string;
  readonly official: boolean;
  connect: (username: string) => Promise<void>;
  disconnect: () => void;
  /** Only available on the demo adapter. */
  inject?: (event: NormalizedEvent) => void;
}

export interface GiftConfigRow {
  gift_id: string;
  gift_name: string;
  gift_alias: string | null;
  coins: number;
  category: string;
  vip_level: number;
  points: number;
  multiplier: number;
  animation: string;
  animation_duration: number;
  emoji: string | null;
  icon_url: string | null;
  enabled: boolean;
}

export interface GiftPopupPayload {
  id: string;
  username: string;
  nickname: string;
  avatar?: string | null;
  giftName: string;
  emoji: string;
  count: number;
  coins: number;
  category: string;
  vipLevel: number;
  animation: string;
  duration: number;
}
