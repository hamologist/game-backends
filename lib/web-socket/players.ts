import { Construct } from 'constructs';
import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { WebSocketLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import { HandlerGenerator } from '../helpers/handler-generator';
import { Players } from '../players';
import { CfnModel, CfnRoute } from 'aws-cdk-lib/aws-apigatewayv2';
import { JsonSchemaType } from 'aws-cdk-lib/aws-apigateway';

export interface WebSocketPlayersProps {
    players: Players;
    webSocketHandlerGenerator: HandlerGenerator;
    api: apigatewayv2.WebSocketApi;
}

export class WebSocketPlayers extends Construct {
    public readonly playersCreateHandler: lambda.Function;
    public readonly playersValidateHandler: lambda.Function;
    public readonly playersGetHandler: lambda.Function;

    constructor(scope: Construct, id: string, props: WebSocketPlayersProps) {
        super(scope, id);

        this.playersCreateHandler = props.webSocketHandlerGenerator.generate('PlayersCreateWebSocketHandler', {
            handler: 'players/create.webSocketHandler',
        });
        props.players.playerTable.grantWriteData(this.playersCreateHandler);
        props.api.addRoute('createPlayer', {
            integration: new WebSocketLambdaIntegration('PlayersCreateWebSocketIntegration', this.playersCreateHandler)
        });
        props.api.grantManageConnections(this.playersCreateHandler);

        const validatePlayerCfnModel = new CfnModel(scope, 'ValidatePlayerCfnModel', {
            apiId: props.api.apiId,
            contentType: 'application/json',
            name: 'ValidatePlayerCfnModel',
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
        this.playersValidateHandler = props.webSocketHandlerGenerator.generate('PlayersValidateWebSocketHandler', {
            handler: 'players/validate.webSocketHandler',
        });
        props.players.playerTable.grantReadData(this.playersValidateHandler);
        const validatePlayerRoute = props.api.addRoute('validatePlayer', {
            integration: new WebSocketLambdaIntegration('PlayersValidateWebSocketIntegration', this.playersValidateHandler)
        });
        const validatePlayerCfnRoute = validatePlayerRoute.node.defaultChild as CfnRoute;
        validatePlayerCfnRoute.modelSelectionExpression = '$request.body.action';
        validatePlayerCfnRoute.requestModels = { validatePlayer: validatePlayerCfnModel.name }
        props.api.grantManageConnections(this.playersValidateHandler);

        this.playersGetHandler = props.webSocketHandlerGenerator.generate('PlayersGetWebSocketHandler', {
            handler: 'players/get.webSocketHandler',
        });
        props.players.playerTable.grantReadData(this.playersGetHandler);
        props.api.addRoute('getPlayer', {
            integration: new WebSocketLambdaIntegration('PlayersGetWebSocketIntegration', this.playersGetHandler),
        });
        props.api.grantManageConnections(this.playersGetHandler);
    }
}
