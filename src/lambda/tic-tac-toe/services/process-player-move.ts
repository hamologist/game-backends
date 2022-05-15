import {
    GameStateResult
} from '../../shared/models/game-state';
import { Players, SessionStates, SquareStates } from '../../shared/types/game-state';

export function processPlayerMove(
    {x, y,}: { x: number, y: number },
    gameState: GameStateResult['state'],
): void {
    const squareState = (
        gameState.currentPlayer === Players.PlayerOne
            ? SquareStates.Cross
            : SquareStates.Circle
    );
    const board = gameState.board;
    board[y][x] = squareState;
    gameState.movesMade += 1;

    let win = false;
    // Check column
    let hits = 0;
    for (let i = 0; i < 3; i++) {
        if (board[i][x] === squareState) {
            hits += 1;
        }
    }
    if (hits === 3) {
        win = true;
    }

    // Check rows
    hits = 0;
    for (let i = 0; i < 3 && !win; i++) {
        if (board[y][i] === squareState) {
            hits += 1;
        }
    }
    if (hits === 3) {
        win = true;
    }

    // Check diagonally
    hits = 0;
    if (!win && ((y === 0 && x === 0) || (y === 1 && x === 1) || (y === 2 && x === 2))) {
        for (let i = 0; i < 3; i++) {
            if (board[i][i] === squareState) {
                hits += 1;
            }
        }
    }
    if (hits === 3) {
        win = true;
    }

    hits = 0;
    if (!win && ((y === 0 && x === 2) || (y === 1 && x === 1) || (y === 2 && x === 0))) {
        for (let i = 0; i < 3; i++) {
            if (board[i][2 - i] === squareState) {
                hits += 1;
            }
        }
    }
    if (hits === 3) {
        win = true;
    }

    if (win) {
        gameState.sessionState = SessionStates.Win;
    } else if (gameState.movesMade === 8) {
        gameState.sessionState = SessionStates.Draw;
    } else {
        gameState.currentPlayer = gameState.currentPlayer === Players.PlayerOne ? Players.PlayerTwo : Players.PlayerOne;
    }
}
