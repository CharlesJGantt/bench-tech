/**
 * Export every device's front-face layout to tools/blender/faces.json for the Blender
 * shell builder (tools/blender/build_shells.py). Run by `npm run models` (under Vitest so
 * the TypeScript sources import directly).
 */
import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { DEVICE_LIST } from '../src/sim/devices';

it('exports device faces for Blender', () => {
  const faces = DEVICE_LIST.filter((d) => d.face).map((d) => ({ id: d.id, width: d.width, height: d.height, face: d.face }));
  writeFileSync('tools/blender/faces.json', JSON.stringify(faces, null, 1));
  console.log(`exported ${faces.length} faces`);
});
