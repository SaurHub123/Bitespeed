import { Router } from 'express';
import { OrderController } from '../controllers/orderController';

const router = Router();
const orderController = new OrderController();

router.post('/', orderController.createOrder as any);
router.get('/:contactId', orderController.getOrders as any);

export default router;