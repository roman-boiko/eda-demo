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
): Promise<{ isClean: boolean; message: string; order: Order }> => {
  console.log('Checking for fraud:', JSON.stringify(event.detail, null, 2));
  
  const order = event.detail;
  
  // Randomly pass 50% of fraud checks
  const isClean = Math.random() < 0.90;
  
  if (isClean) {
    console.log(`Order ${order.orderId} passed fraud check`);
    return {
      isClean: true,
      message: 'Fraud check passed successfully',
      order
    };
  } else {
    console.log(`Order ${order.orderId} failed fraud check`);
    return {
      isClean: false,
      message: 'Fraud check failed',
      order
    };
  }
}; 