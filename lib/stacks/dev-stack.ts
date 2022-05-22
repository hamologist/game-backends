import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { GameBackends } from '../game-backends';
import { WebSocketStage } from '@aws-cdk/aws-apigatewayv2-alpha';

export class DevStack extends Stack {
    public readonly gameBackends: GameBackends;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        this.gameBackends = new GameBackends(this, 'GameBackends', {
            apiDeployOptions: {
                stageName: 'dev',
            },
            scope: 'dev',
        });

        const webSocketStage = new WebSocketStage(this, 'DevStage', {
            webSocketApi: this.gameBackends.webSocketApi.api,
            stageName: 'dev',
            autoDeploy: true,
        });

        new CfnOutput(this, 'WebSocketApiUrl', { value: webSocketStage.url });
    }
}
