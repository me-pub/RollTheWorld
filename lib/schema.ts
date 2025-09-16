import { getTursoClient } from './turso';
import { utcTodayYyyymmdd } from '@/utils/date';
import { Config } from '@/constants/config';

const statements = [
  `CREATE TABLE IF NOT EXISTS devices (
    device_id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS world_pop (
    yyyymmdd INTEGER PRIMARY KEY,
    population INTEGER NOT NULL CHECK(population > 0)
  )`,
  `CREATE TABLE IF NOT EXISTS rolls (
    device_id TEXT NOT NULL,
    yyyymmdd INTEGER NOT NULL,
    value INTEGER NOT NULL CHECK(value > 0),
    created_at INTEGER NOT NULL,
    PRIMARY KEY (device_id, yyyymmdd),
    FOREIGN KEY (device_id) REFERENCES devices(device_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_rolls_day_value ON rolls(yyyymmdd, value)`
];

let initialized = false;
let inflight: Promise<void> | null = null;

export const ensureSchema = async () => {
  if (initialized) {
    return;
  }

  if (inflight) {
    return inflight;
  }

  inflight = (async () => {
    const client = getTursoClient();
    for (const sql of statements) {
      await client.execute(sql);
    }

    const today = utcTodayYyyymmdd();
    await client.execute({
      sql: `INSERT INTO world_pop (yyyymmdd, population)
            VALUES (?, ?)
            ON CONFLICT(yyyymmdd) DO UPDATE SET population = excluded.population`,
      args: [today, Config.world.populationToday],
    });

    initialized = true;
  })();

  try {
    await inflight;
  } finally {
    inflight = null;
  }
};
