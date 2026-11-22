import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { PhotoItem } from '../gifts';
import { photoName, useLang } from '../i18n';

interface Props {
  gifts: PhotoItem[];
  onClose: () => void;
  /** 每次数值变化就「再拆一个」（给手势 👍 用） */
  againSignal?: number;
}

const COLORS = ['#e53935', '#ffd54f', '#43a047', '#42a5f5', '#ffffff', '#ab47bc'];

const randomIndex = (n: number, exclude: number) => {
  if (n <= 1) return 0;
  let i = exclude;
  while (i === exclude) i = Math.floor(Math.random() * n);
  return i;
};

/** 拆礼物弹窗：礼盒摇晃 → 盖子飞开 → 弹出随机礼品 */
export default function GiftModal({ gifts, onClose, againSignal = 0 }: Props) {
  const { t, lang } = useLang();
  const [giftIndex, setGiftIndex] = useState(() => randomIndex(gifts.length, -1));
  const [phase, setPhase] = useState<'shake' | 'open'>('shake');
  const [round, setRound] = useState(0);

  useEffect(() => {
    setPhase('shake');
    const t = setTimeout(() => setPhase('open'), 900);
    return () => clearTimeout(t);
  }, [round]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const again = () => {
    setGiftIndex((i) => randomIndex(gifts.length, i));
    setPhase('shake');
    setRound((r) => r + 1);
  };

  const firstSignal = useRef(againSignal);
  useEffect(() => {
    if (againSignal !== firstSignal.current) again();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [againSignal]);

  const gift = gifts[giftIndex];
  if (!gift) return null;
  const name = photoName(gift, lang) || t.surprise;

  return (
    <div className="modal" onClick={onClose}>
      <div className={`unwrap unwrap--${phase}`} key={round} onClick={(e) => e.stopPropagation()}>
        <div className="unwrap__stage">
          {/* 彩带纸屑 */}
          {phase === 'open' && (
            <div className="confetti" aria-hidden>
              {Array.from({ length: 36 }, (_, i) => (
                <i
                  key={i}
                  style={{
                    '--x': `${Math.cos((i / 36) * Math.PI * 2) * (120 + (i % 5) * 30)}px`,
                    '--y': `${Math.sin((i / 36) * Math.PI * 2) * (120 + (i % 4) * 30) - 60}px`,
                    '--r': `${(i * 47) % 360}deg`,
                    background: COLORS[i % COLORS.length],
                    animationDelay: `${(i % 6) * 0.02}s`,
                  } as CSSProperties}
                />
              ))}
            </div>
          )}

          <div className="rays" aria-hidden />

          <div className="giftbox" aria-hidden>
            <div className="giftbox__lid" />
            <div className="giftbox__body" />
          </div>

          <div className="prize">
            <img src={gift.url} alt={name} />
          </div>
        </div>

        <div className="unwrap__text">
          {phase === 'shake' ? (
            <p className="unwrap__title">{t.unwrapping}</p>
          ) : (
            <>
              <p className="unwrap__title">{t.youGot(name)}</p>
              <div className="unwrap__actions">
                <button className="btn btn--ghost" onClick={onClose}>
                  {t.keepIt}
                </button>
                <button className="btn btn--gold" onClick={again}>
                  {t.another}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
