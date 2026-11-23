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
import GreetingCard from './ui/GreetingCard';
import CardComposer from './ui/CardComposer';
import { cardHash, readCardFromHash, type Card } from './card';
import { IS_TOUCH } from './device';

// 手势模块按需加载（只有点了「手势控制」才下载 MediaPipe）
const GestureController = lazy(() => import('./ui/GestureController'));
// 在线预览版无法使用摄像头，构建时可用 VITE_DISABLE_GESTURES=1 关闭手势按钮
const GESTURES_ENABLED = import.meta.env.VITE_DISABLE_GESTURES !== '1';
const CELEBRATE_MS = 8000;

type Mode = 'default' | 'upload';

type CardView = 'hidden' | 'sealed' | 'open';
const ENVELOPE_DELAY = 1800; // 树聚合好之后再出现信封

export default function App() {
  const { t, setLang } = useLang();
  const defaultGifts = useMemo(() => getDefaultGifts(), []);
  // 通过贺卡链接打开时：跳过欢迎页，直接用默认礼品装饰
  const [card, setCard] = useState<Card | null>(readCardFromHash);
  const [cardView, setCardView] = useState<CardView>('hidden');
  const [composerOpen, setComposerOpen] = useState(false);
  const [quietCelebrate, setQuietCelebrate] = useState(false);
  const [mode, setMode] = useState<Mode | null>(() => (card ? 'default' : null));
  const [uploads, setUploads] = useState<PhotoItem[]>([]);
  const [showWelcome, setShowWelcome] = useState(() => !card);
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

  // 收到贺卡：语言跟随写卡人，树聚合，稍后出现信封。链接在当前页面里变化（点「打开看看」）也走这里
  useEffect(() => {
    if (!card) return;
    setLang(card.lang, false);
    setShowWelcome(false);
    setPhotoIndex(null);
    setGiftOpen(false);
    setCardView('hidden');
    setMode((m) => m ?? 'default');
    setSceneState('CHAOS');
    const form = setTimeout(() => setSceneState('FORMED'), 600);
    const env = setTimeout(() => setCardView('sealed'), ENVELOPE_DELAY);
    return () => {
      clearTimeout(form);
      clearTimeout(env);
    };
  }, [card]);

  useEffect(() => {
    const onHash = () => {
      const next = readCardFromHash();
      if (next) {
        setComposerOpen(false);
        setCard(next);
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const celebrate = useCallback(() => {
    setQuietCelebrate(false);
    setCelebrateId((n) => n + 1);
  }, []);
  const onCardOpened = useCallback(() => {
    setQuietCelebrate(true);
    setCelebrateId((n) => n + 1);
  }, []);
  const closeCard = useCallback(() => setCardView('hidden'), []);
  const openComposer = useCallback(() => {
    setCardView('hidden');
    setShowWelcome(false);
    setComposerOpen(true);
    // 从欢迎页直接来写贺卡：先用默认礼品把树装好，关掉贺卡后能看到树
    if (!mode) {
      setMode('default');
      setSceneState('FORMED');
    }
  }, [mode]);
  const closeComposer = useCallback(() => setComposerOpen(false), []);
  // 「打开看看」：把地址换成贺卡链接（不新增历史记录），然后按收件人的视角重新播放
  const previewCard = useCallback((next: Card) => {
    history.replaceState(null, '', `#${cardHash(next)}`);
    setComposerOpen(false);
    setCard(readCardFromHash()); // 与收件人读到的完全一致（去掉首尾空格等）
  }, []);
  useEffect(() => {
    if (!celebrateId) return;
    setCelebrating(true);
    const timer = setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    return () => clearTimeout(timer);
  }, [celebrateId]);

  const onPhotoClick = useCallback((i: number) => setPhotoIndex(i), []);
  const onGiftClick = useCallback(() => setGiftOpen(true), []);
  const closeGift = useCallback(() => setGiftOpen(false), []);
  const modalOpen = showWelcome || photoIndex !== null || giftOpen || composerOpen || cardView !== 'hidden';

  // 手势（或说明面板里点击）触发的一次性动作。用 ref 读最新状态，避免回调频繁变化
  const blocking = showWelcome || composerOpen || cardView !== 'hidden';
  const live = useRef({ blocking, photoIndex, giftOpen, count: treePhotos.length });
  live.current = { blocking, photoIndex, giftOpen, count: treePhotos.length };
  const onAction = useCallback(
    (g: ActionGesture) => {
      const s = live.current;
      if (s.blocking) return;
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
        <Canvas dpr={[1, IS_TOUCH ? 1.5 : 2]} gl={{ toneMapping: THREE.ReinhardToneMapping }}>
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

      <Celebration id={celebrateId} quiet={quietCelebrate} />

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
            <span>{IS_TOUCH ? t.hintDragTouch : t.hintDrag}</span>
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
            {card && (
              <button className="btn btn--ghost btn--sm" onClick={() => setCardView('open')}>
                {t.reopenCard}
              </button>
            )}
            <button className="btn btn--ghost btn--sm" onClick={openComposer}>
              {t.sendCard}
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
          onWriteCard={openComposer}
          onClose={mode ? () => setShowWelcome(false) : undefined}
        />
      )}

      {card && cardView !== 'hidden' && (
        <GreetingCard
          key={cardView}
          card={card}
          sealed={cardView === 'sealed'}
          onOpened={onCardOpened}
          onClose={closeCard}
          onMakeOwn={openComposer}
        />
      )}

      {composerOpen && <CardComposer initial={null} onClose={closeComposer} onPreview={previewCard} />}

      {photoIndex !== null && (
        <PhotoModal photos={treePhotos} index={photoIndex} onChange={setPhotoIndex} onClose={() => setPhotoIndex(null)} />
      )}

      {giftOpen && <GiftModal gifts={defaultGifts} onClose={closeGift} againSignal={giftAgain} />}
    </div>
  );
}
