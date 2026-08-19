import {
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IHookFunctions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
} from 'n8n-workflow';
import { CERTYNEO_BASE_URL } from './Certyneo.node';

/**
 * Certyneo has no per-event trigger endpoints: there is one generic webhook
 * subscription resource, and the caller declares which of the lifecycle
 * events it wants. That is why this node exposes every event rather than a
 * fixed handful — a new event on the platform becomes selectable here as
 * soon as it is documented, without a node release.
 *
 * The subscription is created when the workflow is activated and deleted
 * when it is deactivated, which is n8n's contract for webhook triggers.
 */
/**
 * Turns a failed subscription into something the person reading it can act on.
 *
 * Certyneo answers 400 with `{ error: "URL rejected: ..." }` when the webhook
 * URL is not reachable from the public internet — which is what happens on
 * every localhost instance, because the API refuses private addresses on
 * purpose. n8n on its own surfaces "Bad request - please check your
 * parameters": accurate about the status code, useless to the reader, and
 * misleading — it points at the parameters, which are fine.
 *
 * So the reason travels from the API response to the message. The
 * unreachable-URL case gets named explicitly with the way out, because it is
 * the one people hit first and the one they cannot diagnose from the outside.
 */
function subscriptionError(
	context: IHookFunctions,
	error: unknown,
	webhookUrl: string | undefined,
): NodeOperationError {
	const body = (error as { cause?: { error?: unknown }; response?: { body?: unknown } })
		?.cause?.error;
	const apiMessage =
		typeof body === 'string'
			? body
			: typeof (body as { error?: string })?.error === 'string'
				? (body as { error: string }).error
				: ((error as Error)?.message ?? '');

	if (/url rejected/i.test(apiMessage) || /url rejected/i.test(String(error))) {
		return new NodeOperationError(
			context.getNode(),
			'Certyneo cannot reach this n8n instance',
			{
				description:
					`Certyneo refused to send events to ${webhookUrl ?? "this workflow's webhook URL"} because ` +
					'that address is not ' +
					'reachable from the public internet. A localhost or private URL is rejected on ' +
					'purpose. Run this workflow on an instance with a public HTTPS address — n8n ' +
					'Cloud, a tunnel, or your own deployment — then activate it again.',
			},
		);
	}

	return new NodeOperationError(
		context.getNode(),
		'Certyneo refused the webhook subscription',
		{
			description:
				apiMessage ||
				'The Certyneo API rejected the subscription without giving a reason. Check that ' +
					'your API key carries the webhooks:write scope.',
		},
	);
}

export class CertyneoTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Certyneo Trigger',
		name: 'certyneoTrigger',
		icon: { light: 'file:certyneo.svg', dark: 'file:certyneo.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts the workflow when a Certyneo signature event happens',
		defaults: {
			name: 'Certyneo Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'certyneoApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: ['envelope.completed'],
				description: 'Signature events that start this workflow',
				options: [
					{
						name: 'Envelope Completed',
						value: 'envelope.completed',
						description: 'Every recipient has signed and the envelope is finalised',
					},
					{
						name: 'Envelope Created',
						value: 'envelope.created',
						description: 'An envelope was created and is still a draft',
					},
					{
						name: 'Envelope Declined',
						value: 'envelope.declined',
						description: 'A recipient refused to sign',
					},
					{
						name: 'Envelope Expired',
						value: 'envelope.expired',
						description: 'The deadline passed before everyone had signed',
					},
					{
						name: 'Envelope Resubmitted',
						value: 'envelope.resubmitted',
						description: 'A returned envelope was corrected and sent again',
					},
					{
						name: 'Envelope Returned to Sender',
						value: 'envelope.returned_to_sender',
						description: 'A recipient sent the envelope back for correction',
					},
					{
						name: 'Envelope Sent',
						value: 'envelope.sent',
						description: 'An envelope left draft and went to its recipients',
					},
					{
						name: 'Envelope Voided',
						value: 'envelope.voided',
						description: 'The sender voided an envelope already in flight',
					},
					{
						name: 'Recipient Approved',
						value: 'recipient.approved',
						description: 'An approver validated the envelope without signing',
					},
					{
						name: 'Recipient Signed',
						value: 'recipient.signed',
						description: 'A recipient completed their signature',
					},
					{
						name: 'Recipient Viewed',
						value: 'recipient.viewed',
						description: 'A recipient opened the envelope for the first time',
					},
				],
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (webhookData.webhookId === undefined) return false;

				const webhookUrl = this.getNodeWebhookUrl('default');
				const response = (await this.helpers.httpRequestWithAuthentication.call(
					this,
					'certyneoApi',
					{
						method: 'GET',
						url: `${CERTYNEO_BASE_URL}/webhooks`,
						json: true,
					},
				)) as { data?: Array<{ id?: string; url?: string }> };

				// Match on the URL, not only on the stored id: a subscription
				// deleted on Certyneo's side while the workflow stayed active
				// would otherwise never be recreated, and the trigger would go
				// quiet with nothing in n8n saying so.
				const existing = (response.data ?? []).find(
					(hook) => hook.id === webhookData.webhookId && hook.url === webhookUrl,
				);
				if (existing) return true;

				delete webhookData.webhookId;
				delete webhookData.secret;
				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const events = this.getNodeParameter('events') as string[];

				let response: { id?: string; secret?: string };
				try {
					response = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'certyneoApi',
						{
							method: 'POST',
							url: `${CERTYNEO_BASE_URL}/webhooks`,
							body: { url: webhookUrl, events },
							json: true,
						},
					)) as { id?: string; secret?: string };
				} catch (error) {
					// Rethrown, never swallowed: a subscription that silently fails to
					// register leaves a workflow that looks active and never fires.
					throw subscriptionError(this, error, webhookUrl);
				}

				if (response.id === undefined) return false;

				const webhookData = this.getWorkflowStaticData('node');
				webhookData.webhookId = response.id;
				// Returned once, at creation. Kept so the workflow can verify the
				// X-Certyneo-Signature header of incoming deliveries.
				webhookData.secret = response.secret;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (webhookData.webhookId === undefined) return true;

				try {
					await this.helpers.httpRequestWithAuthentication.call(this, 'certyneoApi', {
						method: 'DELETE',
						url: `${CERTYNEO_BASE_URL}/webhooks/${webhookData.webhookId}`,
						json: true,
					});
				} catch (error) {
					// A subscription already gone on Certyneo's side must not block
					// deactivating the workflow, so this does not rethrow — but it
					// must not vanish either: a delete failing for any other reason
					// (revoked key, outage) leaves a live subscription pointing at a
					// URL that no longer answers, and only this line says so.
					this.logger.warn(
						`Certyneo Trigger: could not delete webhook subscription ${webhookData.webhookId}. It may still be active on Certyneo. ${(error as Error).message}`,
					);
					return false;
				} finally {
					delete webhookData.webhookId;
					delete webhookData.secret;
				}

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData() as IDataObject;
		const headers = this.getHeaderData() as IDataObject;

		// The signature travels with the payload rather than being checked
		// here: verifying an HMAC means hashing the exact bytes Certyneo sent,
		// and by this point the body has been parsed. A re-serialised body can
		// differ from the original, so a check here would reject valid events —
		// worse than no check. Verify in a Code node against the raw request if
		// your threat model needs it; the secret is in the node's static data.
		return {
			workflowData: [
				this.helpers.returnJsonArray([
					{
						event: body.event,
						data: body.data,
						timestamp: body.timestamp,
						signature: headers['x-certyneo-signature'],
					},
				]),
			],
		};
	}
}
