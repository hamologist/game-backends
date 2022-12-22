import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { BuildContext } from '../../helpers/build-context';
import { PlayersContext } from '../context';
import { CfnOutput } from 'aws-cdk-lib';

export interface PlayersGetProps {
    buildContext: BuildContext;
    playersContext: PlayersContext;
}

export class PlayersGet extends Construct {
    public readonly getHandler: lambda.Function;

    constructor(scope: Construct, id: string, props: PlayersGetProps) {
        super(scope, id);

        this.getHandler = props.playersContext.playerNodejsHandlerGenerator.generate('PlayersGetHandler', {
            entry: 'src/lambda/players/get.ts',
            handler: 'apiHandler',
            functionName: 'PlayersGetRestHandler'
        });
        props.playersContext.playerTable.grantReadData(this.getHandler);

        props.playersContext.byIdResource.addMethod(
            'GET',
            new apigateway.LambdaIntegration(this.getHandler),
        );

        new CfnOutput(this, 'Player Get Path', { value: props.playersContext.byIdResource.path });
    }
}
