import { Construct } from 'constructs';
import { BuildContext } from '../helpers/build-context';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cdk from 'aws-cdk-lib';
import {
    errorAsStatusCodeIntegrationResponses
} from '../helpers/error-as-status-code-integration-responses';
import { PlayersContext } from './players-context';
import { generateGetPlayerDefinition } from './definitions';

export interface GetPlayerProps {
    buildContext: BuildContext;
    playersContext: PlayersContext;
}

export class GetPlayer extends Construct {
    public readonly getPlayerStateMachine: sfn.StateMachine;
    public readonly byIdResource: apigateway.Resource;

    constructor(scope: Construct, id: string, props: GetPlayerProps) {
        super(scope, id);

        const getPlayerDefinition = new sfn.Pass(this, 'Transform API Gateway event to format usable by GetPlayerDefinition', {
            parameters: {
                id: sfn.JsonPath.stringAt('$.path.id'),
            },
        })
            .next(generateGetPlayerDefinition(
                this,
                props.playersContext,
                new sfn.Pass(this, 'Parse player response from Dynamo', {
                    parameters: {
                        username: sfn.JsonPath.stringAt('$.GetPlayerResult.Item.username.S'),
                    },
                }))
            );

        this.getPlayerStateMachine = new sfn.StateMachine(this, 'GetPlayerStateMachine', {
            definition: getPlayerDefinition,
            stateMachineType: sfn.StateMachineType.EXPRESS,
            logs: {
                level: sfn.LogLevel.ALL,
                includeExecutionData: true,
                destination: new logs.LogGroup(this, 'GetPlayerStateMachineLogGroup', {
                    logGroupName: 'getPlayerStateMachine',
                    retention: logs.RetentionDays.ONE_DAY,
                    removalPolicy: cdk.RemovalPolicy.DESTROY,
                }),
            },
        });

        this.byIdResource = props.playersContext.playerResource.addResource('{id}');
        this.byIdResource.addMethod(
            'GET',
            apigateway.StepFunctionsIntegration.startExecution(this.getPlayerStateMachine, {
                integrationResponses: errorAsStatusCodeIntegrationResponses,
            }),
        );

        new cdk.CfnOutput(this, 'Player Get Path', { value: this.byIdResource.path });
    }
}
