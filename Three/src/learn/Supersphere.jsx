import { useMemo, useRef, useEffect } from "react";
import * as THREE from 'three';
import { Canvas, extend, useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial, Environment, Lightformer, OrbitControls, Sphere, shaderMaterial } from "@react-three/drei";
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry";
import { useControls } from "leva";

// 2. 定义动态太阳材质 / 2. Define the dynamic sun material
const DynamicSunMaterial = shaderMaterial(
  {
    iTime: 0,
    iResolution: new THREE.Vector3(window.innerWidth, window.innerHeight, 1),
    baseColor: new THREE.Color('#0075f2'),
    highColor: new THREE.Color('#000000'),
    freq1: 0.75, freq2: 2.81, freq3: 4.69, freq4: 1.9, freq5: 5.58,
    amp1: 0.5, amp2: 0.2, amp3: 0.53, amp4: 0.036, amp5: 0.17,
    speed: 0.2,
  },
  `varying vec2 vUv;
   void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
   }`,
  `uniform float iTime;
   uniform vec3 iResolution;
   uniform vec3 baseColor;
   uniform vec3 highColor;
   uniform float freq1; uniform float freq2; uniform float freq3; uniform float freq4; uniform float freq5;
   uniform float amp1; uniform float amp2; uniform float amp3; uniform float amp4; uniform float amp5;
   uniform float speed;
   varying vec2 vUv;
   float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
   float noise(vec2 p){
     vec2 i = floor(p), f = fract(p);
     float a = hash(i + vec2(0.0, 0.0));
     float b = hash(i + vec2(1.0, 0.0));
     float c = hash(i + vec2(0.0, 1.0));
     float d = hash(i + vec2(1.0, 1.0));
     vec2 u = f * f * (3.0 - 2.0 * f);
     return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * 2.0 - 1.0;
   }
   float fbm(vec2 p){
     float total = 0.0;
     total += noise(p * freq1) * amp1;
     total += noise(p * freq2) * amp2;
     total += noise(p * freq3) * amp3;
     total += noise(p * freq4) * amp4;
     total += noise(p * freq5) * amp5;
     return total;
   }
   void main() {
     vec2 uv = vUv * iResolution.xy / min(iResolution.x, iResolution.y);
     uv += iTime * speed;
     float n = fbm(uv);
     float noiseValue = (n + 1.0) * 0.5;
     vec3 color = mix(baseColor, highColor, noiseValue);
     vec3 emissiveColor = color * 2.2;
     gl_FragColor = vec4(emissiveColor, 1.0);
   }`
);
extend({ DynamicSunMaterial });

// 3. 动态太阳球体组件，接收来自 Leva 调试的 baseColor 与 highColor 参数
// 3. Component for rendering a dynamic sun sphere,
// accepting baseColor and highColor parameters from Leva controls.
const SunSphere = ({ baseColor, highColor }) => {
  const materialRef = useRef();
  // 每一帧更新 iTime 以实现材质动画 / Update iTime every frame for animation
  useFrame((_, delta) => {
    if (materialRef.current) materialRef.current.iTime += delta;
  });
  return (
    <mesh>
      <Sphere args={[0.28, 64, 64]}>
        {/* 将 baseColor 与 highColor 转换为 THREE.Color 后传递给材质 */}
        {/* Convert baseColor and highColor to THREE.Color and pass them to the material */}
        <dynamicSunMaterial
          ref={materialRef}
          baseColor={new THREE.Color(baseColor)}
          highColor={new THREE.Color(highColor)}
        />
      </Sphere>
    </mesh>
  );
}

// 4. 创建发光点函数，用于生成发光的小球 / Create a glow point mesh for a glowing effect
function addPoint(x, y, z) {
  const geometry = new THREE.SphereGeometry(0.025, 16, 16);
  const vertexShader = `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  const fragmentShader = `
    varying vec3 vNormal;
    uniform vec3 glowColor;
    uniform float coef;
    uniform float power;
    void main() {
      float intensity = pow(coef - dot(vNormal, vec3(0.0, 0.0, 1.0)), power);
      gl_FragColor = vec4(glowColor, intensity);
    }
  `;
  // 创建自定义 ShaderMaterial，uniform 中的 glowColor 默认初始值会被更新
  // Create a custom ShaderMaterial; the default glowColor uniform will be updated later.
  const material = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color('#f56b01') },
      coef: { value: 0.9 },
      power: { value: 0.2 }
    },
    vertexShader,
    fragmentShader,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  return mesh;
}

// 5. 点环组件，接收来自 Leva 的 glowColor 调试值，以实现点环颜色动画效果
// 5. DotRing component, receiving glowColor from Leva to animate the dots' color.
const DotRing = ({ glowColor }) => {
  const groupRef = useRef();
  // 使用 useRef 保持 dots 数组，确保仅初始化一次
  // Use useRef to store the dots array so that it's only initialized once
  const dotsRef = useRef([]);
  if (dotsRef.current.length === 0) {
    const numDots = 400;
    for (let i = 0; i < numDots; i++) {
      const angle = (i / numDots) * Math.PI * 2;
      const radius = 0.5;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = 0;
      const mesh = addPoint(x, y, z);
      dotsRef.current.push({
        mesh,
        angle,
        offsetX: Math.random() / 5,
        offsetY: Math.random() / 5,
        offsetZ: Math.random() / 5
      });
    }
  }
  // 当 glowColor 改变时更新每个点的材质颜色 / Update each dot's glowColor uniform when glowColor changes
  useEffect(() => {
    const color = new THREE.Color(glowColor);
    dotsRef.current.forEach(dot => {
      dot.mesh.material.uniforms.glowColor.value = color;
    });
  }, [glowColor]);
  // 每一帧更新点位置，制造动画效果 / Update dots' positions every frame for animation
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime() * 1000;
    dotsRef.current.forEach((dot) => {
      const { mesh, angle, offsetX, offsetY } = dot;
      const newX = Math.cos(angle + time / 2000) * 0.6 + offsetX;
      const newY = Math.sin(angle + time / 2000) * 0.6 + offsetY;
      mesh.position.set(newX, newY, 0);
    });
  });
  return (
    <group ref={groupRef} position={[-0.1, -0.1, 0]}>
      {dotsRef.current.map((dot, index) => (
        <primitive key={index} object={dot.mesh} />
      ))}
    </group>
  );
};

// 6. 超球体几何体组件，通过参数 a 与 segments 构建 ParametricGeometry
// 6. SupersphereGeometry component to create a parametric geometry based on parameters a and segments.
const SupersphereGeometry = ({ a = 1, segments = 50 }) => {
  const geometry = useMemo(() => {
    const paramFunc = (u, v, target) => {
      // 将 u, v 转换为角度，并计算超球体点坐标
      // Convert u, v to angles and compute the supersphere coordinates
      const eta = (u - 0.5) * Math.PI;
      const omega = (v - 0.5) * 2 * Math.PI;
      const cosEta = Math.cos(eta), sinEta = Math.sin(eta);
      const cosOmega = Math.cos(omega), sinOmega = Math.sin(omega);
      const x = a * Math.sign(cosEta) * Math.pow(Math.abs(cosEta), 0.5) * Math.sign(cosOmega) * Math.pow(Math.abs(cosOmega), 0.5);
      const y = a * Math.sign(cosEta) * Math.pow(Math.abs(cosEta), 0.5) * Math.sign(sinOmega) * Math.pow(Math.abs(sinOmega), 0.5);
      const z = a * Math.sign(sinEta) * Math.pow(Math.abs(sinEta), 0.5);
      target.set(x, y, z);
    };
    return new ParametricGeometry(paramFunc, segments, segments);
  }, [a, segments]);
  return <primitive object={geometry} attach="geometry" />;
};

// 7. 主组件：Supersphere，通过 Leva 控制面板调整参数，包括 baseColor、highColor 以及 glowColor
// 7. Main component Supersphere, with Leva controls for baseColor, highColor, and glowColor.
const Supersphere = () => {
  // Leva 调试面板参数 / Leva control panel parameters
  const { segments, baseColor, highColor, glowColor } = useControls({
    segments: { value: 100, min: 5, max: 200, step: 5 },
    baseColor: { value: '#0075f2' },
    highColor: { value: '#000000' },
    glowColor: { value: '#f56b01' }
  });
  return (
    <div className="w-screen h-screen bg-gray-900 overflow-hidden z-0">
      <Canvas>
        <OrbitControls />
        <Environment resolution={1024}>
          {/* 灯光组，通过 Lightformer 创建多个灯光效果 */}
          {/* Lighting group using multiple Lightformers */}
          <group rotation={[-Math.PI / 1, 1, 1]}>
            <Lightformer color={[0, 0.5, 0.5]} intensity={1.4} rotation-x={Math.PI / 2} position={[-10, -10, -6]} scale={[250, 400, 90]} />
            <Lightformer color={[0, 0.5, 0.5]} intensity={1.4} rotation={[Math.PI / 2, 1, 2]} position={[0, -10, 1]} scale={[250, 400, 90]} />
            <Lightformer color={[0, 0.6, 0.6]} intensity={1.1} rotation-y={Math.PI / 2} position={[-10, 10, 10]} scale={[250, 400, 90]} />
            <Lightformer color={[0, 0.5, 0.5]} intensity={1.5} rotation-y={-Math.PI / 2} position={[12, 12, 1]} scale={[250, 400, 90]} />
          </group>
        </Environment>
        <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
          <SupersphereGeometry a={1} segments={segments} />
          <MeshTransmissionMaterial
            color='#1b2cf7'
            backside
            samples={6}
            thickness={1}
            chromaticAberration={0.025}
            anisotropy={0}
            distortion={0}
            distortionScale={0.1}
            temporalDistortion={0.1}
            iridescence={1}
            iridescenceIOR={1}
            iridescenceThicknessRange={[0, 350]}
          />
        </mesh>
        {/* 将 baseColor 与 highColor 参数传递给动态太阳组件 */}
        {/* Pass baseColor and highColor parameters to the SunSphere component */}
        <SunSphere baseColor={baseColor} highColor={highColor} />
        {/* 将 glowColor 参数传递给点环组件 */}
        {/* Pass glowColor parameter to the DotRing component */}
        <DotRing glowColor={glowColor} />
      </Canvas>
    </div>
  );
}

export default Supersphere;