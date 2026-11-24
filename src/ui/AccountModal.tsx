import { useRef, useState, type FormEvent } from 'react';
import { api, passwordOk } from '../api';
import { useAuth } from '../auth';
import { errorText, useLang } from '../i18n';
import { useEscape } from './useEscape';

/** 账号：改密码、退出登录；管理员还能帮别人重置密码 */
export default function AccountModal({ onClose }: { onClose: () => void }) {
  const { t } = useLang();
  const { user, logout } = useAuth();
  useEscape(onClose);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [target, setTarget] = useState('');
  const [resetBusy, setResetBusy] = useState(false);
  const [resetErr, setResetErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ name: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (pwBusy) return;
    if (!passwordOk(next)) return setPwMsg({ ok: false, text: t.errors.bad_password });
    setPwBusy(true);
    setPwMsg(null);
    try {
      await api.changePassword(current, next);
      setCurrent('');
      setNext('');
      setPwMsg({ ok: true, text: t.passwordChanged });
    } catch (err) {
      setPwMsg({ ok: false, text: errorText(t, err) });
    }
    setPwBusy(false);
  };

  const reset = async (e: FormEvent) => {
    e.preventDefault();
    if (resetBusy || !target.trim()) return;
    setResetBusy(true);
    setResetErr(null);
    setResult(null);
    setCopied(false);
    try {
      setResult(await api.resetPassword(target));
      setTarget('');
    } catch (err) {
      setResetErr(errorText(t, err));
    }
    setResetBusy(false);
  };

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.password);
      setCopied(true);
    } catch {
      resultRef.current?.select();
    }
  };

  const signOut = async () => {
    await logout();
    onClose();
  };

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet glass" role="dialog" aria-modal="true" aria-labelledby="account-title">
        <button className="icon-btn modal__close" onClick={onClose} aria-label={t.close}>
          ×
        </button>
        <h2 id="account-title" className="sheet__title">
          <span aria-hidden>👤 </span>
          {user.name}
          {user.admin && <span className="badge">{t.adminBadge}</span>}
        </h2>

        <form className="sheet__form" onSubmit={changePassword} noValidate>
          <h3 className="sheet__sub">{t.changePassword}</h3>
          {/* 让密码管理器知道这是哪个账号 */}
          <input type="text" name="username" autoComplete="username" value={user.name} readOnly hidden />
          <label className="field">
            <span className="field__label">{t.currentPassword}</span>
            <input
              className="field__input"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field__label">{t.newPassword}</span>
            <input
              className="field__input"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
            <span className="field__hint">{t.passwordHint}</span>
          </label>
          {pwMsg && (
            <p className={pwMsg.ok ? 'sheet__ok' : 'composer__err'} role="status">
              {pwMsg.text}
            </p>
          )}
          <button type="submit" className="btn btn--ghost sheet__submit" disabled={pwBusy || !current || !next}>
            {pwBusy ? t.working : t.changePassword}
          </button>
        </form>

        {user.admin && (
          <form className="sheet__form sheet__section" onSubmit={reset} noValidate>
            <h3 className="sheet__sub">{t.resetTitle}</h3>
            <div className="inline-field">
              <input
                className="field__input"
                value={target}
                placeholder={t.resetPlaceholder}
                aria-label={t.resetPlaceholder}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                onChange={(e) => setTarget(e.target.value)}
              />
              <button type="submit" className="btn btn--ghost" disabled={resetBusy || !target.trim()}>
                {resetBusy ? t.working : t.resetButton}
              </button>
            </div>
            {resetErr && <p className="composer__err">{resetErr}</p>}
            {result && (
              <div className="reset-result">
                <p className="sheet__note">{t.resetDone(result.name)}</p>
                <div className="inline-field">
                  <input
                    ref={resultRef}
                    className="field__input reset-result__pw"
                    value={result.password}
                    readOnly
                    onFocus={(e) => e.target.select()}
                    aria-label={t.resetDone(result.name)}
                  />
                  <button type="button" className="btn btn--gold" onClick={copy}>
                    {copied ? t.copied : t.copyPlain}
                  </button>
                </div>
                <p className="field__hint">{t.resetHint}</p>
              </div>
            )}
          </form>
        )}

        <div className="sheet__section">
          <button className="btn btn--ghost" onClick={signOut}>
            {t.logout}
          </button>
        </div>
      </div>
    </div>
  );
}
