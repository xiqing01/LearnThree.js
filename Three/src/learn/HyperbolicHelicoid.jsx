// 引入 React Hooks: useMemo 和 useRef
// Import React hooks: useMemo and useRef
import { useMemo, useRef } from 'react'

// 从 @react-three/fiber 导入 Canvas 和 useFrame，用于 3D 渲染及帧动画更新
// Import Canvas and useFrame from @react-three/fiber for 3D rendering and per-frame updates
import { Canvas, useFrame } from '@react-three/fiber'

// 从 @react-three/drei 导入 Points、PointMaterial 和 OrbitControls，用于点云渲染和场景控制
// Import Points, PointMaterial, and OrbitControls from @react-three/drei for point cloud rendering and scene controls
import { Points, PointMaterial, OrbitControls } from '@react-three/drei'

// 导入 THREE 库，提供 3D 数学工具和渲染辅助函数
// Import the THREE library for 3D math utilities and rendering helpers
import * as THREE from 'three'

// 从 @react-three/postprocessing 导入 EffectComposer 和 Bloom，实现后期处理效果
// Import EffectComposer and Bloom from @react-three/postprocessing to apply post-processing effects
import { EffectComposer, Bloom } from '@react-three/postprocessing'


// HelicoidPoints 组件：生成 Hyperbolic Helicoid 螺旋面点云，并实时更新每个点的位置实现动画效果
// HelicoidPoints component: Generates a hyperbolic helicoid point cloud and updates each point's position in real time for animation
const HelicoidPoints = () => {
  // 定义切片和层数，控制参数 u 与 v 的离散精度
  // Define the number of slices and stacks to control the discretization of parameters u and v
  const slices = 150
  const stacks = 150
  
  // 计算总点数 = slices * stacks
  // Calculate total number of points = slices * stacks
  const count = slices * stacks

  // 使用 useMemo 预先计算所有点的 u 和 v 参数，并确保仅在依赖发生变化时重新计算
  // Use useMemo to pre-calculate u and v parameters for all points, ensuring recalculation only when dependencies change
  const params = useMemo(() => {
    // 创建 Float32Array 数组存储所有点的 u 和 v 参数，归一化到 [0,1]
    // Create Float32Array arrays to store u and v values (normalized to [0, 1]) for all points
    const us = new Float32Array(count) // 存储 u 参数 / Array for u values
    const vs = new Float32Array(count) // 存储 v 参数 / Array for v values
    let index = 0
    // 双重循环遍历所有切片和层数，为每个点计算其 u 和 v 参数
    // Loop through slices and stacks to calculate u and v for each point
    for (let i = 0; i < slices; i++) {
      for (let j = 0; j < stacks; j++) {
        const u = i / (slices - 1) // 将 i 映射到 [0,1] / Map i to [0, 1]
        const v = j / (stacks - 1) // 将 j 映射到 [0,1] / Map j to [0, 1]
        us[index] = u
        vs[index] = v
        index++
      }
    }
    // 返回包含 u 和 v 数组的对象
    // Return an object containing the u and v arrays
    return { us, vs }
  }, [count]) // 依赖 count，确保只在 count 变化时执行

  // 使用 useMemo 为每个点生成随机颜色数组，从预设调色板中随机选择颜色
  // Use useMemo to generate a random color array for each point from a preset palette
  const colors = useMemo(() => {
    // 创建一个 Float32Array，每个点有 r, g, b 三个颜色分量
    // Create a Float32Array where each point has three color components (r, g, b)
    const colors = new Float32Array(count * 3)
    // 定义预设调色板
    // Define a preset color palette
    const palette = [
      [0.5, 0.5, 0.5],
      [0.5, 0.5, 0.5],
      [1.0, 1.0, 1.0],
      [0.00, 0.33, 0.67]
    ]
    let colorIndex = 0
    // 遍历每个点，随机选择调色板中的一种颜色，并写入颜色数组
    // For each point, randomly select a color from the palette and write its RGB values into the array
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * palette.length) // 随机选择索引 / Randomly select an index
      const selectedColor = palette[randomIndex] // 选中的颜色 / The selected color
      colors[colorIndex++] = selectedColor[0] // 红色分量 / Red component
      colors[colorIndex++] = selectedColor[1] // 绿色分量 / Green component
      colors[colorIndex++] = selectedColor[2] // 蓝色分量 / Blue component
    }
    return colors
  }, [count])

  // 使用 useMemo 初始化所有点的坐标数组，初始时所有坐标为 0，数组长度为 count * 3 (x, y, z)
  // Use useMemo to initialize the positions array for all points with zeros; length = count * 3 (for x, y, z)
  const positions = useMemo(() => new Float32Array(count * 3), [count])

  // 创建 Points 组件的引用，用于后续更新几何体数据
  // Create a ref for the Points component to update its geometry data later
  const pointsRef = useRef()

  // useFrame 钩子：在每一帧中更新所有点的位置，实现动态动画效果
  // useFrame hook: Update the position of each point on every frame to create dynamic animation
  useFrame((state) => {
    // 获取自场景启动以来经过的时间
    // Get elapsed time since the scene started
    const time = state.clock.getElapsedTime()
    let posIndex = 0 // 初始化 positions 数组索引 / Initialize index for positions array
    const t = 5 // 控制螺旋缠绕程度的参数 / Parameter controlling the twist of the helicoid
    // 遍历所有点，根据预存的 u, v 参数和时间更新点的坐标
    // Iterate through all points and update positions based on stored u, v values and elapsed time
    for (let i = 0; i < count; i++) {
      const u = params.us[i]
      const v = params.vs[i]
      // 计算 alpha，将 u 从 [0,1] 映射到 [-π, π] 并加上时间因子，产生动画变化
      // Compute alpha by mapping u from [0,1] to [-π, π] and adding the time factor for animation
      const alpha = Math.PI * 2 * (u - 0.5) + time
      // 计算 theta，将 v 从 [0,1] 映射到 [-π, π]
      // Compute theta by mapping v from [0,1] to [-π, π]
      const theta = Math.PI * 2 * (v - 0.5)
      // 计算缩放因子，避免除以 0 的错误
      // Calculate a scaling factor to prevent division by zero
      const bottom = 1 + Math.cosh(alpha) * Math.cosh(theta)
      // 根据 Hyperbolic Helicoid 公式计算 x, y, z 坐标
      // Compute x, y, z coordinates using the hyperbolic helicoid formula
      const x = (2 * Math.sinh(alpha) * Math.cos(t * theta)) / bottom
      const y = (1.5 * Math.cosh(alpha) * Math.sinh(theta)) / bottom
      const z = (2 * Math.sinh(alpha) * Math.sin(t * theta)) / bottom
      // 将计算的坐标依次写入 positions 数组
      // Write the computed coordinates into the positions array sequentially
      positions[posIndex++] = x
      positions[posIndex++] = y
      positions[posIndex++] = z
    }
    // 通知 Three.js，点云的 position 属性已更新，需要重渲染
    // Inform Three.js that the position attribute has been updated and needs re-rendering
    if (pointsRef.current) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  // 返回 Points 组件，绑定 positions 与 colors 数组，并设置点材质属性
  // Return the Points component with bound positions and colors arrays, and set point material properties
  return (
    <Points ref={pointsRef} positions={positions} colors={colors}>
      <PointMaterial
        vertexColors            // 启用顶点颜色 / Enable vertex colors
        color={[0.5, 0.5, 0.5]}  // 默认备用颜色 / Default fallback color
        size={0.025}            // 设置点的大小 / Set the size of each point
        sizeAttenuation         // 开启距离衰减（远处点更小）/ Enable size attenuation (points shrink with distance)
        depthWrite={false}      // 关闭深度写入，防止点云遮挡问题 / Disable depth writing to avoid occlusion issues
        transparent             // 启用透明效果 / Enable transparency
        blending={THREE.AdditiveBlending}  // 使用加法混合模式，实现颜色叠加效果 / Use additive blending for enhanced color overlay
      />
    </Points>
  )
}


// RotatingHelicoidPoints 组件：将点云包裹在 group 内，并添加整体旋转动画效果
// RotatingHelicoidPoints component: Wraps the point cloud within a group and adds overall rotation animation
function RotatingHelicoidPoints() {
  // 创建 group 的引用，用于控制整个组的旋转
  // Create a ref for the group to control its rotation
  const groupRef = useRef()
  
  // useFrame 钩子：每一帧更新 group 的旋转角度，实现持续旋转动画
  // useFrame hook: Update the group's rotation angle on every frame for continuous rotation animation
  useFrame((state, delta) => {
    // delta 表示两帧之间的时间差，乘以 0.5 控制旋转速度
    // delta represents the time difference between frames; multiplied by 0.5 to control rotation speed
    groupRef.current.rotation.y += delta * 0.5
  })
  
  // 返回包含 HelicoidPoints 组件的 group 元素
  // Return a group element that contains the HelicoidPoints component
  return (
    <group ref={groupRef}>
      <HelicoidPoints />
    </group>
  )
}


// HyperbolicHelicoid 页面组件：设置 Canvas、摄像机、灯光、交互控制及后处理效果
// HyperbolicHelicoid page component: Sets up the Canvas, camera, lighting, interactive controls, and post-processing effects
function HyperbolicHelicoid() {
  return (
    <div className='w-screen h-screen bg-gray-950 overflow-hidden z-0'>
      {/* Canvas 组件：渲染 3D 场景，并设置摄像机初始位置及视角 */}
      {/* Canvas component: Renders the 3D scene and sets the initial camera position and field of view */}
      <Canvas camera={{ position: [0, 0, 4], fov: 60 }}>
        <ambientLight /> {/* 环境光，提供全局基础照明 / Ambient light for general scene illumination */}
        <RotatingHelicoidPoints /> {/* 包含动态点云及旋转动画的组件 / Component with animated, rotating point cloud */}
        <OrbitControls /> {/* 允许鼠标拖拽控制摄像机视角 / Enable mouse-controlled orbiting of the camera */}
        <EffectComposer>
          {/* Bloom 后处理效果，增加画面发光 / Bloom effect for adding glow to the scene */}
          <Bloom mipmapBlur luminanceThreshold={0.2} luminanceSmoothing={0.1} intensity={1.5} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}

export default HyperbolicHelicoid
