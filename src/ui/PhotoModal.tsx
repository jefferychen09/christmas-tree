import { useEffect, useState } from 'react';
import type { PhotoItem } from '../gifts';
import { errorText, photoName, shortDate, useLang } from '../i18n';

interface Props {
  photos: PhotoItem[];
  index: number;
  onChange: (i: number) => void;
  onClose: () => void;
  /** 大家的树：当前用户能不能删这张（上传者本人或管理员） */
  canDelete?: (photo: PhotoItem) => boolean;
  onDelete?: (photo: PhotoItem) => Promise<void>;
}

export default function PhotoModal({ photos, index, onChange, onClose, canDelete, onDelete }: Props) {
  const photo = photos[index];
  const { t, lang } = useLang();
  const shared = photo?.shared;
  const name = shared ? t.sharedBy(shared.by) : photoName(photo, lang);
  const go = (step: number) => onChange((index + step + photos.length) % photos.length);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setConfirming(false);
    setError(null);
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!photo) return null;

  const remove = async () => {
    if (!onDelete || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await onDelete(photo);
    } catch (err) {
      setError(errorText(t, err));
    }
    setDeleting(false);
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="polaroid" key={index} onClick={(e) => e.stopPropagation()}>
        {/* 大图还没下载完时先显示小图 */}
        <img src={photo.url} alt={name} style={photo.thumb ? { backgroundImage: `url(${photo.thumb})` } : undefined} />
        <div className="polaroid__caption">{name || ' '}</div>
        {shared && (
          <div className="polaroid__meta">
            <span>{shortDate(lang, shared.at)}</span>
            {canDelete?.(photo) &&
              (confirming ? (
                <span className="polaroid__confirm">
                  <button className="polaroid__del" onClick={remove} disabled={deleting}>
                    {deleting ? t.working : t.confirmDelete}
                  </button>
                  <button className="polaroid__cancel" onClick={() => setConfirming(false)} disabled={deleting}>
                    {t.cancel}
                  </button>
                </span>
              ) : (
                <button className="polaroid__del" onClick={() => setConfirming(true)}>
                  {t.deletePhoto}
                </button>
              ))}
          </div>
        )}
        {error && <p className="polaroid__err">{error}</p>}
        <button className="icon-btn modal__close" onClick={onClose} aria-label={t.close}>
          ×
        </button>
      </div>
      {photos.length > 1 && (
        <>
          <button className="nav nav--prev" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label={t.prev}>
            ‹
          </button>
          <button className="nav nav--next" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label={t.next}>
            ›
          </button>
          <div className="counter">{index + 1} / {photos.length}</div>
        </>
      )}
    </div>
  );
}
