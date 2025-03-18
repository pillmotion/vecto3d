import React, { useRef, useEffect, useMemo } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { EffectComposer, Bloom, BrightnessContrast, SMAA } from "@react-three/postprocessing"
import { BlendFunction } from "postprocessing"
import * as THREE from "three"
import { SVGModel } from "./svg-model"
import { ModelPreviewProps } from "@/lib/types"
import { SimpleEnvironment } from "./environment-presets"

// Split out model preview to a separate component to prevent unnecessary rerenders
const ModelPreviews = React.memo<ModelPreviewProps>(({ 
  svgData, 
  depth, 
  modelRotationY, 
  modelGroupRef, 
  modelRef, 
  // Geometry settings
  bevelEnabled, 
  bevelThickness, 
  bevelSize, 
  bevelSegments,
  isHollowSvg,
  spread,
  // Material settings
  useCustomColor,
  customColor,
  roughness,
  metalness,
  clearcoat,
  transmission,
  envMapIntensity,
  // Environment settings
  backgroundColor,
  useEnvironment,
  environmentPreset,
  customHdriUrl,
  // Rendering options
  autoRotate,
  autoRotateSpeed,
  useBloom,
  bloomIntensity,
  bloomMipmapBlur,
  isMobile
}) => {
  // Use ref to avoid recreating camera on each render
  const cameraRef = useRef(new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000))
  
  // Update camera aspect ratio on resize
  useEffect(() => {
    const handleResize = () => {
      if (cameraRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight
        cameraRef.current.updateProjectionMatrix()
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])
  
  // Configure post-processing based on options
  const effects = useMemo(() => {
    if (useBloom) {
      return (
        <EffectComposer multisampling={isMobile ? 0 : 4}>
          <Bloom 
            intensity={bloomIntensity * 0.7} 
            luminanceThreshold={0.4} 
            luminanceSmoothing={0.95} 
            mipmapBlur={bloomMipmapBlur}
            radius={0.9}
          />
          <BrightnessContrast
            brightness={0.07}
            contrast={0.05}
            blendFunction={BlendFunction.NORMAL}
          />
        </EffectComposer>
      )
    } else if (!isMobile) {
      return (
        <EffectComposer multisampling={0}>
          <SMAA preserveEdges />
        </EffectComposer>
      )
    }
    return null
  }, [useBloom, bloomIntensity, bloomMipmapBlur, isMobile])
  
  // Create memoized environment component
  const environment = useMemo(() => {
    if (!useEnvironment) return null
    
    return (
      <SimpleEnvironment 
        environmentPreset={environmentPreset}
        customHdriUrl={customHdriUrl}
      />
    )
  }, [useEnvironment, environmentPreset, customHdriUrl])
  
  // Return null early if no SVG data
  if (!svgData) return null
  
  return (
    <Canvas 
      shadows
      camera={{ position: [0, 0, 150], fov: 50 }}
      dpr={window?.devicePixelRatio || 1.5} // Adaptive pixel ratio based on device
      frameloop="demand" // Only render when needed for better performance
      performance={{ min: 0.5 }} // Allow adaptive performance
      gl={{ 
        antialias: true,
        outputColorSpace: "srgb",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
        alpha: true,
        // Optimize antialiasing for performance
        logarithmicDepthBuffer: false,
        precision: isMobile ? "mediump" : "highp",
        stencil: false
      }}
    >
      <color attach="background" args={[backgroundColor]} />

      {/* Add a low intensity ambient light for minimum illumination */}
      <ambientLight intensity={0.6 * Math.PI} />
      
      {/* Add directional light for better shape definition */}
      <directionalLight 
        position={[50, 50, 100]} 
        intensity={0.8 * Math.PI} 
        castShadow={false}
      />

      {/* Environment lighting */}
      {environment}

      <group ref={modelGroupRef} rotation={[0, modelRotationY, 0]}>
        <SVGModel
          svgData={svgData}
          depth={depth * 5}
          bevelEnabled={bevelEnabled}
          bevelThickness={bevelThickness}
          bevelSize={bevelSize}
          bevelSegments={isMobile ? 3 : bevelSegments}
          customColor={useCustomColor ? customColor : undefined}
          roughness={roughness}
          metalness={metalness}
          clearcoat={clearcoat}
          transmission={transmission}
          envMapIntensity={useEnvironment ? envMapIntensity : 0.2}
          receiveShadow={false}
          castShadow={false}
          isHollowSvg={isHollowSvg}
          spread={spread}
          ref={modelRef}
        />
      </group>
      
      {/* Post-processing effects */}
      {effects}
      
      <OrbitControls 
        autoRotate={autoRotate}
        autoRotateSpeed={autoRotateSpeed}
        minDistance={50}
        maxDistance={400}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        target={[0, 0, 0]}
      />
    </Canvas>
  )
})

// Ensure proper display name for React DevTools
ModelPreviews.displayName = 'ModelPreviews'

export { ModelPreviews } 