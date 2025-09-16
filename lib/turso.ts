import { createClient, Client } from '@libsql/client/web';

import { Config } from '@/constants/config';

let client: Client | null = null;

export const getTursoClient = () => {
  if (client) {
    return client;
  }

  if (!Config.turso.databaseUrl || !Config.turso.authToken) {
    throw new Error('Turso credentials are missing. Check EXPO_PUBLIC_TURSO_* env vars.');
  }

  client = createClient({
    url: Config.turso.databaseUrl,
    authToken: Config.turso.authToken,
  });

  return client;
};
