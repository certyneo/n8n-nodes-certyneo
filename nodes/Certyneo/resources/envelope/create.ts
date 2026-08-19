import type { INodeProperties } from 'n8n-workflow';

const showOnlyForEnvelopeCreate = {
	operation: ['create'],
	resource: ['envelope'],
};

/**
 * `templateId` and `documentIds` are mutually exclusive server-side: a
 * template already carries its own documents and field layout, so sending
 * both is rejected. The Source selector below makes that exclusivity visible
 * in the UI instead of letting the user discover it through a 400.
 *
 * Every `options` array is alphabetised by display name — n8n's lint rules
 * `node-param-options-type-unsorted-items` and
 * `node-param-collection-type-unsorted-items` enforce it, so the order is
 * not the one that would read most naturally.
 */
export const envelopeCreateDescription: INodeProperties[] = [
	{
		displayName: 'Subject',
		name: 'subject',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showOnlyForEnvelopeCreate },
		description: 'Subject line the signers see in their invitation email',
		routing: { send: { type: 'body', property: 'subject' } },
	},
	{
		displayName: 'Source',
		name: 'source',
		type: 'options',
		noDataExpression: true,
		default: 'template',
		displayOptions: { show: showOnlyForEnvelopeCreate },
		description:
			'Whether the envelope reuses a saved Certyneo template or is composed from documents you already uploaded',
		options: [
			{ name: 'Documents', value: 'documents' },
			{ name: 'Template', value: 'template' },
		],
	},
	{
		displayName: 'Template Name or ID',
		name: 'templateId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getTemplates' },
		default: '',
		required: true,
		displayOptions: {
			show: { ...showOnlyForEnvelopeCreate, source: ['template'] },
		},
		description:
			'Template to build the envelope from. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		routing: { send: { type: 'body', property: 'templateId' } },
	},
	{
		displayName: 'Document IDs',
		name: 'documentIds',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: { ...showOnlyForEnvelopeCreate, source: ['documents'] },
		},
		description:
			'Comma-separated IDs of documents already uploaded to Certyneo. Upload them first with the HTTP Request node against POST /documents.',
		routing: {
			send: {
				type: 'body',
				property: 'documentIds',
				value: '={{ $value.split(",").map(id => id.trim()).filter(id => id) }}',
			},
		},
	},
	{
		displayName: 'Recipients',
		name: 'recipients',
		placeholder: 'Add Recipient',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, sortable: true },
		default: {},
		required: true,
		displayOptions: { show: showOnlyForEnvelopeCreate },
		description: 'People who receive the envelope, in signing order',
		options: [
			{
				name: 'recipient',
				displayName: 'Recipient',
				values: [
					{
						displayName: 'Email',
						name: 'email',
						type: 'string',
						placeholder: 'name@email.com',
						default: '',
						required: true,
						description: 'Email address the invitation is sent to',
					},
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						description: 'Full name of the recipient',
					},
					{
						displayName: 'Role',
						name: 'role',
						type: 'options',
						default: 'SIGNER',
						description: 'What this recipient is expected to do',
						options: [
							{ name: 'Approver', value: 'APPROVER' },
							{ name: 'Signer', value: 'SIGNER' },
							{ name: 'Viewer', value: 'VIEWER' },
						],
					},
				],
			},
		],
		routing: {
			send: {
				type: 'body',
				property: 'recipients',
				value: '={{ $value.recipient }}',
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: showOnlyForEnvelopeCreate },
		options: [
			{
				displayName: 'Expires At',
				name: 'expiresAt',
				type: 'dateTime',
				default: '',
				description: 'Moment after which the envelope can no longer be signed',
				routing: { send: { type: 'body', property: 'expiresAt' } },
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
				description: 'Note included in the invitation email',
				routing: { send: { type: 'body', property: 'message' } },
			},
			{
				displayName: 'Redirect URL',
				name: 'redirectUrl',
				type: 'string',
				default: '',
				placeholder: 'https://example.com/thank-you',
				description: 'Where the signer is sent once signing completes. Must be https.',
				routing: { send: { type: 'body', property: 'redirectUrl' } },
			},
			{
				displayName: 'Require SMS OTP',
				name: 'requireSmsOtp',
				type: 'boolean',
				default: false,
				description: 'Whether each signer must confirm a code sent by SMS before signing',
				routing: { send: { type: 'body', property: 'requireSmsOtp' } },
			},
			{
				displayName: 'Signer Language',
				name: 'locale',
				type: 'string',
				default: '',
				placeholder: 'en',
				description:
					'Language of the signing page and emails, as a supported locale code. Defaults to the sender language.',
				routing: { send: { type: 'body', property: 'locale' } },
			},
		],
	},
];
