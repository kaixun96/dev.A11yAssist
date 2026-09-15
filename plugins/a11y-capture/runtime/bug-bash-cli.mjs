#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { readConfig } from './core.mjs';
import { createDiscovery, discoveryStatus, appendDiscoveryRows, observeDiscovery, reconcileDiscovery,
  cancelDiscovery, cleanupDiscovery, reviewDiscoverySource, recordDiscoveryGap,
  reportDiscovery, deliverDiscovery, advanceDiscovery, configureDiscoveryRows,
  appendDiscoveryTargets, excludeDiscoveryRows, validateDiscovery, runDiscovery,
  prepareDiscoverySource, startDiscoverySource, endDiscoverySource } from './bug-bash.mjs';

const [command, taskOrFile, inputFile] = process.argv.slice(2);
try {
  const config = await readConfig(undefined, { fullWorkflow: false });
  const input = inputFile ? JSON.parse(await readFile(inputFile, 'utf8')) : null;
  let result;
  if (command === 'create') result = await createDiscovery(config, JSON.parse(await readFile(taskOrFile, 'utf8')));
  else if (command === 'status') result = await discoveryStatus(config, taskOrFile);
  else if (command === 'validate') result = await validateDiscovery(config, taskOrFile);
  else if (command === 'advance') result = await advanceDiscovery(config, taskOrFile);
  else if (command === 'run') result = await runDiscovery(config, taskOrFile, input?.maxAdvances);
  else if (command === 'append') result = await appendDiscoveryRows(config, taskOrFile, input.rows, input.reason);
  else if (command === 'configure') result = await configureDiscoveryRows(config, taskOrFile, input.rows, input.reason);
  else if (command === 'inventory') result = await appendDiscoveryTargets(config, taskOrFile, input.inventory, input.reason);
  else if (command === 'exclude') result = await excludeDiscoveryRows(config, taskOrFile, input.exclusions);
  else if (command === 'observe') result = await observeDiscovery(config, taskOrFile, input.rowIds);
  else if (command === 'reconcile') result = await reconcileDiscovery(config, taskOrFile);
  else if (command === 'source') result = await reviewDiscoverySource(config, taskOrFile, input);
  else if (command === 'source-prepare') result = await prepareDiscoverySource(config, taskOrFile, input);
  else if (command === 'source-start') result = await startDiscoverySource(config, taskOrFile, input);
  else if (command === 'source-end') result = await endDiscoverySource(config, taskOrFile, input);
  else if (command === 'gap') result = await recordDiscoveryGap(config, taskOrFile, input.rowIds, input.reason);
  else if (command === 'cancel') result = await cancelDiscovery(config, taskOrFile, input.reason);
  else if (command === 'cleanup') result = await cleanupDiscovery(config, taskOrFile);
  else if (command === 'report') result = await reportDiscovery(config, taskOrFile);
  else if (command === 'deliver') result = await deliverDiscovery(config, taskOrFile);
  else throw new Error('Usage: bug-bash-cli.mjs create <plan.json> | status|validate|run|advance|reconcile|cleanup|report|deliver <taskId> | append|configure|inventory|exclude|observe|source|source-prepare|source-start|source-end|gap|cancel <taskId> <input.json>');
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
} catch (error) {
  process.stderr.write(JSON.stringify({ error: error.message, task: taskOrFile,
    recovery: 'Inspect status and reconcile the original pending operation; never create a replacement task to replay an unknown effect' }) + '\n');
  process.exitCode = 1;
}
