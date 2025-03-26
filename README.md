# EDA Demo - Event-Driven Architecture with AWS

This project demonstrates an Event-Driven Architecture (EDA) implementation using AWS services. It simulates an e-commerce order processing system with multiple microservices communicating through events.

## Architecture

The system consists of the following components:

### Core Services
- **Orders Service**: Handles order creation and initial processing
- **Payment Service**: Processes payments and validates transactions
- **Fulfillment Service**: Handles order fulfillment
- **Loyalty Service**: Manages customer loyalty points

### AWS Services Used
- **API Gateway**: REST API endpoint for order creation
- **EventBridge**: Event bus for service-to-service communication
- **Step Functions**: Orchestrates the payment processing workflow
- **DynamoDB**: Stores orders and payment records
- **Lambda**: Serverless functions for each service

### Flow
1. Customer creates an order through the API
2. Order is validated and stored in DynamoDB
3. Payment processing workflow:
   - Order validation
   - Parallel payment checks (preauthorization and fraud check)
   - Payment processing
   - Payment record storage
4. Order fulfillment and loyalty points processing

## Prerequisites

- Node.js (v18 or later)
- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed globally
- Docker (for local development)

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd eda-demo
```

2. Install dependencies:
```bash
npm install
```

3. Configure AWS credentials:
```bash
aws configure
```

## Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy the stack:
```bash
cdk deploy
```

The deployment will create:
- API Gateway endpoint
- EventBridge event bus
- Step Functions state machine
- DynamoDB tables
- Lambda functions

## Testing

After deployment, you can test the system by creating a new order:

```bash
curl -X POST https://<api-endpoint>/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "123",
    "products": [
      {
        "id": "456",
        "quantity": 1
      }
    ],
    "totalPrice": 100,
    "status": "PENDING"
  }'
```

## Monitoring

You can monitor the system through:
- AWS CloudWatch Logs for Lambda function logs
- Step Functions execution history
- EventBridge event history
- DynamoDB table metrics

## Project Structure

```
eda-demo/
├── bin/                    # CDK app entry point
├── lib/                    # CDK stack definition
├── lambda/                 # Lambda function implementations
│   ├── orders.ts
│   ├── fulfillment.ts
│   ├── loyalty.ts
│   ├── validate-order.ts
│   ├── preauthorize-payment.ts
│   ├── check-fraud.ts
│   └── process-payment.ts
├── test/                   # Test files
└── cdk.json               # CDK configuration
```

## Dependencies

- AWS CDK v2
- AWS Lambda Powertools (Logger, Tracer)
- AWS SDK v3
- TypeScript
- Jest (for testing)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
