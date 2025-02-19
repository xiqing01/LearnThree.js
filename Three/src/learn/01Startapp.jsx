import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

function Startapp() {
  const containerRef = useRef(null); // 创建容器引用

  useEffect(() => {
    // 获取容器的宽高
    const width = containerRef.current.offsetWidth;
    const height = containerRef.current.offsetHeight;
  
    //房间 - 3d容器
    //Scene （场景）是所有3D对象的容器
    const scene = new THREE.Scene()

    //在房间离放物体
    //物体：geometry(几何体，就是骨架) + material（材质，就是皮肤）
    const geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    const cube = new THREE.Mesh(geometry, material)
    //将物体放入房间
    scene.add(cube)

    //光线 · 照亮物体
    const light = new THREE.DirectionalLight(0xffffff, 1)
    scene.add(light)
  
    // 创建相机, 视角, 宽高比, 近平面, 远平面.相机是我们看到的视角
    const camera = new THREE.PerspectiveCamera(
      75, // 视角
      width / height, // 宽高比
      0.1, // 近平面
      1000 // 远平面
    );
  
    // 创建渲染器
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);
  

  
    // 设置相机位置
    camera.position.z = 3;
    //添加世界坐标系辅助
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
  
    // 渲染函数
    const animate = () => {
      // 更新物体旋转
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
  
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
    <div ref={containerRef} className="w-screen h-screen bg-sky-900 overflow-hidden">
      {/* 渲染器将被添加到此容器中 */}
    </div>
  );
}

export default Startapp;
