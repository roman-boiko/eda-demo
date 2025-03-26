import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const eventBridgeClient = new EventBridgeClient({});

function generateOrderId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `ORD-${timestamp}-${random}`;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    const orderData = JSON.parse(event.body || '{}');
    const orderId = generateOrderId();
    const orderDate = new Date().toISOString().split('T')[0];
    
    const order = {
      ...orderData,
      orderId,
      orderDate,
    };

    // Store order in DynamoDB
    const command = new PutCommand({
      TableName: process.env.ORDERS_TABLE_NAME,
      Item: order,
    });

    await docClient.send(command);

    // Publish event to EventBridge
    const eventCommand = new PutEventsCommand({
      Entries: [
        {
          Source: 'orders',
          DetailType: 'order.created',
          Detail: JSON.stringify(order),
          EventBusName: process.env.ORDERS_BUS_NAME,
          Time: new Date(),
        },
      ],
    });

    await eventBridgeClient.send(eventCommand);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Order received successfully',
        order
      })
    };
  } catch (error) {
    console.error('Error processing order:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error processing order',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}; 