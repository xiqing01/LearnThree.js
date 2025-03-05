import { useRef } from "react"
import { Canvas, useFrame, extend } from "@react-three/fiber"
import { SpotLight, shaderMaterial, OrbitControls } from "@react-three/drei"
import { EffectComposer, Bloom } from "@react-three/postprocessing"

//利用drei提供的shaderMaterial 工具来创建自定义材质
const MyShaderMaterial = shaderMaterial(
  // uniforms 定义， 可以传入动态参数， 现在传入时间参数。
  { u_time: 0 },
  //顶点着色器: 将每个顶点的 position 进行处理
  `
  varying vec2 vUv;
  uniform float u_time;
  void main() {
    vUv = uv;
    vec3 pos = position;
    //利用正弦函数使顶点在 z 方向上产生波动效果
    pos.y += sin(pos.x * 10.0 + u_time) * 0.5;
    pos.z += sin(pos.x * 10.0 + u_time) * 0.1;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
  `,
  //片元着色器： 计算每个像素（片元）的颜色
  `
  varying vec2 vUv;
  uniform float u_time;
  void main() {
    //根据 UV 坐标和时间生成动态变化的颜色
    vec3 color = vec3(vUv, 0.5 + 0.9 * sin(u_time));
    gl_FragColor = vec4(color, 1.0);
  }
  `
)

//将自定义材质注册到Jsx 中
extend({ MyShaderMaterial })

//创建一个平面组件， 并应用自定义的 shader 材质
const AnimatedPlane = () => {
  const materiaRef = useRef()

  //useFrame 每一帧更新 u_time, 驱动动画
  useFrame(({clock}) => {
    if (materiaRef.current) {
      materiaRef.current.u_time = clock.getElapsedTime()
    }
  })

  return (
    <mesh>
      {/* 这是创建一个分辨率较高的平面，方便观察波动效果 */}
      <icosahedronGeometry args={[2]} />
      {/* 使用自定义的材质 */}
      <myShaderMaterial ref={materiaRef} />
    </mesh>
  )
}

const Katakana = () => {
  return(
    <div className="w-screen h-screen bg-gray-950 overflow-hidden z-0">
      <Canvas>
        <ambientLight intensity={1.2} />
        <pointLight  />
        
        <AnimatedPlane />
        <OrbitControls />
        {/* 后期处理效果组合器 */}
        <EffectComposer>
          {/* Bloom 效果：对场景中高亮部分产生柔和的发光效果 */}
          <Bloom
            luminanceThreshold={0}  // 小于该值的像素不会触发发光效果
            luminanceSmoothing={0.1}  // 发光效果平滑程度
            intensity={2}           // 发光强度，可以根据需求调整
            height={700}            // 影响采样区域的高度，控制效果范围
          />
        </EffectComposer>

      </Canvas>
    </div>
  )
}

export default Katakana