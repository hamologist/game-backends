import { DynamoDBStreamEvent } from 'aws-lambda';
import { removeObservablesFromConnection } from '../shared/models/connection';

export const handler = async (
    event: DynamoDBStreamEvent,
): Promise<void> => {
    for (const record of event.Records) {
        if (record.eventName !== 'REMOVE') {
            break;
        }

        const observableId = record.dynamodb?.OldImage?.observableId?.S;
        const connectionIds = record.dynamodb?.OldImage?.connectionIds?.SS;

        if (connectionIds === undefined || observableId === undefined) {
            return;
        }

        for (const connectionId of connectionIds) {
            const success = await removeObservablesFromConnection(connectionId, [observableId]);

            if (!success) {
                console.error(
                    `Failed to cleanup observable from connection`,
                    {connectionId, observableId}
                );
            }
        }
    }
};
