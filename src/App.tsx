import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import Experience from './scene/Experience';
import type { GestureMotion, SceneState } from './scene/config';
import { getDefaultGifts, type PhotoItem } from './gifts';
import { LangToggle, useLang, type GestureKey } from './i18n';
import Welcome from './ui/Welcome';
import PhotoModal from './ui/PhotoModal';
import GiftModal from './ui/GiftModal';
import Celebration from './ui/Celebration';
import GestureGuide from './ui/GestureGuide';
import type { ActionGesture, GestureStatus } from './ui/GestureController';

// 手势模块按需加载（只有点了「手势控制」才下载 MediaPipe）
const GestureController = lazy(() => import('./ui/GestureController'));
// 在线预览版无法使用摄像头，构建时可用 VITE_DISABLE_GESTURES=1 关闭手势按钮
const GESTURES_ENABLED = import.meta.env.VITE_DISABLE_GESTURES !== '1';
const CELEBRATE_MS = 8000;

type Mode = 'default' | 'upload';

export default function App() {
  const { t } = useLang();
  const defaultGifts = useMemo(() => getDefaultGifts(), []);
  const [mode, setMode] = useState<Mode | null>(null);
  const [uploads, setUploads] = useState<PhotoItem[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [sceneState, setSceneState] = useState<SceneState>('CHAOS');
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftAgain, setGiftAgain] = useState(0);
  const [celebrateId, setCelebrateId] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [gestureOn, setGestureOn] = useState(false);
  const [debug, setDebug] = useState(false);
  const [status, setStatus] = useState<GestureStatus | null>(null);
  const [activeGesture, setActiveGesture] = useState<GestureKey | null>(null);
  const motion = useRef<GestureMotion>({ yaw: 0, pitch: 0, zoom: 0 });

  const treePhotos = mode === 'upload' ? uploads : defaultGifts;
  const photoUrls = useMemo(() => treePhotos.map((p) => p.url), [treePhotos]);

  const start = (next: Mode, photos?: PhotoItem[]) => {
    if (photos) setUploads(photos);
    setMode(next);
    setShowWelcome(false);
    setSceneState('CHAOS');
    setTimeout(() => setSceneState('FORMED'), 600);
  };

  const celebrate = useCallback(() => setCelebrateId((n) => n + 1), []);
  useEffect(() => {
    if (!celebrateId) return;
    setCelebrating(true);
    const timer = setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    return () => clearTimeout(timer);
  }, [celebrateId]);

  const onPhotoClick = useCallback((i: number) => setPhotoIndex(i), []);
  const onGiftClick = useCallback(() => setGiftOpen(true), []);
  const closeGift = useCallback(() => setGiftOpen(false), []);
  const modalOpen = showWelcome || photoIndex !== null || giftOpen;

  // 手势（或说明面板里点击）触发的一次性动作。用 ref 读最新状态，避免回调频繁变化
  const live = useRef({ showWelcome, photoIndex, giftOpen, count: treePhotos.length });
  live.current = { showWelcome, photoIndex, giftOpen, count: treePhotos.length };
  const onAction = useCallback(
    (g: ActionGesture) => {
      const s = live.current;
      if (s.showWelcome) return;
      switch (g) {
        case 'Pointing_Up':
          setPhotoIndex(null);
          setGiftOpen(true);
          break;
        case 'Victory':
          if (!s.count) break;
          setGiftOpen(false);
          setPhotoIndex(Math.floor(Math.random() * s.count));
          break;
        case 'Thumb_Up':
          if (s.photoIndex !== null) setPhotoIndex((s.photoIndex + 1) % s.count);
          else if (s.giftOpen) setGiftAgain((n) => n + 1);
          break;
        case 'Thumb_Down':
          setPhotoIndex(null);
          setGiftOpen(false);
          break;
        case 'ILoveYou':
          celebrate();
          break;
      }
    },
    [celebrate],
  );

  const onTryGesture = useCallback(
    (g: GestureKey) => {
      if (g === 'Closed_Fist') setSceneState('FORMED');
      else if (g === 'Open_Palm') setSceneState('CHAOS');
      else onAction(g as ActionGesture);
    },
    [onAction],
  );

  const statusText = (() => {
    if (!status) return '';
    switch (status.kind) {
      case 'loading':
        return t.statusLoading;
      case 'camera':
        return t.statusCamera;
      case 'ready':
        return t.statusReady;
      case 'tracking':
        return t.statusTracking;
      case 'denied':
        return t.statusDenied;
      case 'error':
        return t.statusError(status.msg);
    }
  })();
  const statusFailed = status?.kind === 'denied' || status?.kind === 'error';

  return (
    <div className="app">
      <div className={`stage ${modalOpen ? 'stage--dim' : ''}`}>
        <Canvas dpr={[1, 2]} gl={{ toneMapping: THREE.ReinhardToneMapping }}>
          <Experience
            sceneState={sceneState}
            motion={motion}
            celebrating={celebrating}
            onStarClick={celebrate}
            photoUrls={photoUrls}
            onPhotoClick={onPhotoClick}
            onGiftClick={onGiftClick}
          />
        </Canvas>
      </div>

      <Celebration id={celebrateId} />

      {gestureOn && (
        <Suspense fallback={null}>
          <GestureController
            motion={motion}
            onGesture={setSceneState}
            onAction={onAction}
            onDetect={setActiveGesture}
            onStatus={setStatus}
            debug={debug && !statusFailed}
          />
        </Suspense>
      )}

      <LangToggle />

      {!showWelcome && (
        <>
          <div className="hud hud--hint">
            <span>{t.hintPhoto}</span>
            <span>{t.hintGift}</span>
            <span>{t.hintStar}</span>
            <span>{t.hintDrag}</span>
          </div>

          <div className="hud hud--stats">
            <p className="stat__label">{mode === 'upload' ? t.statMemories : t.statGifts}</p>
            <p className="stat__value">
              {treePhotos.length} <span>{mode === 'upload' ? t.unitPhotos : t.unitGifts}</span>
            </p>
          </div>

          {gestureOn && statusText && <div className={`hud hud--status ${statusFailed ? 'is-error' : ''}`}>{statusText}</div>}

          {gestureOn && <GestureGuide active={activeGesture} onTry={onTryGesture} />}

          <div className="hud hud--buttons">
            <button className="btn btn--ghost btn--sm" onClick={() => setShowWelcome(true)}>
              {t.changePhotos}
            </button>
            {GESTURES_ENABLED && (
              <button
                className={`btn btn--sm ${gestureOn ? 'btn--gold' : 'btn--ghost'}`}
                onClick={() => {
                  setGestureOn((v) => !v);
                  setDebug(false);
                  setStatus(null);
                  setActiveGesture(null);
                }}
                title={t.gestureTip}
              >
                {gestureOn ? t.gestureOff : t.gestureOn}
              </button>
            )}
            {gestureOn && (
              <button className={`btn btn--sm ${debug ? 'btn--gold' : 'btn--ghost'}`} onClick={() => setDebug((v) => !v)}>
                {debug ? t.cameraHide : t.cameraShow}
              </button>
            )}
            <button className="btn btn--gold btn--main" onClick={() => setSceneState((s) => (s === 'CHAOS' ? 'FORMED' : 'CHAOS'))}>
              {sceneState === 'CHAOS' ? t.assemble : t.scatter}
            </button>
          </div>
        </>
      )}

      {showWelcome && (
        <Welcome
          initialUploads={uploads}
          onUseDefault={() => start('default')}
          onUseUploads={(photos) => start('upload', photos)}
          onClose={mode ? () => setShowWelcome(false) : undefined}
        />
      )}

      {photoIndex !== null && (
        <PhotoModal photos={treePhotos} index={photoIndex} onChange={setPhotoIndex} onClose={() => setPhotoIndex(null)} />
      )}

      {giftOpen && <GiftModal gifts={defaultGifts} onClose={closeGift} againSignal={giftAgain} />}
    </div>
  );
}
