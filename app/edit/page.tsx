"use client"

import { useState, useRef, Suspense, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, Sky } from "@react-three/drei"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { SVGModel } from "@/components/svg-model"
import { Download, ChevronDown, ArrowLeft, Home, AlertTriangle, RotateCcw } from "lucide-react"
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
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Logo } from "@/components/ui/logo"

// Available HDRI environment presets
const ENVIRONMENT_PRESETS = [
  { name: "apartment", label: "Apartment (Indoor)" },
  { name: "city", label: "City (Urban)" },
  { name: "dawn", label: "Dawn (Sunrise)" },
  { name: "forest", label: "Forest (Natural)" },
  { name: "lobby", label: "Lobby (Interior)" },
  { name: "park", label: "Park (Daytime)" },
  { name: "studio", label: "Studio (Neutral)" },
  { name: "sunset", label: "Sunset (Warm)" },
  { name: "warehouse", label: "Warehouse (Industrial)" },
]

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

export default function EditPage() {
  const [svgData, setSvgData] = useState<string | null>(null)
  const [depth, setDepth] = useState<number>(5)
  
  // Bevel options
  const [bevelEnabled, setBevelEnabled] = useState<boolean>(true)
  const [bevelThickness, setBevelThickness] = useState<number>(1.0)
  const [bevelSize, setBevelSize] = useState<number>(0.5)
  const [bevelSegments, setBevelSegments] = useState<number>(3)
  
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
  
  // Environment settings
  const [useEnvironment, setUseEnvironment] = useState<boolean>(true)
  const [environmentPreset, setEnvironmentPreset] = useState<string>("apartment")
  const [useSky, setUseSky] = useState<boolean>(false)
  
  // Background options - simplified to just solid color
  const [backgroundColor, setBackgroundColor] = useState<string>("#f5f5f5")
  
  // Auto-rotation controls - adjusted scale
  const [autoRotate, setAutoRotate] = useState<boolean>(true)
  const [autoRotateSpeed, setAutoRotateSpeed] = useState<number>(3) // Middle value (represents 2.5+3=5.5)
  
  const modelRef = useRef<THREE.Group>(null)
  const hdriFileInputRef = useRef<HTMLInputElement>(null)
  const [customHdriUrl, setCustomHdriUrl] = useState<string | null>(null)
  const [solidColorPreset, setSolidColorPreset] = useState<string>("light")
  
  const router = useRouter()

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
    if (file && (file.type.includes('image'))) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomHdriUrl(event.target.result as string)
          setEnvironmentPreset('custom')
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleExport = async (format: "stl" | "gltf" | "glb") => {
    if (!modelRef.current || !fileName) return

    const baseName = fileName.replace(".svg", "")

    if (format === "stl") {
      exportToSTL(modelRef.current, `${baseName}.stl`)
    } else if (format === "glb" || format === "gltf") {
      exportToGLTF(modelRef.current, `${baseName}.${format}`, format)
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

  // Helper function to convert display rotation value to actual rotation speed
  const displayToActualRotation = (displayValue: number) => {
    return displayValue + 1.5; // Convert 1-5 display scale to 2.5-7.5 actual scale
  }

  // Helper function to convert actual rotation speed to display value
  const actualToDisplayRotation = (actualValue: number) => {
    return actualValue - 1.5; // Convert 2.5-7.5 actual scale to 1-5 display scale
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Fixed header/navbar */}
      <header className="sticky top-0 z-10 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleBackToHome} 
              className="rounded-full"
              aria-label="Back to home"
            >
              <Home className="h-5 w-5" />
            </Button>
            <div className="flex items-center">
              <Logo className="h-8 w-8 text-primary mr-2" />
              <h1 className="text-xl font-bold hidden sm:block">Vecto3D</h1>
            </div>
          </div>
          
          {svgData && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
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
            <Card className="h-[400px] sm:h-[500px] lg:h-[600px] order-first lg:order-last">
              <CardHeader className="p-4">
                <CardTitle className="text-lg">3D Preview</CardTitle>
                <CardDescription className="text-xs">
                  {svgData ? "Interact with the 3D model" : "Loading model..."}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-80px)]">
                {svgData ? (
                  <Canvas 
                    shadows 
                    camera={{ position: [0, 0, 150], fov: 50 }}
                    gl={{ 
                      outputColorSpace: "srgb",
                      toneMapping: THREE.ACESFilmicToneMapping,
                      toneMappingExposure: 1.5
                    }}
                  >
                    <Suspense fallback={null}>
                      {/* Background based on selected type */}
                      {!useSky && (
                        <color attach="background" args={[backgroundColor]} />
                      )}

                      {/* Add a low intensity ambient light for minimum illumination */}
                      <ambientLight intensity={0.5 * Math.PI} />

                      {/* Environment and sky setup */}
                      {useEnvironment && (
                        environmentPreset === 'custom' && customHdriUrl ? (
                          <Environment 
                            files={customHdriUrl} 
                            background={false}
                          />
                        ) : (
                          <Environment 
                            preset={environmentPreset as any} 
                            background={false}
                          />
                        )
                      )}
                      
                      {useSky && (
                        <Sky 
                          distance={450000} 
                          sunPosition={[0, 1, 0]} 
                          inclination={0.6} 
                          azimuth={0.25}
                          rayleigh={1}
                          turbidity={10}
                        />
                      )}

                      <SVGModel
                        svgData={svgData}
                        depth={depth * 5}
                        bevelEnabled={bevelEnabled}
                        bevelThickness={bevelThickness}
                        bevelSize={bevelSize}
                        bevelSegments={bevelSegments}
                        customColor={useCustomColor ? customColor : undefined}
                        roughness={roughness}
                        metalness={metalness}
                        clearcoat={clearcoat}
                        transmission={transmission}
                        envMapIntensity={useEnvironment ? envMapIntensity : 0.2}
                        ref={modelRef}
                      />
                    </Suspense>
                    <OrbitControls 
                      autoRotate={autoRotate}
                      autoRotateSpeed={autoRotateSpeed}
                      minDistance={50}
                      maxDistance={400}
                      enablePan={true}
                      enableZoom={true}
                      enableRotate={true}
                    />
                  </Canvas>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground">Loading model...</p>
                  </div>
                )}
              </CardContent>
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
                        <Label htmlFor="depth">Extrusion Depth: {depth * 5}</Label>
                        <Slider
                          id="depth"
                          min={5}
                          max={20}
                          step={1}
                          value={[depth]}
                          onValueChange={(value) => setDepth(value[0])}
                        />
                      </div>
                      
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="bevelEnabled"
                            checked={bevelEnabled}
                            onCheckedChange={(checked) => setBevelEnabled(checked as boolean)}
                          />
                          <Label htmlFor="bevelEnabled">Enable Bevel</Label>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Model Rotation</Label>
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
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="useEnvironment"
                          checked={useEnvironment}
                          onCheckedChange={(checked) => setUseEnvironment(checked as boolean)}
                        />
                        <Label htmlFor="useEnvironment">Use Environment Lighting</Label>
                      </div>

                      {useEnvironment && (
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

                          <div className="pt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => hdriFileInputRef.current?.click()}
                              className="w-full"
                            >
                              <input
                                ref={hdriFileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleHdriFileChange}
                              />
                              Upload Custom Image
                            </Button>
                            <p className="text-xs text-muted-foreground mt-1">
                              Any image can be used as environment lighting
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="useSky"
                          checked={useSky}
                          onCheckedChange={(checked) => setUseSky(checked as boolean)}
                        />
                        <Label htmlFor="useSky">Use Sky Background</Label>
                      </div>
                    </TabsContent>

                    <TabsContent value="background" className="space-y-4">
                      <div className="space-y-4">
                        <Label>Background Color</Label>
                        <div className="grid grid-cols-5 gap-2">
                          {SOLID_COLOR_PRESETS.map((preset) => (
                            <div 
                              key={preset.name} 
                              className={`cursor-pointer rounded-md p-2 flex flex-col items-center ${
                                solidColorPreset === preset.name ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-muted'
                              }`}
                              onClick={() => {
                                setSolidColorPreset(preset.name);
                                setBackgroundColor(preset.color);
                              }}
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
                              onChange={(e) => {
                                setBackgroundColor(e.target.value);
                                setSolidColorPreset("custom");
                              }}
                              className="w-10 h-10 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={backgroundColor}
                              onChange={(e) => {
                                setBackgroundColor(e.target.value);
                                setSolidColorPreset("custom");
                              }}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                          </div>
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