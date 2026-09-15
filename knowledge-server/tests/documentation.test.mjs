import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';

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

test('both audits map all registered target IDs and the same incomplete-migration backlog', async () => {
  const entries = (await Promise.all(packageIds.map(id =>
    json(resolve(repository, `accessibility-kb/packages/${id}/package.json`))))).flatMap(pkg => pkg.entries);
  for (const name of audits) {
    const text = await read(name);
    const ids = [...text.matchAll(/^\| `((?:common|fluent|sharepoint)\.[a-z0-9.-]+)` \|/gm)].map(m => m[1]);
    assert.deepEqual(ids.sort(), entries.map(entry => entry.id).sort());
    const backlog = [...text.matchAll(/^\| (B\d+) ·/gm)].map(m => m[1]);
    assert.deepEqual(backlog, Array.from({ length: 16 }, (_, i) => `B${String(i + 1).padStart(2, '0')}`));
    assert.equal([...text.matchAll(/^\| N\d+ ·/gm)].length, 3);
  }
  assert.match(await read(audits[0]), /semantic migration incomplete/);
  assert.match(await read(audits[1]), /语义迁移未完成/);
});