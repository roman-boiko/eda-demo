import { EventBridgeEvent } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
// import { Tracer } from '@aws-lambda-powertools/tracer';
// import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
// import middy from '@middy/core';

const logger = new Logger();
// const tracer = new Tracer({serviceName: 'PreauthorizePaymentService'});

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

const lambdaHandler = async (
  event: EventBridgeEvent<'order.created', Order>
): Promise<{ isAuthorized: boolean; message: string; order: Order }> => {
  logger.info('Preauthorizing payment:', JSON.stringify(event.detail, null, 2));
  
  const order = event.detail;
  
  // Randomly authorize 50% of payments
  const isAuthorized = Math.random() < 0.90;
  
  if (isAuthorized) {
    logger.info(`Payment for order ${order.orderId} is authorized`);
    return {
      isAuthorized: true,
      message: 'Payment preauthorized successfully',
      order
    };
  } else {
    logger.info(`Payment for order ${order.orderId} is not authorized`);
    return {
      isAuthorized: false,
      message: 'Payment preauthorization failed',
      order
    };
  }
}; 

export const handler = lambdaHandler;  