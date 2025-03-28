import { useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { InstancedBufferAttribute } from 'three'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { useControls } from 'leva'
import { MeshDistortMaterial } from '@react-three/drei'

// function CameraController() {
//   const { camera } = useThree()
//   const { camX, camY, camZ, rotX, rotY, rotZ } = useControls('Camera', {
//     camX: { value: 0, min: -10, max: 10, step: 0.1 },
//     camY: { value: 0, min: -10, max: 10, step: 0.1 },
//     camZ: { value: 5, min: 0, max: 20, step: 0.1 },
//     rotX: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
//     rotY: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
//     rotZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
//   })
//   useFrame(() => {
//     camera.position.set(camX, camY, camZ)
//     camera.rotation.set(rotX, rotY, rotZ)
//   })
//   return null
// }

function RandomInstances() {
  const instancesRef = useRef()
  const instanceCount = 486
  const initialPositions = useRef([])
  const startTime = useRef(null)
  const transitionDelay = 1000
  const { distort, speed, radius, emissiveIntensity, emissiveColor } = useControls('Material', {
    distort: { value: 0.1, min: 0, max: 1, step: 0.01 },
    speed: { value: 0.5, min: 0, max: 10, step: 0.1 },
    radius: { value: 0.3, min: 0, max: 1, step: 0.01 },
    emissiveIntensity: { value: 1.8, min: 0, max: 2, step: 0.1 },
    emissiveColor: { value: '#129aff' },
  })
  const { groupCount, targetMultiplierX, targetMultiplierY, targetMultiplierZ } = useControls('Parameters', {
    groupCount: { value: 1, min: 1, max: 1, step: 1 },
    targetMultiplierX: { value: 200, min: 0, max: 200, step: 1 },
    targetMultiplierY: { value: 87, min: 0, max: 200, step: 1 },
    targetMultiplierZ: { value: 200, min: 0, max: 200, step: 1 },
  })

  const { angleMultiplier } = useControls('Animation', {
    angleMultiplier: { value: 0.0003, min: 0, max: 0.0005, step: 0.0001 }
  })
  const groupSize = instanceCount / groupCount

  useEffect(() => {
    if (instancesRef.current) {
      const colors = new Float32Array(instanceCount * 3)
      for (let i = 0; i < instanceCount; i++) {
        const c = new THREE.Color(Math.random(), Math.random(), Math.random())
        colors[i * 3] = c.r
        colors[i * 3 + 1] = c.g
        colors[i * 3 + 2] = c.b
      }
      instancesRef.current.instanceColor = new InstancedBufferAttribute(colors, 3)
      for (let i = 0; i < instanceCount; i++) {
        const x = (Math.random() - 0.5) * 4
        const y = (Math.random() - 0.5) * 4
        const z = (Math.random() - 0.5) * 4
        initialPositions.current[i] = new THREE.Vector3(x, y, z)
        instancesRef.current.setMatrixAt(i, new THREE.Matrix4().setPosition(x, y, z))
      }
      instancesRef.current.instanceMatrix.needsUpdate = true
      startTime.current = performance.now() + transitionDelay
    }
  }, [])

  useFrame(() => {
    if (instancesRef.current && startTime.current) {
      const now = performance.now()
      if (now >= startTime.current) {
        const angle = angleMultiplier * now
        const matrix = new THREE.Matrix4()
        const colors = instancesRef.current.instanceColor.array
        for (let i = 0; i < groupSize; i++) {
          instancesRef.current.getMatrixAt(i, matrix)
          const pos = new THREE.Vector3()
          const rot = new THREE.Quaternion()
          const scl = new THREE.Vector3()
          matrix.decompose(pos, rot, scl)
          const tx = Math.cos(angle + i * targetMultiplierX)
          const ty = Math.sin(angle + i * targetMultiplierY)
          const tz = Math.sin(angle + i * targetMultiplierZ)
          const newPos = pos.lerp(new THREE.Vector3(tx, ty, tz), 0.0085)
          matrix.identity()
          matrix.makeRotationFromQuaternion(rot)
          matrix.setPosition(newPos)
          matrix.multiply(new THREE.Matrix4().makeRotationY(speed))
          instancesRef.current.setMatrixAt(i, matrix)
          const t = (now + i * 100) / 1000
          const nc = new THREE.Color(Math.cos(t), Math.sin(t * 10), Math.abs(Math.sin(t)))
          colors[i * 3] = nc.r
          colors[i * 3 + 1] = nc.g
          colors[i * 3 + 2] = nc.b
        }
        instancesRef.current.instanceColor.needsUpdate = true
        instancesRef.current.instanceMatrix.needsUpdate = true
      }
    }
  })

  return (
    <>
      <instancedMesh ref={instancesRef} args={[null, null, instanceCount]}>
        
        <sphereGeometry args={[0.1, 32, 32]} />
        <MeshDistortMaterial
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
          distort={distort}
          speed={speed}
          radius={radius}
          emissive={new THREE.Color(emissiveColor)}
          emissiveIntensity={emissiveIntensity}
          vertexColors={THREE.VertexColors}
        />
      </instancedMesh>
      
    </>
    
  )
}

export default function RandomScene() {
  const { intensity, kernelSize, luminanceThreshold, luminanceSmoothing } = useControls('Bloom', {
    intensity: { value: 0.9, min: 0, max: 5, step: 0.1 },
    kernelSize: { value: 1, min: 1, max: 10, step: 1 },
    luminanceThreshold: { value: 0.75, min: 0, max: 1, step: 0.05 },
    luminanceSmoothing: { value: 0.55, min: 0, max: 1, step: 0.05 },
  })
  return (
    <div className="w-screen h-screen overflow-hidden bg-gray-950">
      <Canvas camera={{ near: 0.01, far: 2000 }}>
        {/* <CameraController /> */}
        <ambientLight intensity={1} />
        <directionalLight position={[0, 5, 5]} />
        <RandomInstances />
        <EffectComposer>
          <Bloom
            intensity={intensity}
            kernelSize={kernelSize}
            luminanceThreshold={luminanceThreshold}
            luminanceSmoothing={luminanceSmoothing}
          />
        </EffectComposer>
        <OrbitControls />
      </Canvas>
    </div>
  )
}
