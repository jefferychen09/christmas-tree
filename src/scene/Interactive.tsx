import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { CONFIG, randomInCube, treeSurfacePoint, type SceneState } from './config';

// 拖动视角时不要误触点击：指针移动超过 6px 就视为拖拽
const isRealClick = (e: ThreeEvent<MouseEvent>) => e.delta <= 6;

const hoverHandlers = {
  onPointerOver: (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
  },
  onPointerOut: () => {
    document.body.style.cursor = '';
  },
};

const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];

// ---------------- 拍立得照片（点击放大）----------------
export const PhotoOrnaments = ({
  state,
  urls,
  onPick,
}: {
  state: SceneState;
  urls: string[];
  onPick: (index: number) => void;
}) => {
  const textures = useTexture(urls);
  const groupRef = useRef<THREE.Group>(null);
  const borderGeometry = useMemo(() => new THREE.PlaneGeometry(1.2, 1.5), []);
  const photoGeometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const hovered = useRef<number | null>(null);

  useMemo(() => {
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      t.needsUpdate = true;
    });
  }, [textures]);

  const data = useMemo(() => {
    // 照片少的时候也保证每张至少出现几次；照片多时全部挂上去
    const count = Math.max(CONFIG.counts.ornaments, Math.min(textures.length, 400));
    return Array.from({ length: count }, (_, i) => {
      const chaosPos = new THREE.Vector3(...randomInCube(70));
      const isBig = Math.random() < 0.2;
      return {
        chaosPos,
        targetPos: new THREE.Vector3(...treeSurfacePoint(0.5)),
        scale: isBig ? 2.2 : 0.8 + Math.random() * 0.6,
        weight: 0.8 + Math.random() * 1.2,
        textureIndex: i % textures.length,
        borderColor: pick(CONFIG.colors.borders),
        currentPos: chaosPos.clone(),
        currentScale: 1,
        chaosRotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
        rotationSpeed: { x: Math.random() - 0.5, y: Math.random() - 0.5, z: Math.random() - 0.5 },
        wobbleOffset: Math.random() * 10,
        wobbleSpeed: 0.5 + Math.random() * 0.5,
      };
    });
  }, [textures]);

  useFrame((root, delta) => {
    if (!groupRef.current) return;
    const formed = state === 'FORMED';
    const t = root.clock.elapsedTime;
    groupRef.current.children.forEach((group, i) => {
      const d = data[i];
      if (!d) return;
      d.currentPos.lerp(formed ? d.targetPos : d.chaosPos, Math.min(1, delta * (formed ? 0.8 * d.weight : 0.5)));
      group.position.copy(d.currentPos);
      const targetScale = d.scale * (hovered.current === i ? 1.35 : 1);
      d.currentScale = THREE.MathUtils.damp(d.currentScale, targetScale, 10, delta);
      group.scale.setScalar(d.currentScale);
      if (formed) {
        lookTarget.set(group.position.x * 2, group.position.y + 0.5, group.position.z * 2);
        group.lookAt(lookTarget);
        group.rotation.x += Math.sin(t * d.wobbleSpeed + d.wobbleOffset) * 0.05;
        group.rotation.z += Math.cos(t * d.wobbleSpeed * 0.8 + d.wobbleOffset) * 0.05;
      } else {
        group.rotation.x += delta * d.rotationSpeed.x;
        group.rotation.y += delta * d.rotationSpeed.y;
        group.rotation.z += delta * d.rotationSpeed.z;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {data.map((d, i) => {
        const tex = textures[d.textureIndex];
        const face = (
          <>
            <mesh geometry={photoGeometry}>
              <meshStandardMaterial map={tex} roughness={0.5} metalness={0} emissive={CONFIG.colors.white} emissiveMap={tex} emissiveIntensity={0.9} />
            </mesh>
            <mesh geometry={borderGeometry} position={[0, -0.15, -0.01]}>
              <meshStandardMaterial color={d.borderColor} roughness={0.9} metalness={0} />
            </mesh>
          </>
        );
        return (
          <group
            key={i}
            rotation={d.chaosRotation}
            onClick={(e) => {
              if (!isRealClick(e)) return;
              e.stopPropagation();
              onPick(d.textureIndex);
            }}
            onPointerOver={(e) => {
              hoverHandlers.onPointerOver(e);
              hovered.current = i;
            }}
            onPointerOut={() => {
              hoverHandlers.onPointerOut();
              if (hovered.current === i) hovered.current = null;
            }}
          >
            <group position={[0, 0, 0.015]}>{face}</group>
            <group position={[0, 0, -0.015]} rotation={[0, Math.PI, 0]}>{face}</group>
          </group>
        );
      })}
    </group>
  );
};

// ---------------- 一个带丝带的礼盒 ----------------
const GiftBox = ({ color, ribbon, bow = false }: { color: string; ribbon: string; bow?: boolean }) => (
  <>
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.3} emissive={color} emissiveIntensity={0.25} />
    </mesh>
    <mesh>
      <boxGeometry args={[1.02, 1.02, 0.18]} />
      <meshStandardMaterial color={ribbon} roughness={0.2} metalness={0.7} emissive={ribbon} emissiveIntensity={0.25} />
    </mesh>
    <mesh>
      <boxGeometry args={[0.18, 1.02, 1.02]} />
      <meshStandardMaterial color={ribbon} roughness={0.2} metalness={0.7} emissive={ribbon} emissiveIntensity={0.25} />
    </mesh>
    {bow && (
      <group position={[0, 0.58, 0]}>
        <mesh rotation={[0, 0, Math.PI / 4]} position={[-0.17, 0, 0]}>
          <torusGeometry args={[0.16, 0.05, 8, 20]} />
          <meshStandardMaterial color={ribbon} roughness={0.2} metalness={0.7} emissive={ribbon} emissiveIntensity={0.3} />
        </mesh>
        <mesh rotation={[0, 0, -Math.PI / 4]} position={[0.17, 0, 0]}>
          <torusGeometry args={[0.16, 0.05, 8, 20]} />
          <meshStandardMaterial color={ribbon} roughness={0.2} metalness={0.7} emissive={ribbon} emissiveIntensity={0.3} />
        </mesh>
      </group>
    )}
  </>
);

// ---------------- 树上的小装饰（礼盒可点击拆开）----------------
export const Decorations = ({ state, onGift }: { state: SceneState; onGift: () => void }) => {
  const groupRef = useRef<THREE.Group>(null);
  const sphereGeometry = useMemo(() => new THREE.SphereGeometry(0.5, 16, 16), []);
  const caneGeometry = useMemo(() => new THREE.CylinderGeometry(0.15, 0.15, 1.2, 8), []);

  const data = useMemo(
    () =>
      Array.from({ length: CONFIG.counts.elements }, () => {
        const chaosPos = new THREE.Vector3(...randomInCube(60));
        const type = Math.floor(Math.random() * 3); // 0 礼盒 1 彩球 2 拐杖糖
        const color = type === 2 ? (Math.random() > 0.5 ? CONFIG.colors.red : CONFIG.colors.white) : pick(CONFIG.colors.giftColors);
        let ribbon = pick(CONFIG.colors.ribbonColors);
        if (ribbon === color) ribbon = '#FFFFFF';
        return {
          type,
          color,
          ribbon,
          scale: type === 0 ? 0.75 + Math.random() * 0.35 : type === 1 ? 0.6 + Math.random() * 0.4 : 0.7 + Math.random() * 0.3,
          chaosPos,
          targetPos: new THREE.Vector3(...treeSurfacePoint(0, 0.95)),
          currentPos: chaosPos.clone(),
          rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
          rotationSpeed: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z: (Math.random() - 0.5) * 2 },
        };
      }),
    [],
  );

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const formed = state === 'FORMED';
    groupRef.current.children.forEach((child, i) => {
      const d = data[i];
      d.currentPos.lerp(formed ? d.targetPos : d.chaosPos, Math.min(1, delta * 1.5));
      child.position.copy(d.currentPos);
      child.rotation.x += delta * d.rotationSpeed.x;
      child.rotation.y += delta * d.rotationSpeed.y;
      child.rotation.z += delta * d.rotationSpeed.z;
    });
  });

  return (
    <group ref={groupRef}>
      {data.map((d, i) => {
        if (d.type === 0) {
          return (
            <group
              key={i}
              scale={d.scale * 0.8}
              rotation={d.rotation}
              onClick={(e) => {
                if (!isRealClick(e)) return;
                e.stopPropagation();
                onGift();
              }}
              {...hoverHandlers}
            >
              <GiftBox color={d.color} ribbon={d.ribbon} />
            </group>
          );
        }
        return (
          <mesh key={i} scale={d.scale} rotation={d.rotation} geometry={d.type === 1 ? sphereGeometry : caneGeometry}>
            <meshStandardMaterial color={d.color} roughness={0.3} metalness={0.4} emissive={d.color} emissiveIntensity={0.2} />
          </mesh>
        );
      })}
    </group>
  );
};

// ---------------- 树下的大礼盒（点击拆礼物）----------------
const PRESENTS = [
  { angle: 0.2, r: 7.5, size: 2.6, color: '#C62828', ribbon: '#FFD700' },
  { angle: 1.0, r: 9.5, size: 1.8, color: '#1565C0', ribbon: '#FFFFFF' },
  { angle: 1.7, r: 7.0, size: 2.2, color: '#FFD700', ribbon: '#C62828' },
  { angle: 2.6, r: 9.0, size: 2.0, color: '#2E7D32', ribbon: '#FFD700' },
  { angle: 3.4, r: 7.5, size: 2.8, color: '#6A1B9A', ribbon: '#FFD54F' },
  { angle: 4.2, r: 9.5, size: 1.7, color: '#FFFFFF', ribbon: '#C62828' },
  { angle: 5.0, r: 7.2, size: 2.3, color: '#D84315', ribbon: '#FFFFFF' },
  { angle: 5.7, r: 9.2, size: 1.9, color: '#00838F', ribbon: '#FFD700' },
];

export const Presents = ({ state, onGift }: { state: SceneState; onGift: () => void }) => {
  const groupRef = useRef<THREE.Group>(null);
  const hovered = useRef<number | null>(null);
  const data = useMemo(
    () =>
      PRESENTS.map((p) => {
        const chaosPos = new THREE.Vector3(...randomInCube(55));
        const y = -CONFIG.tree.height / 2 - 0.6 + p.size / 2;
        return {
          ...p,
          chaosPos,
          targetPos: new THREE.Vector3(p.r * Math.cos(p.angle), y, p.r * Math.sin(p.angle)),
          currentPos: chaosPos.clone(),
          yaw: Math.random() * Math.PI,
          bobOffset: Math.random() * 10,
        };
      }),
    [],
  );

  useFrame((root, delta) => {
    if (!groupRef.current) return;
    const formed = state === 'FORMED';
    const t = root.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      const d = data[i];
      d.currentPos.lerp(formed ? d.targetPos : d.chaosPos, Math.min(1, delta * 1.2));
      child.position.copy(d.currentPos);
      const isHover = hovered.current === i;
      if (isHover) child.position.y += 0.4 + Math.abs(Math.sin(t * 8)) * 0.4;
      child.rotation.y = d.yaw + (formed ? 0 : t * 0.4) + (isHover ? Math.sin(t * 20) * 0.08 : 0);
      if (!formed) child.rotation.x = t * 0.3 + d.bobOffset;
      else child.rotation.x = THREE.MathUtils.damp(child.rotation.x % (Math.PI * 2), 0, 4, delta);
    });
  });

  return (
    <group ref={groupRef}>
      {data.map((d, i) => (
        <group
          key={i}
          scale={d.size}
          onClick={(e) => {
            if (!isRealClick(e)) return;
            e.stopPropagation();
            onGift();
          }}
          onPointerOver={(e) => {
            hoverHandlers.onPointerOver(e);
            hovered.current = i;
          }}
          onPointerOut={() => {
            hoverHandlers.onPointerOut();
            hovered.current = null;
          }}
        >
          <GiftBox color={d.color} ribbon={d.ribbon} bow />
        </group>
      ))}
    </group>
  );
};
