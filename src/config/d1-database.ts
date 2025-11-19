import { D1Database } from '@cloudflare/workers-types';

export class D1Adapter {
  constructor(private db: D1Database) {}

  async query(sql: string, params?: any[]) {
    const stmt = this.db.prepare(sql);
    const result = params ? stmt.bind(...params).all() : stmt.all();
    return result;
  }

  async one(sql: string, params?: any[]) {
    const result = await this.query(sql, params);
    if (result.success && result.results && result.results.length > 0) {
      return result.results[0];
    }
    return null;
  }

  async oneOrNone(sql: string, params?: any[]) {
    return this.one(sql, params);
  }

  async many(sql: string, params?: any[]) {
    const result = await this.query(sql, params);
    return result.success && result.results ? result.results : [];
  }

  async any(sql: string, params?: any[]) {
    return this.many(sql, params);
  }

  async none(sql: string, params?: any[]) {
    await this.query(sql, params);
  }
}
