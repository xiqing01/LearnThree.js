import { useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, extend } from '@react-three/fiber'
import { OrbitControls, shaderMaterial } from '@react-three/drei'
import { useControls } from 'leva'

// Define custom shader material with uniforms // 定义自定义着色器材质（含 uniforms）
const CustomShaderMaterial = shaderMaterial(
  {
    iTime: 0, // Time // 时间
    iResolution: new THREE.Vector2(window.innerWidth, window.innerHeight), // Resolution // 分辨率
    color1: new THREE.Vector3(0.611765, 0.262745, 0.996078), // Color 1 // 颜色1
    color2: new THREE.Vector3(0.298039, 0.760784, 0.913725), // Color 2 // 颜色2
    color3: new THREE.Vector3(0.062745, 0.078431, 0.600000), // Color 3 // 颜色3
    innerRadius: 0.6,      // Inner radius // 内半径
    noiseScale: 0.65,      // Noise scale // 噪声缩放
    edgeMix1: 0.4,         // Edge mix 1 // 边缘混合1
    edgeMix2: 0.6,         // Edge mix 2 // 边缘混合2
    light1Intensity: 1.0,   // Light1 intensity // 光源1强度
    light1Attenuation: 10.0, // Light1 attenuation // 光源1衰减
    light1Attenuation2: 50.0,// Light1 secondary attenuation // 光源1二次衰减
    light2Intensity: 1.5,   // Light2 intensity // 光源2强度
    light2Attenuation: 5.0,  // Light2 attenuation // 光源2衰减
    bgColor: new THREE.Vector3(0.0, 0.0, 0.0), // Background color // 背景色
    ringOffset: new THREE.Vector2(0.92, 0.5) // Ring offset // 圆环偏移
  },
  // Vertex shader: pass uv to fragment shader // 顶点着色器：传递 uv 坐标
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader: dynamic ring effect with noise and light // 片元着色器：噪声和光照下的动态环形效果
  `
    uniform float iTime;
    uniform vec2 iResolution;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform vec3 color3;
    uniform float innerRadius;
    uniform float noiseScale;
    uniform float edgeMix1;
    uniform float edgeMix2;
    uniform float light1Intensity;
    uniform float light1Attenuation;
    uniform float light1Attenuation2;
    uniform float light2Intensity;
    uniform float light2Attenuation;
    uniform vec3 bgColor;
    uniform vec2 ringOffset;
    varying vec2 vUv;

    vec3 hash33(vec3 p3) {
      p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
      p3 += dot(p3, p3.yxz + 19.19);
      return -1.0 + 2.0 * fract(vec3(p3.x+p3.y, p3.x+p3.z, p3.y+p3.z)*p3.zyx);
    }
    
    float snoise3(vec3 p) {
      const float K1 = 0.333333333;
      const float K2 = 0.166666667;
      vec3 i = floor(p + (p.x+p.y+p.z) * K1);
      vec3 d0 = p - (i - (i.x+i.y+i.z) * K2);
      vec3 e = step(vec3(0.0), d0-d0.yzx);
      vec3 i1 = e * (1.0 - e.zxy);
      vec3 i2 = 1.0 - e.zxy * (1.0 - e);
      vec3 d1 = d0 - (i1 - K2);
      vec3 d2 = d0 - (i2 - K1);
      vec3 d3 = d0 - 0.5;
      vec4 h = max(0.6 - vec4(dot(d0,d0), dot(d1,d1), dot(d2,d2), dot(d3,d3)), 0.0);
      vec4 n = h * h * h * h * vec4(
          dot(d0, hash33(i)),
          dot(d1, hash33(i+i1)),
          dot(d2, hash33(i+i2)),
          dot(d3, hash33(i+1.0))
      );
      return dot(vec4(31.316), n);
    }
    
    vec4 extractAlpha(vec3 colorIn) {
      vec4 colorOut;
      float maxValue = min(max(max(colorIn.r, colorIn.g), colorIn.b), 1.0);
      if(maxValue > 1e-5) {
        colorOut.rgb = colorIn.rgb / maxValue;
        colorOut.a = maxValue;
      } else {
        colorOut = vec4(0.0);
      }
      return colorOut;
    }
    
    float light1(float intensity, float attenuation, float dist) {
      return intensity / (1.0 + dist * attenuation);
    }
    float light2(float intensity, float attenuation, float dist) {
      return intensity / (1.0 + dist * dist * attenuation);
    }
    
    void draw(out vec4 _FragColor, in vec2 vUv) {
      vec2 uv = vUv;
      float ang = atan(uv.y, uv.x);
      float len = length(uv);
      float v0, v1, v2, v3, cl;
      float r0, d0, n0;
      float d;
      
      n0 = snoise3(vec3(uv * noiseScale, iTime * 0.5)) * 0.5 + 0.5;
      r0 = mix(mix(innerRadius, 1.0, edgeMix1), mix(innerRadius, 1.0, edgeMix2), n0);
      d0 = distance(uv, r0 / len * uv);
      v0 = light1(light1Intensity, light1Attenuation, d0) * smoothstep(r0 * 1.05, r0, len);
      cl = cos(ang + iTime * 2.0) * 0.5 + 0.5;
      
      float a = -iTime;
      vec2 pos = vec2(cos(a), sin(a)) * r0;
      d = distance(uv, pos);
      v1 = light2(light2Intensity, light2Attenuation, d) * light1(1.0, light1Attenuation2, d0);
      
      v2 = smoothstep(1.0, mix(innerRadius, 1.0, n0 * 0.5), len);
      v3 = smoothstep(innerRadius, mix(innerRadius, 1.0, 0.5), len);
      
      vec3 col = mix(color1, color2, cl);
      col = mix(color3, col, v0);
      col = clamp((col + v1) * v2 * v3, 0.0, 1.0);
      
      _FragColor = extractAlpha(col);
    }
    
    void mainImage(out vec4 fragColor, in vec2 fragCoord) {
      vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
      uv -= ringOffset;
      vec4 col;
      draw(col, uv);
      fragColor.rgb = mix(bgColor, col.rgb, col.a);
    }
    
    void main() {
      mainImage(gl_FragColor, gl_FragCoord.xy);
    }
  `
);

extend({ CustomShaderMaterial })

// Leva controls for shader uniforms // Leva 控制面板参数
function ShaderControls() {
  const {
    color1,
    color2,
    color3,
    innerRadius,
    noiseScale,
    edgeMix1,
    edgeMix2,
    light1Intensity,
    light1Attenuation,
    light1Attenuation2,
    light2Intensity,
    light2Attenuation,
    bgColor,
  } = useControls({
    color1: { value: '#9c43fe' },
    color2: { value: '#4cc2e8' },
    color3: { value: '#101099' },
    innerRadius: { value: 0.10, min: 0, max: 2, step: 0.01 },
    noiseScale: { value: 2.2, min: 0, max: 2.2, step: 0.01 },
    edgeMix1: { value: 0.0, min: 0, max: 1, step: 0.01 },
    edgeMix2: { value: 1.0, min: 0, max: 1, step: 0.01 },
    light1Intensity: { value: 5.0, min: 0, max: 5, step: 0.1 },
    light1Attenuation: { value: 76, min: 0, max: 100, step: 1 },
    light1Attenuation2: { value: 0, min: 0, max: 100, step: 1 },
    light2Intensity: { value: 0.6, min: 0, max: 5, step: 0.1 },
    light2Attenuation: { value: 3.9, min: 0, max: 50, step: 0.1 },
    bgColor: { value: '#000000' },
  })

  const convertColor = (hex) => {
    const c = new THREE.Color(hex)
    return new THREE.Vector3(c.r, c.g, c.b)
  }

  return {
    color1: convertColor(color1),
    color2: convertColor(color2),
    color3: convertColor(color3),
    innerRadius,
    noiseScale,
    edgeMix1,
    edgeMix2,
    light1Intensity,
    light1Attenuation,
    light1Attenuation2,
    light2Intensity,
    light2Attenuation,
    bgColor: convertColor(bgColor)
  }
}

function AnimatedCuboids() {
  const cuboids = [useRef(), useRef(), useRef(), useRef()];
  const geometryRefs = [useRef(), useRef(), useRef(), useRef()];
  const originalPositions = useRef([]);
  const shaderParams = ShaderControls();

  const xPositions = [
    { x: -0.51, y: 0.46, z: 1 },
    { x: 0.48, y: 0.46, z: 1 },
    { x: -0.48, y: -0.46, z: 1 },
    { x: 0.51, y: -0.46, z: 1 },
  ];
  const columnPositions = [
    { x: -1, y: 0, z: 0 },
    { x: -0.28, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0.28, y: 0, z: 0 },
  ];
  const initialRotations = [
    { x: 0, y: 0, z: 3 * (Math.PI / 180) },
    { x: 0, y: 180 * (Math.PI / 180), z: -180 * (Math.PI / 180) },
    { x: 0, y: 180 * (Math.PI / 180), z: -180 * (Math.PI / 180) },
    { x: 0, y: 0, z: 3 * (Math.PI / 180) },
  ];
  const finalRotations = [
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 180 * (Math.PI / 180), z: 0 },
    { x: 0, y: 180 * (Math.PI / 180), z: 0 },
    { x: 0, y: 0, z: 0 },
  ];

  const baseHeight = 1.7;
  const amplitude = 0.6;
  const totalDuration = 17.4; // Total duration // 总时长
  const initialShear = 1.2;

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const modTime = time % totalDuration;

    cuboids.forEach((ref, i) => {
      if (!ref.current) return;

      const material = ref.current.material;
      material.iTime = time;
      material.color1 = shaderParams.color1;
      material.color2 = shaderParams.color2;
      material.color3 = shaderParams.color3;
      material.innerRadius = shaderParams.innerRadius;
      material.noiseScale = shaderParams.noiseScale;
      material.edgeMix1 = shaderParams.edgeMix1;
      material.edgeMix2 = shaderParams.edgeMix2;
      material.light1Intensity = shaderParams.light1Intensity;
      material.light1Attenuation = shaderParams.light1Attenuation;
      material.light1Attenuation2 = shaderParams.light1Attenuation2;
      material.light2Intensity = shaderParams.light2Intensity;
      material.light2Attenuation = shaderParams.light2Attenuation;
      material.bgColor = shaderParams.bgColor;

      let shearFactor = initialShear;
      if (modTime < 2) {
        shearFactor = initialShear;
      } else if (modTime < 2 + 1.7) {
        const factor = (modTime - 2) / 1.7;
        shearFactor = initialShear * (1 - factor);
      } else if (modTime < 2 + 1.7 + 10) {
        shearFactor = 0;
      } else if (modTime < 2 + 1.7 + 10 + 1.7) {
        const factor = (modTime - (2 + 1.7 + 10)) / 1.7;
        shearFactor = initialShear * factor;
      } else {
        shearFactor = initialShear;
      }

      let posX, posY, posZ, rotX, rotY, rotZ, scaleY;
      if (modTime < 2) {
        posX = xPositions[i].x;
        posY = xPositions[i].y;
        posZ = xPositions[i].z;
        rotX = initialRotations[i].x;
        rotY = initialRotations[i].y;
        rotZ = initialRotations[i].z;
        scaleY = baseHeight;
      } else if (modTime < 2 + 1.7) {
        const factor = (modTime - 2) / 1.7;
        posX = xPositions[i].x * (1 - factor) + columnPositions[i].x * factor;
        posY = xPositions[i].y * (1 - factor) + columnPositions[i].y * factor;
        posZ = xPositions[i].z * (1 - factor) + columnPositions[i].z * factor;
        rotX = initialRotations[i].x * (1 - factor) + finalRotations[i].x * factor;
        rotY = initialRotations[i].y * (1 - factor) + finalRotations[i].y * factor;
        rotZ = initialRotations[i].z * (1 - factor) + finalRotations[i].z * factor;
        const targetHeight = baseHeight + amplitude * Math.sin(i);
        scaleY = baseHeight * (1 - factor) + targetHeight * factor;
      } else if (modTime < 2 + 1.7 + 10) {
        posX = columnPositions[i].x;
        posY = columnPositions[i].y;
        posZ = columnPositions[i].z;
        rotX = finalRotations[i].x;
        rotY = finalRotations[i].y;
        rotZ = finalRotations[i].z;
        const animProgress = (modTime - (2 + 1.7)) / 2;
        scaleY = baseHeight + amplitude * Math.sin(animProgress * 2 * Math.PI + i);
      } else if (modTime < 2 + 1.7 + 10 + 1.7) {
        const factor = (15.4 - modTime) / 1.7;
        posX = columnPositions[i].x * factor + xPositions[i].x * (1 - factor);
        posY = columnPositions[i].y * factor + xPositions[i].y * (1 - factor);
        posZ = columnPositions[i].z * factor + xPositions[i].z * (1 - factor);
        rotX = finalRotations[i].x * factor + initialRotations[i].x * (1 - factor);
        rotY = finalRotations[i].y * factor + initialRotations[i].y * (1 - factor);
        rotZ = finalRotations[i].z * factor + initialRotations[i].z * (1 - factor);
        const endHeight = baseHeight + amplitude * Math.sin(2 * Math.PI + i);
        scaleY = endHeight * factor + baseHeight * (1 - factor);
      } else {
        posX = xPositions[i].x;
        posY = xPositions[i].y;
        posZ = xPositions[i].z;
        rotX = initialRotations[i].x;
        rotY = initialRotations[i].y;
        rotZ = initialRotations[i].z;
        scaleY = baseHeight;
      }
      
      ref.current.position.set(posX, posY, posZ);
      ref.current.rotation.set(rotX, rotY, rotZ);
      ref.current.scale.y = scaleY;

      const geo = geometryRefs[i].current;
      if (geo && originalPositions.current[i]) {
        const posAttr = geo.attributes.position;
        const origArray = originalPositions.current[i];
        for (let j = 0; j < posAttr.array.length; j += 3) {
          posAttr.array[j] = origArray[j] - shearFactor * origArray[j+1];
          posAttr.array[j+1] = origArray[j+1];
          posAttr.array[j+2] = origArray[j+2];
        }
        posAttr.needsUpdate = true;
      }
    });
  });

  return (
    <>
      {xPositions.map((pos, i) => (
        <mesh key={i} ref={cuboids[i]} position={[pos.x, pos.y, pos.z]} rotation={[initialRotations[i].x, initialRotations[i].y, initialRotations[i].z]}>
          <boxGeometry
            args={[0.5, baseHeight, 0.5]}
            ref={geometryRefs[i]}
            onUpdate={(geometry) => {
              if (!originalPositions.current[i]) {
                originalPositions.current[i] = geometry.attributes.position.array.slice();
              }
            }}
          />
          <customShaderMaterial />
        </mesh>
      ))}
    </>
  );
}

// Main scene containing camera, lights and animated cuboids // 主场景包含相机、光源及动画 Cuboids
export default function Scene() {
  return (
    <div className='max-w-screen h-screen overflow-hidden bg-stone-950'>
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <OrbitControls />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <AnimatedCuboids />
      </Canvas>
    </div>
  )
}
