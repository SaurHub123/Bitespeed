"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const order_service_1 = require("../services/order.service");
class OrderController {
    constructor() {
        this.createOrder = async (req, res) => {
            try {
                const { contactId, orderDetails } = req.body;
                if (!contactId || !orderDetails) {
                    return res.status(400).json({ error: 'contactId and orderDetails are required' });
                }
                const order = await this.orderService.createOrder({ contactId, orderDetails });
                res.status(201).json(order);
            }
            catch (error) {
                console.error('Error creating order:', error);
                if (error.message === 'Contact not found') {
                    res.status(404).json({ error: error.message });
                }
                else {
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        };
        this.getOrders = async (req, res) => {
            try {
                const contactId = parseInt(req.params.contactId);
                if (isNaN(contactId)) {
                    return res.status(400).json({ error: 'Invalid contactId' });
                }
                const orders = await this.orderService.getOrdersByContact(contactId);
                res.status(200).json(orders);
            }
            catch (error) {
                console.error('Error getting orders:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        };
        this.orderService = new order_service_1.OrderService();
    }
}
exports.OrderController = OrderController;
