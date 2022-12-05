import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { BuildContext } from '../../helpers/build-context';
import { PlayersContext } from '../context';
import { CfnOutput } from 'aws-cdk-lib';

export interface PlayersCreateProps {
    buildContext: BuildContext;
    playersContext: PlayersContext;
}

export class PlayersCreate extends Construct {
    public readonly createHandler: lambda.Function;

    constructor(scope: Construct, id: string, props: PlayersCreateProps) {
        super(scope, id);

        this.createHandler = props.playersContext.playerNodejsHandlerGenerator.generate('PlayersCreateHandler', {
            entry: 'src/lambda/players/create.ts',
            handler: 'apiHandler',
        });
        props.playersContext.playerTable.grantWriteData(this.createHandler);

        const createPlayerRequestModel = props.buildContext.restApi.addModel('CreatePlayerModel', {
            contentType: 'application/json',
            schema: {
                type: apigateway.JsonSchemaType.OBJECT,
                required: ['username'],
                properties: {
                    username: {
                        type: apigateway.JsonSchemaType.STRING,
                    },
                },
            },
        });
        props.playersContext.playerResource.addMethod(
            'POST',
            new apigateway.LambdaIntegration(this.createHandler),
            {
                requestValidator: props.buildContext.restApi.addRequestValidator('CreatePlayerValidator', {
                    validateRequestBody: true,
                }),
                requestModels: {
                    'application/json': createPlayerRequestModel,
                },
            },
        );

        new CfnOutput(this, 'Player Create Path', { value: props.playersContext.playerResource.path });
    }
}
