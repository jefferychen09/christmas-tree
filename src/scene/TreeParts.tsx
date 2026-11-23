import { useEffect, useMemo, useRef } from 'react';
import { useFrame, extend, type ThreeEvent } from '@react-three/fiber';
import { Float, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { MathUtils } from 'three';
import * as random from 'maath/random';
import { CONFIG, randomInCube, treeSurfacePoint, type SceneState } from './config';

// ---------------- 树叶粒子（原仓库的 shader）----------------
const FoliageMaterial = shaderMaterial(
  { uTime: 0, uColor: new THREE.Color(CONFIG.colors.emerald), uProgress: 0 },
  `uniform float uTime; uniform float uProgress; attribute vec3 aTargetPos; attribute float aRandom;
  varying float vMix;
  float cubicInOut(float t) { return t < 0.5 ? 4.0 * t * t * t : 0.5 * pow(2.0 * t - 2.0, 3.0) + 1.0; }
  void main() {
    vec3 noise = vec3(sin(uTime * 1.5 + position.x), cos(uTime + position.y), sin(uTime * 1.5 + position.z)) * 0.15;
    float t = cubicInOut(uProgress);
    vec3 finalPos = mix(position, aTargetPos + noise, t);
    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    gl_PointSize = (60.0 * (1.0 + aRandom)) / -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
    vMix = t;
  }`,
  `uniform vec3 uColor; varying float vMix;
  void main() {
    float r = distance(gl_PointCoord, vec2(0.5)); if (r > 0.5) discard;
    vec3 finalColor = mix(uColor * 0.3, uColor * 1.2, vMix);
    gl_FragColor = vec4(finalColor, 1.0);
  }`,
);
extend({ FoliageMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    foliageMaterial: JSX.IntrinsicElements['shaderMaterial'] & { uProgress?: number; uTime?: number };
  }
}

export const Foliage = ({ state }: { state: SceneState }) => {
  const materialRef = useRef<THREE.ShaderMaterial & { uTime: number; uProgress: number }>(null);
  const { positions, targetPositions, randoms } = useMemo(() => {
    const count = CONFIG.counts.foliage;
    const positions = random.inSphere(new Float32Array(count * 3), { radius: 25 }) as Float32Array;
    const targetPositions = new Float32Array(count * 3);
    const randoms = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const h = CONFIG.tree.height;
      const y = Math.random() * h - h / 2;
      const r = Math.random() * CONFIG.tree.radius * (1 - (y + h / 2) / h);
      const theta = Math.random() * Math.PI * 2;
      targetPositions.set([r * Math.cos(theta), y, r * Math.sin(theta)], i * 3);
      randoms[i] = Math.random();
    }
    return { positions, targetPositions, randoms };
  }, []);

  useFrame((root, delta) => {
    const m = materialRef.current;
    if (!m) return;
    m.uTime = root.clock.elapsedTime;
    m.uProgress = MathUtils.damp(m.uProgress, state === 'FORMED' ? 1 : 0, 1.5, delta);
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aTargetPos" args={[targetPositions, 3]} />
        <bufferAttribute attach="attributes-aRandom" args={[randoms, 1]} />
      </bufferGeometry>
      <foliageMaterial ref={materialRef} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};

// ---------------- 彩灯 ----------------
export const FairyLights = ({ state, celebrating }: { state: SceneState; celebrating: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const geometry = useMemo(() => new THREE.SphereGeometry(0.8, 8, 8), []);
  const data = useMemo(
    () =>
      Array.from({ length: CONFIG.counts.lights }, () => {
        const chaosPos = new THREE.Vector3(...randomInCube(60));
        return {
          chaosPos,
          targetPos: new THREE.Vector3(...treeSurfacePoint(0.3)),
          color: CONFIG.colors.lights[Math.floor(Math.random() * CONFIG.colors.lights.length)],
          speed: 2 + Math.random() * 3,
          currentPos: chaosPos.clone(),
          timeOffset: Math.random() * 100,
        };
      }),
    [],
  );

  // 彩蛋：彩灯换成粉色/金色的爱心配色，结束后换回来
  useEffect(() => {
    groupRef.current?.children.forEach((child, i) => {
      const color = celebrating ? CONFIG.colors.loveLights[i % CONFIG.colors.loveLights.length] : data[i].color;
      const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
      m.color.set(color);
      m.emissive.set(color);
    });
  }, [celebrating, data]);

  useFrame((root, delta) => {
    if (!groupRef.current) return;
    const formed = state === 'FORMED';
    const t = root.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      const d = data[i];
      d.currentPos.lerp(formed ? d.targetPos : d.chaosPos, Math.min(1, delta * 2));
      const mesh = child as THREE.Mesh;
      mesh.position.copy(d.currentPos);
      const flicker = (Math.sin(t * d.speed * (celebrating ? 2.5 : 1) + d.timeOffset) + 1) / 2;
      (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = formed ? 3 + flicker * 4 : 0.6;
    });
  });

  return (
    <group ref={groupRef}>
      {data.map((d, i) => (
        <mesh key={i} scale={0.15} geometry={geometry}>
          <meshStandardMaterial color={d.color} emissive={d.color} emissiveIntensity={0} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
};

// ---------------- 树顶金星 ----------------
export const TopStar = ({ state, onClick }: { state: SceneState; onClick: () => void }) => {
  const groupRef = useRef<THREE.Group>(null);
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 1.3 : 0.7;
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2; // 第一个尖朝上，星星正着立
      if (i === 0) shape.moveTo(r * Math.cos(a), r * Math.sin(a));
      else shape.lineTo(r * Math.cos(a), r * Math.sin(a));
    }
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.4, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 3 });
    g.center();
    return g;
  }, []);
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.5;
    const s = state === 'FORMED' ? 1 : 0;
    groupRef.current.scale.lerp(target.set(s, s, s), Math.min(1, delta * 3));
  });

  return (
    <group ref={groupRef} position={[0, CONFIG.tree.height / 2 + 1.8, 0]} scale={0}>
      <Float speed={2} rotationIntensity={0} floatIntensity={0.2}>
        <mesh
          geometry={geometry}
          scale={1.15}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            if (e.delta > 6) return;
            e.stopPropagation();
            onClick();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = '';
          }}
        >
          <meshStandardMaterial color={CONFIG.colors.gold} emissive={CONFIG.colors.gold} emissiveIntensity={1.5} roughness={0.1} metalness={1} />
        </mesh>
        <pointLight intensity={30} distance={14} color={CONFIG.colors.warmLight} />
      </Float>
    </group>
  );
};
