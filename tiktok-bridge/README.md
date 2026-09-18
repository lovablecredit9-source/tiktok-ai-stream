# TikTok LIVE Bridge

Bridge Node.js untuk repository `tiktok-ai-stream`.

Fungsinya:
- menerima username TikTok dari aplikasi;
- terhubung ke LIVE publik melalui `tiktok-live-connector`;
- meneruskan komentar, profil, gift, like, follow, share, join, dan viewer count ke browser melalui WebSocket.

## Jalankan

```bash
cd tiktok-bridge
npm install
npm start
```

Default:
- WebSocket: `ws://localhost:8787`
- Health: `http://localhost:8787/health`

Di aplikasi, gunakan endpoint:

```
ws://localhost:8787/?username={username}
```

Tidak perlu memasukkan password TikTok untuk membaca LIVE publik. Konektor yang digunakan bersifat unofficial/reverse-engineered, jadi kompatibilitas dapat berubah.

Untuk aplikasi HTTPS yang berjalan di internet, gunakan endpoint `wss://` yang aman; jangan gunakan `ws://` dari halaman HTTPS karena browser dapat memblokir mixed content.
