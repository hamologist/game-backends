import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { StageContext } from './stage-context';

export interface RestApiGeneratorProps {
    stageContext: StageContext;
}

export class RestApiGenerator extends Construct {
    public readonly stageContext: StageContext

    constructor(scope: Construct, id: string, props: RestApiGeneratorProps) {
        super(scope, id);

        this.stageContext = props.stageContext;
    }

    public generate(): apigateway.RestApi {
        return new apigateway.RestApi(this,  'Api', {
            defaultCorsPreflightOptions: {
                allowMethods: [
                    'OPTIONS',
                    'POST'
                ],
                allowHeaders: [
                    'Content-Type',
                    'X-Amz-Date',
                    'Authorization',
                    'X-Api-Key',
                    'X-Amz-Security-Token'
                ],
                allowOrigins: ['*']
            },
            deployOptions: {
                stageName: this.stageContext.stageToString(),
            },
        });
    }
}
