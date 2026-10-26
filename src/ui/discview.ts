/**
 * The disc buffing station: a scratched game disc on the buffing machine. Scratches are drawn as arcs, darker
 * the deeper they are. Polishing passes (with compound) take a layer off everything; polish too long and the
 * disc goes cloudy, and a scratch that reaches the data layer will not come out.
 */
import type { Session } from '../game/session';
import { DISC_SAFE_PASSES, DISC_UNSAVEABLE } from '../sim/faults';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function discViewHtml(s: Session, message = ''): string {
  const d = s.job.disc;
  if (!d) return '';
  const C = 130;
  const R = 120;
  const arcs = d.scratches
    .filter((x) => x.depth > 0.01)
    .map((x) => {
      const r = R * (0.3 + 0.65 * x.r);
      const a0 = x.a0;
      const a1 = x.a0 + x.sweep;
      const p = (a: number) => `${(C + r * Math.cos(a)).toFixed(1)} ${(C + r * Math.sin(a)).toFixed(1)}`;
      const large = x.sweep > Math.PI ? 1 : 0;
      const alpha = Math.min(1, 0.25 + x.depth);
      const col = x.depth >= DISC_UNSAVEABLE ? '#ff5d4a' : '#f2f2f2';
      return `<path d="M ${p(a0)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 ${large} 1 ${p(a1)}" stroke="${col}" stroke-opacity="${alpha}" stroke-width="${(1 + x.depth * 2.2).toFixed(1)}" fill="none" stroke-linecap="round"/>`;
    })
    .join('');
  const cloudy = d.ruined ? '<circle cx="130" cy="130" r="118" fill="#d8d4c8" opacity="0.55"/>' : d.passes > DISC_SAFE_PASSES - 2 ? '<circle cx="130" cy="130" r="118" fill="#d8d4c8" opacity="0.12"/>' : '';
  const worst = Math.max(0, ...d.scratches.map((x) => x.depth));
  const clean = !d.ruined && worst <= 0.12;
  const verdict = d.ruined
    ? 'It has been polished too thin and has gone cloudy: it will not read now.'
    : clean
      ? 'Every scratch has polished out. The disc is ready.'
      : worst >= DISC_UNSAVEABLE && d.scratches.every((x) => x.depth >= DISC_UNSAVEABLE || x.depth <= 0.12)
        ? 'The remaining scratch goes through the data layer: it cannot be saved. Tell the customer.'
        : `Scratches left: the deepest is ${Math.round(worst * 100)} % through.`;
  const hasTool = s.owns('disc-buffer');
  const polish = s.shop.supplies['disc-polish'];
  const lock = !hasTool ? ' disabled title="You need the disc buffing machine (Equipment tab)"' : polish < 2 ? ' disabled title="Out of polishing compound (Supplies tab)"' : '';
  return `<h2>💿 Disc buffing station</h2>
    <p class="muted small">${esc(s.job.device.name)} disc · ${d.passes} polishing pass${d.passes === 1 ? '' : 'es'} so far${s.guided ? ` · it can take about ${DISC_SAFE_PASSES} before it gets too thin` : ''}</p>
    <div class="discview"><svg viewBox="0 0 260 260" width="100%" role="img" aria-label="The disc">
      <circle cx="130" cy="130" r="124" fill="#3b4250"/><circle cx="130" cy="130" r="118" fill="#aeb6c4"/>
      <circle cx="130" cy="130" r="118" fill="url(#rainbow)" opacity="0.35"/>
      <defs><linearGradient id="rainbow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7fd"/><stop offset="0.5" stop-color="#d7f"/><stop offset="1" stop-color="#fd7"/></linearGradient></defs>
      <circle cx="130" cy="130" r="36" fill="#cfd5df"/><circle cx="130" cy="130" r="14" fill="#14181f"/>
      ${cloudy}${arcs}
    </svg></div>
    <p class="small"><b>${esc(verdict)}</b></p>
    ${message ? `<p class="note">${esc(message)}</p>` : ''}
    <div class="row"><button data-act="disc-polish"${lock}>🌀 Polish one pass (2 ml compound)</button><button data-act="disc-giveup" title="Hand it back: some scratches go too deep">Tell the customer it cannot be saved</button><button data-act="close">Done</button></div>`;
}
