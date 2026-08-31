/**
 * Checks `dist/` against what `package.json` promises n8n.
 *
 * WHY THIS SCRIPT EXISTS
 *
 * `n8n-node build` clears `dist/` before compiling. With `incremental: true`,
 * TypeScript trusts its state file to only re-emit changed sources — which
 * produces a `dist/` missing everything it believes is already compiled.
 * The build reports "successful", lint is green, and the tarball only
 * contains part of the nodes.
 *
 * Observed on 08/19: the 0.1.2 package built this way only contained the
 * trigger — neither the action node nor the credential. Nothing flagged it.
 *
 * `incremental` is now disabled, which removes the cause. This script is
 * the safety net: it checks the result instead of trusting the setting,
 * because it's the result that ships to npm.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const declared = [...(pkg.n8n?.credentials ?? []), ...(pkg.n8n?.nodes ?? [])];

if (declared.length === 0) {
	console.error('✗ package.json declares no node or credential — nothing to check.');
	process.exit(1);
}

const missing = declared.filter((rel) => !existsSync(join(root, rel)));

// The companion files n8n loads alongside each node: icons and codex
// metadata. If missing, the node shows up without an icon or out of
// category, with no error raised.
const companions = ['dist/nodes/Certyneo/certyneo.svg', 'dist/nodes/Certyneo/certyneo.dark.svg'];
for (const rel of pkg.n8n?.nodes ?? []) {
	companions.push(rel.replace(/\.js$/, '.json'));
}
const missingCompanions = companions.filter((rel) => !existsSync(join(root, rel)));

if (missing.length || missingCompanions.length) {
	console.error('\n✗ dist/ does not contain what package.json promises n8n.\n');
	for (const rel of missing) console.error(`  MISSING (declared in n8n.*): ${rel}`);
	for (const rel of missingCompanions) console.error(`  MISSING (companion): ${rel}`);
	console.error(
		'\n  Most likely cause: an incremental build on a cleared dist/.',
	);
	console.error('  Rebuild from scratch:  rm -rf dist .tsbuildinfo && npm run build\n');
	process.exit(1);
}

console.log(
	`✓ dist complete — ${declared.length} declared entr(y/ies), ${companions.length} companion file(s).`,
);
