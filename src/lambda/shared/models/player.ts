import { randomBytes, randomUUID } from 'crypto';
import { documentClient } from '../clients/document-client';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const PLAYER_TABLE_NAME = process.env.PLAYER_TABLE_NAME;

export type PlayerResult = {
    id: string;
    secret: string;
    username: string;
};

export const createPlayer = async (
    username: string
): Promise<PlayerResult> => {
    const playerId = randomUUID();
    const playerSecret = randomBytes(20).toString('hex');

    await documentClient.send(
        new PutCommand({
            TableName: PLAYER_TABLE_NAME,
            Item: {
                'id': playerId,
                'secret': playerSecret,
                'username': username,
            },
        })
    );

    return {
        id: playerId,
        secret: playerSecret,
        username,
    }
};

export const getPlayer = async (
    playerId: string
): Promise<PlayerResult | null> => {
    const result = await documentClient.send(
        new GetCommand({
            TableName: PLAYER_TABLE_NAME,
            Key: {
                'id': playerId,
            },
        })
    );

    if (result.Item === undefined) {
        return null;
    }

    return {
        id: result.Item.id,
        secret: result.Item.secret,
        username: result.Item.username,
    };
}
