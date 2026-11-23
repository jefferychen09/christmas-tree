import { useEffect, useState } from 'react';
import type { Card } from '../card';
import { useLang } from '../i18n';

/** 贺卡正面：写给谁、正文、署名。写贺卡时的预览也用它 */
export function CardFace({ card, className = '' }: { card: Pick<Card, 'to' | 'msg' | 'from'>; className?: string }) {
  const { t } = useLang();
  return (
    <article className={`xcard ${className}`}>
      <p className="xcard__year">{t.cardYear(new Date().getFullYear())}</p>
      <h2 className="xcard__title">Merry Christmas</h2>
      <p className="xcard__dear">{t.dear(card.to || '…')}</p>
      <p className={`xcard__msg ${card.msg ? '' : 'is-empty'}`}>{card.msg || t.msgPlaceholder}</p>
      {card.from && <p className="xcard__from">{t.signed(card.from)}</p>}
    </article>
  );
}

interface Props {
  card: Card;
  /** true：先显示信封，点开后才看到贺卡；false：直接显示贺卡（重新打开时） */
  sealed: boolean;
  onOpened: () => void;
  onClose: () => void;
  onMakeOwn: () => void;
}

/** 收到贺卡的人看到的界面：信封 → 拆开 → 贺卡 */
export default function GreetingCard({ card, sealed, onOpened, onClose, onMakeOwn }: Props) {
  const { t } = useLang();
  const [phase, setPhase] = useState<'sealed' | 'opening' | 'open'>(sealed ? 'sealed' : 'open');

  const open = () => {
    if (phase !== 'sealed') return;
    setPhase('opening');
    onOpened();
  };

  useEffect(() => {
    if (phase !== 'opening') return;
    const timer = setTimeout(() => setPhase('open'), 750);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase === 'open') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, onClose]);

  return (
    <div className="modal modal--card" onClick={(e) => e.target === e.currentTarget && phase === 'open' && onClose()}>
      {phase !== 'open' ? (
        <div className={`envelope-wrap ${phase === 'opening' ? 'is-opening' : ''}`}>
          <button className="envelope" onClick={open} aria-label={`${t.envelopeFor(card.to)} · ${t.tapToOpen}`}>
            <span className="envelope__flap" aria-hidden />
            <span className="envelope__seal" aria-hidden>
              ✦
            </span>
            <span className="envelope__to">{t.envelopeFor(card.to)}</span>
          </button>
          <p className="envelope__hint">{t.tapToOpen}</p>
        </div>
      ) : (
        <div className="card-view">
          <CardFace card={card} className="xcard--reveal" />
          <div className="card-view__actions">
            <button className="btn btn--ghost" onClick={onMakeOwn}>
              {t.makeOwn}
            </button>
            <button className="btn btn--gold" onClick={onClose} autoFocus>
              {t.exploreTree}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
