import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as eventsources from 'aws-cdk-lib/aws-lambda-event-sources'
import { NodejsHandlerGenerator } from '../helpers/nodejs-handler-generator';

export interface TicTacToeContext {
    gameStateTable: dynamodb.Table;
    gameStateTableRemoveEventSource: eventsources.DynamoEventSource;
    gameStateNodejsHandlerGenerator: NodejsHandlerGenerator;
    ticTacToeResource: apigateway.Resource;
    newGameResource: apigateway.Resource;
    byIdResource: apigateway.Resource;
    joinGameResource: apigateway.Resource;
    makeMoveResource: apigateway.Resource;
}
