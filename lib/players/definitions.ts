import { Construct } from 'constructs';
import { PlayersContext } from './players-context';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';

export const generateGetPlayerDefinition = (scope: Construct, playersContext: PlayersContext, definition: sfn.IChainable, props?: {
    error: string,
}) => {
    return new tasks.DynamoGetItem(scope, 'Get player from Dynamo', {
        table: playersContext.playerTable,
        key: {
            id: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.id'))
        },
        resultPath: sfn.JsonPath.stringAt('$.GetPlayerResult')
    })
        .next(new sfn.Choice(scope, 'Check if player was found')
            .when(sfn.Condition.isPresent('$.GetPlayerResult.Item'),
                definition,
            )
            .otherwise(new sfn.Fail(scope, 'Player not found', {
                error: props?.error || '404',
                cause: 'Player not found',
            })),
        );
}
