import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { StageContext } from './stage-context';
import { TableGenerator } from './table-generator';

export interface BuildContextProps {
    stageContext: StageContext;
    restApi: apigateway.RestApi;
    tableGenerator: TableGenerator;
}

export class BuildContext extends Construct {
    public readonly stageContext: StageContext;
    public readonly restApi: apigateway.RestApi;
    public readonly tableGenerator: TableGenerator;

    constructor(scope: Construct, id: string, props: BuildContextProps) {
        super(scope, id);

        this.stageContext = props.stageContext;
        this.restApi = props.restApi;
        this.tableGenerator = props.tableGenerator;
    }
}
