import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { BuildContext } from '../../helpers/build-context';
import { PlayersContext } from '../context';
import { CfnOutput } from 'aws-cdk-lib';

export interface PlayersValidateProps {
    buildContext: BuildContext;
    playersContext: PlayersContext;
}

export class PlayersValidate extends Construct {
    public readonly validateHandler: lambda.Function;

    constructor(scope: Construct, id: string, props: PlayersValidateProps) {
        super(scope, id);

        this.validateHandler = props.playersContext.playerNodejsHandlerGenerator.generate('PlayersValidateHandler', {
            entry: 'src/lambda/players/validate.ts',
            handler: 'apiHandler',
            functionName: 'PlayersValidateRestHandler',
        });
        props.playersContext.playerTable.grantReadData(this.validateHandler);

        const validatePlayerRequestModel = props.buildContext.restApi.addModel('ValidatePlayerModel', {
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
        const validateResource = props.playersContext.playerResource.addResource('validate');
        validateResource.addMethod(
            'POST',
            new apigateway.LambdaIntegration(this.validateHandler),
            {
                requestValidator: props.buildContext.restApi.addRequestValidator('ValidatePlayerValidator', {
                    validateRequestBody: true,
                }),
                requestModels: {
                    'application/json': validatePlayerRequestModel,
                },
            },
        );

        new CfnOutput(this, 'Player Validate Path', { value: validateResource.path });
    }
}
