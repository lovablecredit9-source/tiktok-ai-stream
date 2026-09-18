# Live AI Hub

Buat sebuah web app modern bernama LIVE AI INTERACTION yang berfungsi sebagai dashboard interaksi TikTok LIVE secara realtime.

Aplikasi ini digunakan ketika saya sedang melakukan LIVE TikTok.

Konsep utama:

Paste Link TikTok LIVE → Hubungkan → baca event LIVE → AI menjawab komentar/soal → tampilkan profil penonton → deteksi follower → deteksi gift → hitung koin → VIP gift → leaderboard realtime → overlay → laporan LIVE.

Aplikasi harus benar-benar functional, bukan hanya mockup.

---

1. TEKNOLOGI

Gunakan:

- React
- TypeScript
- Tailwind CSS
- Supabase
- Supabase Realtime
- backend/server-side API
- responsive design
- dark modern premium UI

Gunakan arsitektur yang rapi dan modular.

Jangan menaruh API key rahasia di frontend.

---

2. DASHBOARD UTAMA

Buat halaman:

"/dashboard"

Dashboard terdiri dari:

HEADER

Tampilkan:

LIVE AI INTERACTION

Status:

🟢 LIVE TERHUBUNG

atau

🔴 BELUM TERHUBUNG

Informasi:

- akun TikTok
- durasi LIVE
- komentar
- follower baru
- total gift
- total gift coins
- AI answers

---

3. HUBUNGKAN TIKTOK LIVE

Buat bagian utama:

HUBUNGKAN TIKTOK LIVE

Input:

Link TikTok LIVE

Contoh:

"https://www.tiktok.com/@username/live"

Tombol:

HUBUNGKAN LIVE

Alur:

Paste Link
↓
Connect
↓
Detect LIVE
↓
Connect Event Stream
↓
LIVE Connected

Jika berhasil:

🟢 TikTok LIVE Terhubung

Tampilkan:

- username
- nickname
- LIVE status
- connection duration

Jika gagal:

🔴 Gagal terhubung

[ COBA LAGI ]

Jika provider membutuhkan Room ID atau autentikasi tambahan, tampilkan sebagai fallback.

Jangan meminta Room ID jika provider dapat mengambilnya otomatis.

---

4. TIKTOK LIVE PROVIDER

Jangan mengikat seluruh aplikasi ke satu library/provider TikTok.

Gunakan abstraction:

TikTok LIVE Provider
        ↓
Live Adapter
        ↓
Event Normalizer
        ↓
Event Processor
        ↓
Supabase
        ↓
Realtime
        ↓
Dashboard

Buat interface:

interface LiveEvent {
  id: string;
  type:
    | "comment"
    | "follow"
    | "gift"
    | "like"
    | "share"
    | "join";

  username: string;
  nickname?: string;
  avatar?: string;

  comment?: string;

  giftId?: string;
  giftName?: string;
  giftCount?: number;
  giftCoins?: number;

  timestamp: string;

  raw?: unknown;
}

Jika provider memberikan "giftId", gunakan "giftId" sebagai identifier utama.

Jika tidak tersedia, gunakan nama gift sebagai fallback.

Jangan mengklaim koneksi resmi TikTok apabila provider yang digunakan bukan API resmi TikTok.

Jika connector belum tersedia, gunakan DEMO/MOCK MODE.

---

5. LIVE COMMENTS

Buat panel:

LIVE COMMENTS

Komentar terbaru muncul realtime.

Setiap komentar:

[Avatar]

Nickname

"@username"

Komentar:

«Bang soal nomor 5 jawabannya apa?»

Jika AI menjawab:

🤖 AI ANSWER

«Jawabannya adalah B karena...»

Tambahkan waktu.

Filter:

- Semua
- Pertanyaan
- Sudah dijawab
- Belum dijawab
- Follower
- Pengirim Gift

Tambahkan search username/comment.

---

6. AI ANSWER

AI harus dapat membaca komentar LIVE.

Jika komentar berupa pertanyaan/soal, masukkan ke AI.

Contoh:

Penonton:

«Bang ibu kota Indonesia apa?»

AI:

«Nusantara.»

Contoh:

«Soal nomor 3 jawabannya A?»

AI:

«Benar, jawabannya A.»

AI harus menjawab singkat, ramah, jelas dan cocok untuk LIVE.

System prompt default:

Anda adalah AI assistant untuk TikTok LIVE.

Jawab komentar penonton secara singkat, ramah, jelas, dan natural seperti host LIVE.

Prioritaskan pertanyaan dan soal.

Jangan mengarang informasi yang tidak diketahui.

Jika komentar bukan pertanyaan, berikan respons singkat yang relevan.

Jangan memberikan jawaban terlalu panjang.

---

7. AI ROUTER SETTINGS

Buat:

"/settings/ai"

Input:

- API Base URL
- API Key
- Model
- System Prompt
- Temperature
- Max Tokens

Contoh:

API Base URL
https://example.com/v1

API Key
••••••••••••••

Model
model-name

Tombol:

TEST KONEKSI AI

Berhasil:

🟢 Koneksi AI berhasil.

Gagal:

🔴 Koneksi AI gagal.

API key harus disimpan secara aman di server-side storage/secret.

Jangan expose API key di source frontend.

User harus dapat mengganti Base URL, API Key dan Model kapan saja.

---

8. AI RATE LIMIT

Jangan kirim semua komentar ke AI.

Buat:

- question detection
- duplicate detection
- cooldown username
- request queue
- maximum requests/minute
- maximum response length

Jika 100 orang mengirim komentar sama:

«jawab A»

jangan membuat 100 request AI.

Gabungkan/handle sebagai satu event jika memungkinkan.

---

9. LIVE QUIZ

Buat:

"/quiz"

Saya dapat membuat soal LIVE.

Form:

Judul

Pertanyaan

A

B

C

D

Jawaban benar

Penjelasan

Mode:

- Manual
- AI

Jika penonton menjawab:

"A"

atau:

"Jawaban saya B"

sistem mendeteksi jawabannya.

Catat:

- username
- jawaban
- benar/salah
- score
- waktu

---

10. PROFILE PENONTON

Saat user:

- komentar
- follow
- gift

tampilkan profile card.

Contoh:

┌─────────────────────────┐
│ [AVATAR]                │
│ Budi Gaming             │
│ @budigaming             │
│                         │
│ 💬 Comments       24    │
│ 🎁 Gifts           5    │
│ 🏆 Score         120    │
└─────────────────────────┘

Gunakan hanya data yang diberikan oleh provider.

Jangan mengarang informasi profil.

---

11. FOLLOWER BARU

Jika event follow diterima:

Tampilkan overlay:

🎉 FOLLOW BARU!

@budigaming

Selamat datang di LIVE!

Overlay sekitar 2–4 detik.

Simpan ke history.

---

12. GIFT SYSTEM

Buat sistem Gift TikTok LIVE yang database-driven.

Jangan hardcode gift ke React.

Gunakan tabel:

"gift_config"

Kolom:

id
gift_id
gift_name
gift_alias
coins
category
vip_level
points
animation
animation_duration
icon_url
enabled
updated_at

---

13. GIFT DATABASE

Aplikasi harus mendukung seluruh gift yang tersedia pada database, bukan hanya Rose/Donut/Lion.

Jangan menganggap katalog TikTok permanen karena gift dan harga dapat berubah.

Sediakan:

Gift Manager

dan:

Import Gift

Format JSON/CSV.

Contoh:

[
  {
    "gift_id": "rose",
    "gift_name": "Rose",
    "coins": 1,
    "category": "Normal",
    "vip_level": 1,
    "points": 1
  },
  {
    "gift_id": "doughnut",
    "gift_name": "Doughnut",
    "coins": 30,
    "category": "Special",
    "vip_level": 2,
    "points": 30
  }
]

Saat import:

- jangan duplicate
- update gift lama
- insert gift baru
- simpan "updated_at"

Jika gift baru dari TikTok belum ada di database:

UNKNOWN GIFT

Tetap tampilkan event dan simpan event tersebut.

Admin dapat memasukkan gift baru ke database.

---

14. GIFT MANAGER

Buat:

"/settings/gifts"

Tabel:

Gift| Koin| Kategori| VIP| Poin| Animasi| Status
Rose| 1| Normal| 1| 1| Small| ON
Doughnut| 30| Special| 2| 30| Medium| ON
Galaxy| 1000| VIP| 3| 1000| Large| ON
Lion| 29999| VIP| 4| 29999| Huge| ON
TikTok Universe| 44999| Ultra VIP| 5| 44999| Massive| ON

Fitur:

- tambah
- edit
- disable
- delete
- search
- filter
- import
- export

Filter:

- Semua
- Normal
- Special
- VIP
- Super VIP
- Ultra VIP

---

15. CONTOH GIFT

Masukkan seed data awal untuk testing seperti:

- Rose — 1
- Heart Me — 1
- TikTok — 1
- GG — 1
- Coffee — 1
- Ice Cream Cone — 1
- Finger Heart — 5
- Rosa — 10
- Friendship Necklace — 10
- I Love You — 10
- Perfume — 20
- Doughnut — 30
- Takoyaki — 88
- Little Crown — 99
- Bubble Gum — 99
- Heart — 100
- Kiss — 150
- Butterfly — 169
- Hearts — 199
- Sunglasses — 199
- Corgi — 299
- Rock 'n' Roll — 299
- Diamond Ring — 300
- Forever Rosa — 399
- Coral — 499
- Money Gun — 500
- Swan — 699
- Cute Cat — 799
- Train — 899
- Airdrop Box — 999
- Galaxy — 1000
- Diamond Tree — 1088
- Fireworks — 1088
- Champion — 1500
- Mystery Fireworks — 1999
- Diving Whale — 2150
- Elephant — 2500
- Magic Stage — 2599
- Ferris Wheel — 3000
- Sakura Train — 3999
- Jet — 5000
- Interstellar — 10000
- Eagle — 10999
- Theme Park — 17000
- Spaceship — 20000
- Dragon Flame — 26999
- Lion — 29999
- Sam the Whale — 30000
- Leon and Lion — 34000
- TikTok Stars — 39999
- TikTok Universe — 44999

Nilai seed hanya untuk data awal/testing.

Jangan menganggap nilai tersebut selalu benar atau permanen.

Jika provider LIVE memberikan nilai coin aktual, gunakan nilai dari provider sesuai konfigurasi aplikasi.

---

16. GIFT PROCESSING

Ketika gift masuk:

Gift Event
↓
Cari gift_id
↓
Jika tidak ada, cari gift_name
↓
Ambil gift_config
↓
Ambil coin value
↓
giftCount × coins
↓
Hitung score
↓
Simpan event
↓
Update participant
↓
Update leaderboard
↓
Realtime overlay

Contoh:

Rose × 10

1 × 10 = 10 Coins

Doughnut × 5

30 × 5 = 150 Coins

Lion × 1

29.999 × 1 = 29.999 Coins

---

17. MULTIPLE GIFT

Jangan menampilkan 100 popup jika:

"Rose ×100"

Tampilkan:

🌹

@username

Rose ×100

100 Coins

Tetap simpan quantity dengan benar.

---

18. GIFT COMBO

Jika provider memberikan combo:

gift_id
username
combo_count

gabungkan menjadi satu tampilan:

@username

🌹 Rose ×50

50 Coins

---

19. VIP GIFT

Gift dapat mempunyai:

- Normal
- Special
- VIP
- Super VIP
- Ultra VIP

Admin bebas menentukan kategori.

Jangan menentukan VIP hanya berdasarkan harga.

Contoh:

Doughnut
30 coins
Special

Galaxy
1.000 coins
VIP

Lion
29.999 coins
Super VIP

TikTok Universe
44.999 coins
Ultra VIP

---

20. GIFT OVERLAY

Gift normal:

🌹

@username

mengirim

Rose ×5

5 Coins

Special:

🍩

@username

mengirim

Doughnut ×5

150 Coins

VIP:

🦁

@username

mengirim

Lion ×1

29.999 Coins

Ultra VIP:

🌌

@username

mengirim

TikTok Universe ×1

44.999 Coins

Gunakan animasi sesuai konfigurasi gift.

---

21. MINIMUM GIFT ALERT

Buat setting:

Minimum Coins untuk Popup

Contoh:

10

Jika gift kurang dari 10:

- tetap disimpan
- tetap dihitung
- tetap masuk leaderboard
- tidak perlu popup besar

---

22. GIFT LEADERBOARD

Buat:

"/leaderboard"

Tab:

GIFT

Ranking berdasarkan total gift coins.

Tampilkan:

🥇 username — 29.500 Coins

🥈 username — 15.200 Coins

🥉 username — 8.900 Coins

---

23. QUIZ LEADERBOARD

Ranking berdasarkan:

- correct answers
- score

Contoh:

🥇 @Budi
18 benar
180 points

🥈 @Andi
14 benar
140 points

---

24. OVERALL LEADERBOARD

Buat leaderboard gabungan yang configurable.

Contoh:

@Budi

Gift Coins
1250

Correct Answers
18

Comments
35

Total Score
1480

Semua update realtime.

---

25. SCORING SYSTEM

Default:

Comment = 1 point
Correct Answer = 10 points
Follow = 5 points
Rose = 1 point
Doughnut = 30 points
VIP Gift = mengikuti gift points

Namun semua dapat diubah melalui Settings.

Tambahkan:

Coin → Score Multiplier

Default:

"1 Coin = 1 Point"

User dapat mengubah menjadi:

"1 Coin = 2 Points"

dll.

Gift tertentu juga dapat mempunyai multiplier sendiri.

---

26. DATABASE

Buat tabel Supabase:

live_sessions

id
account_username
live_url
started_at
ended_at
status
created_at

live_events

id
session_id
event_type
username
nickname
avatar
comment
gift_id
gift_name
gift_count
gift_coins
created_at
raw_data

participants

id
session_id
username
nickname
avatar
comment_count
correct_answers
wrong_answers
gift_count
gift_coins
score
created_at
updated_at

quiz_questions

id
session_id
question
option_a
option_b
option_c
option_d
correct_answer
explanation
created_at

quiz_answers

id
question_id
session_id
username
answer
is_correct
points
created_at

ai_responses

id
session_id
event_id
username
question
answer
created_at

gift_config

id
gift_id
gift_name
gift_alias
coins
category
vip_level
points
animation
animation_duration
icon_url
enabled
updated_at

ai_settings

id
base_url
encrypted_api_key
model
system_prompt
temperature
max_tokens
updated_at

Gunakan Row Level Security yang sesuai.

---

27. REALTIME

Gunakan Supabase Realtime.

Realtime update untuk:

- comments
- AI answers
- follower
- gifts
- profiles
- leaderboard
- quiz
- statistics
- overlay

Tidak boleh membutuhkan refresh halaman.

---

28. EVENT HISTORY

Buat:

"/events"

Tampilkan semua event:

16:20:01
@Budi
🌹 Rose ×10
10 Coins

16:20:08
@Andi
🍩 Doughnut ×5
150 Coins

16:20:20
@Rizal
🦁 Lion ×1
29.999 Coins

Filter:

- Comment
- Follow
- Gift
- VIP
- Quiz
- User

---

29. LIVE HISTORY

Buat:

"/history"

Simpan setiap sesi LIVE.

Tampilkan:

- tanggal
- durasi
- comments
- followers
- gifts
- gift coins
- AI answers
- quiz participants
- top gifter

Klik LIVE untuk melihat laporan lengkap.

---

30. LIVE REPORT

Setelah LIVE selesai:

LIVE REPORT

Duration
02:14:31

Comments
8.521

New Followers
432

Total Gifts
1.281

Gift Coins
125.450

AI Answers
742

Quiz Participants
182

Top Gifter
@username

Top Quiz Player
@username

---

31. TEXT TO SPEECH

Tambahkan:

AI VOICE

ON/OFF

Settings:

- Voice
- Speed
- Pitch
- Volume
- Auto Read

Jika aktif, jawaban AI dapat dibacakan.

Gunakan browser TTS atau provider TTS yang dikonfigurasi.

---

32. SERVICES SIDEBAR

Sidebar menampilkan:

SERVICES

🟢 TikTok LIVE

🟢 Supabase

🟢 AI Router

Klik service untuk membuka Settings.

---

33. LIVE CONTROL

Tambahkan:

🔴 START LIVE SESSION

⏸ PAUSE AI

▶ RESUME AI

🔇 MUTE TTS

🧹 CLEAR OVERLAY

⏹ END LIVE SESSION

---

34. CONNECTION ERROR

Jika TikTok terputus:

🔴 CONNECTION LOST

[ RECONNECT ]

Jika AI gagal:

⚠ AI ERROR

LIVE tetap berjalan.

Jika Supabase/realtime bermasalah:

⚠ REALTIME STORAGE DISCONNECTED

Jangan membuat seluruh dashboard crash karena satu service gagal.

---

35. DUPLICATE EVENT

Provider bisa mengirim event yang sama lebih dari satu kali.

Gunakan:

"event_id"

jika tersedia.

Jika tidak tersedia, gunakan kombinasi:

- username
- event type
- timestamp
- content/gift

untuk deduplication.

Jangan menggandakan gift atau score akibat duplicate event.

---

36. MOCK LIVE MODE

Buat:

DEMO LIVE MODE

Agar aplikasi dapat dites tanpa TikTok.

Tombol:

START DEMO LIVE

Kemudian:

TEST COMMENT

TEST FOLLOW

TEST ROSE

TEST DOUGHNUT

TEST GALAXY

TEST LION

TEST TIKTOK UNIVERSE

TEST QUIZ ANSWER

Event demo harus menggunakan processor yang sama dengan event LIVE sebenarnya.

---

37. SYSTEM LOG

Buat:

"/logs"

Contoh:

16:01:01
INFO
TikTok connected

16:01:04
INFO
Comment received

16:01:05
SUCCESS
Question detected

16:01:06
SUCCESS
AI response generated

16:01:10
INFO
Gift received

16:01:11
SUCCESS
Leaderboard updated

Level:

- INFO
- SUCCESS
- WARNING
- ERROR

---

38. EXPORT

Tambahkan:

Export CSV

Export JSON

Export LIVE Report

Export:

- comments
- participants
- gifts
- leaderboard
- AI responses
- session statistics

---

39. RESPONSIVE UI

Desktop:

Sidebar
     ↓
Main Dashboard
     ↓
Comments + AI
     ↓
Leaderboard
     ↓
Event Overlay

Mobile:

- bottom navigation
- cards
- comments
- leaderboard
- settings

Pastikan dashboard tetap nyaman digunakan melalui HP.

---

40. DESAIN UI

Gunakan desain:

- dark
- modern
- premium
- black/charcoal
- aksen neon/premium
- rounded cards
- glass effect ringan
- smooth animation
- typography jelas

Jangan terlalu ramai.

Prioritas visual:

1. LIVE status
2. Comments
3. AI answers
4. Gifts
5. Followers
6. Leaderboard

---

41. ROUTING

Buat:

/dashboard
/live
/quiz
/leaderboard
/events
/history
/logs
/settings/ai
/settings/tiktok
/settings/gifts
/settings/general

---

42. KEAMANAN

API key AI:

- jangan expose di frontend
- jangan hardcode
- jangan masuk Git
- simpan secure/server-side

Gunakan authentication.

Gunakan Row Level Security Supabase.

Validasi semua input.

Sanitize komentar sebelum ditampilkan.

Jangan menjalankan HTML/JS dari komentar LIVE.

---

43. PENTING UNTUK TIKTOK

Jangan membuat klaim bahwa aplikasi dapat membaca komentar, follower, atau gift TikTok LIVE secara resmi jika API/provider yang dipakai tidak menyediakan akses tersebut.

Gunakan connector/provider yang benar-benar dapat menyediakan event LIVE.

Jika akses TikTok membutuhkan service eksternal, buat konfigurasi provider.

Jika belum ada provider:

DEMO MODE harus tetap bekerja.

Arsitektur harus memungkinkan provider diganti tanpa mengubah dashboard.

---

44. HASIL AKHIR

Saya ingin pengalaman pengguna sesederhana ini:

BUKA APLIKASI
       ↓
PASTE LINK TIKTOK LIVE
       ↓
HUBUNGKAN LIVE
       ↓
🟢 LIVE CONNECTED
       ↓
COMMENT MASUK
       ↓
AI DETEKSI SOAL
       ↓
AI MENJAWAB
       ↓
PROFILE USER MUNCUL
       ↓
FOLLOW MASUK
       ↓
FOLLOW ALERT
       ↓
GIFT MASUK
       ↓
GIFT TERDETEKSI
       ↓
COIN DIHITUNG
       ↓
VIP TERDETEKSI
       ↓
GIFT ANIMATION
       ↓
LEADERBOARD UPDATE
       ↓
LIVE SELESAI
       ↓
LIVE REPORT

Buat semua komponen saling terhubung dan gunakan satu event-processing architecture.

Jangan berhenti pada UI. Implementasikan database, backend, realtime, AI queue, gift processing, scoring, leaderboard, history, mock mode, dan error handling.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://tiktok-ai-stream.lovable.app


## TikTok LIVE Direct Bridge

Repository ini sekarang memiliki `tiktok-bridge/` untuk membaca LIVE publik tanpa login TikTok pada sisi pembaca.

Arsitektur:

```
TikTok LIVE
   ↓
tiktok-live-connector (Node.js)
   ↓
WebSocket bridge
   ↓
LIVE AI INTERACTION
   ↓
Supabase + AI queue + dashboard
```

Jalankan bridge:

```bash
cd tiktok-bridge
npm install
npm start
```

Kemudian di halaman **LIVE**:
- masukkan username atau link LIVE;
- pilih **TikTok Direct Bridge**;
- gunakan `ws://localhost:8787/?username={username}` untuk bridge lokal.

Konektor ini unofficial/reverse-engineered, bukan API resmi TikTok. Dokumentasi konektor menyebut username atau URL LIVE dapat digunakan untuk koneksi publik tanpa kredensial, serta event chat, gift, like, follow/share, member, dan viewer tersedia melalui event stream. citeturn0search0turn1search0

Untuk deployment HTTPS, gunakan WebSocket aman (`wss://`) pada server bridge.

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c91055ba-8e82-4069-893c-9740ff7c1697).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
