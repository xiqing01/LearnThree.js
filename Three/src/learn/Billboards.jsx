// 1. 导入 React 及相关钩子，Canvas 用于创建 three.js 渲染区域
import { useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'


import { EffectComposer, Bloom } from '@react-three/postprocessing'

// 2. 从 drei 中导入 Line 和 OrbitControls 组件
import { Line, OrbitControls, Stars } from '@react-three/drei'

// 3. 导入 three.js 库，用于创建向量和材质
import * as THREE from 'three'

// 4. 定义 RingLine 组件，用于生成一个带有颜色动画的圆环线条
const RingLine = ({ radius = 2, rotation = [0, 0, 0] }) => {
  const lineRef = useRef()

  //生成随机颜色
  const generateRandomColor = () => {
    const randomColor = new THREE.Color(
      Math.random(),
      Math.random(),
      Math.random()
    );
    return randomColor;
  }

  // 4.1 使用 useMemo 优化计算，确保只在组件初次渲染时计算一次
  const { points, colors } = useMemo(() => {
    const numPoints = 100
    const points = []
    const colors = []
    for (let i = 0; i <= numPoints; i++) {
      const theta = (i / numPoints) * Math.PI * 2
      const x = radius * Math.cos(theta)
      const y = radius * Math.sin(theta)
      points.push(new THREE.Vector3(x, y, 0))
      colors.push(generateRandomColor())
    }
    return { points, colors } // 只返回 points
  }, [radius])

  return (
    <group rotation={rotation}>
      <Line
        ref={lineRef}
        color={[2, 1, 7]}
        points={points}   // 传入计算好的点数组
        lineWidth={1.7}     // 设置线条宽度
        curveType="catmullrom"
        tension={0.5}
        closed
        toneMapped={false}
      />
    </group>
  )
}

// 4.2 生成多个圆环
const RingSphere = ({ ringCount = 4, radius = 2 }) => {
  const rings = []

  for (let i = 0; i < ringCount; i++) {
    // 计算每条环的角度
    const angle = (Math.PI / ringCount) * i
    rings.push(
      <RingLine 
        key={i}
        radius={radius}
        rotation={[angle, 0, 0]}
      />
    )
  }

  return <group>{rings}</group>
}

const CrystalDodecahedron = () => {
  // 获取 <mesh> 的引用
  const crystalRef = useRef();

  useEffect(() => {
    if (crystalRef.current) {
      // 获取几何体
      const geometry = crystalRef.current.geometry;

      // 创建一个颜色数组
      const colors = [];
      const color = new THREE.Color();

      // 为每个顶点分配随机颜色
      for (let i = 0; i < geometry.attributes.position.count; i++) {
        color.setHSL(Math.random(), 0.5, 0.5); // 随机生成颜色
        colors.push(color.r, color.g, color.b);
      }

      // 将颜色数组转换为 Float32Array 并赋值给几何体的 color 属性
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }
  }, []);

  // 让十二面体持续旋转
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (crystalRef.current) {
      crystalRef.current.rotation.y = 0.7 * t; // Y轴方向慢速旋转
      crystalRef.current.rotation.x = 0.7 * t; // X轴方向慢速旋转
    }
  });

  return (
    <mesh ref={crystalRef} position={[0, 0, 0]}>
      {/* 十二面体几何体，半径设为1，可自行调整 */}
      <dodecahedronGeometry args={[1.05, 0]} />

      {/* 使用物理材质 meshPhysicalMaterial，启用顶点颜色 */}
      <meshPhysicalMaterial
        color={[2,1,7]}
        vertexColors// 启用顶点颜色
        transparent // 开启透明支持
        opacity={1} // 初始透明度
        transmission={0.7} // 启用折射（玻璃效果）
        ior={0.4} // 折射率
        thickness={0.5} // 模拟物理厚度
        reflectivity={1} // 反射率：越高越镜面
        roughness={0.4} // 粗糙度越低，越光滑
        metalness={0.0} // 金属度（0 = 非金属）
      />
    </mesh>
  );
};
// 6. 定义主场景组件 Scene，将场景中所有对象组合在一起
const Scene = () => {
  const groupRef = useRef()

  useFrame(() => {
    if (groupRef.current) {
      // 每帧让 group 在 x 轴和 z 轴上稍稍旋转
      // ==> 这里面放的是所有圆环，让圆环转动
      groupRef.current.rotation.x += 0.008
      groupRef.current.rotation.z += 0.001
    }
  })

  return (
    <>
      {/* 用一个 groupRef 来控制 RingSphere 的旋转 */}
      <group ref={groupRef}>
        <RingSphere ringCount={4} radius={2} />
      </group>

      <CrystalDodecahedron />


      {/* 轨道控制器，可以用鼠标拖拽、缩放查看场景 */}
      <OrbitControls />
    </>
  )
}

// 7. Scenes 组件，封装了 Canvas 用于渲染 3D 内容
const Scenes = () => {
  return (
    <div className="w-screen h-screen bg-gray-950 overflow-hidden z-0">
      {/* Canvas：React 三维场景渲染容器 */}
      <Canvas>
        {/* 环境光，均匀照亮整个场景 */}
        <ambientLight intensity={1.2} />
        {/* 添加点光源，让场景中的物体有高光 */}
        <pointLight position={[10, 10, 10]} />

        {/* 主要场景 */}
        <Scene />

        <Stars 
          radius={50}  // 控制星星的分布半径，值越大，星空范围越广
          depth={50}    // 控制星星在 Z 轴方向上的分布深度，增加可增强立体感
          count={1000}  // 生成的星星数量，值越大，星空越密集
          factor={5}    // 控制星星的大小变化范围，值越大，星星大小差异越明显
          saturation={2} // 设定星星的颜色饱和度，0 表示纯白色，1 表示多彩色星星
          fade={true}   // 是否开启淡出效果，使远处的星星变得模糊，提升视觉真实感
          speed={1}   // 设定星星的旋转速度，值越大，星空旋转得越快
        />

        {/* 后期处理器: Bloom 发光 */}
        <EffectComposer>
          <Bloom 
            mipmapBlur 
            luminanceThreshold={1}
            intensity={0.8} 
            radius={0.9} />
      </EffectComposer>
      </Canvas>
    </div>
  )
}

export default Scenes
