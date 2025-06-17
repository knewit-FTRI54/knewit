import Redis from 'ioredis';
import { SessionState } from '../types/types.js';

const redis = new Redis({ keyPrefix: 'session:' });

export async function saveSession(id: string, state: SessionState) {
  // 1-hour TTL
  await redis.set(id, JSON.stringify(state), 'EX', 3600);
}

export async function loadSession(id: string): Promise<SessionState | null> {
  const raw = await redis.get(id);
  return raw ? (JSON.parse(raw) as SessionState) : null;
}
