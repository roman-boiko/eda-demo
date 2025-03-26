import { EventBridgeEvent } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
// import { Tracer } from '@aws-lambda-powertools/tracer';
// import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
// import middy from '@middy/core';

const logger = new Logger();
// const tracer = new Tracer({serviceName: 'LoyaltyService'});

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
  logger.info('Received order loyalty event:', JSON.stringify(event, null, 2));
  
  const order = event.detail;
  logger.info(`Processing loyalty points for order ${order.orderId} from customer ${order.customerId}`);
  
  // Calculate loyalty points (1 point per $1 spent)
  const pointsEarned = Math.floor(order.totalPrice);
  logger.info(`Customer ${order.customerId} earned ${pointsEarned} points for order ${order.orderId}`);
  
  // Here you would typically:
  // 1. Update customer's loyalty points in a database
  // 2. Send a notification to the customer about points earned
  // 3. Check if customer reached any loyalty tiers
  // 4. Apply any special promotions or bonuses
  
  logger.info('Loyalty points processing completed');
}; 

export const handler = lambdaHandler;