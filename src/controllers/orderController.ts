import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { OrderInput } from '../interfaces/order.interface';

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  public createOrder = async (req: Request, res: Response) => {
    try {
      const { contactId, orderDetails } = req.body;
      
      if (!contactId || !orderDetails) {
        return res.status(400).json({ error: 'contactId and orderDetails are required' });
      }

      const order = await this.orderService.createOrder({ contactId, orderDetails });
      res.status(201).json(order);
    } catch (error: any) {
      console.error('Error creating order:', error);
      if (error.message === 'Contact not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };

  public getOrders = async (req: Request, res: Response) => {
    try {
      const contactId = parseInt(req.params.contactId);
      
      if (isNaN(contactId)) {
        return res.status(400).json({ error: 'Invalid contactId' });
      }

      const orders = await this.orderService.getOrdersByContact(contactId);
      res.status(200).json(orders);
    } catch (error) {
      console.error('Error getting orders:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}