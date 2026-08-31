/**
 * Exercises the trigger's error path with the REAL API refusal.
 *
 * The message "Bad request - please check your parameters" was what n8n
 * used to show before the fix. Here we replay the exact failure observed
 * in real conditions (400, body `{ error: "URL rejected: ..." }`) and
 * check what the node now surfaces.
 */
const { CertyneoTrigger } = require('./dist/nodes/Certyneo/CertyneoTrigger.node.js');

const node = { name: 'Certyneo Trigger', type: 'n8n-nodes-certyneo.certyneoTrigger' };

function contextThrowing(error) {
	return {
		getNodeWebhookUrl: () => 'http://localhost:5678/webhook/abc',
		getNodeParameter: () => ['envelope.completed'],
		getWorkflowStaticData: () => ({}),
		getNode: () => node,
		helpers: {
			httpRequestWithAuthentication: {
				call: async () => {
					throw error;
				},
			},
		},
	};
}

// What n8n throws when the API responds 400 with a JSON body.
const ssrfRefusal = Object.assign(
	new Error('Request failed with status code 400'),
	{ cause: { error: { error: 'URL rejected: private or loopback address' } } },
);

const scopeRefusal = Object.assign(
	new Error('Request failed with status code 403'),
	{ cause: { error: { error: 'Insufficient scope: webhooks:write required' } } },
);

async function run(label, error) {
	const trigger = new CertyneoTrigger();
	const ctx = contextThrowing(error);
	try {
		await trigger.webhookMethods.default.create.call(ctx);
		console.log(`${label}: NO ERROR THROWN — the fix isn't biting`);
		return false;
	} catch (e) {
		console.log(`\n--- ${label} ---`);
		console.log('message     :', e.message);
		console.log('description :', (e.description || '').replace(/\s+/g, ' ').trim());
		const leaksRaw = /please check your parameters|status code 400/i.test(
			`${e.message} ${e.description ?? ''}`,
		);
		console.log('raw message leaked:', leaksRaw ? 'YES (bad)' : 'no');
		return !leaksRaw;
	}
}

(async () => {
	const a = await run('Unreachable URL (anti-SSRF guard)', ssrfRefusal);
	const b = await run('Insufficient scope', scopeRefusal);
	console.log('\nresult:', a && b ? 'OK' : 'FAILED');
	process.exit(a && b ? 0 : 1);
})();
