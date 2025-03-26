import { useEffect, useRef } from 'react'
import { useFrame, Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls, Sampler, MeshDistortMaterial } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { InstancedBufferAttribute } from 'three'
import { useControls } from 'leva'

const SampledCube = ({ dummy }) => {
    return dummy
}

const Cube = () => {
    const groupRef = useRef()
    const geometryRef = useRef()
    const instancesRef = useRef()
    const instanceCount = 486

    const initialPositions = useRef([])
    const startTime = useRef(null)
    const transitionDelay = 2000

    const { 
        distort, 
        speed, 
        radius, 
        emissiveIntensity, 
        emissiveColor 
    } = useControls('Material', {
        distort: { value: 0.27, min: 0, max: 1, step: 0.01 },
        speed: { value: 2.9, min: 0, max: 10, step: 0.1 },
        radius: { value: 0.36, min: 0, max: 1, step: 0.01 },
        emissiveIntensity: { value: 1.8, min: 0, max: 2, step: 0.1 },
        emissiveColor: { value: '#129aff' }
    })

    const { 
        groupCount, 
        targetMultiplierX, 
        targetMultiplierY, 
        targetMultiplierZ 
    } = useControls('Parameters', {
        groupCount: { value: 10, min: 1, max: 10, step: 2 },
        targetMultiplierX: { value: 40, min: 0, max: 200, step: 1 },
        targetMultiplierY: { value: 4, min: 0, max: 200, step: 1 },
        targetMultiplierZ: { value: 1, min: 0, max: 200, step: 1 }
    })

    const groupSize = instanceCount / groupCount
    console.log(`dax`, groupSize)

    useEffect(() => {
        if (instancesRef.current && geometryRef.current) {
            const colors = new Float32Array(instanceCount * 3)
            for (let i = 0; i < instanceCount; i++) {
                const randomColor = new THREE.Color(Math.random(), Math.random(), Math.random())
                colors[i * 3] = randomColor.r
                colors[i * 3 + 1] = randomColor.g
                colors[i * 3 + 2] = randomColor.b
            }

            instancesRef.current.instanceColor = new InstancedBufferAttribute(colors, 3)
            instancesRef.current.instanceMatrix.needsUpdate = true

            const vertexCount = geometryRef.current.geometry.attributes.position.count
            const positions = geometryRef.current.geometry.attributes.position.array
            const step = Math.floor(vertexCount / instanceCount)
            for (let i = 0; i < instanceCount; i++) {
                const idx = i * step
                if (idx < positions.length / 3) {
                    const position = new THREE.Vector3(
                        positions[idx * 1],
                        positions[idx * 1 + 1],
                        positions[idx * 1 + 2]
                    )
                    initialPositions.current[i] = position
                    instancesRef.current.setMatrixAt(i, new THREE.Matrix4().setPosition(position))
                }
            }

            startTime.current = performance.now() + transitionDelay
        }
    }, [])

    useFrame(() => {
        if (instancesRef.current && startTime.current) {
            groupRef.current.rotation.y -= 0.0005
            groupRef.current.rotation.x += 0.00005

            const currentTime = performance.now()
            if (currentTime >= startTime.current) {
                const movementSpeed = 0.0005
                const rotationSpeed = speed
                const groupStartIdx = groupSize * 0
                const angle = movementSpeed * currentTime
  
                const matrix = new THREE.Matrix4()
                const colors = instancesRef.current.instanceColor.array
                for (let i = groupStartIdx; i < groupSize; i++) {
                    instancesRef.current.getMatrixAt(i, matrix)
  
                    const targetX = Math.cos(angle + i * targetMultiplierX) * 1
                    const targetY = Math.sin(angle + i * targetMultiplierY) * 1
                    const targetZ = Math.sin(angle + i * targetMultiplierZ) * 1
  
                    const currentPos = new THREE.Vector3()
                    const rotation = new THREE.Quaternion()
                    const scale = new THREE.Vector3()
                    matrix.decompose(currentPos, rotation, scale)
                    const targetPos = new THREE.Vector3(targetX, targetY, targetZ)
                    const newPos = currentPos.lerp(targetPos, 0.0085)
  
                    matrix.setPosition(newPos)
                    matrix.multiply(new THREE.Matrix4().makeRotationY(rotationSpeed))
                    instancesRef.current.setMatrixAt(i, matrix)
  
                    const time = (currentTime + i * 100) / 1000 
                    const newColor = new THREE.Color(Math.cos(time), Math.sin(time * 10))
                    
                    colors[i * 3] = newColor.r
                    colors[i * 3 + 1] = newColor.g
                    colors[i * 3 + 2] = newColor.b
                }
  
                instancesRef.current.instanceColor.needsUpdate = true
                instancesRef.current.instanceMatrix.needsUpdate = true
            }
        }
    })

    return (
        <group ref={groupRef}>
            <mesh visible={false} rotation={[0.4, 0.2, 0]} ref={geometryRef}>
                <boxGeometry args={[3, 3, 3, 8, 8, 8]} />
                <meshBasicMaterial vertexColors={true} />
            </mesh>
            <Sampler mesh={geometryRef} count={instanceCount} instances={instancesRef} transform={SampledCube}>
                <instancedMesh ref={instancesRef} args={[null, null, instanceCount]}>
                    <sphereGeometry args={[0.1, 32, 32]} />
                    <MeshDistortMaterial
                        distort={distort}
                        speed={speed}
                        radius={radius}
                        emissive={new THREE.Color(emissiveColor)}
                        emissiveIntensity={emissiveIntensity}
                        vertexColors={THREE.VertexColors}
                    />
                </instancedMesh>
            </Sampler>
        </group>
    )
}

export default function SurfaceSampler() {
    const { intensity, kernelSize, luminanceThreshold, luminanceSmoothing } = useControls('Bloom', {
        intensity: { value: 0.5, min: 0, max: 5, step: 0.1 },
        kernelSize: { value: 1, min: 1, max: 10, step: 1 },
        luminanceThreshold: { value: 0.35, min: 0, max: 1, step: 0.05 },
        luminanceSmoothing: { value: 0.3, min: 0, max: 1, step: 0.05 }
    })

    return (
        <div className="w-screen h-screen overflow-hidden z-0 bg-linear-to-br/decreasing from-blue-500 via-gray-800 to-black">
            <Canvas>
                <ambientLight intensity={0.5} />
                <directionalLight position={[0, 5, 5]} />
                <Cube />
                <OrbitControls />
                <EffectComposer>
                    <Bloom
                        intensity={intensity}
                        kernelSize={kernelSize}
                        luminanceThreshold={luminanceThreshold}
                        luminanceSmoothing={luminanceSmoothing}
                    />
                </EffectComposer>
            </Canvas>
        </div>
    )
}