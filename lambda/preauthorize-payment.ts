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
): Promise<{ isAuthorized: boolean; message: string; order: Order }> => {
  console.log('Preauthorizing payment:', JSON.stringify(event.detail, null, 2));
  
  const order = event.detail;
  
  // Randomly authorize 50% of payments
  const isAuthorized = Math.random() < 0.90;
  
  if (isAuthorized) {
    console.log(`Payment for order ${order.orderId} is authorized`);
    return {
      isAuthorized: true,
      message: 'Payment preauthorized successfully',
      order
    };
  } else {
    console.log(`Payment for order ${order.orderId} is not authorized`);
    return {
      isAuthorized: false,
      message: 'Payment preauthorization failed',
      order
    };
  }
}; 