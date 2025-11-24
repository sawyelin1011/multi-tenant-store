import { KVNamespace } from '../db/d1.js';

export class KVCache {
  constructor(private kv: KVNamespace) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.kv.get(key);
      if (!data) return null;

      try {
        return JSON.parse(data) as T;
      } catch {
        return data as T;
      }
    } catch (error: any) {
      console.error('KV get error:', { key, error: error.message });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await this.kv.put(key, serialized, {
        expirationTtl: ttl,
      });
    } catch (error: any) {
      console.error('KV set error:', { key, error: error.message });
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.kv.delete(key);
    } catch (error: any) {
      console.error('KV delete error:', { key, error: error.message });
    }
  }

  async clear(prefix: string = ''): Promise<void> {
    try {
      let cursor: string | undefined;
      let hasMore = true;

      while (hasMore) {
        const result = await this.kv.list({ prefix, limit: 1000, cursor });
        for (const key of result.keys) {
          await this.kv.delete(key.name);
        }
        hasMore = result.list_complete === false;
        cursor = result.cursor;
      }
    } catch (error: any) {
      console.error('KV clear error:', { prefix, error: error.message });
    }
  }

  async increment(key: string, amount: number = 1, ttl: number = 3600): Promise<number> {
    try {
      const current = await this.get<number>(key);
      const newValue = (current || 0) + amount;
      await this.set(key, newValue, ttl);
      return newValue;
    } catch (error: any) {
      console.error('KV increment error:', { key, error: error.message });
      return 0;
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    try {
      const value = await this.get(key);
      if (value !== null) {
        await this.set(key, value, ttl);
      }
    } catch (error: any) {
      console.error('KV expire error:', { key, error: error.message });
    }
  }
}
