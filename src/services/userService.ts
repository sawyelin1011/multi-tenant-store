import bcrypt from 'bcryptjs';
import { config } from '../config/env.js';
import { db } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  role: string;
  api_key?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  role?: string;
  api_key?: string;
}

export interface UpdateUserData {
  email?: string;
  password?: string;
  role?: string;
  api_key?: string;
  is_active?: boolean;
}

class UserService {
  async createUser(userData: CreateUserData): Promise<User> {
    const passwordHash = await bcrypt.hash(userData.password, config.bcryptRounds);
    
    const user = {
      id: uuidv4(),
      email: userData.email,
      password_hash: passwordHash,
      role: userData.role || 'user',
      api_key: userData.api_key,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const result = await db.one(
      `INSERT INTO users (id, email, password_hash, role, api_key, is_active, created_at, updated_at)
       VALUES ($[id], $[email], $[password_hash], $[role], $[api_key], $[is_active], $[created_at], $[updated_at])
       RETURNING *`,
      user
    );

    return this.parseUser(result);
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await db.oneOrNone(
      'SELECT * FROM users WHERE id = $[id]',
      { id }
    );
    
    return result ? this.parseUser(result) : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await db.oneOrNone(
      'SELECT * FROM users WHERE email = $[email]',
      { email }
    );
    
    return result ? this.parseUser(result) : null;
  }

  async getUserByApiKey(apiKey: string): Promise<User | null> {
    const result = await db.oneOrNone(
      'SELECT * FROM users WHERE api_key = $[apiKey] AND is_active = true',
      { apiKey }
    );
    
    return result ? this.parseUser(result) : null;
  }

  async updateUser(id: string, userData: UpdateUserData): Promise<User | null> {
    const updates: string[] = [];
    const values: any = { id, updated_at: new Date().toISOString() };

    if (userData.email !== undefined) {
      updates.push('email = $[email]');
      values.email = userData.email;
    }
    
    if (userData.password !== undefined) {
      const passwordHash = await bcrypt.hash(userData.password, config.bcryptRounds);
      updates.push('password_hash = $[password_hash]');
      values.password_hash = passwordHash;
    }
    
    if (userData.role !== undefined) {
      updates.push('role = $[role]');
      values.role = userData.role;
    }
    
    if (userData.api_key !== undefined) {
      updates.push('api_key = $[api_key]');
      values.api_key = userData.api_key;
    }
    
    if (userData.is_active !== undefined) {
      updates.push('is_active = $[is_active]');
      values.is_active = userData.is_active;
    }

    if (updates.length === 0) {
      return this.getUserById(id);
    }

    updates.push('updated_at = $[updated_at]');

    const result = await db.oneOrNone(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $[id] RETURNING *`,
      values
    );

    return result ? this.parseUser(result) : null;
  }

  async validatePassword(email: string, password: string): Promise<User | null> {
    const result = await db.oneOrNone(
      'SELECT * FROM users WHERE email = $[email] AND is_active = true',
      { email }
    );

    if (!result) {
      return null;
    }

    const isValid = await bcrypt.compare(password, result.password_hash);
    if (!isValid) {
      return null;
    }

    return this.parseUser(result);
  }

  async listUsers(limit: number = 50, offset: number = 0): Promise<{ users: User[]; total: number }> {
    const users = await db.manyOrNone(
      'SELECT * FROM users ORDER BY created_at DESC LIMIT $[limit] OFFSET $[offset]',
      { limit, offset }
    );

    const totalResult = await db.one('SELECT COUNT(*) as count FROM users');
    const total = parseInt(totalResult.count);

    return {
      users: users.map((user: any) => this.parseUser(user)),
      total,
    };
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.result('DELETE FROM users WHERE id = $[id]', { id });
    return result.rowCount > 0;
  }

  private parseUser(user: any): User {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      api_key: user.api_key,
      is_active: Boolean(user.is_active),
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }
}

export const userService = new UserService();