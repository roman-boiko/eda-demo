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
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctionsTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
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

    // Create Lambda function for order processing
    const ordersHandler = new nodejs.NodejsFunction(this, 'OrdersHandler', {
      runtime: lambda.Runtime.NODEJS_22_X,  
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/orders.ts'),
      environment: {
        ORDERS_TABLE_NAME: ordersTable.tableName,
        ORDERS_BUS_NAME: ordersBus.eventBusName,
      },
    });

    // Create Lambda function for order fulfillment
    const fulfillmentHandler = new nodejs.NodejsFunction(this, 'FulfillmentHandler', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/fulfillment.ts'),
    });

    // Create Lambda function for loyalty points
    const loyaltyHandler = new nodejs.NodejsFunction(this, 'LoyaltyHandler', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/loyalty.ts'),
    });

    // Create Lambda function for order validation
    const validateOrderHandler = new nodejs.NodejsFunction(this, 'ValidateOrderHandler', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/validate-order.ts'),
    });

    // Create Lambda function for payment preauthorization
    const preauthorizePaymentHandler = new nodejs.NodejsFunction(this, 'PreauthorizePaymentHandler', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/preauthorize-payment.ts'),
    });

    // Create Lambda function for fraud check
    const checkFraudHandler = new nodejs.NodejsFunction(this, 'CheckFraudHandler', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/check-fraud.ts'),
    });

    // Create Lambda function for payment processing
    const processPaymentHandler = new nodejs.NodejsFunction(this, 'ProcessPaymentHandler', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/process-payment.ts'),
    });

    // Create Step Functions state machine for payment processing
    const validateOrderTask = new stepfunctionsTasks.LambdaInvoke(this, 'Validate Order', {
      lambdaFunction: validateOrderHandler,
      resultPath: '$.validationResult',
    });

    const preauthorizePaymentTask = new stepfunctionsTasks.LambdaInvoke(this, 'Preauthorize Payment', {
      lambdaFunction: preauthorizePaymentHandler,
      resultPath: '$.preauthorizationResult',
    });

    const checkFraudTask = new stepfunctionsTasks.LambdaInvoke(this, 'Check Fraud', {
      lambdaFunction: checkFraudHandler,
      resultPath: '$.fraudCheckResult',
    });

    const processPaymentTask = new stepfunctionsTasks.LambdaInvoke(this, 'Process Payment', {
      lambdaFunction: processPaymentHandler,
      resultPath: '$.paymentResult',
    });

    const updateOrderStatusTask = new stepfunctions.Pass(this, 'Update Order Status', {
      result: stepfunctions.Result.fromObject({
        status: 'completed',
        message: 'Order status updated to paid'
      })
    });

    const failState = new stepfunctions.Fail(this, 'Order Invalid', {
      cause: 'OrderValidationFailed',
      error: 'Order validation failed',
      comment: 'Order was not valid'
    });

    const failPreauthorizationState = new stepfunctions.Fail(this, 'Payment Not Authorized', {
      cause: 'PaymentPreauthorizationFailed',
      error: 'Payment preauthorization failed',
      comment: 'Payment was not authorized'
    });

    const failFraudCheckState = new stepfunctions.Fail(this, 'Fraud Check Failed', {
      cause: 'FraudCheckFailed',
      error: 'Fraud check failed',
      comment: 'Order failed fraud check'
    });

    const validatePreauthorizationChoice = new stepfunctions.Choice(this, 'Is Payment Authorized?')
      .when(stepfunctions.Condition.booleanEquals('$.preauthorizationResult.Payload.isAuthorized', true),
        new stepfunctions.Pass(this, 'Payment Authorized'))
      .otherwise(failPreauthorizationState);

    const validateFraudCheckChoice = new stepfunctions.Choice(this, 'Did Fraud Check Pass?')
      .when(stepfunctions.Condition.booleanEquals('$.fraudCheckResult.Payload.isClean', true),
        new stepfunctions.Pass(this, 'Fraud Check Passed'))
      .otherwise(failFraudCheckState);

    const parallelState = new stepfunctions.Parallel(this, 'Payment Checks')
      .branch(preauthorizePaymentTask.next(validatePreauthorizationChoice))
      .branch(checkFraudTask.next(validateFraudCheckChoice));

    const mapOriginalData = new stepfunctions.Pass(this, 'Map Original Data', {
      parameters: {
        "version": "0",
        "id.$": "$[0].id",
        "detail-type.$": "$[0].detail-type",
        "source.$": "$[0].source",
        "account.$": "$[0].account",
        "time.$": "$[0].time",
        "region.$": "$[0].region",
        "resources.$": "$[0].resources",
        "detail.$": "$[0].detail"
      }
    });

    const choice = new stepfunctions.Choice(this, 'Is Order Valid?')
      .when(stepfunctions.Condition.booleanEquals('$.validationResult.Payload.isValid', true),
        parallelState.next(mapOriginalData).next(processPaymentTask.next(updateOrderStatusTask)))
      .otherwise(failState);

    const paymentStateMachine = new stepfunctions.StateMachine(this, 'PaymentProcessingStateMachine', {
      definition: stepfunctions.Chain
        .start(validateOrderTask)
        .next(choice),
      timeout: cdk.Duration.minutes(5),
    });

    // Grant DynamoDB permissions to Lambda functions
    ordersTable.grantWriteData(ordersHandler);
    ordersTable.grantReadWriteData(fulfillmentHandler);
    ordersTable.grantReadData(loyaltyHandler);
    ordersTable.grantReadData(validateOrderHandler);
    ordersTable.grantReadData(preauthorizePaymentHandler);
    ordersTable.grantReadData(checkFraudHandler);

    // Grant EventBridge permissions to Lambda
    ordersBus.grantPutEventsTo(ordersHandler);

    // Create EventBridge rule for order fulfillment
    const fulfillmentRule = new events.Rule(this, 'OrderFulfillmentRule', {
      eventBus: ordersBus,
      description: 'Route orders to fulfillment Lambda',
      eventPattern: {
        source: ['orders'],
        detailType: ['order.created'],
      },
      targets: [
        new targets.LambdaFunction(fulfillmentHandler),
      ],
    });

    // Create EventBridge rule for loyalty points
    const loyaltyRule = new events.Rule(this, 'OrderLoyaltyRule', {
      eventBus: ordersBus,
      description: 'Route orders to loyalty Lambda',
      eventPattern: {
        source: ['orders'],
        detailType: ['order.created'],
      },
      targets: [
        new targets.LambdaFunction(loyaltyHandler),
      ],
    });

    // Create EventBridge rule for payment processing
    const paymentRule = new events.Rule(this, 'OrderPaymentRule', {
      eventBus: ordersBus,
      description: 'Route orders to payment processing state machine',
      eventPattern: {
        source: ['orders'],
        detailType: ['order.created'],
      },
      targets: [
        new targets.SfnStateMachine(paymentStateMachine),
      ],
    });

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'OrdersApi', {
      restApiName: 'Orders Service',
      description: 'API for handling orders',
    });

    // Add /orders endpoint with POST method
    const ordersResource = api.root.addResource('orders');
    ordersResource.addMethod('POST', new apigateway.LambdaIntegration(ordersHandler));

    // Add stack outputs
    new cdk.CfnOutput(this, 'OrdersApiUrl', {
      value: api.url,
      description: 'API Gateway URL for orders service',
    });

    new cdk.CfnOutput(this, 'OrdersTableName', {
      value: ordersTable.tableName,
      description: 'DynamoDB table name for orders',
    });

    new cdk.CfnOutput(this, 'PaymentStateMachineArn', {
      value: paymentStateMachine.stateMachineArn,
      description: 'Step Functions state machine ARN for payment processing',
    });
  }
}
