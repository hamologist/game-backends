import { Construct } from 'constructs';
import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { WebSocketLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import { HandlerGenerator } from '../helpers/handler-generator';
import { Players } from '../players';
import { TicTacToe } from '../tic-tac-toe';
import { BuildContext } from '../helpers/build-context';
import { WebSocketTicTacToe } from './tic-tac-toe';
import { WebSocketPlayers } from './players';

export interface WebSocketApiProps {
    buildContext: BuildContext;
    players: Players;
    ticTacToe: TicTacToe;
}

export class WebSocketApi extends Construct {
    public readonly api: apigatewayv2.WebSocketApi;
    public readonly connectionTable: dynamodb.Table;
    public readonly observableTable: dynamodb.Table;
    public readonly connectHandler: lambda.Function;
    public readonly disconnectHandler: lambda.Function;
    public readonly webSocketPlayers: WebSocketPlayers;
    public readonly webSocketTicTacToe: WebSocketTicTacToe;

    constructor(scope: Construct, id: string, props: WebSocketApiProps) {
        super(scope, id);

        this.connectionTable = props.buildContext.tableGenerator.generate('WebSocketConnectionTable', {
            tableName: `${props.buildContext.stageContext.stageToString()}-game-backends-connection-table`,
            partitionKey: {
                type: AttributeType.STRING,
                name: 'id',
            },
        });

        this.observableTable = props.buildContext.tableGenerator.generate('WebSocketObservableTable', {
            tableName: `${props.buildContext.stageContext.stageToString()}-game-backends-observable-table`,
            partitionKey: {
                type: AttributeType.STRING,
                name: 'observableId',
            },
        });

        const webSocketHandlerGenerator = new HandlerGenerator(this, 'WebSocketApiHandlerGenerator', {
            defaultLambdaGeneratorProps: {
                environment: {
                    CONNECTION_TABLE_NAME: this.connectionTable.tableName,
                    OBSERVABLE_TABLE_NAME: this.observableTable.tableName,
                    PLAYER_TABLE_NAME: props.players.playerTable.tableName,
                    GAME_STATE_TABLE_NAME: props.ticTacToe.gameStateTable.tableName,
                },
            },
        });
        this.connectHandler = webSocketHandlerGenerator.generate('WebSocketConnectHandler', {
            handler: 'web-socket/connect.handler',
        });
        this.connectionTable.grantReadWriteData(this.connectHandler);

        this.disconnectHandler = webSocketHandlerGenerator.generate('WebSocketDisconnectHandler', {
            handler: 'web-socket/disconnect.handler',
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

        this.webSocketPlayers = new WebSocketPlayers(this, 'WebSocketPlayersStack', {
            api: this.api,
            webSocketHandlerGenerator,
            players: props.players,
        });

        this.webSocketTicTacToe = new WebSocketTicTacToe(this, 'WebSocketTicTacToeStack', {
            connectionTable: this.connectionTable,
            observerTable: this.observableTable,
            api: this.api,
            webSocketHandlerGenerator,
            ticTacToe: props.ticTacToe,
            players: props.players,
        });
    }
}
