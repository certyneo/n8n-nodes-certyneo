import type { INodeProperties } from 'n8n-workflow';

/** Every per-envelope operation needs the same id, hence one shared field. */
export const envelopeGetDescription: INodeProperties[] = [
	{
		displayName: 'Envelope ID',
		name: 'envelopeId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['envelope'],
				operation: ['get', 'send', 'downloadSigned', 'getAuditTrail'],
			},
		},
		description: 'ID of the envelope to act on',
	},
];
