import { Construct } from 'constructs';
import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { WebSocketLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import { HandlerGenerator } from './helpers/handler-generator';

export interface WebSocketApiProps {
    scope: string;
    playerTable: dynamodb.Table;
}

export class WebSocketApi extends Construct {
    public readonly api: apigatewayv2.WebSocketApi;
    public readonly connectionTable: dynamodb.Table;
    public readonly connectHandler: lambda.Function;
    public readonly disconnectHandler: lambda.Function;

    constructor(scope: Construct, id: string, props: WebSocketApiProps) {
        super(scope, id);

        this.connectionTable = new dynamodb.Table(this, 'WebsocketConnectionTable', {
            tableName: `${props.scope}-game-backends-connection-table`,
            readCapacity: 1,
            writeCapacity: 1,
            partitionKey: {
                type: AttributeType.STRING,
                name: 'id',
            },
        });

        const handlerGenerator = new HandlerGenerator(this, 'WebSocketApiHandlerGenerator', {
            defaultLambdaGeneratorProps: {
                environment: {
                    CONNECTION_TABLE_NAME: this.connectionTable.tableName,
                    PLAYER_TABLE_NAME: props.playerTable.tableName,
                },
            },
        });
        this.connectHandler = handlerGenerator.generate('WebSocketConnectHandler', {
            handler: 'web-socket/connect.handler',
        });
        this.connectionTable.grantReadWriteData(this.connectHandler);

        this.disconnectHandler = handlerGenerator.generate('WebSocketDisconnectHandler', {
            handler: 'web-socket/disconnect.handler',
        });
        this.connectionTable.grantReadWriteData(this.disconnectHandler);

        this.api = new apigatewayv2.WebSocketApi(this, 'WebSocketApi', {
            connectRouteOptions: {
                integration: new WebSocketLambdaIntegration('WebSocketConnectIntegration', this.connectHandler),
            },
            disconnectRouteOptions: {
                integration: new WebSocketLambdaIntegration('WebSocketDisconnectIntegration', this.disconnectHandler),
            },
        });
    }
}
