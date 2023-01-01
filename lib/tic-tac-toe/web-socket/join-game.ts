import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { WebSocketLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import { TicTacToeContext } from '../context';
import { WebSocketContext } from '../../web-socket/context';
import { PlayersContext } from '../../players';
import { CfnModel, CfnRoute } from 'aws-cdk-lib/aws-apigatewayv2';
import { JsonSchemaType } from 'aws-cdk-lib/aws-apigateway';

export interface TicTacToeJoinGameProps {
    ticTacToeContext: TicTacToeContext;
    playersContext: PlayersContext;
    webSocketContext: WebSocketContext;
}

export class TicTacToeJoinGame extends Construct {
    public readonly joinGameHandler: lambda.Function;

    constructor(scope: Construct, id: string, props: TicTacToeJoinGameProps) {
        super(scope, id);

        const ticTacToeJoinGameCfnModel = new CfnModel(scope, 'TicTacToeJoinGameCfnModel', {
            apiId: props.webSocketContext.api.apiId,
            contentType: 'application/json',
            name: 'TicTacToeJoinGameCfnModel',
            schema: {
                $schema: 'http://json-schema.org/draft-04/schema#',
                properties: {
                    action: { enum: ['joinGameTicTacToe'] },
                    payload: {
                        properties: {
                            id: { type: JsonSchemaType.STRING },
                            player: {
                                properties: {
                                    id: { type: JsonSchemaType.STRING },
                                    secret: { type: JsonSchemaType.STRING },
                                },
                                required: ['id', 'secret'],
                                type: JsonSchemaType.OBJECT,
                            },
                        },
                        required: ['id', 'player'],
                        type: JsonSchemaType.OBJECT,
                    },
                },
                required: ['action', 'payload'],
                title: `AddSchema`,
                type: 'object',
            },
        });

        this.joinGameHandler = props.webSocketContext.webSocketHandlerGenerator.generate('TicTacToeJoinGameWebSocketHandler', {
            entry: 'src/lambda/tic-tac-toe/join-game.ts',
            handler: 'webSocketHandler',
            functionName: 'TicTacToeJoinGameWebsocketHandler',
        });
        props.webSocketContext.observableTable.grantReadWriteData(this.joinGameHandler);
        props.webSocketContext.connectionTable.grantReadWriteData(this.joinGameHandler);
        props.ticTacToeContext.gameStateTable.grantReadWriteData(this.joinGameHandler);
        props.playersContext.playerTable.grantReadWriteData(this.joinGameHandler);

        const ticTacToeJoinGameRoute = props.webSocketContext.api.addRoute('joinGameTicTacToe', {
            integration: new WebSocketLambdaIntegration('TicTacToeJoinGameWebSocketIntegration', this.joinGameHandler),
        });
        const ticTacToeJoinGameCfnRoute = ticTacToeJoinGameRoute.node.defaultChild as CfnRoute;
        ticTacToeJoinGameCfnRoute.modelSelectionExpression = '$request.body.action';
        ticTacToeJoinGameCfnRoute.requestModels = { joinGameTicTacToe: ticTacToeJoinGameCfnModel.name }

        props.webSocketContext.api.grantManageConnections(this.joinGameHandler);
    }
}
