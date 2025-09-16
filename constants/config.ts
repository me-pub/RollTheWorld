const getEnv = (key: string, fallback?: string) => {
  const value = process.env[key];
  if (value == null || value.length === 0) {
    if (fallback !== undefined) {
      return fallback;
    }
    console.warn(`Missing environment variable: ${key}`);
    return '';
  }
  return value;
};

const normalizeUrl = (url: string) => {
  if (!url) {
    return url;
  }
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const populationFromEnv = () => {
  const raw = getEnv('EXPO_PUBLIC_WORLD_POPULATION_TODAY');
  const parsed = raw ? Number(raw) : NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 8_142_000_000;
  }
  return Math.floor(parsed);
};

export const Config = {
  turso: {
    databaseUrl: normalizeUrl(getEnv('EXPO_PUBLIC_TURSO_DATABASE_URL')),
    authToken: getEnv('EXPO_PUBLIC_TURSO_AUTH_TOKEN'),
  },
  world: {
    populationToday: populationFromEnv(),
  },
} as const;

export type ConfigType = typeof Config;
