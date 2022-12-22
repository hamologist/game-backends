import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { WebSocketLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import { TicTacToeContext } from '../context';
import { WebSocketContext } from '../../web-socket/context';
import { PlayersContext } from '../../players';
import { CfnModel, CfnRoute } from 'aws-cdk-lib/aws-apigatewayv2';
import { JsonSchemaType } from 'aws-cdk-lib/aws-apigateway';

export interface TicTacToeMakeMoveProps {
    ticTacToeContext: TicTacToeContext;
    playersContext: PlayersContext;
    webSocketContext: WebSocketContext;
}

export class TicTacToeMakeMove extends Construct {
    public readonly makeMoveHandler: lambda.Function;

    constructor(scope: Construct, id: string, props: TicTacToeMakeMoveProps) {
        super(scope, id);

        const ticTacToeMakeMoveCfnModel = new CfnModel(scope, 'TicTacToeMakeMoveCfnModel', {
            apiId: props.webSocketContext.api.apiId,
            contentType: 'application/json',
            name: 'TicTacToeMakeMoveCfnModel',
            schema: {
                $schema: 'http://json-schema.org/draft-04/schema#',
                properties: {
                    action: { enum: ['makeMoveTicTacToe'] },
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
                            cord: {
                                properties: {
                                    x: { type: JsonSchemaType.NUMBER },
                                    y: { type: JsonSchemaType.NUMBER },
                                },
                                required: ['x', 'y'],
                            },
                        },
                        required: ['id', 'player', 'cord'],
                        type: JsonSchemaType.OBJECT,
                    },
                },
                required: ['action', 'payload'],
                title: `AddSchema`,
                type: 'object',
            },
        });

        this.makeMoveHandler = props.webSocketContext.webSocketHandlerGenerator.generate('TicTacToeMakeMoveWebSocketHandler', {
            entry: 'src/lambda/tic-tac-toe/make-move.ts',
            handler: 'webSocketHandler',
            functionName: 'TicTacToeMakeMoveWebsocketHandler',
        });
        props.webSocketContext.observableTable.grantReadData(this.makeMoveHandler);
        props.ticTacToeContext.gameStateTable.grantReadWriteData(this.makeMoveHandler);
        props.playersContext.playerTable.grantReadData(this.makeMoveHandler);

        const ticTacToeMakeMoveRoute = props.webSocketContext.api.addRoute('makeMoveTicTacToe', {
            integration: new WebSocketLambdaIntegration('TicTacToeMakeMoveWebSocketIntegration', this.makeMoveHandler),
        });
        const ticTacToeMakeMoveCfnRoute = ticTacToeMakeMoveRoute.node.defaultChild as CfnRoute;
        ticTacToeMakeMoveCfnRoute.modelSelectionExpression = '$request.body.action';
        ticTacToeMakeMoveCfnRoute.requestModels = { makeMoveTicTacToe: ticTacToeMakeMoveCfnModel.name }

        props.webSocketContext.api.grantManageConnections(this.makeMoveHandler);
    }
}
