import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Players } from './players';
import { TicTacToe } from './tic-tac-toe';
import { WebSocketApi } from './web-socket-api';
import { BuildContext } from './helpers/build-context';

export interface GameBackendsProps {
  buildContext: BuildContext;
  apiDeployOptions?: apigateway.StageOptions;
}

export class GameBackends extends Construct {
  public readonly buildContext: BuildContext;
  public readonly webSocketApi: WebSocketApi;
  public readonly players: Players;
  public readonly ticTacToe: TicTacToe;

  constructor(scope: Construct, id: string, props: GameBackendsProps) {
    super(scope, id);

    this.buildContext = props.buildContext;
    this.players = new Players(this, 'PlayersStack', {
      buildContext: props.buildContext,
    });

    this.ticTacToe = new TicTacToe(this, 'TicTacToeStack', {
      buildContext: props.buildContext,
      playerTable: this.players.playerTable,
    });

    this.webSocketApi = new WebSocketApi(this, 'WebSocketApiStack', {
      buildContext: props.buildContext,
      players: this.players,
      ticTacToe: this.ticTacToe,
    });
  }
}
