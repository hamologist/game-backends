import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { NodejsHandlerGenerator } from '../helpers/nodejs-handler-generator';
import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha';

export interface PlayersContext {
    playerTable: dynamodb.Table;
    playerNodejsHandlerGenerator: NodejsHandlerGenerator;
    playerResource: apigateway.Resource;
    byIdResource: apigateway.Resource;
}
