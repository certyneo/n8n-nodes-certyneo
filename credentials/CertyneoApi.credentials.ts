import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

/**
 * Certyneo authenticates every REST call with a bearer API key the user
 * creates from their dashboard (Settings → REST API). Keys are scoped, so a
 * key limited to `envelopes:read` will authenticate fine here and still fail
 * on a write — which is the intended behaviour, not a credential problem.
 *
 * Base URL note: the API answers on `certyneo.com/api/v1`. The OpenAPI
 * document advertises `api.certyneo.com/v1` as the intended public contract,
 * but that host currently 301s to a 404 because the proxy does not rewrite
 * `/v1` → `/api/v1`. Point this at the host that answers today.
 */
export class CertyneoApi implements ICredentialType {
	name = 'certyneoApi';

	displayName = 'Certyneo API';

	icon: Icon = {
		light: 'file:../nodes/Certyneo/certyneo.svg',
		dark: 'file:../nodes/Certyneo/certyneo.dark.svg',
	};

	documentationUrl =
		'https://github.com/certyneo/n8n-nodes-certyneo?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'Certyneo API key, starting with sk_live_ or sk_test_. Create one in Certyneo under Settings → REST API, with the envelopes and webhooks scopes. It is shown only once.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
				// Lets the Certyneo dashboard show this connection as active on
				// its integrations page. n8n's outbound User-Agent is axios', so
				// attribution cannot be inferred from it.
				'X-Certyneo-Source': 'n8n',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://certyneo.com/api/v1',
			url: '/account/me',
		},
	};
}
