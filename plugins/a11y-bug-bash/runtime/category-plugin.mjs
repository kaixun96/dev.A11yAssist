import { readFile, realpath } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { discoveryHash, requireDiscovery as demand } from './discovery-contract.mjs';

export async function loadCategoryPlugin(config, required = true) {
  if (!required) return null;
  const root = config.pluginRoots?.testCategories;
  demand(typeof root === 'string' && isAbsolute(root),
    'Install a11y-test-categories and configure pluginRoots.testCategories to its absolute plugin root; no bundled fallback');
  const directory = await realpath(root);
  const manifest = JSON.parse(await readFile(join(directory, 'plugin.json'), 'utf8'));
  demand(manifest.name === 'a11y-test-categories' && /^\d+\.\d+\.\d+$/.test(manifest.version),
    'Expected the installed a11y-test-categories plugin manifest');
  const toolPath = join(directory, 'tools', 'matrix.mjs');
  const toolHash = discoveryHash((await readFile(toolPath, 'utf8')).replaceAll('\r\n', '\n'));
  const api = await import(`${pathToFileURL(toolPath).href}?sha256=${toolHash}`);
  demand(api.apiVersion === 1 && ['loadProcedures', 'createMatrix', 'checkMatrix'].every(name => typeof api[name] === 'function'),
    'Incompatible a11y-test-categories API; retain the task original plugin version');
  const procedures = await api.loadProcedures();
  return { ...api, procedures,
    binding: discoveryHash({ version: manifest.version, toolHash, procedures }) };
}
