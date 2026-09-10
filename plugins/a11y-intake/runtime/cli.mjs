#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createRun, doctor, readConfig, loadRun, publicRun, executeStage, reconcile,
  resourceStatus, assessProgress, VERSION } from './core.mjs';

const [command, ...args] = process.argv.slice(2);
try {
  if (command === 'version') console.log(VERSION);
  else {
    const config = await readConfig();
    let result;
    if (command === 'doctor') result = await doctor(config);
    else if (command === 'create') result = await createRun(config, args[0]);
    else if (command === 'status') result = publicRun(await loadRun(config, args[0]));
    else if (command === 'progress') result = assessProgress(await loadRun(config, args[0]));
    else if (command === 'resources') result = await resourceStatus(config);
    else if (command === 'reconcile') result = await reconcile(config, 'a11y-workflow', args[0]);
    else if (command === 'execute') {
      const input = args[2] ? JSON.parse(await readFile(args[2], 'utf8')) : {};
      result = await executeStage(config, 'a11y-workflow', args[0], args[1], input);
    } else throw new Error('Usage: cli.mjs version|doctor|create <bug>|status|progress|reconcile <run>|resources|execute <run> <stage> [input.json]');
    console.log(JSON.stringify(result, null, 2));
  }
} catch (error) {
  console.error(JSON.stringify({ error: error.message }));
  process.exitCode = 1;
}
