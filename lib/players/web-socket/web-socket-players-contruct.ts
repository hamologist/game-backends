import { Construct } from 'constructs';
import { PlayersContext } from '../index';
import { PlayersValidate } from './validate';
import { WebSocketContext } from '../../web-socket/context';
import { PlayersGet } from './get';
import { PlayersCreate } from './create';

export interface WebSocketPlayersProps {
    playersContext: PlayersContext;
    webSocketContext: WebSocketContext;
}

export class WebSocketPlayers extends Construct {
    constructor(scope: Construct, id: string, props: WebSocketPlayersProps) {
        super(scope, id);

        new PlayersGet(this, 'PlayersGet', {
            webSocketContext: props.webSocketContext,
            playersContext: props.playersContext,
        });

        new PlayersCreate(this, 'PlayersCreate', {
            webSocketContext: props.webSocketContext,
            playersContext: props.playersContext,
        });

        new PlayersValidate(this, 'PlayersValidate', {
            webSocketContext: props.webSocketContext,
            playersContext: props.playersContext,
        });
    }
}
