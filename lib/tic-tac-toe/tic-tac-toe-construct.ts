import { Construct } from 'constructs';
import { BuildContext } from '../helpers/build-context';
import { NodejsHandlerGenerator } from '../helpers/nodejs-handler-generator';
import { PlayersContext } from '../players';
import { WebSocketContext } from '../web-socket/context';
import { TicTacToeContext } from './context';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as eventsources from 'aws-cdk-lib/aws-lambda-event-sources'
import { TicTacToeNewGame } from './rest-api/new-game';
import { TicTacToeGet } from './rest-api/get';
import { TicTacToeJoinGame } from './rest-api/join-game';
import { TicTacToeMakeMove } from './rest-api/make-move';
import { WebSocketTicTacToe } from './web-socket';

export interface TicTacToeConstructProps {
    buildContext: BuildContext;
    playersContext: PlayersContext;
}

export class TicTacToeConstruct extends Construct {
    public readonly ticTacToeContext: TicTacToeContext;
    private readonly playersContext: PlayersContext;

    constructor(scope: Construct, id: string, props: TicTacToeConstructProps) {
        super(scope, id);

        this.playersContext = props.playersContext;

        const gameStateTable = props.buildContext.tableGenerator.generate('GameStateTable', {
            tableName: `${props.buildContext.stageContext.stageToString()}-game-backends-game-state`,
            partitionKey: {
                type: dynamodb.AttributeType.STRING,
                name: 'id',
            },
            timeToLiveAttribute: 'expirationTime',
            stream: dynamodb.StreamViewType.KEYS_ONLY,
        });
        const gameStateTableRemoveEventSource = new eventsources.DynamoEventSource(gameStateTable, {
            startingPosition: lambda.StartingPosition.TRIM_HORIZON,
            filters: [
                lambda.FilterCriteria.filter({
                    eventName: lambda.FilterRule.isEqual('REMOVE'),
                }),
            ],
        });

        const gameStateNodejsHandlerGenerator = new NodejsHandlerGenerator(this, 'PlayersNodejsHandlerGenerator', {
            defaultLambdaGeneratorProps: {
                environment: {
                    GAME_STATE_TABLE_NAME: gameStateTable.tableName,
                    PLAYER_TABLE_NAME: props.playersContext.playerTable.tableName,
                },
            },
        });

        const ticTacToeResource = props.buildContext.restApi.root.addResource('tic-tac-toe');
        const newGameResource = ticTacToeResource.addResource('new-game');
        const byIdResource = ticTacToeResource.addResource('{id}');
        const joinGameResource = ticTacToeResource.addResource('join-game');
        const makeMoveResource = ticTacToeResource.addResource('make-move');

        this.ticTacToeContext = {
            gameStateTable,
            gameStateTableRemoveEventSource,
            gameStateNodejsHandlerGenerator,
            ticTacToeResource,
            newGameResource,
            byIdResource,
            joinGameResource,
            makeMoveResource,
        };

        new TicTacToeNewGame(this, 'TicTacToeNewGame', {
            ticTacToeContext: this.ticTacToeContext,
            buildContext: props.buildContext,
            playersContext: props.playersContext,
        });

        new TicTacToeGet(this, 'TicTacToeGet', {
            ticTacToeContext: this.ticTacToeContext,
            buildContext: props.buildContext,
            playersContext: props.playersContext,
        });

        new TicTacToeJoinGame(this, 'TicTacToeJoinGame', {
            ticTacToeContext: this.ticTacToeContext,
            buildContext: props.buildContext,
            playersContext: props.playersContext,
        });

        new TicTacToeMakeMove(this, 'TicTacToeMakeMove', {
            ticTacToeContext: this.ticTacToeContext,
            buildContext: props.buildContext,
            playersContext: props.playersContext,
        });
    }

    public buildWebSocket(webSocketContext: WebSocketContext) {
        new WebSocketTicTacToe(this, 'WebSocketTicTacToeStack', {
            playersContext: this.playersContext,
            ticTacToeContext: this.ticTacToeContext,
            webSocketContext,
        });
    }
}
