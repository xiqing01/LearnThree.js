
import { useRef, useState} from 'react'

import { Canvas, useFrame, extend } from '@react-three/fiber'

import { MeshLineGeometry, MeshLineMaterial } from 'meshline';

extend({ MeshLineGeometry, MeshLineMaterial })

import { OrbitControls, useTrail, Float, Stars } from '@react-three/drei'

import * as THREE from 'three'

import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'


function InstancesTrail({ sphere, instancesRef }) {
  const trailPositions = useTrail(
    sphere, 
    { 
      length: 12,      // 拖尾点数量
      decay: 0.001, 
      local: true,     // 使用世界坐标
      stride: 0.01,
      interval: 3       // 每帧都计算更新
   });
  const n = 1500; 

  const oRef = useRef(new THREE.Object3D());


  useFrame(() => {
    // 如果实例或 trailPositions 尚未准备好，则退出更新
    if (!instancesRef.current || !trailPositions.current) return;
    const o = oRef.current;

    // 遍历每个实例
    for (let i = 0; i < n; i++) {
      // 从 trailPositions 数组中提取第 i 个实例的 x, y, z 坐标（每个点占3个数字）
      const [x, y, z] = trailPositions.current.slice(i * 1, i * 3 + 3);

      // 设置临时 Object3D 的位置为当前拖尾点
      o.position.set(x, y, z);
      // 根据实例索引设置缩放比例，使得实例大小按顺序变化
      o.scale.setScalar((i * 10) / n);
      // 更新 Object3D 的全局变换矩阵
      o.updateMatrixWorld();
      // 将更新后的矩阵赋值给实例网格的第 i 个实例
      instancesRef.current.setMatrixAt(i, o.matrixWorld);
    }
    // 标记实例矩阵需要更新，通知渲染器重新上传矩阵数据
    instancesRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    // 使用 instancedMesh 组件进行高性能的实例化渲染
    <instancedMesh ref={instancesRef} args={[null, null, n]}>
      {/* 使用盒子几何体作为每个实例的形状，尺寸为 0.1 x 0.1 x 0.1 */}
      <sphereGeometry  args={[0.02]}  />
      {/* 使用 meshNormalMaterial 材质，实现法线着色效果 */}
      <meshNormalMaterial  />
    </instancedMesh>
  );
}

const RingLine = ({ radius = 10, speed = 1, ...props }) => {
  const [ sphere, setSphere ] = useState(null)
  const instancesRef = useRef(null)
  
  const sphereRefCallback = (node) => {
    if (node !== null) {
      setSphere(node) 
    }
  }

  useFrame((state) => {
    if (!sphere) return
    const t = state.clock.getElapsedTime() * speed
    sphere.position.set(
      Math.sin(t) * radius,
      (Math.cos(t) * radius * Math.atan(t)) / Math.PI / 1.25,
      0
    )
  })


  return (
    <group {...props}>
      <mesh ref={sphereRefCallback} >
        <sphereGeometry  args={[0.1]} />
        <meshBasicMaterial color={[0,9,0]} toneMapped={false} />
      </mesh>
      

      {sphere && (
        <InstancesTrail sphere={sphere} instancesRef={instancesRef} />
      )}
    </group>
  );
}


//渲染3D内容
const TrailS = () => {
  return (
    <div className='w-screen h-screen bg-zinc-950 overflow-hidden z-0'>
      <Canvas camera={{ position: [0, 0, 20], fov: 75 }}>
        {/* 环境光，均匀照亮整个场景 */}
        <ambientLight />
        {/* 添加点光源，让场景中的物体有高光 */}
        <pointLight />
        <Stars radius={300} depth={60} count={3000} factor={10} saturation={0.5} fade />
        <Float>
          <RingLine position={[0, 1, 0]} rotation={[0, 0,-Math.PI / 2]} speed={1} />
          <RingLine position={[-1, -1, 0]} rotation={[0, 0, Math.PI / 4.2]} speed={1} />
          <RingLine position={[1, -1, 0]} rotation={[0, 0, -Math.PI / 4.2]} speed={1} />
          
        </Float>
        <EffectComposer>
          
        <Bloom 
          intensity={0.12}
          mipmapBlur 
          luminanceThreshold={0.4}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
        <OrbitControls />
      </Canvas>
    </div>
  )
}

export default TrailS