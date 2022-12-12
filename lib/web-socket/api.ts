import { Construct } from 'constructs';
import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as eventsources from 'aws-cdk-lib/aws-lambda-event-sources'
import { WebSocketLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import { PlayersContext } from '../players';
import { TicTacToeContext } from '../tic-tac-toe';
import { BuildContext } from '../helpers/build-context';
import { WebSocketContext } from './context';
import { NodejsHandlerGenerator } from '../helpers/nodejs-handler-generator';

export interface WebSocketApiProps {
    buildContext: BuildContext;
    playersContext: PlayersContext;
    ticTacToeContext: TicTacToeContext;
}

export class WebSocketApi extends Construct {
    public readonly api: apigatewayv2.WebSocketApi;
    public readonly connectionTable: dynamodb.Table;
    public readonly observableTable: dynamodb.Table;
    public readonly gameStateCleanupHandler: lambda.Function;
    public readonly observableCleanupHandler: lambda.Function;
    public readonly connectHandler: lambda.Function;
    public readonly disconnectHandler: lambda.Function;
    public readonly observableTableRemoveEventSource: eventsources.DynamoEventSource;
    public readonly webSocketContext: WebSocketContext;

    constructor(scope: Construct, id: string, props: WebSocketApiProps) {
        super(scope, id);

        this.connectionTable = props.buildContext.tableGenerator.generate('WebSocketConnectionTable', {
            tableName: `${props.buildContext.stageContext.stageToString()}-game-backends-connection-table`,
            partitionKey: {
                type: dynamodb.AttributeType.STRING,
                name: 'id',
            },
        });

        this.observableTable = props.buildContext.tableGenerator.generate('WebSocketObservableTable', {
            tableName: `${props.buildContext.stageContext.stageToString()}-game-backends-observable-table`,
            partitionKey: {
                type: dynamodb.AttributeType.STRING,
                name: 'observableId',
            },
            stream: dynamodb.StreamViewType.OLD_IMAGE,
        });
        this.observableTableRemoveEventSource = new eventsources.DynamoEventSource(this.observableTable, {
            startingPosition: lambda.StartingPosition.TRIM_HORIZON,
            filters: [
                lambda.FilterCriteria.filter({
                    eventName: lambda.FilterRule.isEqual('REMOVE'),
                }),
            ],
        });

        const webSocketHandlerGenerator = new NodejsHandlerGenerator(this, 'WebSocketApiHandlerGenerator', {
            defaultLambdaGeneratorProps: {
                environment: {
                    CONNECTION_TABLE_NAME: this.connectionTable.tableName,
                    OBSERVABLE_TABLE_NAME: this.observableTable.tableName,
                    PLAYER_TABLE_NAME: props.playersContext.playerTable.tableName,
                    GAME_STATE_TABLE_NAME: props.ticTacToeContext.gameStateTable.tableName,
                },
            },
        });

        this.gameStateCleanupHandler = webSocketHandlerGenerator.generate('GameStateCleanupHandler', {
            entry: 'src/lambda/cleanup/game-state.ts',
            handler: 'handler',
        });
        this.gameStateCleanupHandler.addEventSource(props.ticTacToeContext.gameStateTableRemoveEventSource);
        this.observableTable.grantWriteData(this.gameStateCleanupHandler);

        this.observableCleanupHandler = webSocketHandlerGenerator.generate('ObservableCleanupHandler', {
            entry: 'src/lambda/cleanup/observable.ts',
            handler: 'handler'
        });
        this.observableCleanupHandler.addEventSource(this.observableTableRemoveEventSource);
        this.connectionTable.grantWriteData(this.observableCleanupHandler);

        this.connectHandler = webSocketHandlerGenerator.generate('WebSocketConnectHandler', {
            entry: 'src/lambda/web-socket/connect.ts',
            handler: 'handler',
        });
        this.connectionTable.grantReadWriteData(this.connectHandler);

        this.disconnectHandler = webSocketHandlerGenerator.generate('WebSocketDisconnectHandler', {
            entry: 'src/lambda/web-socket/disconnect.ts',
            handler: 'handler',
        });
        this.connectionTable.grantReadWriteData(this.disconnectHandler);
        this.observableTable.grantReadWriteData(this.disconnectHandler);

        this.api = new apigatewayv2.WebSocketApi(this, 'WebSocketApi', {
            connectRouteOptions: {
                integration: new WebSocketLambdaIntegration('WebSocketConnectIntegration', this.connectHandler),
            },
            disconnectRouteOptions: {
                integration: new WebSocketLambdaIntegration('WebSocketDisconnectIntegration', this.disconnectHandler),
            },
        });

        this.webSocketContext = {
            observableTable: this.observableTable,
            connectionTable: this.connectionTable,
            api: this.api,
            webSocketHandlerGenerator,
        };
    }
}
