import type { INodeProperties } from 'n8n-workflow';

const showOnlyForEnvelopeGetAll = {
	operation: ['getAll'],
	resource: ['envelope'],
};

export const envelopeGetAllDescription: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: { show: showOnlyForEnvelopeGetAll },
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: { minValue: 1 },
		displayOptions: { show: { ...showOnlyForEnvelopeGetAll, returnAll: [false] } },
		description: 'Max number of results to return',
		routing: { send: { type: 'query', property: 'limit' } },
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: showOnlyForEnvelopeGetAll },
		options: [
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'SENT',
				description: 'Only return envelopes in this state',
				options: [
					{ name: 'Completed', value: 'COMPLETED' },
					{ name: 'Declined', value: 'DECLINED' },
					{ name: 'Draft', value: 'DRAFT' },
					{ name: 'Expired', value: 'EXPIRED' },
					{ name: 'Sent', value: 'SENT' },
					{ name: 'Voided', value: 'VOIDED' },
				],
				routing: { send: { type: 'query', property: 'status' } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Page of results to return',
				routing: { send: { type: 'query', property: 'page' } },
			},
		],
	},
];
