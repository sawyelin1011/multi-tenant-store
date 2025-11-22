import dotenv from 'dotenv';
dotenv.config();
import { config } from './src/config/env.js';

console.log('=== Testing Configuration ===');
console.log('SUPER_ADMIN_API_KEY:', config.superAdminApiKey);
console.log('ADMIN_JWT_SECRET:', config.adminJwtSecret ? 'SET' : 'NOT SET');
console.log('DB_TYPE:', config.dbType);

// Test auth middleware logic
const apiKey = 'sk_live_super_admin_real_key_123456789';

if (!apiKey) {
  console.log('❌ No API key provided');
} else if (!config.superAdminApiKey) {
  console.log('❌ SUPER_ADMIN_API_KEY not configured in environment');
} else if (apiKey !== config.superAdminApiKey) {
  console.log('❌ Invalid API key');
  console.log('Expected:', config.superAdminApiKey);
  console.log('Got:', apiKey);
} else {
  console.log('✅ API key authentication would succeed');
}