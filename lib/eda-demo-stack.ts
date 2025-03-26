import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as logs from 'aws-cdk-lib/aws-logs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class EdaDemoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB table
    const ordersTable = new dynamodb.Table(this, 'OrdersTable', {
      partitionKey: { name: 'orderId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'orderDate', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
      pointInTimeRecovery: true,
    });

    // Create EventBridge bus
    const ordersBus = new events.EventBus(this, 'OrdersBus', {
      eventBusName: 'OrdersBus',
      description: 'Event bus for orders events',
    });

    // Create CloudWatch log group for orders
    const ordersLogGroup = new logs.LogGroup(this, 'OrdersLogGroup', {
      logGroupName: '/events/orders',
      retention: logs.RetentionDays.ONE_WEEK,
    });

    // Create EventBridge rule to log orders
    const ordersRule = new events.Rule(this, 'OrdersLoggingRule', {
      eventBus: ordersBus,
      description: 'Log all orders to CloudWatch',
      eventPattern: {
        source: ['orders'],
        detailType: ['order.created'],
      },
      targets: [
        new targets.CloudWatchLogGroup(ordersLogGroup),
      ],
    });

    // Create Lambda function
    const ordersHandler = new nodejs.NodejsFunction(this, 'OrdersHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/orders.ts'),
      environment: {
        ORDERS_TABLE_NAME: ordersTable.tableName,
        ORDERS_BUS_NAME: ordersBus.eventBusName,
      },
    });

    // Grant DynamoDB permissions to Lambda
    ordersTable.grantWriteData(ordersHandler);

    // Grant EventBridge permissions to Lambda
    ordersBus.grantPutEventsTo(ordersHandler);

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'OrdersApi', {
      restApiName: 'Orders Service',
      description: 'API for handling orders',
    });

    // Add /orders endpoint with POST method
    const ordersResource = api.root.addResource('orders');
    ordersResource.addMethod('POST', new apigateway.LambdaIntegration(ordersHandler));

  }
}
