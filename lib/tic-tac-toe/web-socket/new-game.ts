import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { WebSocketLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import { TicTacToeContext } from '../context';
import { WebSocketContext } from '../../web-socket/context';
import { PlayersContext } from '../../players';
import { CfnModel, CfnRoute } from 'aws-cdk-lib/aws-apigatewayv2';
import { JsonSchemaType } from 'aws-cdk-lib/aws-apigateway';

export interface TicTacToeNewGameProps {
    ticTacToeContext: TicTacToeContext;
    playersContext: PlayersContext;
    webSocketContext: WebSocketContext;
}

export class TicTacToeNewGame extends Construct {
    public readonly newGameHandler: lambda.Function;

    constructor(scope: Construct, id: string, props: TicTacToeNewGameProps) {
        super(scope, id);

        const ticTacToeNewGameCfnModel = new CfnModel(scope, 'TicTacToeNewGameCfnModel', {
            apiId: props.webSocketContext.api.apiId,
            contentType: 'application/json',
            name: 'TicTacToeNewGameCfnModel',
            schema: {
                $schema: 'http://json-schema.org/draft-04/schema#',
                properties: {
                    action: { enum: ['newGameTicTacToe'] },
                    payload: {
                        properties: {
                            player: {
                                properties: {
                                    id: { type: JsonSchemaType.STRING },
                                    secret: { type: JsonSchemaType.STRING },
                                },
                                required: ['id', 'secret'],
                                type: JsonSchemaType.OBJECT,
                            },
                        },
                        required: ['player'],
                        type: JsonSchemaType.OBJECT,
                    },
                },
                required: ['action', 'payload'],
                title: `AddSchema`,
                type: 'object',
            },
        });

        this.newGameHandler = props.webSocketContext.webSocketHandlerGenerator.generate('TicTacToeNewGameWebSocketHandler', {
            entry: 'src/lambda/tic-tac-toe/new-game.ts',
            handler: 'webSocketHandler',
            functionName: 'TicTacToeNewGameWebsocketHandler',
        });
        props.webSocketContext.observableTable.grantReadWriteData(this.newGameHandler);
        props.webSocketContext.connectionTable.grantReadWriteData(this.newGameHandler);
        props.ticTacToeContext.gameStateTable.grantReadWriteData(this.newGameHandler);
        props.playersContext.playerTable.grantReadData(this.newGameHandler);

        const ticTacToeNewGameRoute = props.webSocketContext.api.addRoute('newGameTicTacToe', {
            integration: new WebSocketLambdaIntegration('TicTacToeNewGameWebSocketIntegration', this.newGameHandler),
        });
        const ticTacToeNewGameCfnRoute = ticTacToeNewGameRoute.node.defaultChild as CfnRoute;
        ticTacToeNewGameCfnRoute.modelSelectionExpression = '$request.body.action';
        ticTacToeNewGameCfnRoute.requestModels = { newGameTicTacToe: ticTacToeNewGameCfnModel.name }

        props.webSocketContext.api.grantManageConnections(this.newGameHandler);
    }
}
