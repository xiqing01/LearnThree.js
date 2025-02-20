import { useEffect, useRef } from 'react';
import * as THREE from 'three';

function Startapp() {
  const containerRef = useRef(null); // 创建容器引用

  useEffect(() => {
    // 获取容器的宽高
    const width = containerRef.current.offsetWidth;
    const height = containerRef.current.offsetHeight;
  
    //房间 - 3d容器
    //Scene （场景）是所有3D对象的容器
    const scene = new THREE.Scene()


    let cubes = []
    //在房间离放物体
    const createCube = () => {
      //物体：geometry(几何体，就是骨架) + material（材质，就是皮肤）
      let d = Math.random()
      const geometry = new THREE.BoxGeometry(d,d,d)
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 * Math.random() })
      const cube = new THREE.Mesh(geometry, material)
      cube.position.x = (Math.random() - 0.5) * 5
      cube.position.y = (Math.random() - 0.5) * 5
      cube.position.z = (Math.random() - 0.5) * 5
      cubes.push(cube)
    }
    
    let n = 10; // Assign a value to n
    for (let i = 0; i < n; i++) {
      createCube()
    }
    cubes.forEach(cube => {
      scene.add(cube)
    })

    //Position 位置
    // cude.position.x = 1
    // cude.position.y = 1
    // cude.position.z = 1

    //Scale 缩放
    // cude.scale.x = 2
    // cude.scale.y = 2
    // cude.scale.z = 2

    //Rotation 旋转角度
    // cude.rotation.x = 45 / 180 * Math.PI
    // cude.rotation.y = 45 / 180 * Math.PI
    // cude.rotation.z = 45 / 180 * Math.PI

    //光线 · 照亮物体
    const light = new THREE.DirectionalLight(0xffffff, 1)
    scene.add(light)
  
    // 创建相机, 视角, 宽高比, 近平面, 远平面.相机是我们看到的视角
    const camera = new THREE.PerspectiveCamera(
      75, // 视角
      width / height, // 宽高比
      0.1, // 近平面
      1000 // 远平面
    )
  
    // 创建渲染器
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);
  
    
  
    // 设置相机位置
    camera.position.z = 7
    //添加世界坐标系辅助
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
  
    // 渲染函数
    const clock = new THREE.Clock()
    const animate = () => {
      const time = clock.getElapsedTime()
      cubes.forEach((cube, index) => {
        cube.rotation.x = time *0.4 + index
        cube.rotation.y = time
      })

      // 渲染场景
      renderer.render(scene, camera);
  
      // 请求下一帧
      requestAnimationFrame(animate);
    };
  
    // 开始动画循环
    animate();
  
    // 清理函数
    return () => {
      renderer.dispose(); // 清理渲染器
    };
  }, [])

  return (
    <div ref={containerRef} className="w-screen h-screen bg-sky-900 overflow-hidden z-0">
      {/* 渲染器将被添加到此容器中 */}
    </div>
  );
}

export default Startapp;
