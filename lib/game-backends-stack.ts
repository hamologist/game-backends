import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from "aws-cdk-lib/aws-route53-targets";
import { PlayersStack } from './players-stack';
import { TicTacToeStack } from './tic-tac-toe-stack';

export class GameBackendsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const rootDomain = ssm.StringParameter.valueFromLookup(this, '/game-backends/prod/root-domain');
    const certificate = certificatemanager.Certificate.fromCertificateArn(
        this,
        'Certificate',
        ssm.StringParameter.valueForStringParameter(this, '/game-backends/prod/certificate-arn'),
    );
    const zone = route53.HostedZone.fromLookup(this, 'BaseZone', {
      domainName: rootDomain,
    })
    const restApi = new apigateway.RestApi(this,  'Api', {
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
      domainName: {
        domainName: `game-backends.${rootDomain}`,
        certificate,
      },
    });
    new route53.ARecord(this, 'ApiDNS', {
      zone,
      recordName: 'game-backends',
      target: route53.RecordTarget.fromAlias(
          new route53Targets.ApiGateway(restApi),
      ),
    });

    const playersStack = new PlayersStack(this, 'PlayersStack', {
      restApi
    });

    new TicTacToeStack(this, 'TicTacToeStack', {
      restApi,
      playerTable: playersStack.playerTable,
    })

    new CfnOutput(this, 'ApiUrl', { value: restApi.url });
  }
}
