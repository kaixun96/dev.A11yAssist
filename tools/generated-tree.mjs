import { readdir, unlink, rmdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import assert from 'node:assert/strict';

// Generated packages must not retain retired instructions after a scope change.
export async function pruneGenerated(root, expectedFiles, check = false) {
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      assert(!entry.isSymbolicLink(), `Unexpected generated symlink: ${path}`);
      if (entry.isDirectory()) {
        await visit(path);
        if (!check && (await readdir(path)).length === 0) await rmdir(path);
      } else {
        assert(entry.isFile(), `Unexpected generated entry: ${path}`);
        const key = relative(root, path).split(sep).join('/');
        if (!expectedFiles.has(key)) {
          assert(!check, `Unexpected generated file: ${key}`);
          await unlink(path);
        }
      }
    }
  }
  await visit(root);
}
