/**
 * Confronte `dist/` à ce que `package.json` promet à n8n.
 *
 * POURQUOI CE SCRIPT EXISTE
 *
 * `n8n-node build` vide `dist/` avant de compiler. Avec `incremental: true`,
 * TypeScript se fie à son fichier d'état pour ne réémettre que les sources
 * modifiées — et produit donc un `dist/` amputé de tout ce qu'il croit déjà
 * compilé. Le build sort « successful », le lint est vert, et le tarball ne
 * contient qu'une partie des nœuds.
 *
 * Constaté le 19/08 : le paquet 0.1.2 construit ainsi ne contenait que le
 * déclencheur — ni le nœud d'action, ni l'identifiant. Rien ne le signalait.
 *
 * `incremental` est désormais désactivé, ce qui supprime la cause. Ce script
 * est le filet : il vérifie le résultat plutôt que de faire confiance au
 * réglage, parce que c'est le résultat qui part sur npm.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const declared = [...(pkg.n8n?.credentials ?? []), ...(pkg.n8n?.nodes ?? [])];

if (declared.length === 0) {
	console.error('✗ package.json ne déclare aucun nœud ni identifiant — rien à vérifier.');
	process.exit(1);
}

const missing = declared.filter((rel) => !existsSync(join(root, rel)));

// Les fichiers annexes que n8n charge à côté de chaque nœud : icônes et
// métadonnées codex. Absents, le nœud s'affiche sans icône ou hors catégorie,
// sans qu'aucune erreur ne soit levée.
const companions = ['dist/nodes/Certyneo/certyneo.svg', 'dist/nodes/Certyneo/certyneo.dark.svg'];
for (const rel of pkg.n8n?.nodes ?? []) {
	companions.push(rel.replace(/\.js$/, '.json'));
}
const missingCompanions = companions.filter((rel) => !existsSync(join(root, rel)));

if (missing.length || missingCompanions.length) {
	console.error('\n✗ dist/ ne contient pas ce que package.json promet à n8n.\n');
	for (const rel of missing) console.error(`  MANQUE (déclaré dans n8n.*) : ${rel}`);
	for (const rel of missingCompanions) console.error(`  MANQUE (annexe) : ${rel}`);
	console.error(
		'\n  Cause la plus probable : une compilation incrémentielle sur un dist/ vidé.',
	);
	console.error('  Reconstruire depuis zéro :  rm -rf dist .tsbuildinfo && npm run build\n');
	process.exit(1);
}

console.log(
	`✓ dist complet — ${declared.length} entrée(s) déclarée(s), ${companions.length} fichier(s) annexe(s).`,
);
