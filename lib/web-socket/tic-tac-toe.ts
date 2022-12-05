import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { WebSocketLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import { TicTacToe } from '../tic-tac-toe';
import { PlayersContext } from '../players';
import { WebSocketContext } from './context';

export interface WebSocketTicTacToeProps {
    ticTacToe: TicTacToe;
    playersContext: PlayersContext;
    webSocketContext: WebSocketContext;
}

export class WebSocketTicTacToe extends Construct {
    public readonly newGameHandler: lambda.Function;
    public readonly getHandler: lambda.Function;
    public readonly joinGameHandler: lambda.Function;
    public readonly makeMoveHandler: lambda.Function;

    constructor(scope: Construct, id: string, props: WebSocketTicTacToeProps) {
        super(scope, id);

        this.newGameHandler = props.webSocketContext.webSocketHandlerGenerator.generate('TicTacToeNewGameWebSocketHandler', {
            entry: 'src/lambda/tic-tac-toe/new-game.ts',
            handler: 'webSocketHandler',
        });
        props.webSocketContext.observableTable.grantReadWriteData(this.newGameHandler);
        props.webSocketContext.connectionTable.grantReadWriteData(this.newGameHandler);
        props.ticTacToe.gameStateTable.grantReadWriteData(this.newGameHandler);
        props.playersContext.playerTable.grantReadData(this.newGameHandler);
        props.webSocketContext.api.addRoute('newGameTicTacToe', {
            integration: new WebSocketLambdaIntegration('TicTacToeNewGameWebSocketIntegration', this.newGameHandler),
        });
        props.webSocketContext.api.grantManageConnections(this.newGameHandler);

        this.getHandler = props.webSocketContext.webSocketHandlerGenerator.generate('TicTacToeGetWebSocketHandler', {
            entry: 'src/lambda/tic-tac-toe/get.ts',
            handler: 'webSocketHandler'
        });
        props.ticTacToe.gameStateTable.grantReadData(this.getHandler);
        props.webSocketContext.api.addRoute('getTicTacToe', {
            integration: new WebSocketLambdaIntegration('TicTacToeGetWebSocketIntegration', this.getHandler),
        });
        props.webSocketContext.api.grantManageConnections(this.getHandler);

        this.joinGameHandler = props.webSocketContext.webSocketHandlerGenerator.generate('TicTacToeJoinGameWebSocketHandler', {
            entry: 'src/lambda/tic-tac-toe/join-game.ts',
            handler: 'webSocketHandler',
        });
        props.webSocketContext.observableTable.grantReadWriteData(this.joinGameHandler);
        props.webSocketContext.connectionTable.grantReadWriteData(this.joinGameHandler);
        props.ticTacToe.gameStateTable.grantReadWriteData(this.joinGameHandler);
        props.playersContext.playerTable.grantReadData(this.joinGameHandler);
        props.webSocketContext.api.addRoute('joinGameTicTacToe', {
            integration: new WebSocketLambdaIntegration('TicTacToeJoinGameWebSocketIntegration', this.joinGameHandler),
        });
        props.webSocketContext.api.grantManageConnections(this.joinGameHandler);

        this.makeMoveHandler = props.webSocketContext.webSocketHandlerGenerator.generate('TicTacToeMakeMoveWebSocketHandler', {
            entry: 'src/lambda/tic-tac-toe/make-move.ts',
            handler: 'webSocketHandler',
        });
        props.webSocketContext.observableTable.grantReadData(this.makeMoveHandler);
        props.ticTacToe.gameStateTable.grantReadWriteData(this.makeMoveHandler);
        props.playersContext.playerTable.grantReadData(this.makeMoveHandler);
        props.webSocketContext.api.addRoute('makeMoveTicTacToe', {
            integration: new WebSocketLambdaIntegration('TicTacToeMakeMoveWebSocketIntegration', this.makeMoveHandler),
        });
        props.webSocketContext.api.grantManageConnections(this.makeMoveHandler);
    }
}
