import { config } from '../config/env.js';
import { userService } from '../services/userService.js';

async function checkTableExists(): Promise<boolean> {
  try {
    await userService.getUserByEmail('test@check.com');
    return true;
  } catch (error: any) {
    // If table doesn't exist, we'll get an error
    if (error?.message?.includes('does not exist') || error?.message?.includes('no such table')) {
      return false;
    }
    // Other errors mean table exists but query failed for other reasons
    return true;
  }
}

export async function initSuperAdmin(): Promise<void> {
  try {
    // Check if users table exists
    const tableExists = await checkTableExists();
    if (!tableExists) {
      console.log('⚠️  Users table not found. Skipping super admin initialization.');
      console.log('💡 Run: npm run db:migrate:up');
      return;
    }

    // Check if super admin already exists
    const existingAdmin = await userService.getUserByEmail(config.superAdminEmail);
    
    if (!existingAdmin) {
      console.log('🔧 Creating super admin user...');
      
      // Create super admin user
      await userService.createUser({
        email: config.superAdminEmail,
        password: config.superAdminPassword,
        role: 'super_admin',
        api_key: config.superAdminApiKey,
      });
      
      console.log(`✅ Super admin created: ${config.superAdminEmail}`);
      console.log(`🔑 API Key: ${config.superAdminApiKey}`);
    } else {
      // Update API key if it's different
      if (existingAdmin.api_key !== config.superAdminApiKey) {
        await userService.updateUser(existingAdmin.id, {
          api_key: config.superAdminApiKey,
        });
        console.log(`🔄 Updated super admin API key`);
      } else {
        console.log('✅ Super admin already exists');
      }
    }
  } catch (error: any) {
    console.error('❌ Failed to initialize super admin:', error?.message || error);
    console.error('⚠️  Application will continue but super admin may not be available');
  }
}

export default initSuperAdmin;
