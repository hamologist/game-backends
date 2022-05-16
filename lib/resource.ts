import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';

export interface ResourceStackProps {
    restApi: apigateway.RestApi;
    scope: string;
}

export abstract class Resource extends Construct {
    protected readonly restApi: apigateway.RestApi;
    protected defaultLambdaGeneratorProps: Omit<lambda.FunctionProps, 'handler'>;

    protected constructor(scope: Construct, id: string, props: ResourceStackProps) {
        super(scope, id);

        this.restApi = props.restApi;
        this.defaultLambdaGeneratorProps = {
            timeout: Duration.seconds(5),
            memorySize: 256,
            architecture: lambda.Architecture.ARM_64,
            runtime: lambda.Runtime.NODEJS_14_X,
            code: lambda.Code.fromAsset('src/lambda', { exclude: ['*.ts'] }),
        };
    }

    protected handlerGenerator(
        id: string,
        props: {
            runtime?: lambda.FunctionProps["runtime"],
            code?: lambda.FunctionProps["code"],
        } & Omit<lambda.FunctionProps, "runtime" | "code">
    ): lambda.Function {
        return new lambda.Function(this, id, {
            ...this.defaultLambdaGeneratorProps,
            ...props,
        });
    }
}
