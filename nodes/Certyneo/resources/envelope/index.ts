import type { INodeProperties } from 'n8n-workflow';
import { envelopeCreateDescription } from './create';
import { envelopeGetDescription } from './get';
import { envelopeGetAllDescription } from './getAll';

const showOnlyForEnvelopes = {
	resource: ['envelope'],
};

// Operations are listed alphabetically by display name — the n8n lint rule
// `node-param-options-type-unsorted-items` enforces it, so the reading order
// here is not the lifecycle order (create → send → get).
export const envelopeDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForEnvelopes,
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create an envelope',
				description: 'Create an envelope from a template or from uploaded documents',
				routing: {
					request: {
						method: 'POST',
						url: '/envelopes',
					},
				},
			},
			{
				name: 'Download Signed Document',
				value: 'downloadSigned',
				action: 'Download the signed document of an envelope',
				description: 'Fetch the signed PDF of a completed envelope',
				routing: {
					request: {
						method: 'GET',
						url: '=/envelopes/{{$parameter.envelopeId}}/signed-document',
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get an envelope',
				description: 'Retrieve one envelope with its status and recipients',
				routing: {
					request: {
						method: 'GET',
						url: '=/envelopes/{{$parameter.envelopeId}}',
					},
				},
			},
			{
				name: 'Get Audit Trail',
				value: 'getAuditTrail',
				action: 'Get the audit trail of an envelope',
				description: 'Fetch the evidence record of an envelope',
				routing: {
					request: {
						method: 'GET',
						url: '=/envelopes/{{$parameter.envelopeId}}/audit-trail',
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many envelopes',
				description: 'List envelopes, most recent first',
				routing: {
					request: {
						method: 'GET',
						url: '/envelopes',
					},
				},
			},
			{
				name: 'Send',
				value: 'send',
				action: 'Send an envelope',
				description: 'Take an envelope out of draft and email its signers',
				routing: {
					request: {
						method: 'POST',
						url: '=/envelopes/{{$parameter.envelopeId}}/send',
					},
				},
			},
		],
		default: 'create',
	},
	...envelopeCreateDescription,
	...envelopeGetDescription,
	...envelopeGetAllDescription,
];
