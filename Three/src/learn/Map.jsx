import { useRef } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { OrbitControls, MeshDistortMaterial } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';

export default function Map() {
  return (
    <div className='w-screen h-screen overflow-hidden z-0 bg-gray-950'>
      <Canvas>
        <Scene />
      </Canvas>
    </div>
  );
}

function Scene() {
  const meshRef = useRef();
  const luminanceThreshold = 0.5;
  const luminanceSmoothing = 0.9;
  const height = 800;

  const texture = useLoader(THREE.TextureLoader, '/Map(01).webp');
  const alphaTexture = useLoader(THREE.TextureLoader, '/Map(01).webp');
  const aoTexture = useLoader(THREE.TextureLoader, '/Map(03).png');

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.rotation.x += delta * 0.5;
    }
  });

  return (
    <>
      <ambientLight intensity={34} />
      <pointLight position={[10, 10, 10]} />
      <mesh ref={meshRef}>
        <sphereGeometry args={[3, 164, 164]} />
        <MeshDistortMaterial
          color={[0.5, 0.9, 0.9]}
          map={texture}
          alphaMap={alphaTexture}
          transparent={true}
          alphaTest={0.1}
          aoMap={aoTexture}
          aoMapIntensity={2}
          speed={1.5}
          distort={0.9}
          radius={0}
        />
      </mesh>
      <OrbitControls />
      <EffectComposer>
        <Bloom 
          luminanceThreshold={luminanceThreshold} 
          luminanceSmoothing={luminanceSmoothing} 
          height={height} 
        />
      </EffectComposer>
    </>
  );
}
