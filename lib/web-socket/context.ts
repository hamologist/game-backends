import { NodejsHandlerGenerator } from '../helpers/nodejs-handler-generator';
import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export interface WebSocketContext {
    connectionTable: dynamodb.Table,
    observableTable: dynamodb.Table,
    webSocketHandlerGenerator: NodejsHandlerGenerator;
    api: apigatewayv2.WebSocketApi;
}
