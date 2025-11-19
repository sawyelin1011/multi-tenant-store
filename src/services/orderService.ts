import { db } from '../config/database.js';
import { Order, OrderItem } from '../types/index.js';
import { NotFoundError } from '../utils/errors.js';

export class OrderService {
  async createOrder(tenantId: string, data: {
    user_id?: string;
    order_number?: string;
    status?: string;
    items_data?: Record<string, any>;
    pricing_data?: Record<string, any>;
    payment_data?: Record<string, any>;
    customer_data?: Record<string, any>;
  }): Promise<Order> {
    const order = await db.one(
      `INSERT INTO orders (tenant_id, user_id, order_number, status, items_data, pricing_data, payment_data, customer_data, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        tenantId,
        data.user_id,
        data.order_number,
        data.status || 'pending',
        JSON.stringify(data.items_data || {}),
        JSON.stringify(data.pricing_data || {}),
        JSON.stringify(data.payment_data || {}),
        JSON.stringify(data.customer_data || {}),
        '{}',
      ]
    );

    return order;
  }

  async getOrder(tenantId: string, id: string): Promise<Order> {
    const order = await db.oneOrNone(
      'SELECT * FROM orders WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    return order;
  }

  async listOrders(tenantId: string, filters: any = {}, limit: number = 50, offset: number = 0) {
    let query = 'SELECT * FROM orders WHERE tenant_id = $1';
    let params: any[] = [tenantId];
    let paramIndex = 2;

    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.user_id) {
      query += ` AND user_id = $${paramIndex}`;
      params.push(filters.user_id);
      paramIndex++;
    }

    const data = await db.manyOrNone(
      query + ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    let countQuery = 'SELECT COUNT(*) as count FROM orders WHERE tenant_id = $1';
    const countParams = [tenantId];

    if (filters.status) {
      countQuery += ` AND status = $2`;
      countParams.push(filters.status);
    }

    if (filters.user_id) {
      const idx = countParams.length + 1;
      countQuery += ` AND user_id = $${idx}`;
      countParams.push(filters.user_id);
    }

    const [{ count }] = await db.one(countQuery, countParams);

    return {
      data,
      total: parseInt(count, 10),
      page: Math.floor(offset / limit) + 1,
      limit,
      pages: Math.ceil(parseInt(count, 10) / limit),
    };
  }

  async updateOrder(tenantId: string, id: string, data: Partial<Order>): Promise<Order> {
    const order = await db.one(
      `UPDATE orders 
       SET status = COALESCE($3, status),
           items_data = COALESCE($4, items_data),
           pricing_data = COALESCE($5, pricing_data),
           payment_data = COALESCE($6, payment_data),
           customer_data = COALESCE($7, customer_data),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [
        id,
        tenantId,
        data.status,
        data.items_data ? JSON.stringify(data.items_data) : null,
        data.pricing_data ? JSON.stringify(data.pricing_data) : null,
        data.payment_data ? JSON.stringify(data.payment_data) : null,
        data.customer_data ? JSON.stringify(data.customer_data) : null,
      ]
    );

    return order;
  }

  async addOrderItem(orderId: string, data: {
    product_id?: string;
    variant_id?: string;
    quantity: number;
    unit_price: number;
    item_data?: Record<string, any>;
  }): Promise<OrderItem> {
    const item = await db.one(
      `INSERT INTO order_items (order_id, product_id, variant_id, quantity, unit_price, item_data, delivery_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        orderId,
        data.product_id,
        data.variant_id,
        data.quantity,
        data.unit_price,
        JSON.stringify(data.item_data || {}),
        'pending',
      ]
    );

    return item;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const items = await db.manyOrNone(
      'SELECT * FROM order_items WHERE order_id = $1',
      [orderId]
    );

    return items || [];
  }
}

export const orderService = new OrderService();
