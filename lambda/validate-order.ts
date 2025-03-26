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
): Promise<{ isValid: boolean; message: string; order: Order }> => {
  console.log('Validating order:', JSON.stringify(event.detail, null, 2));
  
  const order = event.detail;
  
  // Randomly validate 80% of orders
  const isValid = Math.random() < 0.95;
  
  if (isValid) {
    console.log(`Order ${order.orderId} is valid`);
    return {
      isValid: true,
      message: 'Order validated successfully',
      order
    };
  } else {
    console.log(`Order ${order.orderId} is invalid`);
    return {
      isValid: false,
      message: 'Order validation failed',
      order
    };
  }
}; 