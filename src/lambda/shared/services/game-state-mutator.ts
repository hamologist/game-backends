import {
    addPlayer,
    createGame as _createGame,
    GameStateResult,
    getGame,
    updateState
} from '../models/game-state';
import { playerValidator } from './player-validator';
import { processPlayerMove } from '../../tic-tac-toe/src/services/process-player-move';
import { Players, SessionStates, SquareStates } from '../types/game-state';

export const createGame = async (
    playerId: string,
    playerSecret: string,
): Promise<GameStateResult> => {
    if (!await playerValidator(playerId, playerSecret)) {
        throw new Error('Invalid player provided');
    }

    return _createGame(playerId);
};

export const joinGame = async (
    gameStateId: string,
    playerId: string,
    playerSecret: string,
): Promise<GameStateResult> => {
    if (await playerValidator(playerId, playerSecret) === null) {
        throw new Error('Player doesn\'t exist');
    }

    if (await getGame(gameStateId) === null) {
        throw new Error('Game doesn\'t exist');
    }

    return addPlayer(gameStateId, playerId);
};

export const makeMove = async (
    gameStateId: string,
    playerId: string,
    playerSecret: string,
    { x, y }: { x: number, y: number },
): Promise<GameStateResult> => {
    if (!await playerValidator(playerId, playerSecret)) {
        throw new Error('Invalid player provided');
    }

    const gameState = await getGame(gameStateId);
    if (gameState === null) {
        throw new Error('Game doesn\'t exist');
    }

    if (playerId !== gameState.playerOne && playerId !== gameState.playerTwo) {
        throw new Error('Provided player is not playing this game');
    }

    const currentPlayer = gameState.state.currentPlayer;
    if (currentPlayer === Players.PlayerOne && playerId !== gameState.playerOne) {
        throw new Error('It\'s not player twos turn yet');
    } else if (currentPlayer === Players.PlayerTwo && playerId !== gameState.playerTwo) {
        throw new Error('It\'s not player ones turn yet');
    }

    if (gameState.state.sessionState !== SessionStates.Playing) {
        throw new Error('Game is no longer active');
    }

    const board = gameState.state.board;
    if (board[y][x] !== SquareStates.Empty) {
        throw new Error('Invalid move: square is already occupied');
    }

    processPlayerMove({ x, y }, gameState.state);
    return updateState(gameStateId, gameState.state);
};
