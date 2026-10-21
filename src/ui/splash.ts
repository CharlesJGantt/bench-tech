/**
 * Start-up splash: the Bench Tech title art with a glowing blue loading bar that fills over
 * (at least) twelve seconds, with three lines of workshop humour underneath, one after another.
 */
const SPLASH_MS = 12000;
/** Three lines per load, each shown for a third of the time. */
const PHRASE_COUNT = 3;
const PHRASE_MS = SPLASH_MS / PHRASE_COUNT;

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
  'Sniffing The Magic Smoke',
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

  // Three different lines picked at random for this load
  const order = [...PHRASES].sort(() => Math.random() - 0.5).slice(0, PHRASE_COUNT);
  let n = 0;
  const GLYPHS = '#%&@$?/\|<>[]{}0123456789ABCDEFXZ';
  const say = () => {
    if (n >= order.length) return;
    const line = `${order[n++]}…`;
    text.classList.add('in');
    // The new line scrambles into place, character by character
    let settled = 0;
    const scramble = window.setInterval(() => {
      settled += 1.4;
      text.textContent = [...line].map((ch, i) => (ch === ' ' || i < settled ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join('');
      if (settled >= line.length) {
        window.clearInterval(scramble);
        text.textContent = line;
      }
    }, 40);
  };
  say();
  const phrases = window.setInterval(say, PHRASE_MS);
  // Random glitch bursts: the line jitters, splits into cyan / magenta ghosts and blinks
  let glitching = true;
  const glitch = () => {
    if (!glitching) return;
    text.classList.add('glitch');
    window.setTimeout(() => text.classList.remove('glitch'), 90 + Math.random() * 180);
    window.setTimeout(glitch, 250 + Math.random() * 900);
  };
  window.setTimeout(glitch, 400);

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
      glitching = false;
      text.classList.remove('glitch');
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
