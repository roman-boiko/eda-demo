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
): Promise<void> => {
  console.log('Received order loyalty event:', JSON.stringify(event, null, 2));
  
  const order = event.detail;
  console.log(`Processing loyalty points for order ${order.orderId} from customer ${order.customerId}`);
  
  // Calculate loyalty points (1 point per $1 spent)
  const pointsEarned = Math.floor(order.totalPrice);
  console.log(`Customer ${order.customerId} earned ${pointsEarned} points for order ${order.orderId}`);
  
  // Here you would typically:
  // 1. Update customer's loyalty points in a database
  // 2. Send a notification to the customer about points earned
  // 3. Check if customer reached any loyalty tiers
  // 4. Apply any special promotions or bonuses
  
  console.log('Loyalty points processing completed');
}; 