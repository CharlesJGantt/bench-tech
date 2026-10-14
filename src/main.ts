import './ui/styles.css';
import { Session } from './game/session';
import { BenchScene } from './render/scene';
import { Hud } from './ui/hud';

async function main() {
  const canvas = document.getElementById('app') as HTMLCanvasElement;
  const session = new Session();
  const hud = new Hud(session);
  const scene = new BenchScene(canvas, session, {
    onClick: (hit, ev) => hud.onClick(hit, ev),
    onHover: (hit, ev) => hud.onHover(hit, ev),
  });
  try {
    await scene.load();
  } catch (e) {
    document.getElementById('loading')!.textContent = `Failed to load: ${String(e)}`;
    throw e;
  }
  hud.attach(scene);
  scene.app.on('update', (dt: number) => hud.tickScope(dt));
  document.getElementById('loading')!.remove();
  // Handy for debugging from the console.
  (window as unknown as { bench: unknown }).bench = { session, scene };
}

void main();
