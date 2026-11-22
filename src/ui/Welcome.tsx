import { useRef, useState } from 'react';
import type { PhotoItem } from '../gifts';
import { filesToPhotos } from '../utils/image';
import { useLang } from '../i18n';

interface Props {
  initialUploads: PhotoItem[];
  onUseDefault: () => void;
  onUseUploads: (photos: PhotoItem[]) => void;
  onClose?: () => void;
}

export default function Welcome({ initialUploads, onUseDefault, onUseUploads, onClose }: Props) {
  const [uploads, setUploads] = useState<PhotoItem[]>(initialUploads);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLang();

  const addFiles = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    const photos = await filesToPhotos(Array.from(files));
    setUploads((prev) => [...prev, ...photos]);
    setBusy(false);
  };

  const removeAt = (i: number) => setUploads((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <div className="welcome">
      <div className="welcome__card">
        {onClose && (
          <button className="icon-btn welcome__close" onClick={onClose} aria-label={t.close}>
            ×
          </button>
        )}
        <p className="eyebrow">{t.eyebrow}</p>
        <h1 className="title">Merry Christmas</h1>
        <p className="subtitle">{t.subtitle}</p>

        <div className="choices">
          {/* 上传照片 */}
          <div
            className={`choice choice--upload ${dragging ? 'is-dragging' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
          >
            <div className="choice__icon">📷</div>
            <h2>{t.uploadTitle}</h2>
            <p>{t.uploadDesc}</p>

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

            {uploads.length > 0 && (
              <div className="thumbs">
                {uploads.slice(0, 11).map((p, i) => (
                  <div className="thumb" key={i}>
                    <img src={p.url} alt={p.name || ''} />
                    <button className="thumb__x" onClick={() => removeAt(i)} aria-label={t.remove}>
                      ×
                    </button>
                  </div>
                ))}
                {uploads.length > 11 && <div className="thumb thumb--more">+{uploads.length - 11}</div>}
              </div>
            )}

            <div className="choice__actions">
              <button className="btn btn--ghost" onClick={() => inputRef.current?.click()} disabled={busy}>
                {busy ? t.processing : uploads.length ? t.addMore : t.choosePhotos}
              </button>
              <button className="btn btn--gold" disabled={uploads.length === 0 || busy} onClick={() => onUseUploads(uploads)}>
                {t.decorateWith(uploads.length)}
              </button>
            </div>
            <p className="hint">{t.uploadHint}</p>
          </div>

          {/* 默认礼品 */}
          <div className="choice choice--default">
            <div className="choice__icon">🎁</div>
            <h2>{t.defaultTitle}</h2>
            <p>{t.defaultDesc}</p>
            <div className="choice__actions">
              <button className="btn btn--gold" onClick={onUseDefault}>
                {t.start}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
