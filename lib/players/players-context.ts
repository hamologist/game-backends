import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { BuildContext } from '../helpers/build-context';

export interface PlayersProps {
    buildContext: BuildContext;
}

export class PlayersContext extends Construct {
    public readonly playerTable: dynamodb.Table;
    public readonly playerResource: apigateway.Resource;

    constructor(scope: Construct, id: string, props: PlayersProps) {
        super(scope, id);

        this.playerTable = props.buildContext.tableGenerator.generate('PlayerTable', {
            tableName: `${props.buildContext.stageContext.stageToString()}-game-backends-player`,
            partitionKey: {
                type: dynamodb.AttributeType.STRING,
                name: 'id',
            },
        });

        this.playerResource = props.buildContext.restApi.root.addResource('player');
    }
}
