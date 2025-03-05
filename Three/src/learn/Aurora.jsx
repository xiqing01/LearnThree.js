// 引入 React 和相关钩子
import { useRef, Suspense } from "react";

// 引入 react-three-fiber 的 Canvas、useFrame（每帧调用的钩子）和 extend（扩展自定义对象）
import { Canvas, useFrame, extend } from "@react-three/fiber";

// 引入 drei 中的 shaderMaterial（用于创建自定义着色器材质）和 OrbitControls（摄像机控制器）
import { shaderMaterial, OrbitControls } from "@react-three/drei";

// 引入 gsap，用于动画效果
import gsap from "gsap";

/* 
  使用 shaderMaterial 创建自定义着色器材质 CustomShaderMaterial
  - uniforms: 包含 iTime（当前时间，用于动画驱动）和 distort（顶点形变强度）
  - 顶点着色器：实现 3D Simplex Noise 算法、计算噪声值、并沿法线方向偏移顶点产生形变
  - 片元着色器：利用传递的噪声、纹理坐标和法线计算基础光照与渐变颜色，最终输出颜色
*/
const CustomShaderMaterial = shaderMaterial(
  {
    iTime: 0,       // 当前时间（动画驱动）
    distort: 0.1,   // 顶点形变强度
  },
  // 顶点着色器代码
  `
  // =========================
  // 以下代码为 Ashima Arts 提供的 3D Simplex Noise 算法，用于生成连续的三维噪声
  vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }
  vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }
  vec4 permute(vec4 x) {
    return mod289(((x * 34.0) + 1.0) * x);
  }
  vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
  }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    // 计算基准点
    vec3 i = floor(v + dot(v, vec3(C.y)));
    vec3 x0 = v - i + dot(i, vec3(C.x));
    
    // 计算其它三个角点
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g, l.zxy);
    vec3 i2 = max(g, l.zxy);
    
    // 计算偏移量
    vec3 x1 = x0 - i1 + C.x;
    vec3 x2 = x0 - i2 + 2.0 * C.x;
    vec3 x3 = x0 - 1.0 + 3.0 * C.x;
    
    // 计算排列值
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    
    // 计算梯度
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ * ns.x + ns.y;
    vec4 y = y_ * ns.x + ns.y;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    
    vec3 g0 = vec3(a0.x, a0.y, h.x);
    vec3 g1 = vec3(a0.z, a0.w, h.y);
    vec3 g2 = vec3(a1.x, a1.y, h.z);
    vec3 g3 = vec3(a1.z, a1.w, h.w);
    
    // 对梯度归一化
    vec4 norm = taylorInvSqrt(vec4(dot(g0, g0), dot(g1, g1), dot(g2, g2), dot(g3, g3)));
    g0 *= norm.x;
    g1 *= norm.y;
    g2 *= norm.z;
    g3 *= norm.w;
    
    // 混合噪声值
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 56.0 * dot(m * m, vec4(dot(g0, x0), dot(g1, x1), dot(g2, x2), dot(g3, x3)));
  }
  // =========================
  
  // 定义 varying 变量，用于传递数据给片元着色器
  varying vec2 vUv;       // 纹理坐标
  varying float vNoise;   // 噪声值
  varying vec3 vNormal;   // 顶点法线数据

  // 声明 uniform 变量
  uniform float iTime;    // 当前时间
  uniform float distort;  // 顶点形变强度

  // 顶点主函数
  void main() {
    vUv = uv;           // 保存内置纹理坐标
    vNormal = normal;   // 保存顶点法线

    // 根据顶点位置和时间计算噪声，实现动态形变效果
    float noise = snoise(position * 7.8 + vec3(iTime));
    vNoise = noise;     // 将噪声传递给片元着色器

    // 根据噪声沿法线方向偏移顶点，达到形变效果
    vec3 newPosition = position + normal * noise * distort;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
  `,
  // 片元着色器代码
  `
  // 接收从顶点着色器传递的 varying 数据
  varying vec2 vUv;
  varying float vNoise;
  varying vec3 vNormal;

  // 声明 uniform 变量
  uniform float iTime;
  uniform float distort;

  void main() {
      // 计算光照：利用法线与向上光源（0,1,0）的点乘，结果归一化到 [0,1]
      float light = dot(normalize(vNormal), vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;
      
      // 定义颜色渐变的起始色和结束色
      vec3 startColor = vec3(0.4, 0.1, 0.5); 
      vec3 endColor = vec3(0.3, 0.4, 1.0);  
    
      // 利用纹理坐标计算周期性变量，生成渐变因子
      float cyc = sin(vUv.x * 6.28318); // 6.28318 = 2π
      float t = cyc * 0.5 + 0.5;         // 将值映射到 [0,1]
      
      // 计算渐变色：根据 t 对起始色和结束色做插值
      vec3 gradientColor = mix(startColor, endColor, 0.2);
      
      // 计算基础颜色：起始色受光照影响，并加入噪声细节
      vec3 baseColor = startColor * light + vNoise * 0.3;
      
      // 混合基础颜色和渐变颜色得到最终颜色
      vec3 finalColor = mix(baseColor, gradientColor, 0.3);
      
      // 输出最终颜色，alpha 固定为 1.0（完全不透明）
      gl_FragColor = vec4(finalColor, 1.0);
  }
  `
);

// 注册自定义材质到 Fiber 的 JSX 元素中
extend({ CustomShaderMaterial });

/* 
  ShaderSphere 组件：使用自定义着色器材质展示一个交互式球体
  - 使用 useRef 获取 mesh 和 shader 的引用
  - 鼠标悬停（onPointerOver）和离开（onPointerOut）时，利用 gsap 平滑调整缩放和形变强度
  - useFrame 钩子每帧更新 shader 的 iTime uniform，保证动画连续性
*/
const ShaderSphere = () => {
  // 获取 mesh 和 shader 材质的引用
  const meshRef = useRef();
  const shaderRef = useRef();

  // 鼠标悬停事件，执行放大动画和增加形变强度
  const handlePointerOver = () => {
    gsap.to(meshRef.current.scale, {
      x: 1.2,
      y: 1.2,
      z: 1.2,
      duration: 0.3,          // 动画时长 0.3 秒
      ease: "power1.out"      // 使用缓动函数
    });
    gsap.to(shaderRef.current.uniforms.distort, {
      value: 0.3,             // 增加形变强度
      duration: 0.3,
      ease: "power1.out"
    });
  };

  // 鼠标离开事件，将动画恢复至初始状态
  const handlePointerOut = () => {
    gsap.to(meshRef.current.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.3,
      ease: "power1.out"
    });
    gsap.to(shaderRef.current.uniforms.distort, {
      value: 0.1,             // 恢复原始形变强度
      duration: 0.3,
      ease: "power1.out"
    });
  };

  // 每帧更新 shader 的 iTime 值，确保动画流畅
  useFrame((state, delta) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.iTime.value = state.clock.getElapsedTime();
    }
    meshRef.current.rotation.y += delta * 0.5
    meshRef.current.rotation.x += delta * 0.5
  });



  return (
    <mesh
      ref={meshRef}
      onPointerOver={handlePointerOver} // 鼠标悬停触发放大及形变增强
      onPointerOut={handlePointerOut}   // 鼠标离开时恢复状态
    >
      {/* 球体几何体：半径为1.7，水平与垂直分段数均为64 */}
      <sphereGeometry args={[1.7, 64, 64]} />
      {/* 应用自定义着色器材质 */}
      <customShaderMaterial ref={shaderRef} />
      {/* 添加 OrbitControls 以实现旋转与缩放交互 */}
      <OrbitControls />
    </mesh>
  );
};

/* 
  Aurora 组件：整体场景组件
  - 包含一个全屏 Canvas，用于渲染 3D 内容
  - 内嵌 Suspense 组件以支持异步加载（fallback 为 null）
  - 包含 ShaderSphere 组件，展示自定义着色器球体
*/
const Aurora = () => {
  return (
    <div className="w-screen h-screen bg-gray-950 overflow-hidden z-0">
      <Canvas>
        <Suspense fallback={null}>
          <ShaderSphere />
        </Suspense>
      </Canvas>
    </div>
  );
};

// 导出 Aurora 组件作为默认模块
export default Aurora;
