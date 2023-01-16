import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import { StageContext } from './stage-context';

export interface NodejsHandlerGeneratorProps {
    defaultLambdaGeneratorProps?: Omit<nodejs.NodejsFunctionProps, 'handler' | 'runtime'>;
    stageContext: StageContext;
}

export class NodejsHandlerGenerator extends Construct {
    protected scope: Construct;
    protected defaultLambdaGeneratorProps: Omit<nodejs.NodejsFunctionProps, 'handler'>;
    protected stageContext: StageContext;

    public constructor(scope: Construct, id: string, props: NodejsHandlerGeneratorProps) {
        super(scope, id);

        this.defaultLambdaGeneratorProps = {
            ...{
                timeout: Duration.seconds(5),
                memorySize: 256,
                architecture: lambda.Architecture.ARM_64,
                runtime: lambda.Runtime.NODEJS_18_X,
                logRetention: logs.RetentionDays.ONE_DAY,
            },
            ...props.defaultLambdaGeneratorProps,
        };
        this.stageContext = props.stageContext;
    }

    public generate(
        id: string,
        props: {
            runtime?: nodejs.NodejsFunctionProps["runtime"],
        } & Omit<nodejs.NodejsFunctionProps, "runtime">
    ): lambda.Function {
        props = {
            ...props,
            functionName: `${this.stageContext.stage}-${props.functionName}`,
        };

        return new nodejs.NodejsFunction(this, id, {
            ...this.defaultLambdaGeneratorProps,
            ...props,
        });
    }
}
