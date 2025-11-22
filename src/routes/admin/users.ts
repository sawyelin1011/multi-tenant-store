import { Router } from 'express';
import { AdminAuthRequest } from '../../types/express.js';
import { userService } from '../../services/userService.js';
import { verifyAdminTokenOrApiKey } from '../../middleware/auth.js';

const router = Router();

// List all users
router.get('/', verifyAdminTokenOrApiKey, async (req: AdminAuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const result = await userService.listUsers(limit, offset);

    res.json({
      success: true,
      data: result.users,
      total: result.total,
      page,
      limit,
      pages: Math.ceil(result.total / limit),
    });
  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get('/:id', verifyAdminTokenOrApiKey, async (req: AdminAuthRequest, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// Update user
router.put('/:id', verifyAdminTokenOrApiKey, async (req: AdminAuthRequest, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// Delete user
router.delete('/:id', verifyAdminTokenOrApiKey, async (req: AdminAuthRequest, res, next) => {
  try {
    const success = await userService.deleteUser(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
