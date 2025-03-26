import { EventBridgeEvent } from 'aws-lambda';

interface Order {
  orderId: string;
  customerId: string;
  products: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  totalPrice: number;
  status: string;
  orderDate: string;
}

export const handler = async (
  event: EventBridgeEvent<'order.created', Order>
): Promise<void> => {
  console.log('Received order fulfillment event:', JSON.stringify(event, null, 2));
  
  const order = event.detail;
  console.log(`Processing order ${order.orderId} for customer ${order.customerId}`);
  console.log(`Order total: $${order.totalPrice}`);
  console.log('Products:', JSON.stringify(order.products, null, 2));
  
  // Here you would typically:
  // 1. Update order status to "processing"
  // 2. Send confirmation email to customer
  // 3. Trigger warehouse operations
  // 4. Update inventory
  // 5. Update order status to "fulfilled"
  
  console.log('Order fulfillment processing completed');
}; 