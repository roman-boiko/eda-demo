import { EventBridgeEvent } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
// import { Tracer } from '@aws-lambda-powertools/tracer';
// import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
// import middy from '@middy/core';

const logger = new Logger();
// const tracer = new Tracer({serviceName: 'FulfillmentService'});

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
): Promise<void> => {
  logger.info('Received order fulfillment event:', JSON.stringify(event, null, 2));
  
  const order = event.detail;
  logger.info(`Processing order ${order.orderId} for customer ${order.customerId}`);
  logger.info(`Order total: $${order.totalPrice}`);
  logger.info('Products:', JSON.stringify(order.products, null, 2));
  
  // Here you would typically:
  // 1. Update order status to "processing"
  // 2. Send confirmation email to customer
  // 3. Trigger warehouse operations
  // 4. Update inventory
  // 5. Update order status to "fulfilled"
  
  logger.info('Order fulfillment processing completed');
}; 

export const handler = lambdaHandler;