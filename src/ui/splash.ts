/**
 * Start-up splash: the Bench Tech title art with a glowing blue loading bar that fills over
 * (at least) seven seconds, and a rotating line of workshop humour underneath.
 */
const SPLASH_MS = 7000;
const PHRASE_MS = 1400;

const PHRASES = [
  'Warming Up The Soldering Iron',
  'Powering Up The Oscilloscope',
  'Heating The Warming Plate',
  'Turning Bench Power Supply On',
  'Setting Phasers To Stun',
  'Tinning The Iron Tip',
  'Calibrating The Multimeter',
  'Sorting The Resistors By Colour',
  'Applying Flux To Everything',
  'Looking For The Dropped 0402 Resistor',
  'Finding The Missing 10mm Socket',
  'Counting The Capacitors Twice',
  'Blaming The Firmware',
  'Keeping The Magic Smoke Inside',
  'Reflowing The Reflow Oven',
  'Untangling The Probe Leads',
];

/** Show the splash; resolves once the minimum time has passed and the splash has faded out. */
export function runSplash(ready: Promise<unknown>): Promise<void> {
  const base = (import.meta.env?.BASE_URL as string | undefined) ?? '/';
  const root = document.createElement('div');
  root.id = 'splash';
  root.innerHTML = `<div class="splash-frame" style="background-image:url(${base}branding/starting-screen.jpg)"><div class="splash-mid"><div class="splash-bar"><i></i></div><div class="splash-text"></div></div></div>`;
  document.body.append(root);
  const fill = root.querySelector<HTMLElement>('.splash-bar i')!;
  const text = root.querySelector<HTMLElement>('.splash-text')!;

  // A shuffled order, so each line shows once before any repeats; the first is always the iron.
  const order = [PHRASES[0], ...PHRASES.slice(1).sort(() => Math.random() - 0.5)];
  let n = 0;
  const say = () => {
    text.classList.remove('in');
    window.setTimeout(() => {
      text.textContent = `${order[n++ % order.length]}…`;
      text.classList.add('in');
    }, 160);
  };
  say();
  const phrases = window.setInterval(say, PHRASE_MS);

  const start = performance.now();
  let loaded = false;
  void ready.then(() => (loaded = true), () => (loaded = true));
  return new Promise((resolve) => {
    const tick = () => {
      const t = (performance.now() - start) / SPLASH_MS;
      // Fills steadily with a little ease; holds just short of full until the game is actually ready.
      const p = Math.min(1, t) ** 0.9;
      fill.style.transform = `scaleX(${t >= 1 && !loaded ? 0.985 : p})`;
      if (t < 1 || !loaded) {
        requestAnimationFrame(tick);
        return;
      }
      fill.style.transform = 'scaleX(1)';
      window.clearInterval(phrases);
      text.textContent = 'Ready!';
      window.setTimeout(() => {
        root.classList.add('out');
        window.setTimeout(() => {
          root.remove();
          resolve();
        }, 600);
      }, 350);
    };
    requestAnimationFrame(tick);
  });
}
