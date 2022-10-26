import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { GameBackends } from '../game-backends';
import { WebSocketStage } from '@aws-cdk/aws-apigatewayv2-alpha';
import { BuildContext } from '../helpers/build-context';
import { Stage, StageContext } from '../helpers/stage-context';
import { RestApiGenerator } from '../helpers/rest-api-generator';
import { TableGenerator } from '../helpers/table-generator';

export class DevStack extends Stack {
    public readonly buildContext: BuildContext;
    public readonly gameBackends: GameBackends;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const stageContext = new StageContext(this, 'DevStageContext', {
            stage: Stage.Dev,
        });
        const restApiGenerator = new RestApiGenerator(this, 'RestApiGenerator', {
            stageContext,
        });
        const tableGenerator = new TableGenerator(this, 'TableGenerator', {
            stageContext
        });

        this.buildContext = new BuildContext(this, 'BuildContext', {
            stageContext,
            restApi: restApiGenerator.generate(),
            tableGenerator
        });
        this.gameBackends = new GameBackends(this, 'GameBackends', {
            buildContext: this.buildContext,
        });

        const webSocketStage = new WebSocketStage(this, 'DevStage', {
            webSocketApi: this.gameBackends.webSocketApi.api,
            stageName: this.buildContext.stageContext.stageToString(),
            autoDeploy: true,
        });

        new CfnOutput(this, 'ApiUrl', { value: this.buildContext.restApi.url });
        new CfnOutput(this, 'WebSocketApiUrl', { value: webSocketStage.url });
    }
}
