import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { isAbsolute } from 'node:path';
import { execFile } from 'node:child_process';

const resources = {
  ado: '499b84ac-1321-427f-aa17-267ca6975798',
  devcenter: 'https://devcenter.azure.com',
  arm: 'https://management.azure.com/'
};
const guid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const demand = (value, message) => { if (!value) throw new Error(message); };

export function validateHostAuthentication(provider) {
  demand(Boolean(provider.authorizationEnvironmentVariable) !== Boolean(provider.authentication),
    'Configure exactly one host authentication route');
  if (provider.authorizationEnvironmentVariable) {
    demand(typeof provider.authorizationEnvironmentVariable === 'string' &&
      /^[A-Z][A-Z0-9_]{0,100}$/.test(provider.authorizationEnvironmentVariable),
    'Expected authorization environment-variable NAME');
    return;
  }
  const auth = provider.authentication;
  demand(auth && typeof auth === 'object' && !Array.isArray(auth) &&
    Object.keys(auth).sort().join(',') === 'executable,executableSha256,kind,prefixArgs,tenantId' &&
    auth.kind === 'azure-cli' && typeof auth.executable === 'string' && isAbsolute(auth.executable) &&
    !/\.(cmd|bat)$/i.test(auth.executable) && /^[a-f0-9]{64}$/.test(auth.executableSha256 ?? '') &&
    guid.test(auth.tenantId ?? '') &&
    (JSON.stringify(auth.prefixArgs) === '[]' || JSON.stringify(auth.prefixArgs) === '["-I","-m","azure.cli"]'),
  'Azure CLI authentication requires pinned executable, tenant and fixed launcher arguments');
}

async function executableHash(path) {
  const digest = createHash('sha256');
  for await (const bytes of createReadStream(path)) digest.update(bytes);
  return digest.digest('hex');
}

function runCli(executable, args) {
  return new Promise((resolve, reject) => {
    execFile(executable, args, { shell: false, windowsHide: true, timeout: 30000,
      maxBuffer: 1024 * 1024, encoding: 'utf8' }, (error, stdout) => {
      // CLI errors/stdout can contain credentials. Never attach them to diagnostics.
      if (error) reject(new Error('Host Azure CLI could not obtain authorization; inspect host login/MFA/consent privately'));
      else resolve(stdout);
    });
  });
}

export async function hostAuthorization(provider, service = 'ado', options = {}) {
  validateHostAuthentication(provider);
  demand(Object.hasOwn(resources, service), 'Unsupported authentication audience');
  if (provider.authorizationEnvironmentVariable) {
    const authorization = (options.environment ?? process.env)[provider.authorizationEnvironmentVariable];
    demand(typeof authorization === 'string' && /^(Bearer|Basic) [^\s\r\n]+$/.test(authorization),
      'Configured authorization is unavailable; no external operation performed');
    demand(service === 'ado' || authorization.startsWith('Bearer '), 'This service requires Bearer authentication');
    return authorization;
  }
  const auth = provider.authentication;
  demand(await executableHash(auth.executable) === auth.executableSha256, 'Host authentication executable hash changed');
  const raw = await (options.runCli ?? runCli)(auth.executable, [...auth.prefixArgs,
    'account', 'get-access-token', '--tenant', auth.tenantId, '--resource', resources[service],
    '--output', 'json', '--only-show-errors']);
  demand(typeof raw === 'string' && Buffer.byteLength(raw) <= 1024 * 1024,
    'Invalid bounded host authentication response');
  let result;
  try { result = JSON.parse(raw); }
  catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    throw new Error('Host authentication response is not valid JSON');
  }
  demand(result && result.tokenType?.toLowerCase() === 'bearer' &&
    typeof result.accessToken === 'string' && /^[^\s\r\n]+$/.test(result.accessToken) &&
    result.tenant?.toLowerCase() === auth.tenantId.toLowerCase() &&
    Number.isFinite(Number(result.expires_on)) &&
    Number(result.expires_on) * 1000 > (options.now ?? Date.now()) + 60000,
  'Host authentication token is missing, expired, or belongs to another tenant');
  return `Bearer ${result.accessToken}`;
}
