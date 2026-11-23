import { useEffect, useRef, useState, type FormEvent } from 'react';
import { cardUrl, LIMITS, type Card } from '../card';
import { useLang } from '../i18n';
import { CardFace } from './GreetingCard';

interface Props {
  initial: Card | null;
  onClose: () => void;
  onPreview: (card: Card) => void;
}

/** 写贺卡：填写 → 生成专属链接 → 复制 / 打开看看 */
export default function CardComposer({ initial, onClose, onPreview }: Props) {
  const { t, lang } = useLang();
  const [to, setTo] = useState(initial?.to ?? '');
  const [msg, setMsg] = useState(initial?.msg ?? '');
  const [from, setFrom] = useState(initial?.from ?? '');
  const [link, setLink] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [showErr, setShowErr] = useState(false);
  const linkRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);

  const card: Card = { to, msg, from, lang };
  const valid = to.trim() !== '' && msg.trim() !== '';

  useEffect(() => {
    toRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const create = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) {
      setShowErr(true);
      return;
    }
    setLink(cardUrl(card));
    setCopyState('idle');
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopyState('copied');
    } catch {
      linkRef.current?.select();
      setCopyState('failed');
    }
  };

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="composer glass" role="dialog" aria-modal="true" aria-labelledby="composer-title">
        <button className="icon-btn modal__close" onClick={onClose} aria-label={t.close}>
          ×
        </button>

        <div className="composer__main">
          <h2 id="composer-title" className="composer__title">
            {t.composerTitle}
          </h2>

          {link === null ? (
            <form className="composer__form" onSubmit={create} noValidate>
              <label className="field">
                <span className="field__label">{t.toLabel}</span>
                <input
                  ref={toRef}
                  className="field__input"
                  value={to}
                  maxLength={LIMITS.to}
                  placeholder={t.toPlaceholder}
                  onChange={(e) => setTo(e.target.value)}
                  aria-invalid={showErr && !to.trim()}
                />
              </label>

              <label className="field">
                <span className="field__label">
                  {t.msgLabel}
                  <span className="field__count">
                    {msg.length}/{LIMITS.msg}
                  </span>
                </span>
                <textarea
                  className="field__input field__input--area"
                  value={msg}
                  maxLength={LIMITS.msg}
                  rows={4}
                  placeholder={t.msgPlaceholder}
                  onChange={(e) => setMsg(e.target.value)}
                  aria-invalid={showErr && !msg.trim()}
                />
              </label>

              <div className="samples">
                <span className="field__label">{t.samplesLabel}</span>
                <div className="samples__list">
                  {t.samples.map((s) => (
                    <button type="button" key={s} className="chip" onClick={() => setMsg(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <label className="field">
                <span className="field__label">{t.fromLabel}</span>
                <input
                  className="field__input"
                  value={from}
                  maxLength={LIMITS.from}
                  placeholder={t.fromPlaceholder}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </label>

              {showErr && !valid && (
                <p className="composer__err" role="alert">
                  {t.needFields}
                </p>
              )}

              <button type="submit" className="btn btn--gold composer__submit">
                {t.createLink}
              </button>
            </form>
          ) : (
            <div className="composer__done">
              <p className="composer__ready">{t.linkReady}</p>
              <input
                ref={linkRef}
                className="field__input composer__link"
                value={link}
                readOnly
                onFocus={(e) => e.target.select()}
                aria-label={t.linkReady}
              />
              <div className="composer__actions">
                <button className="btn btn--gold" onClick={copy}>
                  {copyState === 'copied' ? t.copied : t.copy}
                </button>
                <button
                  className="btn btn--ghost"
                  onClick={() => onPreview(card)}
                >
                  {t.preview}
                </button>
                <button className="btn btn--ghost" onClick={() => setLink(null)}>
                  {t.edit}
                </button>
              </div>
              {copyState === 'failed' && <p className="composer__err">{t.copyFail}</p>}
              <p className="composer__hint">{t.linkHint}</p>
            </div>
          )}
        </div>

        <div className="composer__preview" aria-hidden>
          <CardFace card={card} />
        </div>
      </div>
    </div>
  );
}
