import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { WebSocketLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import { PlayersContext } from '../context';
import { WebSocketContext } from '../../web-socket/context';
import { CfnModel, CfnRoute } from 'aws-cdk-lib/aws-apigatewayv2';
import { JsonSchemaType } from 'aws-cdk-lib/aws-apigateway';

export interface PlayersGetProps {
    playersContext: PlayersContext;
    webSocketContext: WebSocketContext;
}

export class PlayersGet extends Construct {
    public readonly getHandler: lambda.Function;

    constructor(scope: Construct, id: string, props: PlayersGetProps) {
        super(scope, id);

        const playersGetCfnModel = new CfnModel(scope, 'PlayersGetCfnModel', {
            apiId: props.webSocketContext.api.apiId,
            contentType: 'application/json',
            name: 'PlayersGetCfnModel',
            schema: {
                $schema: 'http://json-schema.org/draft-04/schema#',
                properties: {
                    action: { enum: ['getPlayer'] },
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

        this.getHandler = props.webSocketContext.webSocketHandlerGenerator.generate('PlayersGetWebSocketHandler', {
            entry: 'src/lambda/players/get.ts',
            handler: 'webSocketHandler',
            functionName: 'PlayersGetWebsocketHandler'
        });
        props.playersContext.playerTable.grantReadData(this.getHandler);

        const playersGetRoute = props.webSocketContext.api.addRoute('getPlayer', {
            integration: new WebSocketLambdaIntegration('PlayersGetWebSocketIntegration', this.getHandler),
        });
        const playersGetCfnRoute = playersGetRoute.node.defaultChild as CfnRoute;
        playersGetCfnRoute.modelSelectionExpression = '$request.body.action';
        playersGetCfnRoute.requestModels = { getPlayer: playersGetCfnModel.name }

        props.webSocketContext.api.grantManageConnections(this.getHandler);
    }
}
