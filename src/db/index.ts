import { drizzle } from 'drizzle-orm/libsql';
import { createClient, type Client } from '@libsql/client';
import * as schema from './schema';

let client: Client | null = null;

function getClient() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    
    if (!url || !authToken) {
      throw new Error('Missing Turso credentials');
    }
    
    client = createClient({ url, authToken });
  }
  return client;
}

export const db = drizzle(getClient(), { schema });
