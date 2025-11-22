import bcrypt from 'bcryptjs';
import { config } from '../config/env.js';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc } from 'drizzle-orm';

export interface User {
  id: string;
  email: string;
  role: string;
  api_key?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
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
    
    const result = await db.insert(users).values({
      id: uuidv4(),
      email: userData.email,
      password_hash: passwordHash,
      role: (userData.role || 'user') as 'user' | 'admin' | 'super_admin',
      api_key: userData.api_key,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    }).returning();

    return result[0] as User;
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
    
    return result as User | null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    
    return result as User | null;
  }

  async getUserByApiKey(apiKey: string): Promise<User | null> {
    const result = await db.query.users.findFirst({
      where: and(
        eq(users.api_key, apiKey),
        eq(users.is_active, true),
      ),
    });
    
    return result as User | null;
  }

  async updateUser(id: string, userData: UpdateUserData): Promise<User | null> {
    const updates: any = {};

    if (userData.email !== undefined) {
      updates.email = userData.email;
    }
    
    if (userData.password !== undefined) {
      const passwordHash = await bcrypt.hash(userData.password, config.bcryptRounds);
      updates.password_hash = passwordHash;
    }
    
    if (userData.role !== undefined) {
      updates.role = userData.role as 'user' | 'admin' | 'super_admin';
    }
    
    if (userData.api_key !== undefined) {
      updates.api_key = userData.api_key;
    }
    
    if (userData.is_active !== undefined) {
      updates.is_active = userData.is_active;
    }

    if (Object.keys(updates).length === 0) {
      return this.getUserById(id);
    }

    updates.updated_at = new Date();

    const result = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();

    return result.length > 0 ? (result[0] as User) : null;
  }

  async validatePassword(email: string, password: string): Promise<User | null> {
    const result = await db.query.users.findFirst({
      where: and(
        eq(users.email, email),
        eq(users.is_active, true),
      ),
    });

    if (!result) {
      return null;
    }

    const isValid = await bcrypt.compare(password, result.password_hash);
    if (!isValid) {
      return null;
    }

    return result as User;
  }

  async listUsers(limit: number = 50, offset: number = 0): Promise<{ users: User[]; total: number }> {
    const userList = await db.query.users.findMany({
      orderBy: desc(users.created_at),
      limit,
      offset,
    });

    // Count total - get all records to count
    const allRecords = await db.query.users.findMany();
    const total = allRecords.length;

    return {
      users: userList as User[],
      total,
    };
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return true;
  }
}

export const userService = new UserService();