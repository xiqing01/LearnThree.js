import { useRef, useMemo } from 'react';
import { Canvas, useFrame, extend, useLoader } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useControls } from "leva";

// Define a custom shader material using shaderMaterial from drei
const PixelTransitionMaterial = shaderMaterial(
  { 
    uTime: 0,                         // Time uniform for animation
    uTexture: null,                   // Texture uniform for image
    uResolution: new THREE.Vector2()  // Resolution uniform for pixel calculations
  },
  // Vertex shader: pass the UV coordinates to the fragment shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;  // Pass UV coordinates
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader: perform pixel transition effect by scrambling pixels based on time
  `
    // Generate a random value based on a 2D coordinate
    float rand(vec2 co){
      return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453);
    }
    uniform float uTime;       // Animation time uniform
    uniform sampler2D uTexture; // The texture to be processed
    uniform vec2 uResolution;   // Resolution of the texture in pixels
    varying vec2 vUv;          // Interpolated UV coordinates
    void main() {
      float pixelSize = 15.0;              // Size of each pixel block
      float duration = 4.0;               // Duration of the transition effect in seconds
      float progress = clamp(uTime / duration, 0.0, 1.0); // Normalized progress of the effect
      
      // Calculate the starting block UV coordinates based on pixel size and resolution
      vec2 blockUV = floor(vUv * uResolution / pixelSize) * pixelSize / uResolution;
      // Compute the center of the current pixel block
      vec2 blockCenter = blockUV + (pixelSize / (2.0 * uResolution));
      // Calculate relative position inside a block
      vec2 relativePos = (vUv * uResolution - floor(vUv * uResolution)) / pixelSize;
      
      // Generate two random values for the block to be used for offset
      float r1 = rand(blockUV);
      float r2 = rand(blockUV + vec2(1.0, 1.0));
      // Create a random offset in the range [-1, 1]
      vec2 randomOffset = vec2(r1, r2) * 2.0 - 1.0;
      float maxOffset = 0.1; // Maximum offset for scrambling
      
      // Adjust block center by random offset scaled with effect progress (reverse effect)
      vec2 scrambledCenter = blockCenter + randomOffset * maxOffset * (1.0 - progress);
      // Reconstruct UV coordinates for scrambled sampling
      vec2 scrambledUV = scrambledCenter + (relativePos - 0.5) * (pixelSize / uResolution);
      
      // Sample colors from the texture at scrambled and original coordinates
      vec4 colorScrambled = texture2D(uTexture, scrambledUV);
      vec4 colorCorrect = texture2D(uTexture, vUv);
      
      // Mix the two colors based on progress to create transition effect
      gl_FragColor = mix(colorScrambled, colorCorrect, progress);
    }
  `
);

// Register the custom material with Three.js
extend({ PixelTransitionMaterial });

// Component to render the plane with the pixel transition effect
function PixelTransitionPlane({ texture, resolution }) {
  const materialRef = useRef();
  // Animate the shader by updating the uTime uniform on each frame
  useFrame(({ clock }) => {
    if(materialRef.current) {
      materialRef.current.uTime = clock.getElapsedTime(); // Update time uniform
    }
  });
  return (
    <mesh>
      {/* Create a plane geometry for displaying the effect */}
      <planeGeometry args={[4.64, 6.56]} />
      {/* Use the custom shader material with texture and resolution props */}
      <pixelTransitionMaterial ref={materialRef} uTexture={texture} uResolution={resolution} />
    </mesh>
  );
}

// Main component rendering the full scene with a Canvas
export default function Pixel() {
  // Load texture using Three.js TextureLoader
  const texture = useLoader(THREE.TextureLoader, '/public/11.png');
  // Define the resolution vector using useMemo to prevent unnecessary recalculations
  const resolution = useMemo(() => new THREE.Vector2(512, 512), []);
  return (
    <div className='w-screen h-screen bg-conic-180 from-indigo-500 to-teal-400 overflow-hidden z-0'>
      <Canvas>
        {/* Render PixelTransitionPlane component inside the Canvas */}
        <PixelTransitionPlane texture={texture} resolution={resolution} />
      </Canvas>
    </div>
  );
}