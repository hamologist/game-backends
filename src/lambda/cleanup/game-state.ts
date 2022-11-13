import { DynamoDBStreamEvent } from 'aws-lambda';
import { deleteObservable } from '../shared/models/observable';

export const handler = async (
    event: DynamoDBStreamEvent,
): Promise<void> => {
    for (const record of event.Records) {
        if (record.eventName !== 'REMOVE') {
            break;
        }

        const gameStateId = record.dynamodb?.Keys?.id?.S

        if (gameStateId === undefined) {
            return;
        }

        await deleteObservable(gameStateId);
    }
};
