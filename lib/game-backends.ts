import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { PlayersConstruct } from './players';
import { WebSocketApi } from './web-socket/api';
import { BuildContext } from './helpers/build-context';
import { TicTacToeConstruct } from './tic-tac-toe';

export interface GameBackendsProps {
  buildContext: BuildContext;
  apiDeployOptions?: apigateway.StageOptions;
}

export class GameBackends extends Construct {
  public readonly buildContext: BuildContext;
  public readonly webSocketApi: WebSocketApi;
  public readonly players: PlayersConstruct;
  public readonly ticTacToe: TicTacToeConstruct;

  constructor(scope: Construct, id: string, props: GameBackendsProps) {
    super(scope, id);

    this.buildContext = props.buildContext;

    this.players = new PlayersConstruct(this, 'PlayersStack', {
      buildContext: props.buildContext,
    });

    this.ticTacToe = new TicTacToeConstruct(this, 'TicTacToeStack', {
      buildContext: props.buildContext,
      playersContext: this.players.playersContext,
    });

    this.webSocketApi = new WebSocketApi(this, 'WebSocketApiStack', {
      buildContext: props.buildContext,
      playersContext: this.players.playersContext,
      ticTacToeContext: this.ticTacToe.ticTacToeContext,
    });

    this.players.buildWebSocket(this.webSocketApi.webSocketContext);
    this.ticTacToe.buildWebSocket(this.webSocketApi.webSocketContext);
  }
}
