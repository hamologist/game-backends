import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export const errorAsStatusCodeIntegrationResponses: apigateway.IntegrationResponse[] = [
    {
        statusCode: '200',
        responseTemplates: {
            /* eslint-disable */
            'application/json': [
                '#set($inputRoot = $input.path(\'$\'))',
                '#if($input.path(\'$.status\').toString().equals("FAILED"))',
                '#set($error = $input.path(\'$.error\'))',
                '#set($Integer = 0)',
                '#set($context.responseOverride.status = $Integer.parseInt($error))',
                '{',
                '"message": "$input.path(\'$.cause\')"',
                '}',
                '#else',
                '$input.path(\'$.output\')',
                '#end',
            ].join('\n'),
            /* eslint-enable */
        },
    },
    {
        selectionPattern: '4\\d{2}',
        statusCode: '400',
        responseTemplates: {
            'application/json': `{
                "error": "Bad request!"
            }`,
        },
    },
    {
        selectionPattern: '5\\d{2}',
        statusCode: '500',
        responseTemplates: {
            'application/json': '"error": $input.path(\'$.error\')',
        },
    },
];
