import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import { createKnowledgeHandler } from '../src/runtime/knowledge-mcp.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const repository = resolve(root, '..');
const read = name => readFile(resolve(root, name), 'utf8');
const json = async path => JSON.parse(await readFile(path, 'utf8'));
const prose = text => text.replace(/```[\s\S]*?```/g, '');
const designs = ['TECH-DESIGN.md', 'TECH-DESIGN.zh-CN.md'];
const audits = ['AGENTOW-MIGRATION-AUDIT.md', 'AGENTOW-MIGRATION-AUDIT.zh-CN.md'];
const commit = '7896845e51d75b0b9d632a2fd61876bc2f556ea5';
const prefix = `https://github.com/kaixun96/dev.AgentOW/blob/${commit}/`;
const packageIds = ['common', 'fluent', 'sharepoint'];

test('maintained Chinese docs separate punctuation-ending bold spans from following text', async () => {
  for (const name of [
    'TECH-DESIGN.zh-CN.md', 'AGENTOW-MIGRATION-AUDIT.zh-CN.md',
    '../docs/BUG-BASH-EXECUTION-DESIGN.zh-CN.md',
    '../docs/COMPOSABLE-PLUGIN-DESIGN.zh-CN.md'
  ]) {
    const text = prose(await read(name)).replace(/`[^`\n]*`/g, '');
    for (const match of text.matchAll(/\*\*((?:(?!\*\*)[^\n])+)\*\*([^\n]?)/gu)) {
      assert(!(/[：。]$/u.test(match[1]) && /^[\p{L}\p{N}]/u.test(match[2])),
        `${name}: add a space after the closing bold delimiter in ${match[0]}`);
    }
  }
});

test('bilingual designs retain parallel sections, valid examples and planned-only MAS boundaries', async () => {
  const [en, zh] = await Promise.all(designs.map(read));
  const sections = text => [...prose(text).matchAll(/^#{2,3} (\d+(?:\.\d+)?)\.? /gm)].map(m => m[1]);
  assert.deepEqual(sections(en), sections(zh));
  assert.equal(sections(en).filter(id => !id.includes('.')).length, 11);
  const examples = text => [...text.matchAll(/```json\r?\n([\s\S]*?)```/g)].map(m => JSON.parse(m[1]));
  const [enEntry, enSource, enPackage] = examples(en);
  const [zhEntry, zhSource, zhPackage] = examples(zh);
  assert.deepEqual(enEntry, zhEntry);
  assert.deepEqual(enPackage, zhPackage);
  assert.deepEqual({ ...enSource, note: '' }, { ...zhSource, note: '' });
  const schema = await json(resolve(repository, 'accessibility-kb/schemas/package.schema.json'));
  const validate = new Ajv({ allErrors: true, strict: true }).compile(schema);
  for (const text of [en, zh]) {
    const [entry, source, pkg] = examples(text);
    const common = await json(resolve(repository, 'accessibility-kb/packages/common/package.json'));
    common.entries.push(entry); common.sources.push(source);
    assert(validate(common), JSON.stringify(validate.errors));
    assert(validate(pkg), JSON.stringify(validate.errors));
    const proposedTools = [...text.matchAll(/`(a11y_kb_mas_[a-z_]+)`/g)].map(m => m[1]);
    assert.deepEqual(proposedTools, ['a11y_kb_mas_status', 'a11y_kb_mas_search', 'a11y_kb_mas_read', 'a11y_kb_mas_check_basis']);
  }
  assert.match(en, /## 11\. Planned:/);
  assert.match(zh, /## 11\. 待实现/);
  assert.match(en, /TECH-DESIGN\.zh-CN\.md/);
  assert.match(zh, /TECH-DESIGN\.md/);
});

test('bilingual discovery examples match tool schemas and execute against the pinned local KB', async () => {
  const texts = await Promise.all(designs.map(read));
  const examples = text => [...text.matchAll(/```json\r?\n([\s\S]*?)```/g)].map(match => JSON.parse(match[1])).filter(value => value.method === 'tools/call');
  const requests = examples(texts[0]);
  assert.deepEqual(requests, examples(texts[1]));
  assert.equal(requests.length, 5);
  const handler = createKnowledgeHandler(root, 'a11y-kb', { env: { A11Y_ASSIST_KB_ROOT: resolve(repository, 'accessibility-kb') } });
  const { tools } = await handler({ method: 'tools/list' });
  const validators = new Map(tools.map(tool => [tool.name, new Ajv({ strict: true }).compile(tool.inputSchema)]));
  for (const [index, request] of requests.entries()) {
    const validate = validators.get(request.params.name);
    assert(validate?.(request.params.arguments), JSON.stringify(validate?.errors));
    const response = await handler(request);
    assert(!response.isError, response.content[0].text);
    const result = JSON.parse(response.content[0].text);
    if (request.params.name.endsWith('_read')) assert(result.content.length > 0);
    else if (index === requests.length - 1) assert.equal(result.totalMatches, 0);
    else assert(result.totalMatches > 0);
  }
});

test('maintainer documentation links and reference definitions resolve without fetching upstream', async () => {
  for (const name of ['README.md', ...designs, ...audits]) {
    const text = prose(await read(name));
    const references = new Map([...text.matchAll(/^\[([^\]]+)\]:\s+(\S+)/gm)].map(m => [m[1], m[2]]));
    const targets = [...text.matchAll(/\]\(([^)\s]+)\)/g)].map(m => m[1]);
    for (const m of text.matchAll(/\[[^\]\n]+\]\[([^\]]+)\]/g)) {
      assert(references.has(m[1]), `${name}: undefined reference ${m[1]}`);
      targets.push(references.get(m[1]));
    }
    for (const target of targets) {
      if (/^https?:/.test(target)) continue;
      const [path, fragment] = target.split('#');
      const destination = path ? resolve(dirname(resolve(root, name)), path) : resolve(root, name);
      await access(destination);
      if (fragment) {
        const headings = [...prose(await readFile(destination, 'utf8')).matchAll(/^#{1,6}\s+(.+)$/gm)]
          .map(m => m[1].toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-'));
        assert(headings.includes(fragment), `${name}: missing heading ${target}`);
      }
    }
  }
});

test('audit source appendix exactly accounts for pinned candidate paths and hashes', async () => {
  const inventory = await json(resolve(repository, 'integrations/agentow/knowledge/source-inventory.json'));
  assert.equal(inventory.origin.commit, commit);
  assert.deepEqual(inventory.totals, { tracked: 171, snapshot: 106, externalReference: 8, outsideKnowledgeScope: 57 });
  const candidates = inventory.files.filter(file => file.document && file.accessibilityMarker &&
    !file.path.startsWith('copilot/skills/vercel-react-best-practices/'));
  assert.equal(candidates.length, 53);
  assert.equal(new Set(candidates.map(file => file.sha256)).size, 41);
  const byPath = new Map(candidates.map(file => [file.path, file]));
  for (const name of audits) {
    const text = await read(name);
    const definitions = new Map([...text.matchAll(/^\[([sd]\d+)\]:\s+(\S+)/gm)].map(m => [m[1], m[2]]));
    const paths = [...definitions.values()].map(url => {
      assert(url.startsWith(prefix), `${name}: source link not pinned`);
      return url.slice(prefix.length);
    });
    assert.deepEqual(paths.sort(), [...byPath.keys()].sort());
    let verifiedRows = 0;
    for (const line of text.split('\n')) {
      const hash = line.match(/\| `([a-f0-9]{12})` \|/);
      if (!hash) continue;
      for (const match of line.matchAll(/\]\[([sd]\d+)\]/g)) {
        const path = definitions.get(match[1]).slice(prefix.length);
        assert.equal(byPath.get(path).sha256.slice(0, 12), hash[1], `${name}: wrong hash for ${path}`);
      }
      verifiedRows++;
    }
    assert.equal(verifiedRows, 41);
  }
});

test('both audits map completed B01-B16 and registered N01-N03 to actual entry files', async () => {
  const packages = await Promise.all(packageIds.map(id =>
    json(resolve(repository, `accessibility-kb/packages/${id}/package.json`))));
  const entries = packages.flatMap(pkg => pkg.entries);
  const targets = new Map(packages.flatMap(pkg => pkg.entries.map(entry =>
    [entry.id, `../accessibility-kb/packages/${pkg.id}/${entry.path}`])));
  const newIds = ['rich-text-accessibility', 'drag-and-drop', 'localization-and-formatting']
    .map(name => `sharepoint.utilities.${name}`);
  const mappings = [];
  for (const name of audits) {
    const text = await read(name);
    const rows = [...text.matchAll(/^\| `((?:common|fluent|sharepoint)\.[a-z0-9.-]+)` \|(.+)$/gm)];
    const ids = rows.map(m => m[1]);
    assert.deepEqual(ids.sort(), entries.map(entry => entry.id).sort());
    const links = row => [...row.matchAll(/\]\(([^)\s]+)\)/g)].map(m => m[1]);
    for (const [, id, row] of rows) {
      assert(links(row).includes(targets.get(id)), `${name}: ${id} must link to its declared file`);
    }
    const completed = [...text.matchAll(/^\| (B\d+) ·(.+)$/gm)];
    assert.deepEqual(completed.map(m => m[1]), Array.from({ length: 16 }, (_, i) => `B${String(i + 1).padStart(2, '0')}`));
    assert.match(text, /## 3\. (?:Source-to-KB implemented coverage|源到 KB 的已实现覆盖)/);
    const mapped = [];
    for (const [, id, row] of completed) {
      assert.doesNotMatch(row, /partially covered|missing contract|部分覆盖|缺少具体契约/i);
      const destinations = [...row.matchAll(/`((?:common|fluent|sharepoint)\.[a-z0-9.-]+)`/g)]
        .map(match => {
          assert(targets.has(match[1]), `${name}: ${id} has unregistered target ${match[1]}`);
          return targets.get(match[1]);
        }).sort();
      assert(destinations.length > 0, `${name}: ${id} needs a registered target with a verified index link`);
      mapped.push([id, destinations]);
    }
    const added = [...text.matchAll(/^\| (N\d+) ·(.+)$/gm)];
    assert.deepEqual(added.map(m => m[1]), ['N01', 'N02', 'N03']);
    for (const [i, [, id, row]] of added.entries()) {
      assert(targets.has(newIds[i]), `${id} must be registered, not proposed`);
      assert(row.includes(newIds[i]), `${name}: ${id} needs its actual ID`);
      assert(links(row).includes(targets.get(newIds[i])), `${name}: ${id} needs its actual file link`);
    }
    mappings.push(mapped);
    assert.doesNotMatch(text, /semantic migration incomplete|语义迁移未完成/);
  }
  assert.deepEqual(mappings[0], mappings[1], 'Bilingual completion rows must map to the same implementations');
});