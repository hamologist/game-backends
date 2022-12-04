import { Construct } from 'constructs';
import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { WebSocketLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import { HandlerGenerator } from '../helpers/handler-generator';
import { TicTacToe } from '../tic-tac-toe';
import { Players } from '../players';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export interface WebSocketTicTacToeProps {
    connectionTable: dynamodb.Table;
    observerTable: dynamodb.Table;
    ticTacToe: TicTacToe;
    players: Players;
    webSocketHandlerGenerator: HandlerGenerator;
    api: apigatewayv2.WebSocketApi;
}

export class WebSocketTicTacToe extends Construct {
    public readonly newGameHandler: lambda.Function;
    public readonly getHandler: lambda.Function;
    public readonly joinGameHandler: lambda.Function;
    public readonly makeMoveHandler: lambda.Function;

    constructor(scope: Construct, id: string, props: WebSocketTicTacToeProps) {
        super(scope, id);

        this.newGameHandler = props.webSocketHandlerGenerator.generate('TicTacToeNewGameWebSocketHandler', {
            handler: 'tic-tac-toe/new-game.webSocketHandler',
        });
        props.observerTable.grantReadWriteData(this.newGameHandler);
        props.connectionTable.grantReadWriteData(this.newGameHandler);
        props.ticTacToe.gameStateTable.grantReadWriteData(this.newGameHandler);
        props.players.playersContext.playerTable.grantReadData(this.newGameHandler);
        props.api.addRoute('newGameTicTacToe', {
            integration: new WebSocketLambdaIntegration('TicTacToeNewGameWebSocketIntegration', this.newGameHandler),
        });
        props.api.grantManageConnections(this.newGameHandler);

        this.getHandler = props.webSocketHandlerGenerator.generate('TicTacToeGetWebSocketHandler', {
            handler: 'tic-tac-toe/get.webSocketHandler'
        });
        props.ticTacToe.gameStateTable.grantReadData(this.getHandler);
        props.api.addRoute('getTicTacToe', {
            integration: new WebSocketLambdaIntegration('TicTacToeGetWebSocketIntegration', this.getHandler),
        });
        props.api.grantManageConnections(this.getHandler);

        this.joinGameHandler = props.webSocketHandlerGenerator.generate('TicTacToeJoinGameWebSocketHandler', {
            handler: 'tic-tac-toe/join-game.webSocketHandler',
        });
        props.observerTable.grantReadWriteData(this.joinGameHandler);
        props.connectionTable.grantReadWriteData(this.joinGameHandler);
        props.ticTacToe.gameStateTable.grantReadWriteData(this.joinGameHandler);
        props.players.playersContext.playerTable.grantReadData(this.joinGameHandler);
        props.api.addRoute('joinGameTicTacToe', {
            integration: new WebSocketLambdaIntegration('TicTacToeJoinGameWebSocketIntegration', this.joinGameHandler),
        });
        props.api.grantManageConnections(this.joinGameHandler);

        this.makeMoveHandler = props.webSocketHandlerGenerator.generate('TicTacToeMakeMoveWebSocketHandler', {
            handler: 'tic-tac-toe/make-move.webSocketHandler',
        });
        props.observerTable.grantReadData(this.makeMoveHandler);
        props.ticTacToe.gameStateTable.grantReadWriteData(this.makeMoveHandler);
        props.players.playersContext.playerTable.grantReadData(this.makeMoveHandler);
        props.api.addRoute('makeMoveTicTacToe', {
            integration: new WebSocketLambdaIntegration('TicTacToeMakeMoveWebSocketIntegration', this.makeMoveHandler),
        });
        props.api.grantManageConnections(this.makeMoveHandler);
    }
}
