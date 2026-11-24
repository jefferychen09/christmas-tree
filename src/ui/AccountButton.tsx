import { useAuth } from '../auth';
import { useLang } from '../i18n';

/** 右上角：没登录时是「登录」，登录后显示用户名 */
export default function AccountButton({ onClick }: { onClick: () => void }) {
  const { user } = useAuth();
  const { t } = useLang();
  const label = user ? user.name : t.login;
  return (
    <button className={`account-btn ${user ? 'is-in' : ''}`} onClick={onClick} title={user ? `${t.account} · ${user.name}` : t.login}>
      <span className="account-btn__icon" aria-hidden>
        👤
      </span>
      <span className="account-btn__label">{label}</span>
    </button>
  );
}
