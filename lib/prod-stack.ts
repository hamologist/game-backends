import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from "aws-cdk-lib/aws-route53-targets";
import { GameBackends } from './game-backends';

export class ProdStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const gameBackends = new GameBackends(this, 'GameBackends');
    const rootDomain = ssm.StringParameter.valueFromLookup(this, '/game-backends/prod/root-domain');
    const certificate = certificatemanager.Certificate.fromCertificateArn(
        this,
        'Certificate',
        ssm.StringParameter.valueForStringParameter(this, '/game-backends/prod/certificate-arn'),
    );
    const zone = route53.HostedZone.fromLookup(this, 'BaseZone', {
      domainName: rootDomain,
    })
    gameBackends.restApi.addDomainName('DomainName', {
      domainName: `game-backends.${rootDomain}`,
      certificate,
    });
    new route53.ARecord(this, 'ApiDNS', {
      zone,
      recordName: 'game-backends',
      target: route53.RecordTarget.fromAlias(
          new route53Targets.ApiGateway(gameBackends.restApi),
      ),
    });
  }
}
