/**
 * Background soundtrack: the Bench Tech tracks (public/music) play in a random order, one after
 * another. A round mute button sits in the bottom-right corner; hovering it opens a small
 * panel with the music volume, the track name and a skip button. Volume and mute are remembered.
 */
const KEY = 'benchtech.music';
/** Default music volume: low, so it sits under the sounds of the bench. */
const DEFAULT_VOLUME = 0.12;

interface Track {
  file: string;
  title: string;
}

interface Saved {
  volume: number;
  muted: boolean;
}

const ICON_ON = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
const ICON_OFF = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="m16 9 5 6M21 9l-5 6"/></svg>';

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (raw && typeof raw.volume === 'number') return { volume: Math.min(1, Math.max(0, raw.volume)), muted: !!raw.muted };
  } catch {
    /* ignore */
  }
  return { volume: DEFAULT_VOLUME, muted: false };
}

export class Music {
  private audio = new Audio();
  private tracks: Track[] = [];
  private bag: Track[] = [];
  private current: Track | null = null;
  private saved = load();
  private started = false;
  private root = document.createElement('div');
  private btn!: HTMLButtonElement;
  private slider!: HTMLInputElement;
  private nameEl!: HTMLElement;
  private volEl!: HTMLElement;
  private ready: Promise<void>;

  constructor() {
    this.audio.preload = 'auto';
    this.audio.volume = this.saved.volume;
    this.audio.addEventListener('ended', () => this.next());
    this.audio.addEventListener('error', () => window.setTimeout(() => this.next(), 500));
    this.build();
    this.ready = this.loadTracks();
  }

  /** Is a track actually playing right now? */
  get playing(): boolean {
    return !this.audio.paused && !this.audio.ended && this.audio.currentTime > 0;
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
      this.tracks = (await res.json()) as Track[];
    } catch {
      this.tracks = [];
    }
    this.refresh();
  }

  /** Start when the browser allows sound: now if it lets us, otherwise on the first click or key press. */
  arm(): void {
    const kick = () => {
      if (this.started) return cleanup();
      this.start().then((ok) => ok && cleanup());
    };
    const cleanup = () => {
      window.removeEventListener('pointerdown', kick, true);
      window.removeEventListener('keydown', kick, true);
    };
    window.addEventListener('pointerdown', kick, true);
    window.addEventListener('keydown', kick, true);
    // The track list may still be loading, and the browser may not allow sound yet: keep trying
    // on each interaction until one play() succeeds.
    void this.ready.then(() => kick());
  }

  /** Try to play; true once music is actually running (or deliberately muted). */
  private async start(): Promise<boolean> {
    if (this.started) return true;
    if (this.saved.muted) return true;
    if (!this.tracks.length) return false;
    if (!this.current) this.pick();
    try {
      await this.audio.play();
      this.started = true;
      this.refresh();
      return true;
    } catch {
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
    this.audio.src = `${this.base()}music/${this.current.file}`;
    this.refresh();
  }

  private next(): void {
    this.pick();
    if (!this.saved.muted) void this.audio.play().catch(() => undefined);
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
    else {
      this.started = false;
      void this.start();
    }
    this.refresh();
  }

  private setVolume(v: number): void {
    this.saved.volume = v;
    this.audio.volume = v;
    this.save();
    this.refresh();
  }

  private build(): void {
    this.root.id = 'music';
    this.root.innerHTML = `<div class="music-panel">
        <div class="music-now"><span class="music-note">♪</span> <span class="music-name">—</span></div>
        <label class="music-vol">Music volume <b class="music-pct"></b><input type="range" min="0" max="100" step="1" aria-label="Music volume" /></label>
        <div class="row" style="margin:6px 0 0"><button class="music-skip" type="button" title="Play another track">⏭ Next track</button></div>
      </div>
      <button class="music-btn" type="button" aria-label="Mute music"></button>`;
    document.body.append(this.root);
    this.btn = this.root.querySelector('.music-btn')!;
    this.slider = this.root.querySelector('input')!;
    this.nameEl = this.root.querySelector('.music-name')!;
    this.volEl = this.root.querySelector('.music-pct')!;
    this.btn.addEventListener('click', () => this.setMuted(!this.saved.muted));
    this.slider.addEventListener('input', () => {
      this.setVolume(parseInt(this.slider.value, 10) / 100);
      // Moving the slider up from silence un-mutes
      if (this.saved.muted && this.saved.volume > 0) this.setMuted(false);
    });
    this.root.querySelector('.music-skip')!.addEventListener('click', () => {
      if (this.saved.muted) this.setMuted(false);
      this.next();
    });
    this.refresh();
  }

  private refresh(): void {
    const muted = this.saved.muted || this.saved.volume === 0;
    this.btn.innerHTML = muted ? ICON_OFF : ICON_ON;
    this.btn.classList.toggle('muted', muted);
    this.btn.title = muted ? 'Music is off — click to turn it on' : 'Music on — click to mute (hover for volume)';
    this.slider.value = String(Math.round(this.saved.volume * 100));
    this.volEl.textContent = `${Math.round(this.saved.volume * 100)}%`;
    this.nameEl.textContent = this.current?.title ?? (this.tracks.length ? 'Ready' : '—');
  }
}
