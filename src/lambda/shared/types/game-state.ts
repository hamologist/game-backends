export enum Players {
    PlayerOne,
    PlayerTwo,
}

export enum SessionStates {
    Playing,
    Win,
    Draw,
}

export enum SquareStates {
    Empty,
    Circle,
    Cross,
}

export type BoardRow = [SquareStates, SquareStates, SquareStates];
export type Board = [BoardRow, BoardRow, BoardRow];
