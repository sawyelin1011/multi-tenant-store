import { config } from '../config/env.js';
import { userService } from './userService.js';

export class SuperAdminService {
  private static initialized = false;

  static async initializeSuperAdmin(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
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
          console.log(`🔄 Updated super admin API key: ${config.superAdminApiKey}`);
        } else {
          console.log('✅ Super admin already exists');
        }
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize super admin:', error);
      throw error;
    }
  }

  static getApiKey(): string {
    return config.superAdminApiKey;
  }

  static getSuperAdminEmail(): string {
    return config.superAdminEmail;
  }

  static async validateSuperAdminApiKey(apiKey: string): Promise<boolean> {
    return apiKey === config.superAdminApiKey;
  }
}

export default SuperAdminService;