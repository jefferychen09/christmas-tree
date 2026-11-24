import { useEffect, useRef, useState, type FormEvent } from 'react';
import { nameOk, passwordOk, type User } from '../api';
import { useAuth } from '../auth';
import { errorText, useLang } from '../i18n';
import { useEscape } from './useEscape';

interface Props {
  /** 为了分享照片而登录：顶部多一句说明 */
  forSharing?: boolean;
  onClose: () => void;
  onDone: (user: User) => void;
}

/** 登录 / 注册（用户名 + 密码） */
export default function AuthModal({ forSharing, onClose, onDone }: Props) {
  const { t } = useLang();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  useEscape(onClose);

  useEffect(() => {
    nameRef.current?.focus();
  }, [mode]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (mode === 'signup' && !nameOk(name)) return setError(t.errors.bad_name);
    if (mode === 'signup' && !passwordOk(password)) return setError(t.errors.bad_password);
    if (!name.trim() || !password) return setError(t.errors.wrong_login);
    setBusy(true);
    setError(null);
    try {
      onDone(await (mode === 'login' ? login : register)(name, password));
    } catch (err) {
      setError(errorText(t, err));
      setBusy(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === 'login' ? 'signup' : 'login'));
    setError(null);
  };

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet glass" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="icon-btn modal__close" onClick={onClose} aria-label={t.close}>
          ×
        </button>
        <h2 id="auth-title" className="sheet__title">
          {mode === 'login' ? t.loginTitle : t.signupTitle}
        </h2>
        {forSharing && <p className="sheet__lead">{t.loginLead}</p>}

        <form className="sheet__form" onSubmit={submit} noValidate>
          <label className="field">
            <span className="field__label">{t.nameLabel}</span>
            <input
              ref={nameRef}
              className="field__input"
              name="username"
              autoComplete="username"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {mode === 'signup' && <span className="field__hint">{t.nameHint}</span>}
          </label>

          <label className="field">
            <span className="field__label">{t.passwordLabel}</span>
            <span className="field__pw">
              <input
                className="field__input"
                type={show ? 'text' : 'password'}
                name="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="field__eye" onClick={() => setShow((v) => !v)} aria-pressed={show}>
                {show ? t.hidePassword : t.showPassword}
              </button>
            </span>
            {mode === 'signup' && <span className="field__hint">{t.passwordHint}</span>}
          </label>

          {error && (
            <p className="composer__err" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn--gold sheet__submit" disabled={busy}>
            {busy ? t.working : mode === 'login' ? t.login : t.signup}
          </button>
        </form>

        <p className="sheet__switch">
          {mode === 'login' ? t.noAccount : t.haveAccount}{' '}
          <button type="button" className="link-btn" onClick={switchMode}>
            {mode === 'login' ? t.signup : t.login}
          </button>
        </p>
        {mode === 'login' && <p className="sheet__note">{t.forgotHint}</p>}
      </div>
    </div>
  );
}
