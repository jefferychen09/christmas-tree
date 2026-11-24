import { useEffect, useRef, useState } from 'react';
import { api, thumbSrc, type SharedPhoto } from '../api';
import { errorText, useLang } from '../i18n';
import { fileToShare, type SharePhoto } from '../utils/image';
import { useEscape } from './useEscape';

interface Props {
  onClose: () => void;
  /** 照片有增删：让大家的树重新加载 */
  onChanged: () => void;
}

type Pending = SharePhoto & { key: number };

/** 分享照片到大家的树，并管理自己分享过的照片 */
export default function ShareModal({ onClose, onChanged }: Props) {
  const { t } = useLang();
  const [pending, setPending] = useState<Pending[]>([]);
  const [mine, setMine] = useState<SharedPhoto[] | null>(null);
  const [limit, setLimit] = useState(40);
  const [phase, setPhase] = useState<'idle' | 'processing' | 'uploading'>('idle');
  const [progress, setProgress] = useState({ at: 0, of: 0 });
  const [done, setDone] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextKey = useRef(0);

  const close = () => phase !== 'uploading' && onClose();
  useEscape(close);

  useEffect(() => {
    let alive = true;
    api
      .myPhotos()
      .then((r) => {
        if (!alive) return;
        setMine(r.photos);
        setLimit(r.limit);
      })
      .catch((err) => alive && setError(errorText(t, err)));
    return () => {
      alive = false;
    };
  }, []); // 只在打开时读一次

  const room = Math.max(0, limit - (mine?.length ?? 0) - pending.length);

  const addFiles = async (files: FileList | null) => {
    const images = Array.from(files ?? []).filter((f) => f.type.startsWith('image/'));
    if (!images.length) return;
    setError(null);
    setDone(0);
    if (images.length > room) setError(t.errors.limit_reached);
    setPhase('processing');
    const ready: Pending[] = [];
    let failed = false;
    for (const file of images.slice(0, room)) {
      try {
        ready.push({ ...(await fileToShare(file)), key: nextKey.current++ });
      } catch {
        failed = true;
      }
    }
    setPending((list) => [...list, ...ready]);
    if (failed) setError(t.errors.bad_image);
    setPhase('idle');
  };

  const upload = async () => {
    if (!pending.length || phase !== 'idle') return;
    const queue = [...pending];
    setPhase('uploading');
    setError(null);
    setDone(0);
    let ok = 0;
    for (let i = 0; i < queue.length; i++) {
      setProgress({ at: i + 1, of: queue.length });
      try {
        const { photo } = await api.upload(queue[i].full, queue[i].thumb);
        ok++;
        setMine((list) => [photo, ...(list ?? [])]);
        setPending((list) => list.filter((p) => p.key !== queue[i].key));
      } catch (err) {
        setError(errorText(t, err));
        break;
      }
    }
    setPhase('idle');
    setDone(ok);
    if (ok) onChanged();
  };

  const remove = async (id: number) => {
    setConfirmId(null);
    setError(null);
    try {
      await api.remove(id);
      setMine((list) => list?.filter((p) => p.id !== id) ?? null);
      onChanged();
    } catch (err) {
      setError(errorText(t, err));
    }
  };

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="sheet sheet--wide glass" role="dialog" aria-modal="true" aria-labelledby="share-title">
        <button className="icon-btn modal__close" onClick={close} disabled={phase === 'uploading'} aria-label={t.close}>
          ×
        </button>
        <h2 id="share-title" className="sheet__title">
          {t.shareTitle}
        </h2>
        <p className="sheet__warn">{t.sharePublicNote}</p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />

        {pending.length > 0 && (
          <div className="thumbs">
            {pending.map((p) => (
              <div className="thumb" key={p.key}>
                <img src={p.preview} alt="" />
                {phase !== 'uploading' && (
                  <button
                    className="thumb__x"
                    onClick={() => setPending((list) => list.filter((x) => x.key !== p.key))}
                    aria-label={t.remove}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="composer__actions">
          <button className="btn btn--ghost" onClick={() => inputRef.current?.click()} disabled={phase !== 'idle' || room === 0}>
            {phase === 'processing' ? t.processing : pending.length ? t.addMore : t.choosePhotos}
          </button>
          <button className="btn btn--gold" onClick={upload} disabled={!pending.length || phase !== 'idle'}>
            {phase === 'uploading' ? t.uploading(progress.at, progress.of) : t.shareUpload(pending.length)}
          </button>
        </div>
        {error && (
          <p className="composer__err" role="alert">
            {error}
          </p>
        )}
        {done > 0 && !error && (
          <p className="sheet__ok" role="status">
            {t.shareDone(done)}
          </p>
        )}

        <div className="sheet__section">
          <h3 className="sheet__sub">{t.myPhotos(mine?.length ?? 0, limit)}</h3>
          {mine === null ? (
            <p className="sheet__note">{t.working}</p>
          ) : mine.length === 0 ? (
            <p className="sheet__note">{t.myPhotosEmpty}</p>
          ) : (
            <div className="thumbs">
              {mine.map((p) => (
                <div className="thumb" key={p.id}>
                  <img src={thumbSrc(p)} alt="" />
                  {confirmId === p.id ? (
                    <div className="thumb__confirm">
                      <button className="thumb__yes" onClick={() => remove(p.id)}>
                        {t.deletePhoto}
                      </button>
                      <button className="thumb__no" onClick={() => setConfirmId(null)}>
                        {t.cancel}
                      </button>
                    </div>
                  ) : (
                    <button className="thumb__x" onClick={() => setConfirmId(p.id)} aria-label={t.deletePhoto}>
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
