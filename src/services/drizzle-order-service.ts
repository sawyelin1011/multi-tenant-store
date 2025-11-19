import { getWorkerDb } from '../config/worker-database.js';
import { orders, orderItems } from '../db/schema.js';
import { Order, OrderItem } from '../types/index.js';
import { NotFoundError } from '../utils/errors.js';
import { eq, and, desc } from 'drizzle-orm';

export class DrizzleOrderService {
  async createOrder(
    tenantId: string,
    data: {
      user_id?: string;
      order_number?: string;
      status?: string;
      items_data?: Record<string, any>;
      pricing_data?: Record<string, any>;
      payment_data?: Record<string, any>;
      customer_data?: Record<string, any>;
    }
  ): Promise<Order> {
    const db = getWorkerDb();

    const [order] = await db
      .insert(orders)
      .values({
        tenant_id: tenantId,
        user_id: data.user_id,
        order_number: data.order_number,
        status: data.status || 'pending',
        items_data: JSON.stringify(data.items_data || {}),
        pricing_data: JSON.stringify(data.pricing_data || {}),
        payment_data: JSON.stringify(data.payment_data || {}),
        customer_data: JSON.stringify(data.customer_data || {}),
        metadata: '{}',
      })
      .returning();

    return this.parseOrder(order);
  }

  async getOrder(tenantId: string, id: string): Promise<Order> {
    const db = getWorkerDb();

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, id), eq(orders.tenant_id, tenantId)),
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    return this.parseOrder(order);
  }

  async listOrders(
    tenantId: string,
    filters: any = {},
    limit: number = 50,
    offset: number = 0
  ) {
    const db = getWorkerDb();

    let whereClause = eq(orders.tenant_id, tenantId);

    if (filters.status) {
      whereClause = and(whereClause, eq(orders.status, filters.status));
    }

    if (filters.user_id) {
      whereClause = and(whereClause, eq(orders.user_id, filters.user_id));
    }

    const data = await db.query.orders.findMany({
      where: whereClause,
      orderBy: (o) => desc(o.created_at),
      limit,
      offset,
    });

    const countResult = await db
      .select({ count: orders.id })
      .from(orders)
      .where(whereClause);

    const total = countResult.length;

    return {
      data: data.map((o) => this.parseOrder(o)),
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async updateOrder(tenantId: string, id: string, data: Partial<Order>): Promise<Order> {
    const db = getWorkerDb();

    const updateData: any = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.items_data !== undefined) updateData.items_data = JSON.stringify(data.items_data);
    if (data.pricing_data !== undefined) updateData.pricing_data = JSON.stringify(data.pricing_data);
    if (data.payment_data !== undefined) updateData.payment_data = JSON.stringify(data.payment_data);
    if (data.customer_data !== undefined) updateData.customer_data = JSON.stringify(data.customer_data);
    updateData.updated_at = new Date().toISOString();

    const [order] = await db
      .update(orders)
      .set(updateData)
      .where(and(eq(orders.id, id), eq(orders.tenant_id, tenantId)))
      .returning();

    return this.parseOrder(order);
  }

  async addOrderItem(
    orderId: string,
    data: {
      product_id?: string;
      variant_id?: string;
      quantity: number;
      unit_price: number;
      item_data?: Record<string, any>;
    }
  ): Promise<OrderItem> {
    const db = getWorkerDb();

    const [item] = await db
      .insert(orderItems)
      .values({
        order_id: orderId,
        product_id: data.product_id,
        variant_id: data.variant_id,
        quantity: data.quantity,
        unit_price: data.unit_price,
        item_data: JSON.stringify(data.item_data || {}),
        delivery_status: 'pending',
      })
      .returning();

    return this.parseOrderItem(item);
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const db = getWorkerDb();

    const items = await db.query.orderItems.findMany({
      where: eq(orderItems.order_id, orderId),
    });

    return (items || []).map((i) => this.parseOrderItem(i));
  }

  private parseOrder(order: any): Order {
    return {
      ...order,
      items_data: typeof order.items_data === 'string' ? JSON.parse(order.items_data) : order.items_data,
      pricing_data: typeof order.pricing_data === 'string' ? JSON.parse(order.pricing_data) : order.pricing_data,
      payment_data: typeof order.payment_data === 'string' ? JSON.parse(order.payment_data) : order.payment_data,
      customer_data: typeof order.customer_data === 'string' ? JSON.parse(order.customer_data) : order.customer_data,
      metadata: typeof order.metadata === 'string' ? JSON.parse(order.metadata) : order.metadata,
    };
  }

  private parseOrderItem(item: any): OrderItem {
    return {
      ...item,
      item_data: typeof item.item_data === 'string' ? JSON.parse(item.item_data) : item.item_data,
    };
  }
}

export const drizzleOrderService = new DrizzleOrderService();
