import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

/**
 * 生成一个粒子球体，并使其具有微小的浮动效果
 * Generate a particle sphere with a subtle floating effect
 */
const ParticlesSphere = () => {
  const pointsRef = useRef(); // 创建引用，以便访问粒子点对象 Create a ref to access the particle points object

  // 预计算粒子的位置，保证粒子数据在组件生命周期内不会重复计算
  // Precompute particle positions to ensure data is not recalculated unnecessarily
  const particles = useMemo(() => {
    const count = 390; // 粒子总数 Total number of particles
    const positions = new Float32Array(count * 3); // 存储粒子坐标的数组，每个粒子占3个浮点数（x, y, z）
    // Array to store particle positions, each particle occupies 3 float values (x, y, z)

    // 生成粒子位置，使其均匀分布在球体表面
    // Generate particle positions to be evenly distributed on the sphere surface
    for (let i = 0; i < count; i++) {
      const theta = Math.acos(2 * Math.random() - 1); // 计算极角 θ，范围 [0, π]
      // Compute the polar angle θ, range [0, π]
      const phi = 2 * Math.PI * Math.random(); // 计算方位角 φ，范围 [0, 2π]
      // Compute the azimuthal angle φ, range [0, 2π]
      const radius = 2; // 球体半径 Sphere radius

      // 将球面坐标转换为笛卡尔坐标
      // Convert spherical coordinates to Cartesian coordinates
      positions[i * 3] = radius * Math.sin(theta) * Math.cos(phi); // X 坐标 X coordinate
      positions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi); // Y 坐标 Y coordinate
      positions[i * 3 + 2] = radius * Math.cos(theta); // Z 坐标 Z coordinate
    }

    return positions;
  }, []); // 空依赖数组，确保只在组件初始化时计算一次
  // Empty dependency array ensures computation happens only once at component initialization

  // 使用动画帧更新粒子，使其产生微小的浮动效果
  // Use animation frames to update particles, creating a subtle floating effect
  useFrame((state) => {
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array; // 获取粒子位置数组
      // Retrieve the particle position array

      for (let i = 0; i < positions.length / 3; i++) {
        const index = i * 3;
        // 通过正弦波模拟粒子上下浮动，产生轻微动态效果
        // Simulate floating motion using a sine wave for subtle movement
        positions[index + 1] += Math.sin(state.clock.elapsedTime + i) * 0.001;
      }

      // 标记位置数据已更新，通知 three.js 重新渲染
      // Mark position data as updated to notify three.js to re-render
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <points ref={pointsRef}>
        {/* 定义粒子几何体 Define particle geometry */}
        <bufferGeometry>
          {/* bufferAttribute 绑定粒子位置数据 Bind particle position data */}
          <bufferAttribute
            attach="attributes-position" // 绑定到 position 属性 Bind to position attribute
            count={particles.length / 3} // 计算粒子数量 Calculate number of particles
            array={particles} // 位置数据数组 Position data array
            itemSize={3} // 每个粒子由 3 个坐标值 (x, y, z) 组成 Each particle consists of 3 coordinates (x, y, z)
          />
        </bufferGeometry>
        {/* 设定粒子材质，如大小和颜色 Set particle material, including size and color */}
        <pointsMaterial size={0.1} color="white" />
      </points>
    </mesh>
  );
};

/**
 * 渲染粒子特效的 Canvas 组件
 * Render the particle effect inside a Canvas component
 */
const Particles = () => {
  return (
    <div className="w-screen h-screen bg-gray-950 overflow-hidden z-0">
      <Canvas>
        <ambientLight /> {/* 环境光 Ambient light */}
        <ParticlesSphere /> {/* 粒子球体 Particle sphere */}
        <OrbitControls /> {/* 允许鼠标拖拽旋转场景 Enable mouse drag to rotate the scene */}
      </Canvas>
    </div>
  );
};

export default Particles;
