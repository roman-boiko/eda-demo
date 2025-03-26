import { EventBridgeEvent } from 'aws-lambda';

interface Order {
  orderId: string;
  customerId: string;
  products: Array<{
    id: string;
    quantity: number;
  }>;
  totalPrice: number;
  status: string;
  orderDate: string;
}

export const handler = async (
  event: EventBridgeEvent<'order.created', Order>
): Promise<{ orderId: string; paymentId: string; status: string; message: string }> => {
  console.log('Processing payment:', JSON.stringify(event.detail, null, 2));
  
  const order = event.detail;
  
  // Simulate payment processing with 95% success rate
  const isSuccessful = Math.random() < 0.95;
  
  if (isSuccessful) {
    // Generate a payment ID
    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    console.log(`Payment processed successfully for order ${order.orderId}`);
    return {
      orderId: order.orderId,
      paymentId,
      status: 'COMPLETED',
      message: 'Payment processed successfully'
    };
  } else {
    console.log(`Payment failed for order ${order.orderId}`);
    return {
      orderId: order.orderId,
      paymentId: '',
      status: 'FAILED',
      message: 'Payment processing failed'
    };
  }
}; 