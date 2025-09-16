
# ROLL the World — Project Breakdown (Expo + TursoDB, no backend)

A minimalist, global **number roll** app. Each device rolls **one integer per day** in the range **[1 … world_population_today]**, stores it in **TursoDB**, and shows your **global rank** among all players.

Design language: **dark navy gradient, rounded glassy cards, soft shadows, pill buttons, compact bottom nav** — following your reference image.

---

## 0) Tech Stack

- **App:** Expo (React Native, TypeScript)
- **DB:** Turso (libSQL). Direct client from app (prototype trade‑off; see Security notes).
- **Local cache:** `expo-sqlite` (optional for offline) or MMKV
- **Device ID:** `expo-application` (+ `expo-secure-store` for persistence)
- **State:** Zustand or React Context
- **UI:** RN + Reanimated (optional), `expo-linear-gradient`, `expo-blur`

> **Important:** Without a backend, you must embed a **Turso auth token** in the client. That’s acceptable for a prototype, but it can be extracted. Use tight DB permissions and constraints to minimize risk (see §Security).

---

## 1) Core Features (MVP)

1. **Daily Roll**
   - Range: `1..8,142,000,000` (update daily via constant or manual setting).
   - One roll per device per UTC day.
   - Persist to Turso and local cache.
2. **Leaderboard & Rank**
   - Shows your **rank** among all rolls for the current day.
   - Global top 100 and your relative position ±10.
3. **Profile (Device)**
   - Shows your previous rolls (last 7–30 days).
4. **Rate Limit**
   - Enforced locally + DB constraint (unique `(device_id, yyyymmdd)`).
5. **Design**
   - Dark navy gradient background, rounded “cards”, pill buttons, soft shadows.

**Post‑MVP**
- Country leaderboards (iso_country via device locale).
- Streak for daily play.
- Share card (image) of your roll + rank.
- Animated rolling reel (slot‑machine effect).

---

## 2) Information Architecture

- **Tabs:** Home (Roll) • Leaderboard • History • Settings
- **Home:** Big glassy card with today’s population + CTA “ROLL” → result reveal & confetti.
- **Leaderboard:** Today’s ranks; search your device; show percentile.
- **History:** List of past rolls for this device; streak; best rank.
- **Settings:** Theme, timezone (UTC/local), data reset (local only).

---

## 3) Data Model (Turso)

```sql
-- Devices (anonymous). Optional: store hashed device_id only.
CREATE TABLE IF NOT EXISTS devices (
  device_id TEXT PRIMARY KEY,        -- hashed with app salt
  created_at INTEGER NOT NULL
);

-- Daily population source of truth (manual for now)
CREATE TABLE IF NOT EXISTS world_pop (
  yyyymmdd INTEGER PRIMARY KEY,
  population INTEGER NOT NULL CHECK(population > 0)
);

-- Rolls: one per device per day
CREATE TABLE IF NOT EXISTS rolls (
  device_id TEXT NOT NULL,
  yyyymmdd INTEGER NOT NULL,
  value INTEGER NOT NULL CHECK(value > 0),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (device_id, yyyymmdd),         -- one per device per day
  FOREIGN KEY (device_id) REFERENCES devices(device_id)
);
CREATE INDEX IF NOT EXISTS idx_rolls_day_value ON rolls(yyyymmdd, value);

-- View: rank for a given day (SQLite window functions supported)
-- Example query shown below in §Queries.
```

**Local cache (SQLite/MMKV):**
- `last_roll:{yyyymmdd}` → value
- `my_rank:{yyyymmdd}` → integer
- `streak_current`, `streak_best`

---

## 4) Core Queries

```sql
-- Insert or reject if already rolled today
INSERT INTO rolls (device_id, yyyymmdd, value, created_at)
VALUES (?, ?, ?, strftime('%s','now')*1000);

-- Compute rank (1 = best/highest or lowest? Choose one)
-- If higher value is better:
SELECT 1 + (SELECT COUNT(*) FROM rolls r2 WHERE r2.yyyymmdd = ? AND r2.value > r1.value) AS rank,
       (SELECT COUNT(*) FROM rolls WHERE yyyymmdd = ?) AS total
FROM rolls r1
WHERE r1.device_id = ? AND r1.yyyymmdd = ?
LIMIT 1;

-- Top N for the day (higher is better)
SELECT device_id, value FROM rolls WHERE yyyymmdd = ?
ORDER BY value DESC LIMIT 100;

-- Around me (±10)
WITH my AS (
  SELECT value FROM rolls WHERE device_id = ? AND yyyymmdd = ?
),
ordered AS (
  SELECT device_id, value,
         ROW_NUMBER() OVER (ORDER BY value DESC) AS rn
  FROM rolls WHERE yyyymmdd = ?
)
SELECT * FROM ordered
WHERE rn BETWEEN (SELECT rn FROM ordered WHERE device_id = ?) - 10
             AND (SELECT rn FROM ordered WHERE device_id = ?) + 10;
```

> Decide **direction**: bigger number = better rank (fits “roll the world’s biggest”).

---

## 5) Rate Limiting Strategy (no backend)

- **Local gate:** store `last_roll_yyyymmdd` per device in SecureStore; block UI if already rolled.
- **DB constraint:** `PRIMARY KEY(device_id, yyyymmdd)` makes a second write fail.
- **Device ID:** hash `Application.androidId || iosIdForVendor` with app salt before sending to DB.

```ts
const deviceId = hash(`${platformId}-${appSalt}`); // never send raw ids
```

---

## 6) Connecting to Turso from Expo

```ts
// lib/turso.ts
import { createClient } from "@libsql/client/web"; // works in RN with fetch

export const turso = createClient({
  url: "libsql://<your-db-name>-<org>.turso.io",
  authToken: "<WRITE_SCOPED_TOKEN>", // prototype only
});
```

> For production, mint short‑lived tokens server‑side; since you want **no backend**, treat this as **prototype** with tight DB constraints and revokable token.

---

## 7) UI Design Guidance (match your image)

**Palette**
- Background gradient: `#0F1B3D → #0A1330` (top→bottom).
- Cards: deep navy `#12224F` with **soft inner light**.
- Accents: **indigo/blue** buttons `#355CFF`, white text.
- Secondary text: `rgba(255,255,255,0.72)`; muted `0.6`.

**Components**
- **Top hero card**: rounded 24, drop shadow (y=8, blur=24), inner gradient.
- **Pill buttons**: 14–16 radius, medium elevation, subtle gradient.
- **Bottom tab**: curved white dock or translucent glass; active pill.
- **Cover art slot**: use large circular stat for today’s roll.
- **Typography**: Title 28–32 (Semibold), body 16, small 12–13.

**Motion**
- Button press scale `0.98`, ease‑out 120ms.
- Roll animation: slot‑machine count‑up (500–1200ms), confetti on settle.

---

## 8) Screens & Flows

### Home (Roll)
- Shows today’s population and your status:
  - If not rolled → CTA “ROLL” (big).
  - If rolled → show your value, rank, percentile, share button.
- Visual: large circular meter inside a glassy card.

### Leaderboard
- Tabs: **Today** • **All‑time high** (optional).
- Sections: Top 100, **Around You** (±10), search by device ID (masked).

### History
- List of past 30 rolls: date, value, rank badge, streak.

### Settings
- Region/country (to slice leaderboards later), theme, reset local cache.

---

## 9) Example Client Flow (TypeScript pseudo)

```ts
const today = yyyymmddUTC();
const roll = Math.floor(Math.random() * population) + 1;

await turso.execute({
  sql: "INSERT INTO rolls (device_id, yyyymmdd, value, created_at) VALUES (?, ?, ?, ?)",
  args: [deviceId, today, roll, Date.now()]
}); // fails if already rolled

const { rows } = await turso.execute({
  sql: `SELECT 1 + (SELECT COUNT(*) FROM rolls r2 WHERE r2.yyyymmdd = ? AND r2.value > r1.value) AS rank,
               (SELECT COUNT(*) FROM rolls WHERE yyyymmdd = ?) AS total
        FROM rolls r1 WHERE r1.device_id = ? AND r1.yyyymmdd = ? LIMIT 1`,
  args: [today, today, deviceId, today]
});
const { rank, total } = rows[0];
```

---

## 10) EPICs & Phases

### **Phase 0 — Prototype (1–2 days)**
- **EPIC: Turso schema & client wiring**
  - Make env.example with basic turso config.
  - Create tables, seed `world_pop` for today.
  - Embed *write‑scoped* token (prototype).
- **EPIC: Home Roll flow**
  - Device ID, local gate, insert roll, rank calc.
  - Slot animation + confetti.
- **EPIC: Leaderboard (Top 100 + Around Me)**
  - Queries + basic list UI.


### **Phase 1 — Polish & Reliability (3–5 days)**
- **EPIC: Offline cache + retry queue**
  - If write fails, queue and retry; show cached rank.
- **EPIC: History & streaks**
  - Local + remote fetch; badges.
- **EPIC: Design polish**
  - Gradient, glass cards, pill nav, haptics, accessibility.

### **Phase 2 — Scale & Fairness (1 week)**
- **EPIC: Country boards and percentiles**
  - Add `iso_country` from device locale.
- **EPIC: Abuse & integrity**
  - Serverless edge (optional) to mint short tokens; add row-level triggers for bounds checks.
- **EPIC: Shareables**
  - Render image card of roll + rank.

### **Phase 3 — Nice‑to‑have**
- **EPIC: Daily population auto‑update**
  - Small script/edge job to update `world_pop`.
- **EPIC: All‑time records**
  - Highest daily rolls, longest streaks.
- **EPIC: Theming (light/amoled)**

---

## 11) Security Notes (no backend constraint)

- **Token exposure:** the Turso token in the app can be extracted. Mitigate by:
  - Restricting token to a **single DB** and rotate regularly.
  - Add **CHECK constraints** to prevent out‑of‑range inserts.
  - Use **PRIMARY KEY(device_id, yyyymmdd)** to enforce 1/day.
  - Consider moving to a tiny **edge token mint** later for production.

```sql
ALTER TABLE rolls ADD CONSTRAINT ck_roll_range
  CHECK (value >= 1 AND value <= (SELECT population FROM world_pop WHERE yyyymmdd = rolls.yyyymmdd));
```

---

## 12) Definition of Done (MVP)

- [ ] One successful roll per device per day (client+DB enforced)
- [ ] Rank & total displayed immediately
- [ ] Leaderboard (Top 100 + Around Me)
- [ ] History list with streak
- [ ] UI matches dark navy/glassy style
- [ ] Works on iOS & Android in Expo
