import { KVNamespace } from '@cloudflare/workers-types';

export class KVStorage {
  constructor(private kv: KVNamespace) {}

  async get(key: string): Promise<string | null> {
    return this.kv.get(key);
  }

  async getJSON<T = unknown>(key: string): Promise<T | null> {
    const value = await this.kv.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    await this.kv.put(key, value, options);
  }

  async putJSON<T = unknown>(
    key: string,
    value: T,
    options?: { expirationTtl?: number }
  ): Promise<void> {
    await this.kv.put(key, JSON.stringify(value), options);
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }

  async list(options?: { prefix?: string; limit?: number }): Promise<KVNamespace.ListResult<unknown>> {
    return this.kv.list(options);
  }
}

export class SessionStore {
  constructor(private kv: KVNamespace) {}

  async getSession(sessionId: string): Promise<Record<string, any> | null> {
    const storage = new KVStorage(this.kv);
    return storage.getJSON(`session:${sessionId}`);
  }

  async setSession(
    sessionId: string,
    data: Record<string, any>,
    ttl: number = 86400
  ): Promise<void> {
    const storage = new KVStorage(this.kv);
    await storage.putJSON(`session:${sessionId}`, data, { expirationTtl: ttl });
  }

  async deleteSession(sessionId: string): Promise<void> {
    const storage = new KVStorage(this.kv);
    await storage.delete(`session:${sessionId}`);
  }
}

export class CacheStore {
  constructor(private kv: KVNamespace) {}

  async get<T = unknown>(key: string): Promise<T | null> {
    const storage = new KVStorage(this.kv);
    return storage.getJSON<T>(`cache:${key}`);
  }

  async set<T = unknown>(key: string, value: T, ttl: number = 3600): Promise<void> {
    const storage = new KVStorage(this.kv);
    await storage.putJSON(`cache:${key}`, value, { expirationTtl: ttl });
  }

  async delete(key: string): Promise<void> {
    const storage = new KVStorage(this.kv);
    await storage.delete(`cache:${key}`);
  }

  async invalidatePattern(prefix: string): Promise<void> {
    const storage = new KVStorage(this.kv);
    const list = await storage.list({ prefix: `cache:${prefix}` });
    for (const item of list.keys) {
      await storage.delete(item.name);
    }
  }
}
