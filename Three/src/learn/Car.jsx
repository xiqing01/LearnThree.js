import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'


const Car = () => {
  const carRef = useRef(null)

  useEffect(() => {
    // 获取容器的宽高
    const width = carRef.current.offsetWidth
    const height = carRef.current.offsetHeight

    // 创建场景
    const scene = new THREE.Scene()

    //材质
    const material = new THREE.MeshNormalMaterial()

    //整个车
    const car = new THREE.Group()
    car.position.x = 2

    //车身
    const body = new THREE.Group()

    const bodyGeometry = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 1), material)
    const bodyGeometry1 = new THREE.Mesh(new THREE.BoxGeometry(1, 0.7, 0.5), new THREE.MeshBasicMaterial({ color: 176196222 }))
    bodyGeometry1.position.set(0, 0.1, 0)

    body.add(bodyGeometry, bodyGeometry1)
    car.add(body)
    scene.add(car)

    //车轮

    //车轮1
    const wheelGroup1 = new THREE.Group()
    const whreel = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.1,), material)
    wheelGroup1.add(whreel)
    wheelGroup1.position.set(-0.6, 0, 0.6)
    car.add(wheelGroup1)

    //车轮2
    const wheelGroup2 = new THREE.Group()
    const whreel2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.1,), material)
    wheelGroup2.add(whreel2)
    wheelGroup2.position.set(0.6, 0, -0.6)
    car.add(wheelGroup2)

    //车轮3
    const wheelGroup3 = wheelGroup1.clone()
    wheelGroup3.position.set(-0.6, 0, -0.6)
    car.add(wheelGroup3)

    //车轮4
    const wheelGroup4 = wheelGroup2.clone()
    wheelGroup4.position.set(0.6, 0, 0.6)
    car.add(wheelGroup4)

    //轮胎 
    const circle = new THREE.Group()

    let n = 15
    for (let i = 0; i < n; i++) {
      const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1)
      const material = new THREE.MeshBasicMaterial({ color: 13843226 })
      const cube = new THREE.Mesh(geometry, material)
      cube.position.x = Math.cos(Math.PI * 2 / n * i) * 0.35
      cube.position.y = Math.sin(Math.PI * 2 / n * i) * 0.35
      circle.add(cube)
    }
    wheelGroup1.add(circle.clone())
    wheelGroup2.add(circle.clone())
    wheelGroup3.add(circle.clone())
    wheelGroup4.add(circle.clone()) 

    // 创建相机
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100)
    camera.position.z = 5

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer()
    renderer.setSize(width, height)
    carRef.current.appendChild(renderer.domElement)
    const orbitControls = new OrbitControls(camera, renderer.domElement)

    //Clock 帮助我们计算时间
    const clock = new THREE.Clock()
    const tick = () => {
      const time = clock.getElapsedTime()

      car.position.x = -time % 4

      wheelGroup1.rotation.z = time
      wheelGroup2.rotation.z = time
      wheelGroup3.rotation.z = time
      wheelGroup4.rotation.z = time

      requestAnimationFrame(tick)
      renderer.render(scene, camera)
      orbitControls.update()
      
    }
    tick()
  }, [])

  return (
    <div ref={carRef} className='w-screen h-screen bg-cyan-950 overflow-hidden z-0'></div>
  )
}

export default Car