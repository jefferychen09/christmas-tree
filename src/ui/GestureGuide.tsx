import { useState } from 'react';
import { useLang, type GestureKey } from '../i18n';

const ORDER: GestureKey[] = [
  'Closed_Fist',
  'Open_Palm',
  'MoveX',
  'MoveY',
  'Pinch',
  'Pointing_Up',
  'Victory',
  'Thumb_Up',
  'Thumb_Down',
  'ILoveYou',
];

// 这几行可以点击直接试效果（移动、捏合需要真的用手）
const TRYABLE = new Set<GestureKey>(['Closed_Fist', 'Open_Palm', 'Pointing_Up', 'Victory', 'Thumb_Up', 'Thumb_Down', 'ILoveYou']);

interface Props {
  active: GestureKey | null;
  onTry: (g: GestureKey) => void;
}

/** 手势说明面板：列出所有手势，并高亮当前识别到的那个 */
export default function GestureGuide({ active, onTry }: Props) {
  const { t } = useLang();
  const [open, setOpen] = useState(() => window.innerWidth > 720);

  return (
    <aside className={`guide ${open ? 'is-open' : ''}`}>
      <button className="guide__head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span>{t.guideTitle}</span>
        <span className="guide__chev" aria-hidden>
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <>
          <ul className="guide__list">
            {ORDER.map((key) => {
              const [icon, name, effect] = t.gestures[key];
              const tryable = TRYABLE.has(key);
              const content = (
                <>
                  <span className="guide__icon" aria-hidden>
                    {icon}
                  </span>
                  <span className="guide__text">
                    <span className="guide__name">{name}</span>
                    <span className="guide__effect">{effect}</span>
                  </span>
                </>
              );
              return (
                <li key={key} className={active === key ? 'is-active' : ''}>
                  {tryable ? (
                    <button className="guide__row" onClick={() => onTry(key)}>
                      {content}
                    </button>
                  ) : (
                    <div className="guide__row">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="guide__foot">{t.guideTryHint}</p>
        </>
      )}
    </aside>
  );
}
