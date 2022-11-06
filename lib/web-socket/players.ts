import { Construct } from 'constructs';
import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { WebSocketLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import { HandlerGenerator } from '../helpers/handler-generator';
import { Players } from '../players';

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

        this.playersValidateHandler = props.webSocketHandlerGenerator.generate('PlayersValidateWebSocketHandler', {
            handler: 'players/validate.webSocketHandler',
        });
        props.players.playerTable.grantReadData(this.playersValidateHandler);
        props.api.addRoute('validatePlayer', {
            integration: new WebSocketLambdaIntegration('PlayersValidateWebSocketIntegration', this.playersValidateHandler)
        });
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