import { Construct } from 'constructs';
import { TicTacToeContext } from '../index';
import { TicTacToeGet } from './get';
import { TicTacToeJoinGame } from './join-game';
import { TicTacToeMakeMove } from './make-move';
import { TicTacToeNewGame } from './new-game';
import { WebSocketContext } from '../../web-socket/context';
import { PlayersContext } from '../../players';
import { TicTacToeObserveGame } from './observe-game';

export interface WebSocketPlayersProps {
    ticTacToeContext: TicTacToeContext;
    playersContext: PlayersContext;
    webSocketContext: WebSocketContext;
}

export class WebSocketTicTacToe extends Construct {
    constructor(scope: Construct, id: string, props: WebSocketPlayersProps) {
        super(scope, id);

        new TicTacToeGet(this, 'TicTacToeGet', {
            ticTacToeContext: props.ticTacToeContext,
            webSocketContext: props.webSocketContext,
            playersContext: props.playersContext,
        });

        new TicTacToeJoinGame(this, 'TicTacToeJoinGame', {
            ticTacToeContext: props.ticTacToeContext,
            webSocketContext: props.webSocketContext,
            playersContext: props.playersContext,
        });

        new TicTacToeObserveGame(this, 'TicTacToeObserveGame', {
            ticTacToeContext: props.ticTacToeContext,
            webSocketContext: props.webSocketContext,
            playersContext: props.playersContext,
        });

        new TicTacToeMakeMove(this, 'TicTacToeMakeMove', {
            ticTacToeContext: props.ticTacToeContext,
            webSocketContext: props.webSocketContext,
            playersContext: props.playersContext,
        });

        new TicTacToeNewGame(this, 'TicTacToeNewGame', {
            ticTacToeContext: props.ticTacToeContext,
            webSocketContext: props.webSocketContext,
            playersContext: props.playersContext,
        });
    }
}
