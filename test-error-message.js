/**
 * Exerce le chemin d'erreur du declencheur avec le refus REEL de l'API.
 *
 * Le message « Bad request - please check your parameters » etait ce que n8n
 * affichait avant le correctif. On rejoue ici l'echec exact observe en
 * conditions reelles (400, corps `{ error: "URL rejected: ..." }`) et on
 * verifie ce que le noeud remonte desormais.
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

// Ce que n8n leve quand l'API repond 400 avec un corps JSON.
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
		console.log(`${label}: AUCUNE ERREUR LEVEE — le correctif ne mord pas`);
		return false;
	} catch (e) {
		console.log(`\n--- ${label} ---`);
		console.log('message     :', e.message);
		console.log('description :', (e.description || '').replace(/\s+/g, ' ').trim());
		const leaksRaw = /please check your parameters|status code 400/i.test(
			`${e.message} ${e.description ?? ''}`,
		);
		console.log('fuite du message brut :', leaksRaw ? 'OUI (mauvais)' : 'non');
		return !leaksRaw;
	}
}

(async () => {
	const a = await run('URL non joignable (garde anti-SSRF)', ssrfRefusal);
	const b = await run('Portee insuffisante', scopeRefusal);
	console.log('\nresultat :', a && b ? 'OK' : 'ECHEC');
	process.exit(a && b ? 0 : 1);
})();
