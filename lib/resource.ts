import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export interface ResourceStackProps {
    restApi: apigateway.RestApi;
    scope: string;
}

export abstract class Resource extends Construct {
    protected readonly restApi: apigateway.RestApi;

    protected constructor(scope: Construct, id: string, props: ResourceStackProps) {
        super(scope, id);

        this.restApi = props.restApi;
    }
}
