import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';

export interface HandlerGeneratorProps {
    defaultLambdaGeneratorProps?: Omit<lambda.FunctionProps, 'handler' | 'runtime' | 'code'>;
}

export class HandlerGenerator extends Construct {
    protected scope: Construct;
    protected defaultLambdaGeneratorProps: Omit<lambda.FunctionProps, 'handler'>;

    public constructor(scope: Construct, id: string, props: HandlerGeneratorProps = {}) {
        super(scope, id);

        this.defaultLambdaGeneratorProps = {
            ...{
                timeout: Duration.seconds(5),
                memorySize: 256,
                architecture: lambda.Architecture.ARM_64,
                runtime: lambda.Runtime.NODEJS_14_X,
                code: lambda.Code.fromAsset('src/lambda', { exclude: ['*.ts'] }),
            },
            ...props.defaultLambdaGeneratorProps,
        };
    }

    public generate(
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
