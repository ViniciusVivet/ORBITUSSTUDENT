'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';

function RotatingOrb() {
  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => {
    const m = ref.current;
    if (!m) return;
    m.rotation.y += delta * 0.4;
    m.rotation.x += delta * 0.12;
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        color="#a78bfa"
        emissive="#4c1d95"
        emissiveIntensity={0.45}
        metalness={0.28}
        roughness={0.4}
      />
    </mesh>
  );
}

/** Cena WebGL leve para o painel do modal (fundo do avatar). */
export function ModalAvatar3DBackdrop() {
  return (
    <Canvas
      className="!h-full !w-full min-h-[7rem] min-w-[7rem]"
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 2.35], fov: 42 }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 6, 4]} intensity={1.05} />
      <directionalLight position={[-4, -2, -2]} intensity={0.4} color="#ddd6fe" />
      <RotatingOrb />
    </Canvas>
  );
}
