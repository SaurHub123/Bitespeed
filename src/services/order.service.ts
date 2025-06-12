import prisma from '../config/database';
import { OrderInput, OrderResponse, OrderDetails } from '../interfaces/order.interface';

export class OrderService {
  async createOrder(data: OrderInput): Promise<OrderResponse> {
    try {
      await this.validateOrderInput(data);
      await this.validateContact(data.contactId);

      const order = await prisma.order.create({
        data: {
          contactId: data.contactId,
          orderDetails: this.sanitizeOrderDetails(data.orderDetails) as any // Type assertion needed for Prisma JSON field
        }
      });

      return this.formatOrderResponse(order);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to create order: ${errorMessage}`);
    }
  }

  async getOrdersByContact(contactId: number): Promise<OrderResponse[]> {
    try {
      await this.validateContact(contactId);

      const orders = await prisma.order.findMany({
        where: { contactId },
        orderBy: { createdAt: 'desc' }
      });

      return orders.map(order => this.formatOrderResponse(order));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to fetch orders: ${errorMessage}`);
    }
  }

  private async validateOrderInput(data: OrderInput): Promise<void> {
    if (!data.contactId || typeof data.contactId !== 'number') {
      throw new Error('Invalid contact ID');
    }

    if (!data.orderDetails || typeof data.orderDetails !== 'object') {
      throw new Error('Order details are required and must be an object');
    }

    if (!Array.isArray(data.orderDetails.items) || data.orderDetails.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    for (const item of data.orderDetails.items) {
      if (!item.productId || !item.quantity || typeof item.price !== 'number') {
        throw new Error('Each item must have productId, quantity, and price');
      }

      if (item.quantity <= 0 || item.price <= 0) {
        throw new Error('Quantity and price must be positive numbers');
      }
    }
  }

  private async validateContact(contactId: number): Promise<void> {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId }
    });

    if (!contact) {
      throw new Error('Contact not found');
    }
  }

  private sanitizeOrderDetails(orderDetails: OrderDetails): OrderDetails {
    return {
      items: orderDetails.items.map(item => ({
        productId: String(item.productId),
        quantity: Math.max(1, Math.floor(item.quantity)),
        price: Number(item.price.toFixed(2))
      })),
      totalAmount: Number(
        orderDetails.items
          .reduce((total, item) => total + (item.price * item.quantity), 0)
          .toFixed(2)
      )
    };
  }

  private formatOrderResponse(order: any): OrderResponse {
    return {
      id: order.id,
      contactId: order.contactId,
      orderDetails: order.orderDetails,
      createdAt: order.createdAt
    };
  }
}