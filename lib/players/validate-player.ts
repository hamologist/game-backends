import { Construct } from 'constructs';
import { BuildContext } from '../helpers/build-context';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cdk from 'aws-cdk-lib';
import { StateMachineType } from 'aws-cdk-lib/aws-stepfunctions';
import { PlayersContext } from './players-context';
import { generateGetPlayerDefinition } from './definitions';
import {
    errorAsStatusCodeIntegrationResponses
} from '../helpers/error-as-status-code-integration-responses';
import { CfnOutput } from 'aws-cdk-lib';

export interface ValidatePlayerProps {
    buildContext: BuildContext;
    playersContext: PlayersContext;
}

export class ValidatePlayer extends Construct {
    public readonly validatePlayerStateMachine: sfn.StateMachine;
    public readonly validateResource: apigateway.Resource;

    constructor(scope: Construct, id: string, props: ValidatePlayerProps) {
        super(scope, id);

        const validatePlayerDefinition = new sfn.Pass(this, 'Transform API Gateway event to format usable by GetPlayerDefinition', {
            parameters: {
                id: sfn.JsonPath.stringAt('$.body.id'),
                secret: sfn.JsonPath.stringAt('$.body.secret'),
            },
        })
            .next(generateGetPlayerDefinition(
                this,
                props.playersContext,
                new sfn.Choice(this, 'Check if player secret matches one provided')
                    .when(sfn.Condition.stringEquals('$.GetPlayerResult.Item.secret.S', sfn.JsonPath.stringAt('$.secret')),
                        new sfn.Pass(this, 'Player secret matched', {
                            parameters: {
                                valid: true,
                            },
                        }),
                    )
                    .otherwise(new sfn.Pass(this, 'Player secret did not match', {
                        parameters: {
                            valid: false,
                        }
                    })),
                { error: '400' }
            ));

        this.validatePlayerStateMachine = new sfn.StateMachine(this, 'ValidatePlayerStateMachine', {
            definition: validatePlayerDefinition,
            stateMachineType: StateMachineType.EXPRESS,
            logs: {
                level: sfn.LogLevel.ALL,
                includeExecutionData: true,
                destination: new logs.LogGroup(this, 'ValidatePlayerStateMachineLogGroup', {
                    logGroupName: 'validatePlayerStateMachine',
                    retention: logs.RetentionDays.ONE_DAY,
                    removalPolicy: cdk.RemovalPolicy.DESTROY,
                }),
            },
        });

        const validatePlayerRequestModel = props.buildContext.restApi.addModel('GetPlayerModel', {
            modelName: 'validatePlayer',
            contentType: 'application/json',
            schema: {
                type: apigateway.JsonSchemaType.OBJECT,
                required: ['id', 'secret'],
                properties: {
                    id: {
                        type: apigateway.JsonSchemaType.STRING,
                    },
                    secret: {
                        type: apigateway.JsonSchemaType.STRING,
                    },
                },
            },
        });
        this.validateResource = props.playersContext.playerResource.addResource('validate');
        this.validateResource.addMethod(
            'POST',
            apigateway.StepFunctionsIntegration.startExecution(this.validatePlayerStateMachine, {
                integrationResponses: errorAsStatusCodeIntegrationResponses,
            }),
            {
                requestValidator: props.buildContext.restApi.addRequestValidator('ValidatePlayerValidator', {
                    validateRequestBody: true,
                }),
                requestModels: {
                    'application/json': validatePlayerRequestModel,
                },
            },
        );

        new CfnOutput(this, 'Player Validate Path', { value: this.validateResource.path });
    }
}
