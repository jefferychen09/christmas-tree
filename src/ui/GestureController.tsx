import { useEffect, useRef, type MutableRefObject } from 'react';
import { GestureRecognizer, FilesetResolver, DrawingUtils, type NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { GestureMotion, SceneState } from '../scene/config';
import type { GestureKey } from '../i18n';

// 模型和 wasm 都从自己的网站加载（public/mediapipe/），不依赖 Google / jsDelivr，国内也能用。
// wasm 由 scripts/copy-mediapipe.mjs 在 dev/build 前从 node_modules 复制，版本自动一致。
const asset = (path: string) => new URL(`${import.meta.env.BASE_URL}mediapipe/${path}`, window.location.href).href;
const WASM_URL = asset('wasm');
const MODEL_URL = asset('gesture_recognizer.task');

export type GestureStatus =
  | { kind: 'loading' | 'camera' | 'ready' | 'tracking' | 'denied' }
  | { kind: 'error'; msg: string };

/** 一次性动作手势（保持一小会儿才触发，触发后要换手势才能再次触发） */
export type ActionGesture = 'Pointing_Up' | 'Victory' | 'Thumb_Up' | 'Thumb_Down' | 'ILoveYou';
const ACTIONS: ActionGesture[] = ['Pointing_Up', 'Victory', 'Thumb_Up', 'Thumb_Down', 'ILoveYou'];

const HOLD_FRAMES_STATE = 4; // 握拳/张开手掌：约 0.13 秒
const HOLD_FRAMES_ACTION = 8; // 动作手势：约 0.27 秒，防止误触
const ACTION_COOLDOWN_MS = 1200;

interface Props {
  motion: MutableRefObject<GestureMotion>;
  onGesture: (s: SceneState) => void;
  onAction: (g: ActionGesture) => void;
  onDetect: (g: GestureKey | null) => void;
  onStatus: (s: GestureStatus) => void;
  debug: boolean;
}

const dist = (a: NormalizedLandmark, b: NormalizedLandmark) => Math.hypot(a.x - b.x, a.y - b.y);

/** 手指是否弯曲：指尖比第二关节更靠近手腕 */
const folded = (lm: NormalizedLandmark[], tip: number, pip: number) => dist(lm[0], lm[tip]) < dist(lm[0], lm[pip]);

/**
 * 捏合手势：中指、无名指、小指弯曲，食指伸出。
 * 返回拇指尖与食指尖的距离（按手掌大小归一化），不是捏合姿势则返回 null。
 */
const pinchRatio = (lm: NormalizedLandmark[]) => {
  if (!folded(lm, 12, 10) || !folded(lm, 16, 14) || !folded(lm, 20, 18) || folded(lm, 8, 6)) return null;
  return dist(lm[4], lm[8]) / Math.max(dist(lm[0], lm[9]), 1e-3);
};

const deadZone = (v: number, zone: number) => (Math.abs(v) < zone ? 0 : v - Math.sign(v) * zone);

/** 摄像头手势控制：只有在用户点了「手势控制」按钮后才挂载 */
export default function GestureController({ motion, onGesture, onAction, onDetect, onStatus, debug }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 用 ref 保存回调和 debug，避免它们变化时重新下载模型
  const cb = useRef({ onGesture, onAction, onDetect, onStatus, debug });
  cb.current = { onGesture, onAction, onDetect, onStatus, debug };

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    let recognizer: GestureRecognizer | null = null;
    let stream: MediaStream | null = null;
    let lastVideoTime = -1;
    let current: GestureKey | 'None' = 'None';
    let holdFrames = 0;
    let lastActionAt = 0;
    let lastDetected: GestureKey | null = null;
    let lastStatus = '';

    const status = (s: GestureStatus) => {
      const key = JSON.stringify(s);
      if (key !== lastStatus) {
        lastStatus = key;
        cb.current.onStatus(s);
      }
    };
    const detect = (g: GestureKey | null) => {
      if (g !== lastDetected) {
        lastDetected = g;
        cb.current.onDetect(g);
      }
    };
    const stopMotion = () => {
      motion.current.yaw = 0;
      motion.current.pitch = 0;
      motion.current.zoom = 0;
    };

    const loop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (cancelled || !recognizer || !video || !canvas) return;
      if (video.videoWidth > 0 && video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        const results = recognizer.recognizeForVideo(video, performance.now());
        const { debug, onGesture, onAction } = cb.current;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (debug) {
            const du = new DrawingUtils(ctx);
            for (const lm of results.landmarks) {
              du.drawConnectors(lm, GestureRecognizer.HAND_CONNECTIONS, { color: '#FFD700', lineWidth: 2 });
              du.drawLandmarks(lm, { color: '#FF0000', lineWidth: 1 });
            }
          }
        }

        const lm = results.landmarks[0];
        if (!lm) {
          stopMotion();
          current = 'None';
          holdFrames = 0;
          detect(null);
          status({ kind: 'ready' });
        } else {
          status({ kind: 'tracking' });
          const top = results.gestures[0]?.[0];
          const pinch = pinchRatio(lm);
          let g: GestureKey | 'None' = top && top.score > 0.5 && top.categoryName !== 'None' ? (top.categoryName as GestureKey) : 'None';
          if (g === 'None' && pinch !== null) g = 'Pinch';

          if (g === current) holdFrames++;
          else {
            current = g;
            holdFrames = 1;
          }

          // --- 连续控制：旋转 / 俯仰 / 缩放 ---
          if (g === 'Pinch' && pinch !== null) {
            // 捏紧（<0.25）拉远，张开（>0.45）拉近
            motion.current.zoom = pinch < 0.25 ? -0.7 : pinch > 0.45 ? 0.7 : 0;
            motion.current.yaw = 0;
            motion.current.pitch = 0;
          } else {
            motion.current.zoom = 0;
            // 画面是镜像的：手往左移，树往左转
            const yaw = deadZone(0.5 - lm[0].x, 0.07) * 0.15;
            const pitch = deadZone(lm[9].y - 0.5, 0.15) * 0.05;
            motion.current.yaw = yaw;
            motion.current.pitch = pitch;
          }

          // 面板里高亮当前手势
          let shown: GestureKey | null = g === 'None' ? null : g;
          if (!shown && motion.current.yaw !== 0) shown = 'MoveX';
          if (!shown && motion.current.pitch !== 0) shown = 'MoveY';
          detect(shown);

          // --- 状态手势：握拳聚合、张开散开 ---
          if (holdFrames >= HOLD_FRAMES_STATE) {
            if (g === 'Closed_Fist') onGesture('FORMED');
            if (g === 'Open_Palm') onGesture('CHAOS');
          }

          // --- 动作手势：触发一次 ---
          const now = performance.now();
          if (
            holdFrames === HOLD_FRAMES_ACTION &&
            ACTIONS.includes(g as ActionGesture) &&
            now - lastActionAt > ACTION_COOLDOWN_MS
          ) {
            lastActionAt = now;
            onAction(g as ActionGesture);
          }
        }
      }
      raf = requestAnimationFrame(loop);
    };

    (async () => {
      try {
        status({ kind: 'loading' });
        const vision = await FilesetResolver.forVisionTasks(WASM_URL);
        recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numHands: 1,
        });
        if (cancelled) return recognizer.close();
        status({ kind: 'camera' });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        status({ kind: 'ready' });
        loop();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        status(/Permission|NotAllowed|denied/i.test(msg) ? { kind: 'denied' } : { kind: 'error', msg });
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      recognizer?.close();
      stopMotion();
      cb.current.onDetect(null);
    };
  }, [motion]);

  return (
    <div className={`camera ${debug ? 'camera--show' : ''}`}>
      <video ref={videoRef} playsInline muted autoPlay />
      <canvas ref={canvasRef} />
    </div>
  );
}
