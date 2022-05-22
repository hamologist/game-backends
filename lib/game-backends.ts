import { CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Players } from './players';
import { TicTacToe } from './tic-tac-toe';
import { WebSocketApi } from './web-socket-api';

export interface GameBackendsProps {
  scope: string;
  apiDeployOptions?: apigateway.StageOptions;
}

export class GameBackends extends Construct {
  public readonly restApi: apigateway.RestApi;
  public readonly webSocketApi: WebSocketApi;
  public readonly players: Players;
  public readonly ticTacToe: TicTacToe;

  constructor(scope: Construct, id: string, props: GameBackendsProps) {
    super(scope, id);

    this.restApi = new apigateway.RestApi(this,  'Api', {
      defaultCorsPreflightOptions: {
        allowMethods: [
          'OPTIONS',
          'POST'
        ],
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token'
        ],
        allowOrigins: ['*']
      },
      deployOptions: props?.apiDeployOptions,
    });

    this.players = new Players(this, 'PlayersStack', {
      restApi: this.restApi,
      scope: props.scope,
    });

    this.ticTacToe = new TicTacToe(this, 'TicTacToeStack', {
      restApi: this.restApi,
      playerTable: this.players.playerTable,
      scope: props.scope,
    });

    this.webSocketApi = new WebSocketApi(this, 'WebSocketApiStack', {
      scope: props.scope,
      playerTable: this.players.playerTable,
    });

    new CfnOutput(this, 'ApiUrl', { value: this.restApi.url });
  }
}
