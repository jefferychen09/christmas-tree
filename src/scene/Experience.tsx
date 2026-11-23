import { Suspense, useRef, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls, PerspectiveCamera, Sparkles, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { CONFIG, type GestureMotion, type SceneState } from './config';
import { Foliage, FairyLights, TopStar } from './TreeParts';
import { Decorations, PhotoOrnaments, Presents } from './Interactive';

const MIN_DIST = 25;
const MAX_DIST = 130;
const MAX_POLAR = Math.PI / 1.7;

interface Props {
  sceneState: SceneState;
  motion: MutableRefObject<GestureMotion>;
  celebrating: boolean;
  onStarClick: () => void;
  photoUrls: string[];
  onPhotoClick: (index: number) => void;
  onGiftClick: () => void;
}

export default function Experience({ sceneState, motion, celebrating, onStarClick, photoUrls, onPhotoClick, onGiftClick }: Props) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  // 竖屏（手机）时把镜头拉远一些，保证整棵树都能看到
  const aspect = useThree((s) => s.size.width / s.size.height);
  const distance = aspect < 0.8 ? (50 / Math.max(aspect, 0.45)) * 0.64 : 50;

  const camera = useThree((s) => s.camera);

  // 手势：旋转 / 俯仰 / 缩放
  useFrame((_, delta) => {
    const c = controlsRef.current;
    if (!c) return;
    const { yaw, pitch, zoom } = motion.current;
    c.autoRotate = sceneState === 'FORMED' && !yaw && !pitch && !zoom;
    if (yaw) c.setAzimuthalAngle(c.getAzimuthalAngle() + yaw);
    if (pitch) c.setPolarAngle(THREE.MathUtils.clamp(c.getPolarAngle() + pitch, 0.35, MAX_POLAR));
    if (zoom) {
      const offset = camera.position.clone().sub(c.target);
      offset.setLength(THREE.MathUtils.clamp(offset.length() * (1 - zoom * delta), MIN_DIST, MAX_DIST));
      camera.position.copy(c.target).add(offset);
    }
    c.update();
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 3, distance]} fov={45} />
      <OrbitControls
        ref={controlsRef}
        target={[0, -4.5, 0]}
        enablePan={false}
        enableZoom
        minDistance={MIN_DIST}
        maxDistance={MAX_DIST}
        autoRotateSpeed={0.3}
        maxPolarAngle={MAX_POLAR}
      />

      <color attach="background" args={['#000300']} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* 本地生成的环境光（不依赖外网 HDR 文件），给金属材质反光 */}
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={2} color="#FFE0A0" position={[0, 6, -10]} scale={[20, 6, 1]} />
        <Lightformer intensity={1.5} color="#FFFFFF" position={[-10, 2, 5]} rotation-y={Math.PI / 2} scale={[10, 4, 1]} />
        <Lightformer intensity={1} color="#4060FF" position={[10, -2, 5]} rotation-y={-Math.PI / 2} scale={[10, 4, 1]} />
      </Environment>

      <ambientLight intensity={0.4} color="#003311" />
      <pointLight position={[30, 30, 30]} intensity={100} color={CONFIG.colors.warmLight} />
      <pointLight position={[-30, 10, -30]} intensity={50} color={CONFIG.colors.gold} />
      <pointLight position={[0, -20, 10]} intensity={30} color="#ffffff" />

      <group position={[0, -6, 0]}>
        <Foliage state={sceneState} />
        <FairyLights state={sceneState} celebrating={celebrating} />
        <TopStar state={sceneState} onClick={onStarClick} />
        <Decorations state={sceneState} onGift={onGiftClick} />
        <Presents state={sceneState} onGift={onGiftClick} />
        <Suspense fallback={null}>
          {photoUrls.length > 0 && <PhotoOrnaments state={sceneState} urls={photoUrls} onPick={onPhotoClick} />}
        </Suspense>
        <Sparkles count={600} scale={50} size={8} speed={0.4} opacity={0.4} color={CONFIG.colors.silver} />
      </group>

      <EffectComposer>
        <Bloom luminanceThreshold={0.8} luminanceSmoothing={0.1} intensity={1.5} radius={0.5} mipmapBlur />
        <Vignette eskil={false} offset={0.1} darkness={1.2} />
      </EffectComposer>
    </>
  );
}
