"use client"

import { useState, useRef, Suspense, useEffect, useMemo } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, useTexture } from "@react-three/drei"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { SVGModel } from "@/components/svg-model"
import { ChevronDown, AlertTriangle, RotateCcw, InfoIcon, ArrowLeft, Camera, ImageIcon, Box } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { exportToSTL, exportToGLTF } from "@/lib/exporters"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import * as THREE from "three"
import { useRouter } from "next/navigation"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { EffectComposer, Bloom, BrightnessContrast, SMAA, FXAA } from "@react-three/postprocessing"
import { BlendFunction } from "postprocessing"
import { useFrame } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import React from "react"


// Available HDRI environment presets
const ENVIRONMENT_PRESETS = [
  { name: "apartment", label: "Apartment (Indoor)", color: "#e0ccae" },
  { name: "city", label: "City (Urban)", color: "#b4bdc6" },
  { name: "dawn", label: "Dawn (Sunrise)", color: "#ffd0b0" },
  { name: "forest", label: "Forest (Natural)", color: "#a8c0a0" },
  { name: "lobby", label: "Lobby (Interior)", color: "#d8c8b8" },
  { name: "park", label: "Park (Daytime)", color: "#b3d9ff" },
  { name: "studio", label: "Studio (Neutral)", color: "#d9d9d9" },
  { name: "sunset", label: "Sunset (Warm)", color: "#ffb98c" },
  { name: "warehouse", label: "Warehouse (Industrial)", color: "#9ba3ad" },
]

// Add theme-aware background color presets
const DARK_MODE_COLOR = "#121212"
const LIGHT_MODE_COLOR = "#f5f5f5"

// Add solid color presets
const SOLID_COLOR_PRESETS = [
  { name: "light", label: "Light", color: "#f5f5f5" },
  { name: "dark", label: "Dark", color: "#121212" },
  { name: "blue", label: "Blue", color: "#e6f7ff" },
  { name: "gray", label: "Gray", color: "#e0e0e0" },
  { name: "green", label: "Green", color: "#e6ffed" },
]

// Material presets
const MATERIAL_PRESETS = [
  { 
    name: "metallic", 
    label: "Metallic", 
    roughness: 0.2, 
    metalness: 0.9, 
    clearcoat: 1.0, 
    transmission: 0, 
    envMapIntensity: 1.8
  },
  { 
    name: "clay", 
    label: "Clay/Matte", 
    roughness: 1.0, 
    metalness: 0.0, 
    clearcoat: 0.0, 
    transmission: 0, 
    envMapIntensity: 0.3
  },
  { 
    name: "plastic", 
    label: "Plastic", 
    roughness: 0.4, 
    metalness: 0.0, 
    clearcoat: 0.6, 
    transmission: 0, 
    envMapIntensity: 0.8
  },
  { 
    name: "glass", 
    label: "Glass", 
    roughness: 0.05, 
    metalness: 0.0, 
    clearcoat: 1.0, 
    transmission: 0.95, 
    envMapIntensity: 3.5
  },
  { 
    name: "custom", 
    label: "Custom", 
    roughness: 0.3, 
    metalness: 0.5, 
    clearcoat: 0, 
    transmission: 0, 
    envMapIntensity: 1.0
  }
]

// Create constants for PNG export resolutions
const PNG_RESOLUTIONS = [
  { label: "HD (1x)", multiplier: 1 },
  { label: "2K (2x)", multiplier: 2 }
]

// Add bevel presets
const BEVEL_PRESETS = [
  { name: "none", label: "None", thickness: 0, size: 0, segments: 1 },
  { name: "light", label: "Light", thickness: 0.5, size: 0.3, segments: 2 },
  { name: "medium", label: "Medium", thickness: 1.0, size: 0.5, segments: 4 },
  { name: "heavy", label: "Heavy", thickness: 2.0, size: 1.0, segments: 8 },
  { name: "custom", label: "Custom", thickness: 1.0, size: 0.5, segments: 4 }
]

// Custom environment component that uses a texture instead of a direct HDRI
function CustomEnvironment({ imageUrl }: { imageUrl: string }) {
  const texture = useTexture(imageUrl)
  
  // Convert the texture to an environment map
  useEffect(() => {
    if (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [texture])
  
  return <Environment map={texture} background={false} />
}

// Simple environment component without animations
function SimpleEnvironment({ environmentPreset, customHdriUrl }: { 
  environmentPreset: string, 
  customHdriUrl: string | null
}) {
  return (
    <>
      {environmentPreset === 'custom' && customHdriUrl ? (
        <CustomEnvironment imageUrl={customHdriUrl} />
      ) : (
        <Environment 
          preset={environmentPreset as any} 
          background={false}
        />
      )}
    </>
  )
}

// Interface for ModelPreview component props
interface ModelPreviewProps {
  svgData: string
  depth: number
  modelRotationY: number
  modelGroupRef: React.RefObject<THREE.Group | null>
  modelRef: React.RefObject<THREE.Group | null>
  // Geometry settings
  bevelEnabled: boolean
  bevelThickness: number
  bevelSize: number
  bevelSegments: number
  isHollowSvg: boolean
  spread: number
  // Material settings
  useCustomColor: boolean
  customColor: string
  roughness: number
  metalness: number
  clearcoat: number
  transmission: number
  envMapIntensity: number
  // Environment settings
  backgroundColor: string
  useEnvironment: boolean
  environmentPreset: string
  customHdriUrl: string | null
  // Rendering options
  autoRotate: boolean
  autoRotateSpeed: number
  useBloom: boolean
  bloomIntensity: number
  bloomMipmapBlur: boolean
  isMobile: boolean
}

// Split out model preview to a separate component to prevent unnecessary rerenders
const ModelPreview = React.memo<ModelPreviewProps>(({ 
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
      <Suspense fallback={null}>
        {/* Background color */}
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
      </Suspense>
      
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
ModelPreview.displayName = 'ModelPreview'

export default function EditPage() {
  // React.useState imports before all the other hooks
  const [svgData, setSvgData] = useState<string | null>(null)
  const [depth, setDepth] = useState<number>(5)
  
  // Bevel options
  const [bevelEnabled, setBevelEnabled] = useState<boolean>(true)
  const [bevelThickness, setBevelThickness] = useState<number>(1.0)
  const [bevelSize, setBevelSize] = useState<number>(0.5)
  const [bevelSegments, setBevelSegments] = useState<number>(4)
  const [bevelPreset, setBevelPreset] = useState<string>("medium")
  
  // Gap between inner and outer SVG parts to prevent glitching
  const [spread, setSpread] = useState<number>(0)
  
  // Flag to determine if SVG has overlapping layers
  const [hasOverlappingLayers, setHasOverlappingLayers] = useState<boolean>(false)
  
  const [fileName, setFileName] = useState<string>("")
  const [customColor, setCustomColor] = useState<string>("#3498db")
  const [useCustomColor, setUseCustomColor] = useState<boolean>(false)
  const [isMobile, setIsMobile] = useState<boolean>(false)
  const [continueOnMobile, setContinueOnMobile] = useState<boolean>(false)
  
  // Material properties with presets
  const [materialPreset, setMaterialPreset] = useState<string>("metallic")
  const initialPreset = MATERIAL_PRESETS.find(p => p.name === "metallic") || MATERIAL_PRESETS[0];
  const [roughness, setRoughness] = useState<number>(initialPreset.roughness)
  const [metalness, setMetalness] = useState<number>(initialPreset.metalness)
  const [clearcoat, setClearcoat] = useState<number>(initialPreset.clearcoat)
  const [envMapIntensity, setEnvMapIntensity] = useState<number>(initialPreset.envMapIntensity)
  const [transmission, setTransmission] = useState<number>(initialPreset.transmission)
  
  // Hollow SVG optimization option
  const [isHollowSvg, setIsHollowSvg] = useState<boolean>(false)
  
  // Environment settings
  const [useEnvironment, setUseEnvironment] = useState<boolean>(true)
  const [environmentPreset, setEnvironmentPreset] = useState<string>("apartment")
  
  // Model rotation settings
  const [modelRotationY, setModelRotationY] = useState<number>(0)
  
  // Background options - with theme awareness
  const [userSelectedBackground, setUserSelectedBackground] = useState<boolean>(false)
  const [backgroundColor, setBackgroundColor] = useState<string>(LIGHT_MODE_COLOR)
  const [solidColorPreset, setSolidColorPreset] = useState<string>("light")
  
  // Auto-rotation controls - adjusted scale and DEFAULT OFF
  const [autoRotate, setAutoRotate] = useState<boolean>(false) 
  const [autoRotateSpeed, setAutoRotateSpeed] = useState<number>(3)
  
  // Use useRef for objects that shouldn't trigger re-renders
  const modelRef = useRef<THREE.Group | null>(null)
  const modelGroupRef = useRef<THREE.Group | null>(null)
  const hdriFileInputRef = useRef<HTMLInputElement>(null)
  
  // HDRI image state
  const [customHdriUrl, setCustomHdriUrl] = useState<string | null>(null)
  const [customImageError, setCustomImageError] = useState<string | null>(null)

  // Bloom effect settings - disabled by default
  const [useBloom, setUseBloom] = useState<boolean>(false)
  const [bloomIntensity, setBloomIntensity] = useState<number>(1.0)
  const [bloomMipmapBlur, setBloomMipmapBlur] = useState<boolean>(true)
  
  // Vibe Mode specific settings
  const [vibeModeMaterial, setVibeModeMaterial] = useState<string>("#000000")
  const [vibeModeOriginalMaterial, setVibeModeOriginalMaterial] = useState<string | null>(null)
  
  const router = useRouter()
  const { theme } = useTheme()
  
  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      // Clear references to any large objects
      if (customHdriUrl && customHdriUrl.startsWith('data:')) {
        URL.revokeObjectURL(customHdriUrl)
      }
    }
  }, [])

  // Debounce expensive operations
  const debouncedSvgData = useDebounce(svgData, 300)
  
  // Helper to detect if the SVG is potentially hollow based on path analysis
  // And check for overlapping layers
  useEffect(() => {
    if (!debouncedSvgData) return
    
    // More accurate hollow SVG detection:
    // Look for indicators of hollow SVGs like icons with inner parts
    const hasClosedPath = debouncedSvgData.includes('Z') || debouncedSvgData.includes('z')
    const hasMultiplePaths = (debouncedSvgData.match(/<path/g) || []).length > 1
    const hasCircles = debouncedSvgData.includes('<circle')
    const hasEllipse = debouncedSvgData.includes('<ellipse')
    const hasRect = debouncedSvgData.includes('<rect')
    
    // SVGs likely to have hollow parts:
    // 1. Has multiple closed paths
    // 2. Contains shapes like circles, ellipses or rectangles
    // 3. Contains "smile" or "face" related SVGs (like emojis)
    const isLikelyHollow = 
      (hasClosedPath && (hasMultiplePaths || hasCircles || hasEllipse || hasRect)) ||
      debouncedSvgData.toLowerCase().includes('smile') || 
      debouncedSvgData.toLowerCase().includes('face')
    
    setIsHollowSvg(isLikelyHollow)
    
    // Check for overlapping layers that might need spread adjustment
    // Multiple paths or shapes suggest potential for overlapping
    const hasMultipleElements = 
      hasMultiplePaths || 
      hasCircles || 
      hasEllipse || 
      hasRect || 
      debouncedSvgData.includes('<polygon') ||
      debouncedSvgData.includes('<polyline') ||
      (debouncedSvgData.match(/<g /g) || []).length > 1
    
    setHasOverlappingLayers(hasMultipleElements && isLikelyHollow)
  }, [debouncedSvgData])

  // Detect mobile device on mount and window resize
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Check on initial load
    checkIsMobile()
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIsMobile)
    
    // Check if user has explicitly continued on mobile
    const mobilePreference = localStorage.getItem('continueOnMobile')
    setContinueOnMobile(mobilePreference === 'true')
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // Retrieve SVG data from localStorage on component mount
  useEffect(() => {
    const savedSvgData = localStorage.getItem('svgData')
    const savedFileName = localStorage.getItem('fileName')
    
    if (savedSvgData) {
      setSvgData(savedSvgData)
    }
    
    if (savedFileName) {
      setFileName(savedFileName)
    } else if (!savedSvgData) {
      // If no svg data, redirect to home page
      router.push('/')
    }
  }, [router])

  const handleHdriFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    
    // Reset any previous errors
    setCustomImageError(null)
    
    if (!file) {
      setCustomImageError("No file selected")
      toast.error("No file selected")
      return
    }
    
    // Check if the file type is supported
    const fileType = file.type.toLowerCase()
    const isJpg = fileType === 'image/jpeg' || fileType === 'image/jpg'
    const isPng = fileType === 'image/png'
    
    if (!isJpg && !isPng) {
      setCustomImageError("Only JPG and PNG formats are supported")
      toast.error("Unsupported file format: Only JPG and PNG are supported")
      return
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setCustomImageError("Image must be smaller than 10MB")
      toast.error("File too large: Image must be smaller than 10MB")
      return
    }
    
      const reader = new FileReader()
    
    try {
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomHdriUrl(event.target.result as string)
          setEnvironmentPreset('custom')
          // Reset error state on successful load
          setCustomImageError(null)
          toast.success("Image uploaded successfully")
        } else {
          setCustomImageError("Failed to process image")
          toast.error("Failed to process image")
        }
      }
      
      reader.onerror = (error) => {
        console.error("FileReader error:", error)
        setCustomImageError("Failed to read file")
        toast.error("Failed to read the image file")
      }
      
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("File reading error:", error)
      setCustomImageError("Failed to read file")
      toast.error("Failed to read the image file")
    }
    
    // Clear the input value to allow selecting the same file again
    e.target.value = ''
  }

  const handleExport = async (format: "stl" | "gltf" | "glb" | "png", resolution?: number) => {
    // Log what we have to debug 
    console.log("Export attempt:", { 
      hasModelRef: !!modelRef.current, 
      hasGroupRef: !!modelGroupRef.current, 
      fileName 
    });
    
    // Check group ref first, as that's the parent containing the actual model
    if (!modelGroupRef.current || !fileName) {
      console.error("Export failed: Model group or filename missing");
      toast.error("Error: Cannot export - model not loaded");
      return;
    }

    console.log("Starting export process for", format);
    const baseName = fileName.replace(".svg", "");
    
    try {
      if (format === "png") {
        // Special handling for PNG screenshot
        const canvas = document.querySelector("canvas");
        if (!canvas) {
          toast.error("Could not find the 3D renderer");
          return false;
        }
        
        // Use the provided resolution or default to 1x
        const pngResolution = resolution || 1;
        
        try {
          // Create a temporary canvas with the desired resolution
          const exportCanvas = document.createElement('canvas');
          const ctx = exportCanvas.getContext('2d');
          
          if (!ctx) {
            throw new Error("Could not get 2D context for export canvas");
          }
          
          // Set the export canvas size based on the resolution
          exportCanvas.width = canvas.width * pngResolution;
          exportCanvas.height = canvas.height * pngResolution;
          
          // Get the WebGL renderer from Three.js
          const renderer = (document.querySelector('canvas') as any)?.__r3f?.fiber?.renderer;
          
          if (renderer) {
            // Save current pixel ratio
            const currentPixelRatio = renderer.getPixelRatio();
            
            // Set higher pixel ratio for the screenshot
            renderer.setPixelRatio(currentPixelRatio * pngResolution);
            
            // Force a render at the higher resolution
            renderer.render(renderer.scene, renderer.camera);
            
            // Capture the high-resolution render
            ctx.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);
            
            // Reset pixel ratio to original
            renderer.setPixelRatio(currentPixelRatio);
            
            // Render once more at original resolution
            renderer.render(renderer.scene, renderer.camera);
            
            // Free up GPU resources by explicitly calling dispose where possible
            renderer.renderLists.dispose();
          } else {
            // Fallback if we can't access the renderer
            ctx.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);
          }
          
          // Get the image data as PNG
          const dataURL = exportCanvas.toDataURL('image/png', 0.95);
          
          // Create and trigger download
          const link = document.createElement('a');
          link.download = `${baseName}.png`;
          link.href = dataURL;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast.success(`Image saved as ${baseName}.png`, { duration: 3000 });
          
          // Clean up
          exportCanvas.remove();
          
          // Explicitly release the dataURL to help garbage collection
          URL.revokeObjectURL(dataURL);
        } catch (error) {
          console.error("Error exporting PNG:", error);
          toast.error("Failed to generate image");
        }
        
        return true;
      }
      
      // To avoid visible glitching, we'll create an invisible clone of the model
      // and use that for export instead of modifying the visible model

      // Clone the model group
      const modelGroupClone = modelGroupRef.current.clone();
      
      // Reset the clone's rotation to zero (not visible to user)
      modelGroupClone.rotation.y = 0;
      modelGroupClone.updateMatrixWorld(true);
      
      // Export using the invisible clone
      let success = false;

      if (format === "stl") {
        success = await exportToSTL(modelGroupClone, `${baseName}.stl`);
      } else if (format === "glb" || format === "gltf") {
        success = await exportToGLTF(modelGroupClone, `${baseName}.${format}`, format);
      }
      
      // Dispose of the clone to free memory
      modelGroupClone.traverse((object) => {
        // Type check and cast to access geometry and material properties
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((material: THREE.Material) => material.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
      
      // Only show success message
      if (success) {
        toast.success(`${baseName}.${format} has been downloaded successfully`, {
          duration: 3000,
        });
      } else {
        toast.error(`Failed to export ${format.toUpperCase()}`);
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error(`Export failed: ${(error as Error).message || "Unknown error"}`);
    }
  }

  const handleBackToHome = () => {
    // Clear mobile preference when going back
    localStorage.removeItem('continueOnMobile')
    router.push('/')
  }

  const handleContinueAnyway = () => {
    setContinueOnMobile(true)
    localStorage.setItem('continueOnMobile', 'true')
  }
  
  const handleBackgroundChange = (color: string, preset: string) => {
    setUserSelectedBackground(true)
    setSolidColorPreset(preset)
    setBackgroundColor(color)
  }

  // Helper function to convert display rotation value to actual rotation speed
  const displayToActualRotation = (displayValue: number) => {
    return displayValue + 1.5; // Convert 1-5 display scale to 2.5-7.5 actual scale
  }

  // Helper function to convert actual rotation speed to display value
  const actualToDisplayRotation = (actualValue: number) => {
    return actualValue - 1.5; // Convert 2.5-7.5 actual scale to 1-5 display scale
  }

  // Get environment preset by name
  const getEnvironmentPresetByName = (name: string) => {
    return ENVIRONMENT_PRESETS.find(preset => preset.name === name) || ENVIRONMENT_PRESETS[0]
  }

  // When enabling/disabling Vibe Mode
  const toggleVibeMode = (newState: boolean) => {
    // Check if custom image is selected
    if (newState && environmentPreset === 'custom' && customHdriUrl) {
      toast.error("Vibe Mode is not available with custom images", {
        duration: 3000,
      });
      return; // Don't enable Vibe Mode
    }
    
    setUseBloom(newState);
    
    if (newState) {
      // Entering Vibe Mode
      
      // Set dark background
      setUserSelectedBackground(true);
      setBackgroundColor("#000000");
      setSolidColorPreset('custom');
      
      // Disable auto-rotation
      setAutoRotate(false);
      
      // Store current material color for restoration later
      if (useCustomColor) {
        setVibeModeOriginalMaterial(customColor);
      }
      
      // Override material to black
      setUseCustomColor(true);
      setCustomColor("#000000");
      
      // Keep custom HDRI if used
      if (environmentPreset === 'custom' && customHdriUrl) {
        // Keep the custom HDRI
      } else {
        // Override to dawn environment preset for better effect
        setEnvironmentPreset('dawn');
      }
    } else {
      // Exiting Vibe Mode
      
      // Show alert if using custom environment
      if (environmentPreset === 'custom' && customHdriUrl) {
        toast.info("Custom environment maintained after exiting Vibe Mode", {
          duration: 3000,
        });
      }
      
      // Restore original material if available
      if (vibeModeOriginalMaterial) {
        setCustomColor(vibeModeOriginalMaterial);
        setVibeModeOriginalMaterial(null);
      } else if (useCustomColor) {
        // Keep custom color if one was set
      } else {
        // Restore to using SVG colors
        setUseCustomColor(false);
      }
    }
  }

  // Add an effect to disable Vibe Mode when custom image is selected
  useEffect(() => {
    if (environmentPreset === 'custom' && customHdriUrl && useBloom) {
      toggleVibeMode(false);
      toast.info("Vibe Mode has been disabled because you selected a custom image", {
        duration: 3000,
      });
    }
  }, [environmentPreset, customHdriUrl]);

  // Apply bevel preset
  const applyBevelPreset = (presetName: string) => {
    const preset = BEVEL_PRESETS.find(p => p.name === presetName)
    if (preset) {
      setBevelPreset(preset.name)
      setBevelThickness(preset.thickness)
      setBevelSize(preset.size)
      setBevelSegments(preset.segments)
      setBevelEnabled(preset.name !== "none")
    }
  }

  // Optimize model preview using memoization
  const renderModelPreview = () => {
    if (!svgData) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-lg">
          <p className="text-muted-foreground">Loading model...</p>
        </div>
      )
    }
    
    return (
      <ModelPreview
        svgData={svgData}
        depth={depth}
        modelRotationY={modelRotationY}
        modelGroupRef={modelGroupRef}
        modelRef={modelRef}
        // Geometry settings
        bevelEnabled={bevelEnabled}
        bevelThickness={bevelThickness}
        bevelSize={bevelSize}
        bevelSegments={bevelSegments}
        isHollowSvg={isHollowSvg}
        spread={spread}
        // Material settings
        useCustomColor={useCustomColor}
        customColor={customColor}
        roughness={roughness}
        metalness={metalness}
        clearcoat={clearcoat}
        transmission={transmission}
        envMapIntensity={envMapIntensity}
        // Environment settings
        backgroundColor={backgroundColor}
        useEnvironment={useEnvironment}
        environmentPreset={environmentPreset}
        customHdriUrl={customHdriUrl}
        // Rendering options
        autoRotate={autoRotate}
        autoRotateSpeed={autoRotateSpeed}
        useBloom={useBloom}
        bloomIntensity={bloomIntensity}
        bloomMipmapBlur={bloomMipmapBlur}
        isMobile={isMobile}
      />
    )
  }

  // Custom hook for debouncing values
  function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)
    
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value)
      }, delay)
      
      return () => {
        clearTimeout(handler)
      }
    }, [value, delay])
    
    return debouncedValue
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Fixed header/navbar */}
      <header className="sticky top-0 z-10 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleBackToHome} 
              aria-label="Back to home"
              className="rounded-md w-fit px-4 py-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Back</span>
        </Button>
      </div>

          {svgData && (
            <div className="flex items-center gap-2">
              {/* Export Image Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="flex items-center gap-1">
                    <Camera className="h-4 w-4" />
                    <span className="hidden sm:inline">Export Image</span>
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {PNG_RESOLUTIONS.map((resolution) => (
                    <DropdownMenuItem 
                      key={resolution.multiplier}
                      onSelect={() => handleExport("png", resolution.multiplier)}
                    >
                      {resolution.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Export 3D Model Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="flex items-center gap-1">
                    <Box className="h-4 w-4" />
                    <span className="hidden sm:inline">Export 3D</span>
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onSelect={() => handleExport("stl")}>
                    Export as STL (3D Printing)
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleExport("glb")}>
                    Export as GLB (3D Web/AR)
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleExport("gltf")}>
                    Export as GLTF (3D Editing)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="container flex-1 px-4 py-6">
        {isMobile && !continueOnMobile ? (
          <div className="w-full max-w-md mx-auto">
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Mobile Device Detected</AlertTitle>
              <AlertDescription>
                The 3D editor works best on desktop devices. Some features may be 
                limited or difficult to use on smaller screens.
              </AlertDescription>
            </Alert>
            
            <Card className="mb-6">
              <CardContent className="pt-6 pb-4 px-6">
                <div className="flex flex-col items-center text-center mb-4">
                  <RotateCcw className="h-16 w-16 text-primary mb-4" />
                  <h2 className="text-xl font-semibold">Recommended</h2>
                  <p className="text-muted-foreground mt-2">
                    Please switch to a desktop or laptop computer for the best experience with the 3D editor.
                  </p>
                </div>
                
                <div className="flex flex-col gap-2 mt-4">
                  <Button 
                    variant="default" 
                    className="w-full"
                    onClick={handleBackToHome}
                  >
                    Return to Homepage
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleContinueAnyway}
                  >
                    Continue Anyway
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Mobile-first design with order-last for preview on small screens */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 3D Preview - Order first on mobile so it appears at the top */}
            <Card className="h-[400px] sm:h-[500px] lg:h-[600px] order-first lg:order-last relative overflow-hidden border-[1px] shadow-sm">
              <CardHeader className="p-4">
                <CardTitle className="text-lg">3D Preview</CardTitle>
                <CardDescription className="text-xs">
                  {svgData ? "Interact with the 3D model" : "Loading model..."}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-80px)]">
                {renderModelPreview()}
              </CardContent>
              {/* Extra border at the bottom to fix glitching issue */}
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-border"></div>
            </Card>

            {/* Controls - Shown below the preview on mobile */}
            <div className="space-y-6 order-last lg:order-first">
          <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">Customize 3D Model</CardTitle>
                  <CardDescription className="text-xs truncate">{fileName}</CardDescription>
            </CardHeader>
                <CardContent className="p-4">
              <Tabs defaultValue="geometry">
                    <TabsList className="w-full flex justify-between mb-4 overflow-x-auto">
                      <TabsTrigger value="geometry" className="flex-1">Geometry</TabsTrigger>
                      <TabsTrigger value="material" className="flex-1">Material</TabsTrigger>
                      <TabsTrigger value="environment" className="flex-1">Environment</TabsTrigger>
                      <TabsTrigger value="background" className="flex-1">Background</TabsTrigger>
                </TabsList>

                <TabsContent value="geometry" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="depth">Thickness: {depth}</Label>
                    <Slider
                      id="depth"
                      min={1}
                      max={50}
                      step={1}
                      value={[depth]}
                      onValueChange={(value) => setDepth(value[0])}
                    />
                  </div>
                  
                  {hasOverlappingLayers && (
                    <div className="space-y-2">
                      <Label htmlFor="spread">Hole Spread: {spread}%</Label>
                      <div className="flex items-center space-x-2">
                        <Slider
                          id="spread"
                          min={0}
                          max={20}
                          step={1}
                          value={[spread]}
                          onValueChange={(value) => setSpread(value[0])}
                        />
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setSpread(0)}
                          title="Reset spread"
                          className="h-7 w-7"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Adjust to eliminate glitches between overlapping parts
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="bevelPreset">Bevel Style</Label>
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {BEVEL_PRESETS.map((preset) => (
                        <div 
                          key={preset.name} 
                          className={`cursor-pointer rounded-md p-2 flex flex-col items-center ${
                            bevelPreset === preset.name ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-muted'
                          }`}
                          onClick={() => applyBevelPreset(preset.name)}
                        >
                          <div 
                            className="w-12 h-12 rounded-md mb-1 flex items-center justify-center overflow-hidden"
                            style={
                              preset.name === "none" 
                                ? { 
                                    background: 'transparent',
                                    border: '1px solid hsl(210, 40%, 70%)'
                                  }
                                : preset.name === "custom" 
                                  ? {
                                      background: 'linear-gradient(135deg, hsl(250, 60%, 60%), hsl(210, 60%, 50%))',
                                      border: '1px solid hsl(210, 40%, 70%)',
                                      boxShadow: 'inset 0 0 8px rgba(255,255,255,0.5)',
                                      borderRadius: '10%'
                                    }
                                  : { 
                                      position: 'relative',
                                      background: 'linear-gradient(135deg, hsl(210, 50%, 65%), hsl(210, 50%, 45%))',
                                      border: '1px solid hsl(210, 40%, 70%)',
                                      borderRadius: `${preset.size * 25}%`,
                                      boxShadow: `
                                        inset 0 0 0 ${preset.thickness}px rgba(255,255,255,0.3),
                                        0 ${preset.thickness * 2}px ${preset.thickness * 3}px rgba(0,0,0,0.2)
                                      `
                                    }
                            }
                          >
                            {preset.name === "none" && <span className="text-sm">ー</span>}
                            {preset.name === "custom" && (
                              <div className="text-white text-xs font-semibold relative z-10">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M3 17C3 17.5523 3.44772 18 4 18H10C10.5523 18 11 17.5523 11 17V13H3V17Z" fill="white"/>
                                  <path d="M11 13V9C11 8.44772 10.5523 8 10 8H4C3.44772 8 3 8.44772 3 9V13H11Z" fill="white"/>
                                  <path d="M12 9C12 8.44772 12.4477 8 13 8H19C19.5523 8 20 8.44772 20 9V17C20 17.5523 19.5523 18 19 18H13C12.4477 18 12 17.5523 12 17V9Z" fill="white"/>
                                </svg>
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-medium">{preset.label}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Only show custom sliders if "custom" preset is selected */}
                    {bevelEnabled && bevelPreset === "custom" && (
                      <>
                        <div className="space-y-2 mt-4">
                          <Label htmlFor="bevelThickness">Bevel Thickness: {bevelThickness.toFixed(1)}</Label>
                          <Slider
                            id="bevelThickness"
                            min={0}
                            max={3}
                            step={0.1}
                            value={[bevelThickness]}
                            onValueChange={(value) => {
                              setBevelThickness(value[0])
                            }}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="bevelSize">Bevel Size: {bevelSize.toFixed(1)}</Label>
                          <Slider
                            id="bevelSize"
                            min={0}
                            max={2}
                            step={0.1}
                            value={[bevelSize]}
                            onValueChange={(value) => {
                              setBevelSize(value[0])
                            }}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="bevelSegments">Bevel Quality: {bevelSegments}</Label>
                          <Slider
                            id="bevelSegments"
                            min={1}
                            max={10}
                            step={1}
                            value={[bevelSegments]}
                            onValueChange={(value) => {
                              setBevelSegments(value[0])
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="space-y-2 pt-2 mt-2 border-t">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="autoRotate"
                        checked={autoRotate}
                        onCheckedChange={(checked) => setAutoRotate(checked as boolean)}
                      />
                      <Label htmlFor="autoRotate">Auto-rotate model</Label>
                    </div>
                    
                    {autoRotate && (
                      <div className="space-y-2 pt-2">
                        <Label htmlFor="autoRotateSpeed">
                          Rotation Speed: {actualToDisplayRotation(autoRotateSpeed).toFixed(1)} 
                        </Label>
                        <Slider
                          id="autoRotateSpeed"
                          min={1}
                          max={5}
                          step={0.5}
                          value={[actualToDisplayRotation(autoRotateSpeed)]}
                          onValueChange={(value) => setAutoRotateSpeed(displayToActualRotation(value[0]))}
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="material" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="materialPreset">Material Type</Label>
                    <Select 
                      value={materialPreset} 
                      onValueChange={(value) => {
                        setMaterialPreset(value);
                        // Apply preset values when selected
                        const preset = MATERIAL_PRESETS.find(p => p.name === value);
                        if (preset) {
                          setRoughness(preset.roughness);
                          setMetalness(preset.metalness);
                          setClearcoat(preset.clearcoat);
                          setTransmission(preset.transmission);
                          setEnvMapIntensity(preset.envMapIntensity);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select material type" />
                      </SelectTrigger>
                      <SelectContent>
                        {MATERIAL_PRESETS.map((preset) => (
                          <SelectItem key={preset.name} value={preset.name}>
                            {preset.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {MATERIAL_PRESETS.map((preset) => (
                      <div 
                        key={preset.name} 
                        className={`cursor-pointer rounded-md p-2 flex flex-col items-center ${
                          materialPreset === preset.name ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-muted'
                        }`}
                        onClick={() => {
                          setMaterialPreset(preset.name);
                          setRoughness(preset.roughness);
                          setMetalness(preset.metalness);
                          setClearcoat(preset.clearcoat);
                          setTransmission(preset.transmission);
                          setEnvMapIntensity(preset.envMapIntensity);
                        }}
                      >
                        <div 
                          className="w-12 h-12 rounded-full mb-1"
                          style={{ 
                            background: `linear-gradient(135deg, 
                              hsl(210, ${100 - preset.roughness * 100}%, ${50 + preset.metalness * 30}%), 
                              hsl(240, ${100 - preset.roughness * 80}%, ${20 + preset.metalness * 50}%))`,
                            boxShadow: preset.clearcoat > 0 ? '0 0 10px rgba(255,255,255,0.5) inset' : 'none',
                            opacity: preset.transmission > 0 ? 0.7 : 1
                          }}
                        />
                        <span className="text-xs font-medium">{preset.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useCustomColor"
                      checked={useCustomColor}
                      onCheckedChange={(checked) => setUseCustomColor(checked as boolean)}
                    />
                    <Label htmlFor="useCustomColor">Override SVG colors</Label>
                  </div>

                  {useCustomColor && (
                    <div className="space-y-2">
                      <Label htmlFor="colorPicker">Custom Color</Label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          id="colorPicker"
                          value={customColor}
                          onChange={(e) => setCustomColor(e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={customColor}
                          onChange={(e) => setCustomColor(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {materialPreset === "custom" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="roughness">Roughness: {roughness.toFixed(2)}</Label>
                        <Slider
                          id="roughness"
                          min={0}
                          max={1}
                          step={0.01}
                          value={[roughness]}
                          onValueChange={(value) => setRoughness(value[0])}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="metalness">Metalness: {metalness.toFixed(2)}</Label>
                        <Slider
                          id="metalness"
                          min={0}
                          max={1}
                          step={0.01}
                          value={[metalness]}
                          onValueChange={(value) => setMetalness(value[0])}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="clearcoat">Clearcoat: {clearcoat.toFixed(2)}</Label>
                        <Slider
                          id="clearcoat"
                          min={0}
                          max={1}
                          step={0.01}
                          value={[clearcoat]}
                          onValueChange={(value) => setClearcoat(value[0])}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="transmission">Transmission: {transmission.toFixed(2)}</Label>
                        <Slider
                          id="transmission"
                          min={0}
                          max={1}
                          step={0.01}
                          value={[transmission]}
                          onValueChange={(value) => setTransmission(value[0])}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="envMapIntensity">Environment Reflection: {envMapIntensity.toFixed(1)}</Label>
                        <Slider
                          id="envMapIntensity"
                          min={0}
                          max={3}
                          step={0.1}
                          value={[envMapIntensity]}
                          onValueChange={(value) => setEnvMapIntensity(value[0])}
                        />
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="environment" className="space-y-4">
                      <Alert className="bg-muted/50 mb-4">
                        <AlertDescription className="text-xs flex items-center">
                          <InfoIcon className="h-4 w-4 mr-2" />
                          Environment settings are for preview only and will not affect the exported 3D model.
                        </AlertDescription>
                      </Alert>
                      
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useEnvironment"
                      checked={useEnvironment}
                      onCheckedChange={(checked) => setUseEnvironment(checked as boolean)}
                    />
                    <Label htmlFor="useEnvironment">Use Environment Lighting</Label>
                  </div>

                  {useEnvironment && (
                        <>
                    <div className="space-y-2">
                      <Label htmlFor="environmentPreset">Environment Preset</Label>
                      <Select 
                        value={environmentPreset} 
                        onValueChange={setEnvironmentPreset}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select environment" />
                        </SelectTrigger>
                        <SelectContent>
                          {ENVIRONMENT_PRESETS.map((preset) => (
                            <SelectItem key={preset.name} value={preset.name}>
                              {preset.label}
                            </SelectItem>
                          ))}
                          {customHdriUrl && (
                            <SelectItem value="custom">Custom Image</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                          </div>

                          {/* Visual Indicators for Environment Presets */}
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 my-3">
                            {ENVIRONMENT_PRESETS.map((preset) => (
                              <div 
                                key={preset.name} 
                                className={`cursor-pointer rounded-md p-2 flex flex-col items-center ${
                                  environmentPreset === preset.name ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-muted'
                                }`}
                                onClick={() => setEnvironmentPreset(preset.name)}
                              >
                                <div 
                                  className="w-12 h-12 rounded-full mb-1 overflow-hidden"
                                  style={{ 
                                    background: preset.color,
                                    boxShadow: '0 0 8px rgba(0,0,0,0.15) inset'
                                  }}
                                />
                                <span className="text-xs font-medium text-center">{preset.label.split(' ')[0]}</span>
                              </div>
                            ))}
                            
                            {/* Custom upload option in the grid */}
                            <div 
                              className={`cursor-pointer rounded-md p-2 flex flex-col items-center ${
                                environmentPreset === 'custom' ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-muted'
                              }`}
                              onClick={() => {
                                if (customHdriUrl) {
                                  setEnvironmentPreset('custom');
                                } else {
                                  hdriFileInputRef.current?.click();
                                }
                              }}
                        >
                          <input
                            ref={hdriFileInputRef}
                            type="file"
                                accept="image/jpeg,image/jpg,image/png" 
                            className="hidden"
                            onChange={handleHdriFileChange}
                          />
                                  
                              {customHdriUrl ? (
                                <>
                                  <div 
                                    className="w-12 h-12 rounded-full mb-1 overflow-hidden"
                                    style={{ 
                                      backgroundImage: `url(${customHdriUrl})`,
                                      backgroundSize: 'cover',
                                      backgroundPosition: 'center'
                                    }}
                                  />
                                  <span className="text-xs font-medium">Custom</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-12 h-12 rounded-full mb-1 flex items-center justify-center bg-primary/10">
                                    <span className="text-2xl font-semibold text-primary">+</span>
                                  </div>
                                  <span className="text-xs font-medium">Custom</span>
                                </>
                              )}
                            </div>
                          </div>

                          {environmentPreset === 'custom' && (
                            <div className="mt-3 p-3 bg-muted/30 rounded-md">
                              {customImageError ? (
                                <div className="space-y-2">
                                  <Alert variant="destructive" className="mb-2">
                                    <AlertDescription className="text-xs flex items-center">
                                      <AlertTriangle className="h-4 w-4 mr-2" />
                                      {customImageError}
                                    </AlertDescription>
                                  </Alert>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-xs h-7 w-full"
                                    onClick={() => {
                                      setCustomImageError(null);
                                      hdriFileInputRef.current?.click();
                                    }}
                                  >
                                    Try Again
                        </Button>
                                </div>
                              ) : customHdriUrl ? (
                                <div className="flex items-start">
                                  <InfoIcon className="h-4 w-4 text-muted-foreground mr-2 mt-0.5" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      Your image will be used for reflections in the 3D model
                                    </p>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="mt-2 text-xs h-7"
                                      onClick={() => hdriFileInputRef.current?.click()}
                                    >
                                      Change Image
                                    </Button>
                      </div>
                    </div>
                              ) : (
                                <div className="flex items-start">
                                  <InfoIcon className="h-4 w-4 text-muted-foreground mr-2 mt-0.5" />
                                  <p className="text-xs text-muted-foreground">
                                    Select an image to use for reflections in the 3D model (JPG/PNG only)
                                  </p>
                    </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Vibe Mode with button instead of checkbox - disabled for custom images */}
                      <div className="space-y-2 pt-4 mt-4 border-t">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="vibeMode" className="text-sm font-medium">Vibe Mode</Label>
                          {environmentPreset === 'custom' && customHdriUrl ? (
                            <Button 
                              variant="outline"
                              size="sm"
                              disabled={true}
                              className="opacity-50 cursor-not-allowed"
                            >
                              Not Available
                            </Button>
                          ) : (
                            <Button 
                              variant={useBloom ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                const newValue = !useBloom;
                                toggleVibeMode(newValue);
                              }}
                            >
                              {useBloom ? "Enabled" : "Enable"}
                            </Button>
                          )}
                        </div>
                        
                        {environmentPreset === 'custom' && customHdriUrl && (
                          <Alert variant="destructive" className="mt-2 py-2">
                            <AlertDescription className="text-xs flex items-center">
                              <InfoIcon className="h-3 w-3 mr-1" />
                              Vibe Mode is not available with custom images
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        {useBloom && (
                          <div className="space-y-3 mt-2 p-3 bg-muted/20 rounded-md">
                            <div className="space-y-2">
                              <Label htmlFor="bloomIntensity">Glow Intensity: {bloomIntensity.toFixed(1)}</Label>
                              <Slider
                                id="bloomIntensity"
                                min={0.1}
                                max={4.0}
                                step={0.1}
                                value={[bloomIntensity]}
                                onValueChange={(value) => setBloomIntensity(value[0])}
                              />
                            </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                                id="bloomMipmapBlur"
                                checked={bloomMipmapBlur}
                                onCheckedChange={(checked) => {
                                  if (typeof checked === 'boolean') {
                                    setBloomMipmapBlur(checked);
                                  }
                                }}
                              />
                              <Label htmlFor="bloomMipmapBlur">Soft Glow</Label>
                            </div>
                            
                            {/* Model Rotation Control moved inside Vibe Mode */}
                            <div className="space-y-2 mt-2 pt-2 border-t">
                              <Label htmlFor="modelRotation">Model Rotation: {(modelRotationY * (180/Math.PI)).toFixed(0)}°</Label>
                              <Slider
                                id="modelRotation"
                                min={0}
                                max={2 * Math.PI}
                                step={Math.PI / 12}
                                value={[modelRotationY]}
                                onValueChange={(value) => setModelRotationY(value[0])}
                              />
                            </div>
                          </div>
                        )}
                  </div>
                </TabsContent>

                <TabsContent value="background" className="space-y-4">
                      <Alert className="bg-muted/50 mb-4">
                        <AlertDescription className="text-xs flex items-center">
                          <InfoIcon className="h-4 w-4 mr-2" />
                          Background settings are for preview only and will not be included in the exported 3D model.
                        </AlertDescription>
                      </Alert>
                    
                  <div className="space-y-4">
                    <Label>Background Color</Label>
                        <div className="flex items-center mb-2 text-sm text-muted-foreground">
                          <span>Currently using: {userSelectedBackground ? 'Custom selection' : 'Theme default'}</span>
                        </div>
                    <div className="grid grid-cols-5 gap-2">
                      {SOLID_COLOR_PRESETS.map((preset) => (
                        <div 
                          key={preset.name} 
                          className={`cursor-pointer rounded-md p-2 flex flex-col items-center ${
                            solidColorPreset === preset.name ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-muted'
                          }`}
                              onClick={() => handleBackgroundChange(preset.color, preset.name)}
                        >
                          <div 
                            className="w-12 h-12 rounded-full mb-1"
                            style={{ 
                              background: preset.color
                            }}
                          />
                          <span className="text-xs font-medium">{preset.label}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-2 pt-2">
                      <Label htmlFor="backgroundColor">Custom Color</Label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          id="backgroundColor"
                          value={backgroundColor}
                              onChange={(e) => handleBackgroundChange(e.target.value, "custom")}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={backgroundColor}
                              onChange={(e) => handleBackgroundChange(e.target.value, "custom")}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                        <div className="pt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setUserSelectedBackground(false)
                              if (theme === 'dark') {
                                setBackgroundColor(DARK_MODE_COLOR)
                                setSolidColorPreset('dark')
                              } else {
                                setBackgroundColor(LIGHT_MODE_COLOR)
                                setSolidColorPreset('light')
                              }
                            }}
                            className="w-full"
                          >
                            Reset to Theme Default
                          </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
                      </div>
        </div>
        )}
      </div>
    </main>
  )
} 