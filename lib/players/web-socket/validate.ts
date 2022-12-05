import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { WebSocketLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import { CfnModel, CfnRoute } from 'aws-cdk-lib/aws-apigatewayv2';
import { JsonSchemaType } from 'aws-cdk-lib/aws-apigateway';
import { PlayersContext } from '../context';
import { WebSocketContext } from '../../web-socket/context';

export interface PlayersValidateProps {
    playersContext: PlayersContext;
    webSocketContext: WebSocketContext;
}

export class PlayersValidate extends Construct {
    public readonly validateHandler: lambda.Function;

    constructor(scope: Construct, id: string, props: PlayersValidateProps) {
        super(scope, id);

        const playerValidateCfnModel = new CfnModel(scope, 'PlayerValidateCfnModel', {
            apiId: props.webSocketContext.api.apiId,
            contentType: 'application/json',
            name: 'PlayerValidateCfnModel',
            schema: {
                $schema: 'http://json-schema.org/draft-04/schema#',
                properties: {
                    action: { enum: ['validatePlayer'] },
                    payload: {
                        properties: {
                            id: { type: JsonSchemaType.STRING },
                            secret: { type: JsonSchemaType.STRING },
                        },
                        required: ['id', 'secret'],
                        type: JsonSchemaType.OBJECT,
                    },
                },
                required: ['action', 'payload'],
                title: `AddSchema`,
                type: 'object',
            },
        });
        this.validateHandler = props.webSocketContext.webSocketHandlerGenerator.generate('PlayersValidateWebSocketHandler', {
            entry: 'src/lambda/players/validate.ts',
            handler: 'webSocketHandler',
        });
        props.playersContext.playerTable.grantReadData(this.validateHandler);
        const playerValidateRoute = props.webSocketContext.api.addRoute('validatePlayer', {
            integration: new WebSocketLambdaIntegration('PlayersValidateWebSocketIntegration', this.validateHandler),
        });
        const playerValidateCfnRoute = playerValidateRoute.node.defaultChild as CfnRoute;
        playerValidateCfnRoute.modelSelectionExpression = '$request.body.action';
        playerValidateCfnRoute.requestModels = { validatePlayer: playerValidateCfnModel.name }
        props.webSocketContext.api.grantManageConnections(this.validateHandler);
    }
}
