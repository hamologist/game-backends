import { randomUUID } from 'crypto';
import { Board, Players, SessionStates, SquareStates } from '../types/game-state';
import { documentClient } from './document-client';
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'

const createBoard = (): Board => {
    return [
        [SquareStates.Empty, SquareStates.Empty, SquareStates.Empty],
        [SquareStates.Empty, SquareStates.Empty, SquareStates.Empty],
        [SquareStates.Empty, SquareStates.Empty, SquareStates.Empty],
    ];
}

const processAttributes = (
    attributes: { [key: string]: any } | undefined,
): GameStateResult => {
    if (attributes === undefined) {
        throw new Error('IMPOSSIBLE!');
    }

    return attributes as GameStateResult;
}

export interface GameStateResult {
    id: string;
    playerOne: string;
    playerTwo: string | null;
    state: {
        currentPlayer: Players;
        sessionState: SessionStates;
        board: Board;
        movesMade: number;
    };
}

export const getGame = async (
    gameStateId: string
): Promise<GameStateResult | null> => {
    const { Item: item } = await documentClient.send(
        new GetCommand({
            TableName: 'gameState',
            Key: { 'id': gameStateId },
        })
    );

    if (item === undefined) {
        return null;
    }

    return item as GameStateResult
};

export const createGame = async (
    playerId: string,
): Promise<GameStateResult> => {
    const gameStateId = randomUUID();
    const gameState = {
        currentPlayer: Players.PlayerOne,
        sessionState: SessionStates.Playing,
        board: createBoard(),
        movesMade: 0,
    };

    await documentClient.send(
        new PutCommand({
            TableName: 'gameState',
            Item: {
                id: gameStateId,
                playerOne: playerId,
                playerTwo: null,
                state: gameState
            },
        })
    )

    return {
        id: gameStateId,
        playerOne: playerId,
        playerTwo: null,
        state: gameState,
    };
};

export const addPlayer = async (
    gameStateId: string,
    playerId: string,
): Promise<GameStateResult> => {
    const { Attributes: attributes } = await documentClient.send(
        new UpdateCommand({
            TableName: 'gameState',
            Key: { id: gameStateId },
            UpdateExpression: 'set playerTwo = :p',
            ExpressionAttributeValues: {
                ':p': playerId
            },
            ReturnValues: 'ALL_NEW',
        })
    );

    return processAttributes(attributes)
};

export const updateState = async (
    gameStateId: string,
    state: GameStateResult['state'],
): Promise<GameStateResult> => {
    const { Attributes: attributes } = await documentClient.send(
        new UpdateCommand({
            TableName: 'gameState',
            Key: { id: gameStateId },
            UpdateExpression: 'set #s = :s',
            ExpressionAttributeNames: {
                '#s': 'state',
            },
            ExpressionAttributeValues: {
                ':s': state
            },
            ReturnValues: 'ALL_NEW',
        })
    );

    return processAttributes(attributes)
};
