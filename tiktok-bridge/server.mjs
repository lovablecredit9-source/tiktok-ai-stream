import http from "node:http";
import { WebSocketServer } from "ws";
import { TikTokLiveConnection, WebcastEvent } from "tiktok-live-connector";

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "0.0.0.0";

const httpServer = http.createServer((req, res) => {
  if (req.url?.startsWith("/health")) {
    res.writeHead(200, { "content-type": "application/json", "access-control-allow-origin": "*" });
    res.end(JSON.stringify({ ok: true, service: "tiktok-live-bridge" }));
    return;
  }
  res.writeHead(404);
  res.end("Not found");
});

const wss = new WebSocketServer({ server: httpServer });

function send(ws, payload) {
  if (ws.readyState === 1) ws.send(JSON.stringify(payload));
}

function userOf(data) {
  const user = data?.user ?? data;
  return {
    uniqueId: user?.uniqueId ?? user?.unique_id ?? user?.username ?? "unknown",
    userId: user?.userId != null ? String(user.userId) : undefined,
    nickname: user?.nickname ?? user?.uniqueId ?? "unknown",
    profilePictureUrl: user?.profilePictureUrl ?? user?.profilePicture?.urls?.[0] ?? null,
  };
}

function wire(connection, ws, username) {
  connection.on(WebcastEvent.CHAT, (data) => {
    const user = userOf(data);
    send(ws, {
      type: "chat",
      event: "chat",
      uniqueId: user.uniqueId,
      userId: user.userId,
      username: user.uniqueId,
      nickname: user.nickname,
      profilePictureUrl: user.profilePictureUrl,
      comment: data.comment ?? "",
      msgId: data.msgId != null ? String(data.msgId) : undefined,
    });
  });

  connection.on(WebcastEvent.GIFT, (data) => {
    const user = userOf(data);
    send(ws, {
      type: "gift",
      event: "gift",
      uniqueId: user.uniqueId,
      userId: user.userId,
      username: user.uniqueId,
      nickname: user.nickname,
      profilePictureUrl: user.profilePictureUrl,
      giftId: data.giftId != null ? String(data.giftId) : undefined,
      giftName: data.giftDetails?.giftName ?? data.giftName ?? "Gift",
      repeatCount: Number(data.repeatCount ?? 1),
      giftCoins: Number(data.giftDetails?.diamondCount ?? 0),
      repeatEnd: Boolean(data.repeatEnd),
      msgId: data.msgId != null ? String(data.msgId) : undefined,
    });
  });

  connection.on(WebcastEvent.LIKE, (data) => {
    const user = userOf(data);
    send(ws, {
      type: "like",
      event: "like",
      uniqueId: user.uniqueId,
      userId: user.userId,
      username: user.uniqueId,
      nickname: user.nickname,
      profilePictureUrl: user.profilePictureUrl,
      likeCount: Number(data.likeCount ?? 0),
      msgId: data.msgId != null ? String(data.msgId) : undefined,
    });
  });

  connection.on(WebcastEvent.SOCIAL, (data) => {
    const user = userOf(data);
    const action = String(data.action ?? data.event?.eventDetails?.displayType ?? "").toLowerCase();
    const type = action.includes("share") ? "share" : "follow";
    send(ws, {
      type,
      event: type,
      uniqueId: user.uniqueId,
      userId: user.userId,
      username: user.uniqueId,
      nickname: user.nickname,
      profilePictureUrl: user.profilePictureUrl,
      msgId: data.msgId != null ? String(data.msgId) : undefined,
    });
  });

  connection.on(WebcastEvent.MEMBER, (data) => {
    const user = userOf(data);
    send(ws, {
      type: "join",
      event: "join",
      uniqueId: user.uniqueId,
      userId: user.userId,
      username: user.uniqueId,
      nickname: user.nickname,
      profilePictureUrl: user.profilePictureUrl,
      msgId: data.msgId != null ? String(data.msgId) : undefined,
    });
  });

  connection.on(WebcastEvent.ROOM_USER, (data) => {
    send(ws, {
      type: "system",
      event: "viewerCount",
      viewerCount: Number(data.viewerCount ?? 0),
      username,
    });
  });

  connection.on("connected", (state) => {
    send(ws, { type: "connected", event: "connected", roomId: String(state?.roomId ?? "") });
  });

  connection.on("disconnected", () => {
    send(ws, { type: "disconnected", event: "disconnected" });
  });

  connection.on(WebcastEvent.CONTROL, (data) => {
    send(ws, { type: "system", event: "control", raw: data });
  });

  connection.on("error", (error) => {
    send(ws, {
      type: "error",
      event: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  });
}

wss.on("connection", async (ws, request) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  let username = (url.searchParams.get("username") ?? "").trim().replace(/^@/, "");

  send(ws, { type: "bridge_ready", event: "bridge_ready" });

  const start = async (requestedUsername) => {
    username = String(requestedUsername ?? username).trim().replace(/^@/, "");
    if (!username) {
      send(ws, { type: "error", event: "error", message: "Username TikTok wajib diisi." });
      ws.close(1008, "username required");
      return;
    }

    const connection = new TikTokLiveConnection(username);
    ws._tiktokConnection = connection;
    wire(connection, ws, username);

    try {
      send(ws, { type: "connecting", event: "connecting", username });
      const state = await connection.connect();
      send(ws, {
        type: "connected",
        event: "connected",
        username,
        roomId: String(state?.roomId ?? ""),
      });
    } catch (error) {
      send(ws, {
        type: "error",
        event: "error",
        username,
        message: error instanceof Error ? error.message : String(error),
      });
      try { await connection.disconnect(); } catch {}
    }
  };

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(String(raw));
      if (msg?.action === "subscribe" && msg.username) {
        if (!ws._tiktokConnection) void start(msg.username);
      }
    } catch {}
  });

  ws.on("close", async () => {
    const connection = ws._tiktokConnection;
    if (connection) {
      try { await connection.disconnect(); } catch {}
    }
  });

  if (username) void start(username);
});

httpServer.listen(PORT, HOST, () => {
  console.log(`TikTok LIVE bridge listening on ws://localhost:${PORT}`);
});
