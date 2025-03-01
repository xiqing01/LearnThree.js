// 1. 导入 React 及相关钩子，Canvas 用于创建 three.js 渲染区域
import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'

//提供一系列后期处理插件，可以非常方便地给整个场景或部分物体做泛光
import { EffectComposer, Bloom } from '@react-three/postprocessing'

// 2. 从 drei 中导入 Line 和 OrbitControls 组件
import { Line, OrbitControls } from '@react-three/drei'

// 3. 导入 three.js 库，用于创建向量和颜色对象
import * as THREE from 'three'

// 4. 定义 RingLine 组件，用于生成一个带有颜色动画的圆环线条
const RingLine = ({ radius = 2, rotation = [0, 0, 0] }) => {
  const lineRef = useRef()

  // 4.1 使用 useMemo 优化计算，确保只在组件初次渲染时计算一次
  const { points } = useMemo(() => {
    const numPoints = 100
    const points = []
    for (let i = 0; i <= numPoints; i++) {
      const theta = (i / numPoints) * Math.PI * 2
      const x = radius * Math.cos(theta)
      const y = radius * Math.sin(theta)
      points.push(new THREE.Vector3(x, y, 0))
    }
    return { points } // 只返回 points
  }, [radius])



  return (
    <group rotation={rotation}>
      <Line
        color={'white'}    // 初始颜色
        points={points}    // 传入计算好的点数组
        lineWidth={2}      // 设置线条宽度
        curveType="catmullrom"
        tension={0.5}
        closed
      />
    </group>
  )
}

// 生成多个圆环
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

// 5. 定义 Scene 组件，将场景中所有对象组合在一起
const Scene = () => {
  const groupRef = useRef()

  useFrame(() => {
    if (groupRef.current) {
      // 每帧让 group 在 x 轴和 y 轴上稍稍旋转
      groupRef.current.rotation.x += 0.005
      groupRef.current.rotation.z += 0.001
    }
  })

  return (
    <group ref={groupRef}>
      <RingSphere ringCount={4} radius={2} />
      <OrbitControls />
    </group>
  )
}

const Scenes = () => {
  return (
    <div className="w-screen h-screen bg-gray-950 overflow-hidden z-0">
      <Canvas>
        {/* 环境光，均匀照亮 */}
        <ambientLight />
        {/* 添加点光源 */}
        <pointLight position={[10, 10, 10]} />

        <Scene />

        {/* 后期处理器: Bloom 发光 */}
        <EffectComposer>
          <Bloom
            intensity={2}  // 发光强度
            threshold={0.1}  // 亮度阈值
            radius={0.7}     // 模糊半径
          />
        </EffectComposer>
      </Canvas>
    </div>
  )
}

export default Scenes
