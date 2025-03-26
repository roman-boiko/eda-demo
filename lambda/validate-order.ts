import { EventBridgeEvent } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
// import { Tracer } from '@aws-lambda-powertools/tracer';
// import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
// import middy from '@middy/core';

const logger = new Logger();
// const tracer = new Tracer({serviceName: 'ValidateOrderService'});

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
): Promise<{ isValid: boolean; message: string; order: Order }> => {
  logger.info('Validating order:', JSON.stringify(event.detail, null, 2));
  
  const order = event.detail;
  
  // Randomly validate 80% of orders
  const isValid = Math.random() < 0.95;
  
  if (isValid) {
    logger.info(`Order ${order.orderId} is valid`);
    return {
      isValid: true,
      message: 'Order validated successfully',
      order
    };
  } else {
    logger.info(`Order ${order.orderId} is invalid`);
    return {
      isValid: false,
      message: 'Order validation failed',
      order
    };
  }
}; 

export const handler = lambdaHandler;