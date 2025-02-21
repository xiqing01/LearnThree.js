import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { useRef, useEffect } from 'react'

const Groups = () => {
  const groupRef = useRef(null) // 重命名变量为 groupRef，避免与 THREE.Group() 冲突

  useEffect(() => {
    // 确保 groupRef 在使用前被初始化
    const width = groupRef.current.offsetWidth
    const height = groupRef.current.offsetHeight

    // 场景设置
    const scene = new THREE.Scene()
    const axesHelper = new THREE.AxesHelper(5)
    scene.add(axesHelper)

    //Group 是一个用于将多个对象组合在一起的容器类。它可以想其他3D对象一样进行位置、旋转和缩放等变换操作
    const group = new THREE.Group() // 创建一个 3D 对象组
    const group3D1 = new THREE.Group()

    const geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshNormalMaterial()
    const cube1 = new THREE.Mesh(geometry, material)
    group.add(cube1) // 将立方体添加到 group3D 中
    group3D1.add(group) // 将 group3D 添加到 group3D1 中

    const geometry2 = new THREE.BoxGeometry( 0.3, 0.3, 0.3)
    const material2 = new THREE.MeshNormalMaterial()
    const cube2 = new THREE.Mesh(geometry2, material2)
    cube2.position.x = 1.3
    group.add(cube2)

    const geometry3 = new THREE.BoxGeometry()
    const material3 = new THREE.MeshNormalMaterial()
    const cube3 = new THREE.Mesh(geometry3, material3)
    cube3.position.x = -3
    group3D1.add(cube3)

    scene.add(group3D1)

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100)
    camera.position.z = 5

    const renderer = new THREE.WebGLRenderer()
    renderer.setSize(width, height)
    groupRef.current.appendChild(renderer.domElement) // 将渲染器附加到 DOM 元素上

    const orbitControls = new OrbitControls(camera, renderer.domElement)
    const clock = new THREE.Clock()

    const tick = () => {
      const time = clock.getDelta()
      cube1.rotation.z += time * 0.5
      cube2.rotation.y += time * 0.5
      cube3.rotation.x += time * 0.5

      // 调整旋转的速度
      group.rotation.z += time * 0.5; 
      group3D1.rotation.z += time * 0.5;
      
      requestAnimationFrame(tick)
      renderer.render(scene, camera)
      orbitControls.update()
    }

    tick() // 启动动画循环

    return () => {
      renderer.dispose()
    }
  }, [])

  return (
    <div ref={groupRef} className='max-w-screen h-screen overflow-hidden bg-stone-950'></div>
  )
}

export default Groups
