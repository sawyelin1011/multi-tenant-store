import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { userService } from '../services/userService.js';
import { SuperAdminService } from '../services/superAdminService.js';
import { AdminAuthRequest } from '../types/express.js';

const router = Router();

// Admin login
router.post('/admin/login', async (req: AdminAuthRequest, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    const user = await userService.validatePassword(email, password);
    
    if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      config.adminJwtSecret!,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Generate API key for admin user
router.post('/admin/api-keys', async (req: AdminAuthRequest, res, next) => {
  try {
    const { name, tenant_id, scopes, expires_at } = req.body;

    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Generate a new API key
    const apiKey = `sk_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Update the user with the new API key
    await userService.updateUser(req.admin.id, {
      api_key: apiKey,
    });

    res.json({
      success: true,
      data: {
        api_key: apiKey,
        name,
        tenant_id,
        scopes,
        expires_at,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;