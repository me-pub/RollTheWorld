import { ensureSchema } from './schema';
import { getTursoClient } from './turso';
import { Config } from '@/constants/config';
import { utcTodayYyyymmdd, nowMs } from '@/utils/date';
import { resolveDeviceId } from '@/utils/device-id';
import { cacheLastRoll, CachedRoll, getCachedRoll } from '@/utils/local-cache';

export type RankSummary = {
  rank: number;
  total: number;
};

export type RollResult = CachedRoll & RankSummary;

export type LeaderboardEntry = {
  deviceId: string;
  value: number;
  rank: number;
};

const toNumber = (value: unknown): number => {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`Expected number, received ${value}`);
  }
  return num;
};

const toStringVal = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (value == null) {
    return '';
  }
  return String(value);
};

const fetchRankRow = async (deviceId: string, day: number) => {
  const client = getTursoClient();
  const { rows } = await client.execute({
    sql: `SELECT value,
                 1 + (SELECT COUNT(*) FROM rolls r2 WHERE r2.yyyymmdd = ? AND r2.value > r1.value) AS rank,
                 (SELECT COUNT(*) FROM rolls WHERE yyyymmdd = ?) AS total
          FROM rolls r1
          WHERE r1.device_id = ? AND r1.yyyymmdd = ?
          LIMIT 1`,
    args: [day, day, deviceId, day],
  });

  if (rows.length === 0) {
    return null;
  }

  const [row] = rows as Array<Record<string, unknown>>;
  return {
    value: toNumber(row.value),
    rank: toNumber(row.rank),
    total: toNumber(row.total),
  };
};

const ensureDeviceRow = async (deviceId: string) => {
  const client = getTursoClient();
  await client.execute({
    sql: `INSERT OR IGNORE INTO devices (device_id, created_at) VALUES (?, ?)`,
    args: [deviceId, nowMs()],
  });
};

export const performDailyRoll = async (): Promise<RollResult> => {
  await ensureSchema();

  const deviceId = await resolveDeviceId();
  const day = utcTodayYyyymmdd();
  const client = getTursoClient();

  await ensureDeviceRow(deviceId);

  const rollValue = Math.floor(Math.random() * Config.world.populationToday) + 1;
  const now = nowMs();

  const result = await client.execute({
    sql: `INSERT INTO rolls (device_id, yyyymmdd, value, created_at) VALUES (?, ?, ?, ?)`,
    args: [deviceId, day, rollValue, now],
  });

  if (result.rowsAffected === 0) {
    const rankRow = await fetchRankRow(deviceId, day);
    if (!rankRow) {
      throw new Error('Roll exists but rank lookup failed');
    }

    const payload: RollResult = { date: day, value: rankRow.value, rank: rankRow.rank, total: rankRow.total };
    await cacheLastRoll(payload);
    return payload;
  }

  const rankRow = await fetchRankRow(deviceId, day);
  if (!rankRow) {
    throw new Error('Rank calculation failed after roll');
  }

  const payload: RollResult = { date: day, value: rollValue, rank: rankRow.rank, total: rankRow.total };
  await cacheLastRoll(payload);
  return payload;
};

export const getCurrentRoll = async () => {
  await ensureSchema();
  const deviceId = await resolveDeviceId();
  const day = utcTodayYyyymmdd();
  const row = await fetchRankRow(deviceId, day);
  if (!row) {
    const cached = await getCachedRoll();
    return cached && cached.date === day ? cached : null;
  }

  const payload: RollResult = { date: day, value: row.value, rank: row.rank, total: row.total };
  await cacheLastRoll(payload);
  return payload;
};

export const fetchLeaderboardTop = async (limit = 100): Promise<LeaderboardEntry[]> => {
  await ensureSchema();
  const day = utcTodayYyyymmdd();
  const client = getTursoClient();
  const { rows } = await client.execute({
    sql: `SELECT device_id, value FROM rolls WHERE yyyymmdd = ? ORDER BY value DESC LIMIT ?`,
    args: [day, limit],
  });

  return (rows as Array<Record<string, unknown>>).map((row, index) => ({
    deviceId: toStringVal(row.device_id),
    value: toNumber(row.value),
    rank: index + 1,
  }));
};

export const fetchLeaderboardAround = async (): Promise<LeaderboardEntry[]> => {
  await ensureSchema();
  const client = getTursoClient();
  const deviceId = await resolveDeviceId();
  const day = utcTodayYyyymmdd();
  const { rows } = await client.execute({
    sql: `WITH ordered AS (
            SELECT device_id, value,
                   ROW_NUMBER() OVER (ORDER BY value DESC) AS rn
            FROM rolls
            WHERE yyyymmdd = ?
          )
          SELECT device_id, value, rn
          FROM ordered
          WHERE rn BETWEEN (
            SELECT rn FROM ordered WHERE device_id = ?
          ) - 10 AND (
            SELECT rn FROM ordered WHERE device_id = ?
          ) + 10
          ORDER BY rn`,
    args: [day, deviceId, deviceId],
  });

  return (rows as Array<Record<string, unknown>>).map((row) => ({
    deviceId: toStringVal(row.device_id),
    value: toNumber(row.value),
    rank: toNumber(row.rn),
  }));
};

export type HistoryEntry = {
  date: number;
  value: number;
  rank: number;
  total: number;
};

export const fetchHistory = async (limit = 30): Promise<HistoryEntry[]> => {
  await ensureSchema();
  const client = getTursoClient();
  const deviceId = await resolveDeviceId();
  const { rows } = await client.execute({
    sql: `SELECT yyyymmdd AS date,
                 value,
                 1 + (SELECT COUNT(*) FROM rolls r2 WHERE r2.yyyymmdd = rolls.yyyymmdd AND r2.value > rolls.value) AS rank,
                 (SELECT COUNT(*) FROM rolls WHERE yyyymmdd = rolls.yyyymmdd) AS total
          FROM rolls
          WHERE device_id = ?
          ORDER BY yyyymmdd DESC
          LIMIT ?`,
    args: [deviceId, limit],
  });

  return (rows as Array<Record<string, unknown>>).map((row) => ({
    date: toNumber(row.date),
    value: toNumber(row.value),
    rank: toNumber(row.rank),
    total: toNumber(row.total),
  }));
};
