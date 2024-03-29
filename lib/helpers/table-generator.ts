import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Stage, StageContext } from './stage-context';

export interface TableGeneratorProps {
    stageContext: StageContext;
}

export class TableGenerator extends Construct {
    protected scope: Construct;
    protected stageContext: StageContext;

    public constructor(scope: Construct, id: string, props: TableGeneratorProps) {
        super(scope, id);

        this.stageContext = props.stageContext;
    }

    protected generateProdTableProps(props: dynamodb.TableProps): dynamodb.TableProps {
        return {
            ...props,
            billingMode: BillingMode.PAY_PER_REQUEST,
        };
    }

    protected generateDevTableProps(props: dynamodb.TableProps): dynamodb.TableProps {
        return {
            ...props,
            billingMode: BillingMode.PROVISIONED,
            readCapacity: 1,
            writeCapacity: 1,
        };
    }

    public generate(id: string, props: dynamodb.TableProps): dynamodb.Table {
        let fullProps: dynamodb.TableProps;
        if (this.stageContext.stage === Stage.Prod) {
            fullProps = this.generateProdTableProps(props);
        } else {
            fullProps = this.generateDevTableProps(props);
        }

        return new dynamodb.Table(this, id, fullProps);
    }
}
