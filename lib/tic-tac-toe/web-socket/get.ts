import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { WebSocketLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import { TicTacToeContext } from '../context';
import { WebSocketContext } from '../../web-socket/context';
import { PlayersContext } from '../../players';
import { CfnModel, CfnRoute } from 'aws-cdk-lib/aws-apigatewayv2';
import { JsonSchemaType } from 'aws-cdk-lib/aws-apigateway';

export interface TicTacToeGetProps {
    ticTacToeContext: TicTacToeContext;
    playersContext: PlayersContext;
    webSocketContext: WebSocketContext;
}

export class TicTacToeGet extends Construct {
    public readonly getHandler: lambda.Function;

    constructor(scope: Construct, id: string, props: TicTacToeGetProps) {
        super(scope, id);

        const ticTacToeGetCfnModel = new CfnModel(scope, 'TicTacToeGetCfnModel', {
            apiId: props.webSocketContext.api.apiId,
            contentType: 'application/json',
            name: 'TicTacToeGetCfnModel',
            schema: {
                $schema: 'http://json-schema.org/draft-04/schema#',
                properties: {
                    action: { enum: ['getTicTacToe'] },
                    payload: {
                        properties: {
                            id: { type: JsonSchemaType.STRING },
                        },
                        required: ['id'],
                        type: JsonSchemaType.OBJECT,
                    },
                },
                required: ['action', 'payload'],
                title: `AddSchema`,
                type: 'object',
            },
        });

        this.getHandler = props.webSocketContext.webSocketHandlerGenerator.generate('TicTacToeGetWebSocketHandler', {
            entry: 'src/lambda/tic-tac-toe/get.ts',
            handler: 'webSocketHandler',
        });
        props.ticTacToeContext.gameStateTable.grantReadData(this.getHandler);

        const ticTacToeGetRoute = props.webSocketContext.api.addRoute('getTicTacToe', {
            integration: new WebSocketLambdaIntegration('TicTacToeGetWebSocketIntegration', this.getHandler),
        });
        const ticTacToeGetCfnRoute = ticTacToeGetRoute.node.defaultChild as CfnRoute;
        ticTacToeGetCfnRoute.modelSelectionExpression = '$request.body.action';
        ticTacToeGetCfnRoute.requestModels = { getTicTacToe: ticTacToeGetCfnModel.name }

        props.webSocketContext.api.grantManageConnections(this.getHandler);
    }
}
