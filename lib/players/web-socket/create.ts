import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { WebSocketLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import { CfnModel, CfnRoute } from 'aws-cdk-lib/aws-apigatewayv2';
import { JsonSchemaType } from 'aws-cdk-lib/aws-apigateway';
import { PlayersContext } from '../context';
import { WebSocketContext } from '../../web-socket/context';

export interface PlayersCreateProps {
    playersContext: PlayersContext;
    webSocketContext: WebSocketContext;
}

export class PlayersCreate extends Construct {
    public readonly createHandler: lambda.Function;

    constructor(scope: Construct, id: string, props: PlayersCreateProps) {
        super(scope, id);

        const playerCreateCfnModel = new CfnModel(scope, 'PlayerCreateCfnModel', {
            apiId: props.webSocketContext.api.apiId,
            contentType: 'application/json',
            name: 'PlayerCreateCfnModel',
            schema: {
                $schema: 'http://json-schema.org/draft-04/schema#',
                properties: {
                    action: { enum: ['createPlayer'] },
                    payload: {
                        properties: {
                            username: { type: JsonSchemaType.STRING },
                        },
                        required: ['username' ],
                        type: JsonSchemaType.OBJECT,
                    },
                },
                required: ['action', 'payload'],
                title: `AddSchema`,
                type: 'object',
            },
        });
        this.createHandler = props.webSocketContext.webSocketHandlerGenerator.generate('PlayersCreateWebSocketHandler', {
            entry: 'src/lambda/players/create.ts',
            handler: 'webSocketHandler',
        });
        props.playersContext.playerTable.grantWriteData(this.createHandler);
        const playerCreateRoute = props.webSocketContext.api.addRoute('createPlayer', {
            integration: new WebSocketLambdaIntegration('PlayersCreateWebSocketIntegration', this.createHandler),
        });
        const playerCreateCfnRoute = playerCreateRoute.node.defaultChild as CfnRoute;
        playerCreateCfnRoute.modelSelectionExpression = '$request.body.action';
        playerCreateCfnRoute.requestModels = { createPlayer: playerCreateCfnModel.name }
        props.webSocketContext.api.grantManageConnections(this.createHandler);
    }
}
