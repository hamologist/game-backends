import { DynamoDBRecord, DynamoDBStreamEvent } from 'aws-lambda';
import { deleteObservable } from '../shared/models/observable';

const processRemoveEvent = async (record: DynamoDBRecord) => {
    const gameStateId = record.dynamodb?.Keys?.id?.S

    if (gameStateId === undefined) {
        return;
    }

    await deleteObservable(gameStateId);
};

export const handler = async (
    event: DynamoDBStreamEvent,
): Promise<void> => {
    for (const record of event.Records) {
        switch (record.eventName) {
            case 'REMOVE':
                processRemoveEvent(record);
        }
    }
};
