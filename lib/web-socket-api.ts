import { Construct } from 'constructs';
import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { WebSocketLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import { HandlerGenerator } from './helpers/handler-generator';
import { Players } from './players';
import { TicTacToe } from './tic-tac-toe';
import { BuildContext } from './helpers/build-context';

export interface WebSocketApiProps {
    buildContext: BuildContext;
    players: Players;
    ticTacToe: TicTacToe;
}

export class WebSocketApi extends Construct {
    public readonly api: apigatewayv2.WebSocketApi;
    public readonly connectionTable: dynamodb.Table;
    public readonly connectHandler: lambda.Function;
    public readonly disconnectHandler: lambda.Function;
    public readonly playersCreateHandler: lambda.Function;
    public readonly playersValidateHandler: lambda.Function;
    public readonly playersGetHandler: lambda.Function;
    public readonly ticTacToeNewGameHandler: lambda.Function;
    public readonly ticTacToeGetHandler: lambda.Function;

    constructor(scope: Construct, id: string, props: WebSocketApiProps) {
        super(scope, id);

        this.connectionTable = props.buildContext.tableGenerator.generate('WebsocketConnectionTable', {
            tableName: `${props.buildContext.stageContext.stageToString()}-game-backends-connection-table`,
            partitionKey: {
                type: AttributeType.STRING,
                name: 'id',
            },
        });

        const handlerGenerator = new HandlerGenerator(this, 'WebSocketApiHandlerGenerator', {
            defaultLambdaGeneratorProps: {
                environment: {
                    CONNECTION_TABLE_NAME: this.connectionTable.tableName,
                    PLAYER_TABLE_NAME: props.players.playerTable.tableName,
                    GAME_STATE_TABLE_NAME: props.ticTacToe.gameStateTable.tableName,
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

        this.playersCreateHandler = handlerGenerator.generate('PlayersCreateWebSocketHandler', {
            handler: 'players/create.webSocketHandler',
        });
        props.players.playerTable.grantWriteData(this.playersCreateHandler);
        this.api.addRoute('createPlayer', {
            integration: new WebSocketLambdaIntegration('PlayersCreateWebSocketIntegration', this.playersCreateHandler)
        });
        this.api.grantManageConnections(this.playersCreateHandler);

        this.playersValidateHandler = handlerGenerator.generate('PlayersValidateWebSocketHandler', {
            handler: 'players/validate.webSocketHandler',
        });
        props.players.playerTable.grantReadData(this.playersValidateHandler);
        this.api.addRoute('validatePlayer', {
            integration: new WebSocketLambdaIntegration('PlayersValidateWebSocketIntegration', this.playersValidateHandler)
        });
        this.api.grantManageConnections(this.playersValidateHandler);

        this.playersGetHandler = handlerGenerator.generate('PlayersGetWebSocketHandler', {
            handler: 'players/get.webSocketHandler',
        });
        props.players.playerTable.grantReadData(this.playersGetHandler);
        this.api.addRoute('getPlayer', {
            integration: new WebSocketLambdaIntegration('PlayersGetWebSocketIntegration', this.playersGetHandler),
        });
        this.api.grantManageConnections(this.playersGetHandler);

        this.ticTacToeNewGameHandler = handlerGenerator.generate('TicTacToeNewGameWebSocketHandler', {
            handler: 'tic-tac-toe/new-game.webSocketHandler',
        });
        props.ticTacToe.gameStateTable.grantReadWriteData(this.ticTacToeNewGameHandler);
        props.players.playerTable.grantReadData(this.ticTacToeNewGameHandler);
        this.api.addRoute('newGameTicTacToe', {
            integration: new WebSocketLambdaIntegration('TicTacToeNewGameWebSocketIntegration', this.ticTacToeNewGameHandler),
        });
        this.api.grantManageConnections(this.ticTacToeNewGameHandler);

        this.ticTacToeGetHandler = handlerGenerator.generate('TicTacToeGetWebSocketHandler', {
            handler: 'tic-tac-toe/get.webSocketHandler'
        });
        props.ticTacToe.gameStateTable.grantReadData(this.ticTacToeGetHandler);
        this.api.addRoute('getTicTacToe', {
            integration: new WebSocketLambdaIntegration('TicTacToeGetWebSocketIntegration', this.ticTacToeGetHandler),
        });
        this.api.grantManageConnections(this.ticTacToeGetHandler);
    }
}
