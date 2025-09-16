import * as SecureStore from 'expo-secure-store';

const ensureJson = <T>(value: string | null): T | null => {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn('Failed to parse cache payload', error);
    return null;
  }
};

const writeJson = async (key: string, value: unknown) => {
  try {
    await SecureStore.setItemAsync(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to write cache', error);
  }
};

const readJson = async <T>(key: string) => {
  try {
    const raw = await SecureStore.getItemAsync(key);
    return ensureJson<T>(raw);
  } catch (error) {
    console.warn('Failed to read cache', error);
    return null;
  }
};

const deleteKey = async (key: string) => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.warn('Failed to clear cache', error);
  }
};

const LAST_ROLL_KEY = 'rolltheworld:lastRoll';

export type CachedRoll = {
  date: number;
  value: number;
  rank?: number;
  total?: number;
};

export const cacheLastRoll = async (payload: CachedRoll) => writeJson(LAST_ROLL_KEY, payload);

export const getCachedRoll = () => readJson<CachedRoll>(LAST_ROLL_KEY);

export const clearCachedRoll = () => deleteKey(LAST_ROLL_KEY);
