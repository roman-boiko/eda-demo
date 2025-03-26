import { EventBridgeEvent } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
// import { Tracer } from '@aws-lambda-powertools/tracer';
// import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
// import middy from '@middy/core';

const logger = new Logger();
// const tracer = new Tracer({serviceName: 'ProcessPaymentService'});

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

const lambdaHandler = async (
  event: EventBridgeEvent<'order.created', Order>
): Promise<{ orderId: string; paymentId: string; status: string; message: string }> => {
  logger.info('Processing payment:', JSON.stringify(event.detail, null, 2));
  
  const order = event.detail;
  

  const isSuccessful = true;
  
  if (isSuccessful) {
    // Generate a payment ID
    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    logger.info(`Payment processed successfully for order ${order.orderId}`);
    return {
      orderId: order.orderId,
      paymentId,
      status: 'COMPLETED',
      message: 'Payment processed successfully'
    };
  } else {
    logger.error(`Payment failed for order ${order.orderId}`);
    return {
      orderId: order.orderId,
      paymentId: '',
      status: 'FAILED',
      message: 'Payment processing failed'
    };
  }
}; 

export const handler = lambdaHandler;