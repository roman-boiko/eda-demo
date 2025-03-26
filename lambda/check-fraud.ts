import { EventBridgeEvent } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
// import { Tracer } from '@aws-lambda-powertools/tracer';
// import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
// import middy from '@middy/core';

const logger = new Logger();
// const tracer = new Tracer({serviceName: 'CheckFraudService'});

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
): Promise<{ isClean: boolean; message: string; order: Order }> => {
  logger.info('Checking for fraud:', JSON.stringify(event.detail, null, 2));
  
  const order = event.detail;
  
  // Randomly pass 50% of fraud checks
  const isClean = Math.random() < 0.90;
  
  if (isClean) {
    logger.info(`Order ${order.orderId} passed fraud check`);
    return {
      isClean: true,
      message: 'Fraud check passed successfully',
      order
    };
  } else {
    logger.error(`Order ${order.orderId} failed fraud check`);
    return {
      isClean: false,
      message: 'Fraud check failed',
      order
    };
  }
}; 

export const handler = lambdaHandler;
