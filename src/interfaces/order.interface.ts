export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface OrderDetails {
  items: OrderItem[];
  totalAmount: number;
}

export interface OrderInput {
  contactId: number;
  orderDetails: OrderDetails;
}

export interface OrderResponse {
  id: number;
  contactId: number;
  orderDetails: OrderDetails;
  createdAt: Date;
}