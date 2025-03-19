import { Canvas, extend, useFrame } from "@react-three/fiber"
import { OrbitControls,useTexture } from "@react-three/drei"
import { useMemo, useRef } from "react"
import * as THREE from "three"
import { useControls } from "leva"

function createCloudMaterial(BaseMaterial) {
  return class CloudMaterial extends BaseMaterial {
    constructor(parameters) {
      super(parameters)
      const opaque_fragment = parseInt(THREE.REVISION.replace(/\D+/g, "")) >= 154 ? "opaque_fragment" : "output_fragment"
      this.onBeforeCompile = shader => {
        shader.vertexShader = `
          attribute float cloudOpacity;
          varying float vOpacity;
          ` + shader.vertexShader.replace(
            "#include <fog_vertex>",
            `#include <fog_vertex>
             vOpacity = cloudOpacity;`
          )
        shader.fragmentShader = `
          varying float vOpacity;
          ` + shader.fragmentShader.replace(
            `#include <${opaque_fragment}>`,
            `#include <${opaque_fragment}>
             gl_FragColor = vec4(outgoingLight, diffuseColor.a * vOpacity);`
          )
      }
    }
  }
}

const CustomCloudMaterial = createCloudMaterial(THREE.MeshBasicMaterial)
extend({ CustomCloudMaterial })

const CLOUD_URL = "https://rawcdn.githack.com/pmndrs/drei-assets/9225a9f1fbd449d9411125c2f419b843d0308c9f/cloud.png"

const RightTetrahedron = (props) => {
  const face1 = {
    V0: [-1, 0, 0],
    V1: [0, 2, 0],
    V2: [0, 0, 0]
  }
  const face2 = {
    V0: [0, 0, 1],
    V1: [0, 0, 0],
    V3: [0, 2, 0]
  }
  const face3 = {
    V1: [-1, 0, 0],
    V2: [0, 0, 1],
    V3: [0, 2, 0]
  }


  const geometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const vertices = new Float32Array([
      ...face1.V0, ...face1.V1, ...face1.V2,
      ...face2.V0, ...face2.V1, ...face2.V3,
      ...face3.V1, ...face3.V2, ...face3.V3
    ])
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3))
    const uvs = new Float32Array([
      1, 0, 0, 1, 0, 0.1,
      0, 0, 1, 0, 0, 1,
      2, 0, 0, 1, 0, 0
    ])
    geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2))
    const cloudOpacityArray = new Float32Array(geometry.attributes.position.count).fill(1)
    geometry.setAttribute("cloudOpacity", new THREE.BufferAttribute(cloudOpacityArray, 1))
    geometry.computeVertexNormals()
    return geometry
  }, [])

  const cloudTexture = useTexture(CLOUD_URL)

  return (
    <mesh geometry={geometry} {...props}>
      <customCloudMaterial
        map={cloudTexture}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

const Animation = ({ group1, group2 }) => {
  useFrame((state, delta) => {
    if (group1.current) {
      group1.current.rotation.y += delta
    }
    if (group2.current) {
      group2.current.rotation.y -= -delta
    }
  })
  return null
}

const TrihedronGroup = () => {
  const group1 = useRef()
  const group2 = useRef()

  return (
    <div className="w-screen h-screen bg-radial-[at_50%_75%] from-indigo-500 to-teal-700 overflow-hidden z-0">
      <Canvas>
        <group position={[0.1, -0.25, 2]} rotation={[Math.PI/8.5, Math.PI/5, Math.PI/4.5]}>
          <group ref={group1} position={[0, 0.25, 0]}>
            <RightTetrahedron position={[0.2, 0, 0.2]} rotation={[0, 1.6, 0]} />
            <RightTetrahedron position={[-0.2, 0, 0.2]} rotation={[0, 0, 0]} />
            <RightTetrahedron position={[-0.2, 0, -0.2]} rotation={[0, 4.7, 0]} />
            <RightTetrahedron position={[0.2, 0, -0.2]} rotation={[0, 3.2, 0]} />
          </group>
          <group ref={group2} position={[0, -0.25, 0]} rotation={[Math.PI, 0, 0]}>
            <RightTetrahedron position={[0.2, 0, 0.2]} rotation={[0, 1.6, 0]} />
            <RightTetrahedron position={[-0.2, 0, 0.2]} rotation={[0, 0, 0]} />
            <RightTetrahedron position={[-0.2, 0, -0.2]} rotation={[0, 4.7, 0]} />
            <RightTetrahedron position={[0.2, 0, -0.2]} rotation={[0, 3.2, 0]} />
          </group>
          <Animation group1={group1} group2={group2} />
        </group>
        <OrbitControls />
      </Canvas>
    </div>
  )
}

export default TrihedronGroup