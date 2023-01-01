import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { WebSocketLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import { TicTacToeContext } from '../context';
import { WebSocketContext } from '../../web-socket/context';
import { PlayersContext } from '../../players';
import { CfnModel, CfnRoute } from 'aws-cdk-lib/aws-apigatewayv2';
import { JsonSchemaType } from 'aws-cdk-lib/aws-apigateway';

export interface TicTacToeObserveGameProps {
    ticTacToeContext: TicTacToeContext;
    playersContext: PlayersContext;
    webSocketContext: WebSocketContext;
}

export class TicTacToeObserveGame extends Construct {
    public readonly observeGameHandler: lambda.Function;

    constructor(scope: Construct, id: string, props: TicTacToeObserveGameProps) {
        super(scope, id);

        const ticTacToeObserveGameCfnModel = new CfnModel(scope, 'TicTacToeObserveGameCfnModel', {
            apiId: props.webSocketContext.api.apiId,
            contentType: 'application/json',
            name: 'TicTacToeObserveGameCfnModel',
            schema: {
                $schema: 'http://json-schema.org/draft-04/schema#',
                properties: {
                    action: { enum: ['observeGameTicTacToe'] },
                    payload: {
                        properties: {
                            gameState: {
                                properties: {
                                    id: { type: JsonSchemaType.STRING },
                                },
                                required: ['id'],
                                type: JsonSchemaType.OBJECT,
                            },
                        },
                        required: ['gameState'],
                        type: JsonSchemaType.OBJECT,
                    },
                },
                required: ['action', 'payload'],
                title: `AddSchema`,
                type: 'object',
            },
        });

        this.observeGameHandler = props.webSocketContext.webSocketHandlerGenerator.generate('TicTacToeObserveGameWebSocketHandler', {
            entry: 'src/lambda/tic-tac-toe/observe-game.ts',
            handler: 'webSocketHandler',
            functionName: 'TicTacToeObserveGameWebsocketHandler',
        });
        props.webSocketContext.observableTable.grantReadWriteData(this.observeGameHandler);
        props.webSocketContext.connectionTable.grantReadWriteData(this.observeGameHandler);
        props.ticTacToeContext.gameStateTable.grantReadWriteData(this.observeGameHandler);

        const ticTacToeObserveGameRoute = props.webSocketContext.api.addRoute('observeGameTicTacToe', {
            integration: new WebSocketLambdaIntegration('TicTacToeObserveGameWebSocketIntegration', this.observeGameHandler),
        });
        const ticTacToeObserveGameCfnRoute = ticTacToeObserveGameRoute.node.defaultChild as CfnRoute;
        ticTacToeObserveGameCfnRoute.modelSelectionExpression = '$request.body.action';
        ticTacToeObserveGameCfnRoute.requestModels = { observeGameTicTacToe: ticTacToeObserveGameCfnModel.name }

        props.webSocketContext.api.grantManageConnections(this.observeGameHandler);
    }
}
