import { useEffect, useRef } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { AsciiRenderer } from "@react-three/drei"
import * as THREE from "three"
import gsap from "gsap"
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'

// 注册 GSAP 的 MotionPathPlugin 插件
gsap.registerPlugin(MotionPathPlugin)

const Sphere = () => {
  const ref = useRef()
  const viewport = useThree((state) => state.viewport)

  const path = new THREE.CubicBezierCurve3(
    new THREE.Vector3(-3, 0, 0),    // 起始点
    new THREE.Vector3(-1.0, 4, 0),  // 控制点1
    new THREE.Vector3(1.0, -4, 0),  // 控制点2
    new THREE.Vector3(3, 0, 0)      // 终点
  )


  useFrame((state, delta) => ( ref.current.rotation.x = ref.current.rotation.y += delta /5 ))

  useEffect(() => {
    // 使用 GSAP 的 to() 方法创建动画
    gsap.to(ref.current.position, {
      duration: 15, // 动画持续时间为 5 秒
      repeat: -1, // 动画无限循环
      yoyo: true, // 动画来回播放
      motionPath: {
        path: path.getPoints(100), // 获取贝塞尔曲线上的 100 个点作为路径
        align: path.getPoints(100), // 将元素对齐到路径上
        autoRotate: true, // 元素沿路径自动旋转
      },
    });
  }, [path]); // 依赖项为 path，当 path 变化时重新执行该 effect
  

  return (
    <>
      <mesh scale={Math.min(viewport.width, viewport.height) / 5} ref={ref}>
      <sphereGeometry args={[1, 3, 3, 0, 6.2, 2.3, 2.9]} />
      <meshBasicMaterial color="hotpink" />
      </mesh>
    </>
    
  )
}

const Ascii = () => {

  return (
      <div  className="w-screen h-screen overflow-hidden z-0 bg-neutral-950 flex flex-row">
        <Canvas>
          <color attach="background" args={['black']} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <pointLight position={[-10, -10, -10]} />
          <Sphere />
          <AsciiRenderer fgColor="white" bgColor="transparent"  resolution={0.1} />
        </Canvas>
      </div>
      
  )
}

export default Ascii