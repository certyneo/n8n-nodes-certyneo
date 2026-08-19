import {
	NodeConnectionTypes,
	type ILoadOptionsFunctions,
	type INodePropertyOptions,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import { envelopeDescription } from './resources/envelope';
import { templateDescription } from './resources/template';

/**
 * Base URL: the API answers on `certyneo.com/api/v1`. The published OpenAPI
 * document advertises `api.certyneo.com/v1` as the intended contract, but
 * that host 301s to a 404 today because the proxy does not rewrite `/v1` →
 * `/api/v1`. Ship the host that answers; switch when the rewrite lands.
 */
export const CERTYNEO_BASE_URL = 'https://certyneo.com/api/v1';

export class Certyneo implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Certyneo',
		name: 'certyneo',
		icon: { light: 'file:certyneo.svg', dark: 'file:certyneo.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Send documents for eIDAS electronic signature with Certyneo',
		defaults: {
			name: 'Certyneo',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'certyneoApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: CERTYNEO_BASE_URL,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Envelope',
						value: 'envelope',
					},
					{
						name: 'Template',
						value: 'template',
					},
				],
				default: 'envelope',
			},
			...envelopeDescription,
			...templateDescription,
		],
	};

	methods = {
		loadOptions: {
			/**
			 * Template ids are opaque strings nobody remembers, so the create
			 * form offers the account's templates by name. A failure here must
			 * not break the form: an account with no templates, or a key
			 * lacking the read scope, simply gets an empty list.
			 */
			async getTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const response = (await this.helpers.httpRequestWithAuthentication.call(
					this,
					'certyneoApi',
					{
						method: 'GET',
						url: `${CERTYNEO_BASE_URL}/templates`,
						json: true,
					},
				)) as { data?: Array<{ id?: string; name?: string }> };

				return (response.data ?? [])
					.filter((template) => typeof template.id === 'string')
					.map((template) => ({
						name: template.name ?? (template.id as string),
						value: template.id as string,
					}));
			},
		},
	};
}
