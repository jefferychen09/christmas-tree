import { useSyncExternalStore } from 'react';
import { music } from '../music/player';
import { useLang } from '../i18n';

/** 右上角的音乐开关：播放时金色并显示跳动的音符 */
export default function MusicButton() {
  const { t } = useLang();
  const playing = useSyncExternalStore(music.subscribe, () => music.playing);
  const title = useSyncExternalStore(music.subscribe, () => music.title);
  const label = playing ? `${t.musicOff} · ♪ ${title}` : t.musicOn;
  return (
    <button
      className={`music-btn ${playing ? 'is-on' : ''}`}
      onClick={() => music.toggle()}
      aria-pressed={playing}
      aria-label={label}
      title={label}
    >
      <span aria-hidden>♫</span>
    </button>
  );
}
