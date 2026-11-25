import { SONGS, type Song } from './songs';

/**
 * 八音盒背景音乐：用 Web Audio 实时合成，不需要任何音频文件。
 * 浏览器要求用户先点一下页面才能出声，所以 play() 必须在点击等操作里调用。
 */

const STORAGE_KEY = 'christmas-tree-music';
const LOOKAHEAD = 0.35; // 秒：提前排好这么远的音符
const GAP_BEATS = 3; // 两首歌之间空几拍

interface NoteEvent {
  time: number; // 从歌曲开头算起的秒数
  freq: number;
  dur: number;
  bass: boolean;
}

const SEMI: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

const noteFreq = (name: string) => {
  const m = /^([A-G])(#|b)?(\d)$/.exec(name);
  if (!m) throw new Error(`bad note ${name}`);
  const midi = 12 * (Number(m[3]) + 1) + SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return 440 * 2 ** ((midi - 69) / 12);
};

/** 和弦名（G、Am、F#m…）→ 低音根音和五度 */
const chordBass = (name: string) => {
  const m = /^([A-G])(#|b)?/.exec(name)!;
  const root = noteFreq(`${m[1]}${m[2] ?? ''}2`);
  return { root: root < 75 ? root * 2 : root, fifth: (root < 75 ? root * 2 : root) * 1.5 };
};

/** 把曲谱展开成按时间排好的音符 */
export function compile(song: Song): { events: NoteEvent[]; length: number } {
  const spb = 60 / song.bpm;
  const events: NoteEvent[] = [];
  let beat = 0;
  for (const tok of song.melody.split(/\s+/)) {
    if (!tok || tok === '|') continue;
    const [name, len] = tok.split(':');
    const beats = Number(len);
    if (name !== 'R') events.push({ time: beat * spb, freq: noteFreq(name), dur: beats * spb, bass: false });
    beat += beats;
  }
  const chords = song.chords.split(/\s+/).filter(Boolean);
  chords.forEach((c, i) => {
    const start = (song.pickup ?? 0) + i * song.beatsPerBar;
    const { root, fifth } = chordBass(c);
    events.push({ time: start * spb, freq: root, dur: song.beatsPerBar * spb * 0.6, bass: true });
    if (song.beatsPerBar === 4) events.push({ time: (start + 2) * spb, freq: fifth, dur: 2 * spb * 0.6, bass: true });
  });
  events.sort((a, b) => a.time - b.time);
  return { events, length: beat * spb };
}

/** 一个八音盒音符：几个正弦泛音 + 快起慢衰的包络 */
function pluck(ctx: AudioContext, out: AudioNode, ev: NoteEvent, at: number) {
  const vol = ev.bass ? 0.16 : 0.26;
  const decay = ev.bass ? Math.max(1.2, ev.dur) : Math.min(2.2, 0.7 + 300 / ev.freq + ev.dur * 0.5);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(vol, at + 0.005);
  env.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  env.connect(out);
  const partials = ev.bass ? [[1, 1], [2, 0.2]] : [[1, 1], [2, 0.28], [3, 0.08], [5.4, 0.025]];
  for (const [ratio, amp] of partials) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.value = ev.freq * ratio;
    g.gain.value = amp;
    osc.connect(g).connect(env);
    osc.start(at);
    osc.stop(at + decay + 0.05);
  }
}

/** 生成一段简单的混响冲激响应（衰减的噪声） */
function makeReverb(ctx: AudioContext) {
  const len = Math.floor(ctx.sampleRate * 2.2);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  }
  const conv = ctx.createConvolver();
  conv.buffer = buf;
  return conv;
}

const readEnabled = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
};

class MusicBox {
  enabled = readEnabled();
  playing = false;
  songIndex = 0;
  private ctx: AudioContext | null = null;
  private out: AudioNode | null = null;
  private bus: GainNode | null = null;
  private events: NoteEvent[] = [];
  private next = 0;
  private songStart = 0;
  private songEnd = 0;
  private timer = 0;
  private listeners = new Set<() => void>();

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  get title() {
    return SONGS[this.songIndex].title;
  }

  private setup() {
    if (this.ctx) return this.ctx;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = 0.55;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);
    const reverb = makeReverb(ctx);
    const wet = ctx.createGain();
    wet.gain.value = 0.28;
    reverb.connect(wet).connect(master);
    const input = ctx.createGain();
    input.connect(master);
    input.connect(reverb);
    this.ctx = ctx;
    this.out = input;
    // 切到别的标签页时暂停，回来接着放
    document.addEventListener('visibilitychange', () => {
      if (!this.playing) return;
      if (document.hidden) ctx.suspend();
      else ctx.resume();
    });
    return ctx;
  }

  private startSong(index: number, at: number) {
    this.songIndex = index % SONGS.length;
    const { events, length } = compile(SONGS[this.songIndex]);
    this.events = events;
    this.next = 0;
    this.songStart = at;
    this.songEnd = at + length;
    this.emit();
  }

  private tick = () => {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const horizon = ctx.currentTime + LOOKAHEAD;
    while (true) {
      if (this.next >= this.events.length) {
        const spb = 60 / SONGS[this.songIndex].bpm;
        this.startSong(this.songIndex + 1, this.songEnd + GAP_BEATS * spb);
        continue;
      }
      const ev = this.events[this.next];
      const at = this.songStart + ev.time;
      if (at > horizon) break;
      if (at >= ctx.currentTime - 0.05) pluck(ctx, this.bus, ev, Math.max(at, ctx.currentTime));
      this.next++;
    }
  };

  play() {
    let ctx: AudioContext;
    try {
      ctx = this.setup();
    } catch {
      return; // 不支持 Web Audio 就安静地跳过
    }
    ctx.resume();
    if (this.playing) return;
    this.playing = true;
    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0.0001, ctx.currentTime);
    bus.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 1.2);
    bus.connect(this.out!);
    this.bus = bus;
    this.startSong(this.songIndex, ctx.currentTime + 0.15);
    this.tick();
    this.timer = window.setInterval(this.tick, 60);
    this.emit();
  }

  pause() {
    if (!this.playing) return;
    this.playing = false;
    clearInterval(this.timer);
    const ctx = this.ctx!;
    const bus = this.bus!;
    this.bus = null;
    bus.gain.cancelScheduledValues(ctx.currentTime);
    bus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.12);
    setTimeout(() => bus.disconnect(), 800);
    // 下次从下一首开始
    this.songIndex = (this.songIndex + 1) % SONGS.length;
    this.emit();
  }

  /** 用户点了音乐按钮：切换，并记住选择 */
  toggle() {
    this.enabled = !this.playing;
    try {
      localStorage.setItem(STORAGE_KEY, this.enabled ? 'on' : 'off');
    } catch {
      /* 存不了也没关系 */
    }
    if (this.playing) this.pause();
    else this.play();
  }

  /** 开始看树时调用：用户没关过音乐就开始放 */
  autoStart() {
    if (this.enabled && !this.playing) this.play();
  }
}

export const music = new MusicBox();
