// Builds public/models/*.glb by running the Blender scripts in tools/blender headless.
// Set BLENDER to override the Blender executable path.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const blender = process.env.BLENDER ?? 'C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe';
if (!existsSync(blender)) {
  console.error(`Blender not found at ${blender}. Set the BLENDER environment variable.`);
  process.exit(1);
}

const jobs = [['build_parts.py', 'parts.glb']];
mkdirSync(join(root, 'public', 'models'), { recursive: true });
for (const [script, out] of jobs) {
  const r = spawnSync(blender, ['-b', '--factory-startup', '-P', join(root, 'tools', 'blender', script), '--', join(root, 'public', 'models', out)], {
    stdio: 'inherit',
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
