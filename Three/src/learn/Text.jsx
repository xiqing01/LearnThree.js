// 引入@react-three/fiber和@react-three/drei库中的Canvas和useThree用于3D渲染和控制
import { Canvas, useThree } from '@react-three/fiber'
// 引入@react-three/drei库中的Center、Text3D和OrbitControls，分别用于文本居中、3D文本渲染和控制摄像机视角
import { Center, Text3D, OrbitControls } from '@react-three/drei'

// 定义Scene组件，用于展示3D场景
function Scene({ margin = 0.5 }) {
  // 获取当前视口的宽度和高度
  const { width, height } = useThree((state) => state.viewport)

  return (
    <>
      {/* 使用Center组件将文本居中，并设置旋转角度 */}
      <Center rotation={[0, -0.25, 0]}>
        {/* 创建一个Text3D组件，设置一些文本的样式和属性 */}
        <Text3D
          curveSegments={32} // 设置文本曲线的细分级别
          bevelEnabled // 启用文本的倒角效果
          bevelSize={0.04} // 设置倒角的尺寸
          bevelThickness={0.1} // 设置倒角的厚度
          height={0.5} // 设置文本的高度
          lineHeight={0.6} // 设置行间距
          letterSpacing={-0.06} // 设置字母之间的间距
          size={1.5} // 设置文本的大小
          font="/gentilis_bold.typeface.json" // 设置文本的字体文件
        >
          {`hello\nThree.js`} {/* 显示的文本内容 */}
          <meshStandardMaterial color="#ccfbf1" />{/* 为文本应用一个默认的法线材质 */}
        </Text3D>
      </Center>
    </>
  )
}

// 默认导出Number组件
export default function Number() {
  return (
    // 设置一个全屏背景，使用Tailwind CSS来设置样式
    <div className="w-screen h-screen bg-gray-950 overflow-hidden z-0">
      {/* 使用Canvas组件来创建一个3D渲染区域，设置正交相机 */}
      <Canvas orthographic camera={{ position: [0, 0, 100], zoom: 100 }}>
        {/* 添加一个环境光源，设置强度为0.5 */}
        <ambientLight intensity={0.1} />
        {/* 添加一个方向光源，设置光源位置 */}
        <directionalLight position={[10, 10, 10]} />
        {/* 渲染场景中的内容 */}
        <Scene />
        
        {/* 添加OrbitControls组件来控制摄像机视角 */}
        <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 2} maxPolarAngle={Math.PI / 2} />
      </Canvas>
    </div>
  )
}
