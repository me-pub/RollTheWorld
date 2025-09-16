import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const STORAGE_KEY = 'rolltheworld:deviceId';
const SALT = 'rolltheworld-prototype';

const withSalt = (value: string) => `${SALT}:${value}`;

const hash = async (value: string) => {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value, {
    encoding: Crypto.CryptoEncoding.HEX,
  });
};

const readSecure = async () => {
  try {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    return stored ?? null;
  } catch (error) {
    console.warn('SecureStore read failed', error);
    return null;
  }
};

const writeSecure = async (value: string) => {
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, value, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
  } catch (error) {
    console.warn('SecureStore write failed', error);
  }
};

const deriveHardwareId = async () => {
  if (Platform.OS === 'android') {
    return Application.androidId ?? null;
  }
  if (Platform.OS === 'ios') {
    try {
      const id = await Application.getIosIdForVendorAsync();
      return id ?? null;
    } catch (error) {
      console.warn('getIosIdForVendorAsync failed', error);
    }
  }

  return null;
};

const randomId = () => Crypto.randomUUID();

export const resolveDeviceId = async () => {
  const cached = await readSecure();
  if (cached) {
    return cached;
  }

  const hardware = await deriveHardwareId();
  const base = hardware ?? randomId();
  const hashed = await hash(withSalt(base));
  await writeSecure(hashed);
  return hashed;
};
