import { CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Players } from './players';
import { TicTacToe } from './tic-tac-toe';

export interface GameBackendsProps {
  scope: string;
  apiDeployOptions?: apigateway.StageOptions;
}

export class GameBackends extends Construct {
  public restApi: apigateway.RestApi;

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

    const playersStack = new Players(this, 'PlayersStack', {
      restApi: this.restApi,
      scope: props.scope,
    });

    new TicTacToe(this, 'TicTacToeStack', {
      restApi: this.restApi,
      playerTable: playersStack.playerTable,
      scope: props.scope,
    })

    new CfnOutput(this, 'ApiUrl', { value: this.restApi.url });
  }
}
