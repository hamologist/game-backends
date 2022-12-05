import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { WebSocketLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import { PlayersContext } from '../context';
import { WebSocketContext } from '../../web-socket/context';

export interface PlayersGetProps {
    playersContext: PlayersContext;
    webSocketContext: WebSocketContext;
}

export class PlayersGet extends Construct {
    public readonly getHandler: lambda.Function;

    constructor(scope: Construct, id: string, props: PlayersGetProps) {
        super(scope, id);

        this.getHandler = props.webSocketContext.webSocketHandlerGenerator.generate('PlayersGetWebSocketHandler', {
            entry: 'src/lambda/players/get.ts',
            handler: 'webSocketHandler',
        });
        props.playersContext.playerTable.grantReadData(this.getHandler);
        props.webSocketContext.api.addRoute('getPlayer', {
            integration: new WebSocketLambdaIntegration('PlayersGetWebSocketIntegration', this.getHandler),
        });
        props.webSocketContext.api.grantManageConnections(this.getHandler);
    }
}
