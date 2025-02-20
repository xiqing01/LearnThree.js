import * as THREE from 'three'

//OrbitControls 是一个用于控制相机围绕目标旋转、缩放和平移的工具。它使用户能够通过鼠标或触摸手势与 3D 场景进行交互，提供了直观的视角控制
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { useEffect, useRef } from 'react'

const Threeinteraction = () => {
  const threeinteraction = useRef(null)

  useEffect(() => {
    // 获取容器的宽高
    const width = threeinteraction.current.offsetWidth
    const height = threeinteraction.current.offsetHeight

    const scene = new THREE.Scene()

    //创建一个立方体
    const geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshNormalMaterial()
    const cube = new THREE.Mesh(geometry, material)
    scene.add(cube)

    //辅助参考坐标系
    const axesHelper = new THREE.AxesHelper(5)
    scene.add(axesHelper)

    //创建相机
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.z = 5

    //创建渲染器
    const renderer = new THREE.WebGLRenderer()
    renderer.setSize(width, height)
    threeinteraction.current.appendChild(renderer.domElement)
    const orbitControls = new OrbitControls(camera, renderer.domElement)


    const clock = new THREE.Clock()
    
    const tick = () => {
      const time = clock.getDelta()
      requestAnimationFrame(tick)
      renderer.render(scene, camera)
      
      orbitControls.update()
    }

    tick()

    //清理函数
    return () => {
      renderer.dispose()
    }
  }, [])

  return (
    <div ref={threeinteraction} className='max-w-screen h-screen overflow-hidden bg-blue-900 z-0'></div>
  )
}

export default Threeinteraction