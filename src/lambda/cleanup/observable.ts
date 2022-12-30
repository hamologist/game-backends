import { DynamoDBRecord, DynamoDBStreamEvent } from 'aws-lambda';
import { removeObservablesFromConnection } from '../shared/models/connection';

const processRemoveEvent = async (record: DynamoDBRecord) => {
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
                { connectionId, observableId }
            );
        }
    }
};

export const handler = async (
    event: DynamoDBStreamEvent,
): Promise<void> => {
    for (const record of event.Records) {
        switch (record.eventName) {
            case "REMOVE":
                processRemoveEvent(record);
        }
    }
};
