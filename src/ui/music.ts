/**
 * Background soundtrack: the Bench Tech tracks (public/music) play in a random order, one after
 * another. A round mute button sits in the bottom-left corner with a small arrow beside it that
 * expands / collapses a panel with the music volume, the track name and a skip button. Volume,
 * mute and whether the panel is open are remembered. New players start with the music off (so
 * nothing plays uninvited) and, once the tutorial is over, get a one-time popup pointing at the
 * button.
 *
 * Browsers refuse to play sound until the player has interacted with the page (autoplay
 * policy), so when playback is blocked the button pulses with "Click for music" and the first
 * click or key press anywhere starts the music. Each track is fetched whole and played from a
 * blob URL, which avoids streaming / range-request problems.
 */
const KEY = 'benchtech.music';
const HINT_KEY = 'benchtech.musicHint';
/** Default music volume: low, so it sits under the sounds of the bench. */
const DEFAULT_VOLUME = 0.12;

interface Track {
  file: string;
  title: string;
}

interface Saved {
  volume: number;
  muted: boolean;
  /** The details panel is expanded (collapsed by default). */
  panel: boolean;
}

type State = 'loading' | 'blocked' | 'playing' | 'muted' | 'error';

const ICON_ON = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
const ICON_OFF = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="m16 9 5 6M21 9l-5 6"/></svg>';

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (raw && typeof raw.volume === 'number') return { volume: Math.min(1, Math.max(0, raw.volume)), muted: !!raw.muted, panel: !!raw.panel };
  } catch {
    /* ignore */
  }
  // A new player starts with the music off until they choose it (see hint())
  return { volume: DEFAULT_VOLUME, muted: true, panel: false };
}

export class Music {
  private audio = new Audio();
  private tracks: Track[] = [];
  private bag: Track[] = [];
  private current: Track | null = null;
  private saved = load();
  private root = document.createElement('div');
  private btn!: HTMLButtonElement;
  private more!: HTMLButtonElement;
  private slider!: HTMLInputElement;
  private nameEl!: HTMLElement;
  private volEl!: HTMLElement;
  private statusEl!: HTMLElement;
  private ready: Promise<void>;
  /** Object URL of the loaded track (revoked when the next one loads). */
  private blobUrl = '';
  private loadingTrack: Promise<boolean> | null = null;
  private error = '';
  private armed = false;
  private lastState: State = 'loading';

  constructor() {
    this.audio.preload = 'auto';
    this.audio.volume = this.saved.volume;
    this.audio.addEventListener('ended', () => void this.next());
    this.audio.addEventListener('playing', () => this.refresh());
    this.audio.addEventListener('canplay', () => this.refresh());
    this.audio.addEventListener('timeupdate', () => {
      // Catch the moment playback is really under way (keeps the panel and button state honest)
      if (this.lastState !== this.state()) this.refresh();
    });
    this.audio.addEventListener('pause', () => this.refresh());
    this.audio.addEventListener('error', () => {
      this.error = `the audio could not be played (code ${this.audio.error?.code ?? '?'})`;
      console.warn('[music]', this.error);
      this.refresh();
      window.setTimeout(() => void this.next(), 1500);
    });
    this.build();
    this.ready = this.loadTracks();
    // Duck the music while the tutorial voice is talking
    window.addEventListener('benchtech:speaking', (e) => {
      this.audio.volume = (e as CustomEvent<boolean>).detail ? this.saved.volume * 0.3 : this.saved.volume;
    });
    window.addEventListener('benchtech:tutorial-done', () => window.setTimeout(() => this.hint(), 900));
    window.addEventListener('keydown', (e) => e.key === 'Escape' && this.closeHint());
  }

  private hintEl: HTMLElement | null = null;

  /** One-time popup: "Want to listen to music?" pointing at the button (first run, after the tutorial). */
  hint(): void {
    try {
      if (localStorage.getItem(HINT_KEY)) return;
    } catch {
      /* ignore */
    }
    if (this.hintEl || this.playing) return;
    try {
      localStorage.setItem(HINT_KEY, '1');
    } catch {
      /* ignore */
    }
    const el = document.createElement('div');
    el.id = 'music-hint';
    el.innerHTML = '<b>🎵 Want to listen to music?</b><p>Click the music icon to turn the Bench Tech soundtrack on. The arrow beside it has the volume.</p><button type="button" class="primary">Got it</button>';
    el.querySelector('button')!.addEventListener('click', () => this.closeHint());
    document.body.append(el);
    this.hintEl = el;
    this.btn.classList.add('spotlight');
  }

  private closeHint(): void {
    this.hintEl?.remove();
    this.hintEl = null;
    this.btn.classList.remove('spotlight');
  }

  /** Is a track actually playing right now? */
  get playing(): boolean {
    return !this.audio.paused && !this.audio.ended && this.audio.readyState >= 3;
  }

  get time(): number {
    return this.audio.currentTime;
  }

  private base(): string {
    return (import.meta.env?.BASE_URL as string | undefined) ?? '/';
  }

  private async loadTracks(): Promise<void> {
    try {
      const res = await fetch(`${this.base()}music/tracks.json`);
      if (!res.ok) throw new Error(`tracks.json: ${res.status}`);
      this.tracks = (await res.json()) as Track[];
    } catch (e) {
      this.tracks = [];
      this.error = `the track list could not be loaded (${String(e)})`;
      console.warn('[music]', this.error);
    }
    this.refresh();
  }

  /** Start the music as soon as the browser allows: now if it does, otherwise on the first click or key press. */
  arm(): void {
    if (this.armed) return;
    this.armed = true;
    const kick = () => {
      void this.play().then((ok) => {
        if (ok) {
          window.removeEventListener('pointerdown', kick, true);
          window.removeEventListener('keydown', kick, true);
        }
      });
    };
    window.addEventListener('pointerdown', kick, true);
    window.addEventListener('keydown', kick, true);
    void this.ready.then(() => kick());
    // Players who already finished the tutorial see the hint once, on their next visit
    try {
      if (localStorage.getItem('benchtech.tutorial') === 'done') window.setTimeout(() => this.hint(), 2500);
    } catch {
      /* ignore */
    }
  }

  /** Fetch the current track into a blob URL (once per track). */
  private fetchTrack(): Promise<boolean> {
    if (!this.current) return Promise.resolve(false);
    if (this.loadingTrack) return this.loadingTrack;
    const track = this.current;
    this.loadingTrack = (async () => {
      try {
        const res = await fetch(`${this.base()}music/${track.file}`);
        if (!res.ok) throw new Error(`${track.file}: ${res.status}`);
        const blob = new Blob([await res.arrayBuffer()], { type: 'audio/mpeg' });
        if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
        this.blobUrl = URL.createObjectURL(blob);
        this.audio.src = this.blobUrl;
        this.error = '';
        return true;
      } catch (e) {
        this.error = `a track could not be loaded (${String(e)})`;
        console.warn('[music]', this.error);
        return false;
      } finally {
        this.loadingTrack = null;
        this.refresh();
      }
    })();
    this.refresh();
    return this.loadingTrack;
  }

  /** Try to play the current track; true when music is running (or deliberately muted). */
  private async play(): Promise<boolean> {
    if (this.saved.muted || this.saved.volume === 0) return true;
    if (this.playing) return true;
    if (!this.tracks.length) return false;
    if (!this.current) this.pick();
    if (!this.blobUrl || this.audio.src !== this.blobUrl) {
      // A track that will not load is skipped (up to a few in a row) rather than leaving silence
      let ok = await this.fetchTrack();
      for (let tries = 0; !ok && tries < 3 && this.tracks.length > 1; tries++) {
        this.pick();
        ok = await this.fetchTrack();
      }
      if (!ok) return false;
    }
    try {
      await this.audio.play();
      this.error = '';
      this.refresh();
      return true;
    } catch (e) {
      const name = (e as DOMException)?.name;
      if (name !== 'NotAllowedError') {
        this.error = `playback failed (${name ?? String(e)})`;
        console.warn('[music]', this.error);
      }
      this.refresh();
      return false;
    }
  }

  /** Random order without repeats: each track plays once before the shuffle starts over. */
  private pick(): void {
    if (!this.tracks.length) return;
    if (!this.bag.length) {
      this.bag = [...this.tracks].sort(() => Math.random() - 0.5);
      // Don't open the new round with the track that just played
      if (this.bag.length > 1 && this.bag[this.bag.length - 1].file === this.current?.file) this.bag.unshift(this.bag.pop()!);
    }
    this.current = this.bag.pop()!;
    this.blobUrl && URL.revokeObjectURL(this.blobUrl);
    this.blobUrl = '';
    this.audio.removeAttribute('src');
    this.audio.load();
    this.refresh();
  }

  private async next(): Promise<void> {
    this.pick();
    await this.play();
  }

  private save(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.saved));
    } catch {
      /* ignore */
    }
  }

  private setMuted(m: boolean): void {
    this.saved.muted = m;
    this.save();
    if (m) this.audio.pause();
    else void this.play();
    this.refresh();
  }

  private setVolume(v: number): void {
    this.saved.volume = v;
    this.audio.volume = v;
    this.save();
    this.refresh();
  }

  private state(): State {
    if (this.saved.muted || this.saved.volume === 0) return 'muted';
    if (this.playing) return 'playing';
    if (this.error) return 'error';
    if (!this.tracks.length || this.loadingTrack) return 'loading';
    return 'blocked';
  }

  private build(): void {
    this.root.id = 'music';
    this.root.innerHTML = `<div class="music-panel">
        <div class="music-now"><span class="music-note">♪</span> <span class="music-name">—</span></div>
        <div class="music-status"></div>
        <label class="music-vol">Music volume <b class="music-pct"></b><input type="range" min="0" max="100" step="1" aria-label="Music volume" /></label>
        <div class="row" style="margin:6px 0 0"><button class="music-skip" type="button" title="Play another track">⏭ Next track</button></div>
      </div>
      <div class="music-row"><button class="music-btn" type="button" aria-label="Music"></button><button class="music-more" type="button" aria-label="Music controls"></button></div>`;
    document.body.append(this.root);
    this.btn = this.root.querySelector('.music-btn')!;
    this.more = this.root.querySelector('.music-more')!;
    this.more.addEventListener('click', () => {
      this.saved.panel = !this.saved.panel;
      this.save();
      this.refresh();
    });
    this.slider = this.root.querySelector('input')!;
    this.nameEl = this.root.querySelector('.music-name')!;
    this.volEl = this.root.querySelector('.music-pct')!;
    this.statusEl = this.root.querySelector('.music-status')!;
    this.btn.addEventListener('click', () => {
      this.closeHint();
      // Nothing is playing yet (blocked, loading or failed): the button starts the music; otherwise it mutes / unmutes.
      const st = this.state();
      if (st === 'blocked' || st === 'error' || st === 'loading') {
        this.error = '';
        void this.play();
        this.refresh();
      } else this.setMuted(!this.saved.muted);
    });
    this.slider.addEventListener('input', () => {
      this.setVolume(parseInt(this.slider.value, 10) / 100);
      // Moving the slider up from silence un-mutes
      if (this.saved.muted && this.saved.volume > 0) this.setMuted(false);
      else if (!this.playing) void this.play();
    });
    this.root.querySelector('.music-skip')!.addEventListener('click', () => {
      this.saved.muted = false;
      this.save();
      void this.next();
    });
    this.refresh();
  }

  private refresh(): void {
    const st = this.state();
    this.lastState = st;
    const off = st === 'muted';
    this.btn.innerHTML = off ? ICON_OFF : ICON_ON;
    this.btn.classList.toggle('muted', off);
    this.btn.classList.toggle('attention', st === 'blocked');
    this.btn.title =
      st === 'blocked' ? 'Click to start the music' : off ? 'Music is off — click to turn it on' : st === 'error' ? 'Music problem — click to try again' : 'Music on — click to mute (hover for volume)';
    this.slider.value = String(Math.round(this.saved.volume * 100));
    this.volEl.textContent = `${Math.round(this.saved.volume * 100)}%`;
    this.nameEl.textContent = this.current?.title ?? (this.tracks.length ? 'Ready' : '—');
    this.statusEl.textContent =
      st === 'blocked'
        ? '▶ Your browser needs a click before it plays sound — click here or anywhere.'
        : st === 'error'
          ? `⚠ ${this.error}`
          : st === 'loading'
            ? 'Loading…'
            : '';
    this.statusEl.style.display = this.statusEl.textContent ? 'block' : 'none';
    const open = this.saved.panel || st === 'blocked' || st === 'error';
    this.root.classList.toggle('open', open);
    this.more.textContent = open ? '▾' : '▴';
    this.more.title = open ? 'Hide the music controls' : 'Music volume and track';
  }
}
