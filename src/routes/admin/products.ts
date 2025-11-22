import { Router } from 'express';
import { AdminAuthRequest } from '../../types/express.js';
import { db } from '../../db/client.js';
import { products } from '../../db/schema.js';
import { verifyAdminTokenOrApiKey } from '../../middleware/auth.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// List all products
router.get('/', verifyAdminTokenOrApiKey, async (req: AdminAuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const allProductsList = await db.query.products.findMany({
      limit,
      offset,
    });

    // Get total count
    const allRecords = await db.query.products.findMany();
    const total = allRecords.length;

    res.json({
      success: true,
      data: allProductsList,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
});

// Get product by ID
router.get('/:id', verifyAdminTokenOrApiKey, async (req: AdminAuthRequest, res, next) => {
  try {
    const product = await db.query.products.findFirst({
      where: eq(products.id, req.params.id),
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

// Update product
router.put('/:id', verifyAdminTokenOrApiKey, async (req: AdminAuthRequest, res, next) => {
  try {
    const updates: any = {};
    
    if (req.body.name) updates.name = req.body.name;
    if (req.body.slug) updates.slug = req.body.slug;
    if (req.body.status) updates.status = req.body.status;
    if (req.body.metadata) updates.metadata = JSON.stringify(req.body.metadata);
    updates.updated_at = new Date();

    const result = await db.update(products)
      .set(updates)
      .where(eq(products.id, req.params.id))
      .returning();
    
    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    res.json({ success: true, data: result[0] });
  } catch (error) {
    next(error);
  }
});

// Delete product
router.delete('/:id', verifyAdminTokenOrApiKey, async (req: AdminAuthRequest, res, next) => {
  try {
    await db.delete(products).where(eq(products.id, req.params.id));
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
