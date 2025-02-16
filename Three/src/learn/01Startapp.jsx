import { useEffect, useRef } from 'react';
import * as THREE from 'three';

function Startapp() {
  const containerRef = useRef(null); // 创建容器引用

  useEffect(() => {
    // 获取容器的宽高
    const width = containerRef.current.offsetWidth;
    const height = containerRef.current.offsetHeight;
  
    // 创建场景
    const scene = new THREE.Scene();
  
    // 创建相机
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
  
    // 创建几何体
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    // 创建材质
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    // 创建网格
    const cube = new THREE.Mesh(geometry, material);
  
    // 将网格添加到场景
    scene.add(cube);
  
    // 设置相机位置
    camera.position.z = 3;
  
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
