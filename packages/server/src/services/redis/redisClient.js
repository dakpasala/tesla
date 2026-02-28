// Singleton Redis client factory using the ioredis-compatible `redis` package.
// Lazily connects on first use and reuses the same client across the application.
// Connection URL is sourced from the REDIS_URL environment variable.

import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

let client;
let connecting;

export async function getRedisClient() {
  if (!client) {
    client = createClient({
      url: process.env.REDIS_URL,
    });

    client.on('connect', () => console.log('Connected.'));
    client.on('error', (err) => console.error('Redis error:', err));
  }

  if (!client.isOpen) {
    if (!connecting) connecting = client.connect();
    await connecting;
  }

  return client;
}
