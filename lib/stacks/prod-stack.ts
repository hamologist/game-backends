import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from "aws-cdk-lib/aws-route53-targets";
import { GameBackends } from '../game-backends';
import { BuildContext } from '../helpers/build-context';
import { Stage, StageContext } from '../helpers/stage-context';
import { RestApiGenerator } from '../helpers/rest-api-generator';
import { TableGenerator } from '../helpers/table-generator';
import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha';

export class ProdStack extends Stack {
  public readonly buildContext: BuildContext;
  public readonly gameBackends: GameBackends;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const stageContext = new StageContext(this, 'DevStageContext', {
      stage: Stage.Prod,
    });
    const restApiGenerator = new RestApiGenerator(this, 'RestApiGenerator', {
      stageContext,
    });
    const tableGenerator = new TableGenerator(this, 'TableGenerator', {
      stageContext
    });

    this.buildContext = new BuildContext(this, 'BuildContext', {
      stageContext,
      restApi: restApiGenerator.generate(),
      tableGenerator
    });
    this.gameBackends = new GameBackends(this, 'GameBackends', {
      buildContext: this.buildContext
    });
    const rootDomain = ssm.StringParameter.valueFromLookup(this, '/game-backends/prod/root-domain');
    const certificate = certificatemanager.Certificate.fromCertificateArn(
        this,
        'Certificate',
        ssm.StringParameter.valueForStringParameter(this, '/game-backends/prod/certificate-arn'),
    );
    const zone = route53.HostedZone.fromLookup(this, 'BaseZone', {
      domainName: rootDomain,
    })
    this.buildContext.restApi.addDomainName('DomainName', {
      domainName: `game-backends.${rootDomain}`,
      certificate,
    });
    new route53.ARecord(this, 'ApiDNS', {
      zone,
      recordName: 'game-backends',
      target: route53.RecordTarget.fromAlias(
          new route53Targets.ApiGateway(this.buildContext.restApi),
      ),
    });

    const webSocketStage = new apigatewayv2.WebSocketStage(this, 'DevStage', {
        webSocketApi: this.gameBackends.webSocketApi.api,
        stageName: this.buildContext.stageContext.stageToString(),
        autoDeploy: true,
    });
    const webSocketDomainName = new apigatewayv2.DomainName(this, 'WebSocketDomainName', {
      certificate,
      domainName: `game-backends-ws.${rootDomain}`,
    });
    const webSocketApiMapping = new apigatewayv2.ApiMapping(this, 'WebSocketApiMapping', {
      api: this.gameBackends.webSocketApi.api,
      domainName: webSocketDomainName,
      stage: webSocketStage,
    });
    webSocketApiMapping.node.addDependency(webSocketDomainName);
    new route53.CnameRecord(this, 'WebSocketApiDNS', {
      recordName: `game-backends-ws.${rootDomain}`,
      zone,
      domainName: webSocketDomainName.regionalDomainName,
    });

    new CfnOutput(this, 'ApiUrl', { value: this.buildContext.restApi.url });
    new CfnOutput(this, 'WebSocketApiUrl', { value: webSocketStage.url });
  }
}
