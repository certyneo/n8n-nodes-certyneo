import type { INodeProperties } from 'n8n-workflow';

export const templateDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['template'] } },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many templates',
				description: 'List the templates available on the account',
				routing: {
					request: {
						method: 'GET',
						url: '/templates',
					},
				},
			},
		],
		default: 'getAll',
	},
];
