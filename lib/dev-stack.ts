import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { GameBackends } from './game-backends';

export class DevStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        new GameBackends(this, 'GameBackends', {
            apiDeployOptions: {
                stageName: 'dev',
            },
            scope: 'dev',
        });
    }
}
