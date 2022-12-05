import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { PlayersConstruct } from './players';
import { TicTacToe } from './tic-tac-toe';
import { WebSocketApi } from './web-socket/api';
import { BuildContext } from './helpers/build-context';

export interface GameBackendsProps {
  buildContext: BuildContext;
  apiDeployOptions?: apigateway.StageOptions;
}

export class GameBackends extends Construct {
  public readonly buildContext: BuildContext;
  public readonly webSocketApi: WebSocketApi;
  public readonly players: PlayersConstruct;
  public readonly ticTacToe: TicTacToe;

  constructor(scope: Construct, id: string, props: GameBackendsProps) {
    super(scope, id);

    this.buildContext = props.buildContext;

    this.players = new PlayersConstruct(this, 'PlayersStack', {
      buildContext: props.buildContext,
    });

    this.ticTacToe = new TicTacToe(this, 'TicTacToeStack', {
      buildContext: props.buildContext,
      playersContext: this.players.playersContext,
    });

    this.webSocketApi = new WebSocketApi(this, 'WebSocketApiStack', {
      buildContext: props.buildContext,
      playersContext: this.players.playersContext,
      ticTacToe: this.ticTacToe,
    });

    this.players.buildWebSocket(this.webSocketApi.webSocketContext);
    this.ticTacToe.buildWebSocket(this.webSocketApi.webSocketContext);
  }
}
