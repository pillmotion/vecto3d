"use client";

import { useState, useRef, Suspense, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useTexture } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SVGModel } from "@/components/svg-model";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as THREE from "three";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  EffectComposer,
  Bloom,
  BrightnessContrast,
  SMAA,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import React from "react";
import { ModeToggle } from "@/components/ui/theme-toggle";
import { motion, AnimatePresence } from "framer-motion";
import {
  staggerContainer,
  cardAnimation,
  fadeUp,
  modelContainerAnimation,
  tabContentAnimation,
  pageTransition,
} from "@/lib/animation-values";

// Import extracted components
import { GeometryControls } from "@/components/controls/geometry-controls";
import { MaterialControls } from "@/components/controls/material-controls";
import { EnvironmentControls } from "@/components/controls/environment-controls";
import { BackgroundControls } from "@/components/controls/background-controls";
import { ExportButtons } from "@/components/export-buttons";
import { EditorMobileWarning } from "@/components/mobile-warning";

// Import constants and types
import {
  MATERIAL_PRESETS,
  DARK_MODE_COLOR,
  LIGHT_MODE_COLOR,
  ENVIRONMENT_PRESETS,
} from "@/lib/constants";

// Import hooks
import { useDebounce } from "@/hooks/use-debounce";
import { useMobileDetection } from "@/hooks/use-mobile-detection";

// Background color sync with theme
function useThemeBackgroundColor() {
  const { theme, resolvedTheme } = useTheme();

  // Return background color based on resolved theme (handles system preference correctly)
  return useMemo(() => {
    // resolvedTheme gives us the actual applied theme (light/dark) even when set to 'system'
    if (resolvedTheme === "dark") return DARK_MODE_COLOR;
    return LIGHT_MODE_COLOR;
  }, [resolvedTheme]);
}

// Custom environment component that uses a texture instead of a direct HDRI
function CustomEnvironment({ imageUrl }: { imageUrl: string }) {
  const texture = useTexture(imageUrl);

  // Convert the texture to an environment map
  useEffect(() => {
    if (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
    }
  }, [texture]);

  return <Environment map={texture} background={false} />;
}

// Simple environment component without animations
function SimpleEnvironment({
  environmentPreset,
  customHdriUrl,
}: {
  environmentPreset: string;
  customHdriUrl: string | null;
}) {
  return (
    <>
      {environmentPreset === "custom" && customHdriUrl ? (
        <CustomEnvironment imageUrl={customHdriUrl} />
      ) : (
        <Environment preset={environmentPreset as any} background={false} />
      )}
    </>
  );
}

// Interface for ModelPreview component props
interface ModelPreviewProps {
  svgData: string;
  depth: number;
  modelRotationY: number;
  modelGroupRef: React.RefObject<THREE.Group | null>;
  modelRef: React.RefObject<THREE.Group | null>;
  // Geometry settings
  bevelEnabled: boolean;
  bevelThickness: number;
  bevelSize: number;
  bevelSegments: number;
  isHollowSvg: boolean;
  spread: number;
  // Material settings
  useCustomColor: boolean;
  customColor: string;
  roughness: number;
  metalness: number;
  clearcoat: number;
  transmission: number;
  envMapIntensity: number;
  // Environment settings
  backgroundColor: string;
  useEnvironment: boolean;
  environmentPreset: string;
  customHdriUrl: string | null;
  // Rendering options
  autoRotate: boolean;
  autoRotateSpeed: number;
  useBloom: boolean;
  bloomIntensity: number;
  bloomMipmapBlur: boolean;
  isMobile: boolean;
}

// Split out model preview to a separate component to prevent unnecessary rerenders
const ModelPreview = React.memo<ModelPreviewProps>(
  ({
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
    isMobile,
  }) => {
    // Use ref to avoid recreating camera on each render
    const cameraRef = useRef(
      new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        1,
        1000,
      ),
    );

    // Update camera aspect ratio on resize
    useEffect(() => {
      const handleResize = () => {
        if (cameraRef.current) {
          cameraRef.current.aspect = window.innerWidth / window.innerHeight;
          cameraRef.current.updateProjectionMatrix();
        }
      };

      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, []);

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
        );
      } else if (!isMobile) {
        return (
          <EffectComposer multisampling={0}>
            <SMAA preserveEdges />
          </EffectComposer>
        );
      }
      return null;
    }, [useBloom, bloomIntensity, bloomMipmapBlur, isMobile]);

    // Create memoized environment component
    const environment = useMemo(() => {
      if (!useEnvironment) return null;

      return (
        <SimpleEnvironment
          environmentPreset={environmentPreset}
          customHdriUrl={customHdriUrl}
        />
      );
    }, [useEnvironment, environmentPreset, customHdriUrl]);

    // Return null early if no SVG data
    if (!svgData) return null;

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
          stencil: false,
        }}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}>
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
    );
  },
);

// Ensure proper display name for React DevTools
ModelPreview.displayName = "ModelPreview";

export default function EditPage() {
  // React.useState imports before all the other hooks
  const [svgData, setSvgData] = useState<string | null>(null);
  const [depth, setDepth] = useState<number>(5);

  // Bevel options
  const [bevelEnabled, setBevelEnabled] = useState<boolean>(true);
  const [bevelThickness, setBevelThickness] = useState<number>(1.0);
  const [bevelSize, setBevelSize] = useState<number>(0.5);
  const [bevelSegments, setBevelSegments] = useState<number>(4);
  const [bevelPreset, setBevelPreset] = useState<string>("medium");

  const [fileName, setFileName] = useState<string>("");
  const [customColor, setCustomColor] = useState<string>("#3498db");
  const [useCustomColor, setUseCustomColor] = useState<boolean>(false);

  // Material properties with presets
  const [materialPreset, setMaterialPreset] = useState<string>("metallic");
  const initialPreset =
    MATERIAL_PRESETS.find((p) => p.name === "metallic") || MATERIAL_PRESETS[0];
  const [roughness, setRoughness] = useState<number>(initialPreset.roughness);
  const [metalness, setMetalness] = useState<number>(initialPreset.metalness);
  const [clearcoat, setClearcoat] = useState<number>(initialPreset.clearcoat);
  const [envMapIntensity, setEnvMapIntensity] = useState<number>(
    initialPreset.envMapIntensity,
  );
  const [transmission, setTransmission] = useState<number>(
    initialPreset.transmission,
  );

  // Hollow SVG optimization option
  const [isHollowSvg, setIsHollowSvg] = useState<boolean>(false);

  // Environment settings
  const [useEnvironment, setUseEnvironment] = useState<boolean>(true);
  const [environmentPreset, setEnvironmentPreset] =
    useState<string>("apartment");

  // Model rotation settings
  const [modelRotationY, setModelRotationY] = useState<number>(0);

  // Background options - with theme awareness
  const [userSelectedBackground, setUserSelectedBackground] =
    useState<boolean>(false);
  const [backgroundColor, setBackgroundColor] =
    useState<string>(LIGHT_MODE_COLOR);
  const [solidColorPreset, setSolidColorPreset] = useState<string>("light");

  // Auto-rotation controls - adjusted scale and DEFAULT OFF
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [autoRotateSpeed, setAutoRotateSpeed] = useState<number>(3);

  // Use useRef for objects that shouldn't trigger re-renders
  const modelRef = useRef<THREE.Group | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const hdriFileInputRef = useRef<HTMLInputElement>(null);

  // HDRI image state
  const [customHdriUrl, setCustomHdriUrl] = useState<string | null>(null);
  const [customImageError, setCustomImageError] = useState<string | null>(null);

  // Bloom effect settings - disabled by default
  const [useBloom, setUseBloom] = useState<boolean>(false);
  const [bloomIntensity, setBloomIntensity] = useState<number>(1.0);
  const [bloomMipmapBlur, setBloomMipmapBlur] = useState<boolean>(true);

  // Vibe Mode specific settings
  const [vibeModeOriginalMaterial, setVibeModeOriginalMaterial] = useState<
    string | null
  >(null);

  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();
  const {
    isMobile,
    continueOnMobile,
    handleContinueOnMobile,
    clearMobilePreference,
  } = useMobileDetection();

  // Get theme-aware background color
  const themeBackgroundColor = useThemeBackgroundColor();

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      // Clear references to any large objects
      if (customHdriUrl && customHdriUrl.startsWith("data:")) {
        URL.revokeObjectURL(customHdriUrl);
      }
    };
  }, [customHdriUrl]);

  // Update background color when theme changes if user hasn't selected a custom one
  useEffect(() => {
    if (!userSelectedBackground) {
      setBackgroundColor(themeBackgroundColor);
      setSolidColorPreset(resolvedTheme === "dark" ? "dark" : "light");
    }
  }, [resolvedTheme, themeBackgroundColor, userSelectedBackground]);

  // Debounce expensive operations
  const debouncedSvgData = useDebounce(svgData, 300);

  // Helper to detect if the SVG is potentially hollow based on path analysis
  useEffect(() => {
    if (!debouncedSvgData) return;

    // More accurate hollow SVG detection:
    // Look for indicators of hollow SVGs like icons with inner parts
    const hasClosedPath =
      debouncedSvgData.includes("Z") || debouncedSvgData.includes("z");
    const hasMultiplePaths =
      (debouncedSvgData.match(/<path/g) || []).length > 1;
    const hasCircles = debouncedSvgData.includes("<circle");
    const hasEllipse = debouncedSvgData.includes("<ellipse");
    const hasRect = debouncedSvgData.includes("<rect");

    // SVGs likely to have hollow parts:
    // 1. Has multiple closed paths
    // 2. Contains shapes like circles, ellipses or rectangles
    // 3. Contains "smile" or "face" related SVGs (like emojis)
    const isLikelyHollow =
      (hasClosedPath &&
        (hasMultiplePaths || hasCircles || hasEllipse || hasRect)) ||
      debouncedSvgData.toLowerCase().includes("smile") ||
      debouncedSvgData.toLowerCase().includes("face");

    setIsHollowSvg(isLikelyHollow);
  }, [debouncedSvgData]);

  // Retrieve SVG data from localStorage on component mount
  useEffect(() => {
    const savedSvgData = localStorage.getItem("svgData");
    const savedFileName = localStorage.getItem("fileName");

    if (savedSvgData) {
      setSvgData(savedSvgData);
    }

    if (savedFileName) {
      setFileName(savedFileName);
    } else if (!savedSvgData) {
      // If no svg data, redirect to home page
      router.push("/");
    }
  }, [router]);

  const handleBackToHome = () => {
    // Clear mobile preference when going back
    clearMobilePreference();
    router.push("/");
  };

  // When enabling/disabling Vibe Mode
  const toggleVibeMode = (newState: boolean) => {
    // Check if custom image is selected
    if (newState && environmentPreset === "custom" && customHdriUrl) {
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
      setSolidColorPreset("custom");

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
      if (environmentPreset === "custom" && customHdriUrl) {
        // Keep the custom HDRI
      } else {
        // Override to dawn environment preset for better effect
        setEnvironmentPreset("dawn");
      }
    } else {
      // Exiting Vibe Mode

      // Show alert if using custom environment
      if (environmentPreset === "custom" && customHdriUrl) {
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
  };

  // Add an effect to disable Vibe Mode when custom image is selected
  useEffect(() => {
    if (environmentPreset === "custom" && customHdriUrl && useBloom) {
      toggleVibeMode(false);
      toast.info(
        "Vibe Mode has been disabled because you selected a custom image",
        {
          duration: 3000,
        },
      );
    }
  }, [environmentPreset, customHdriUrl, useBloom]);

  // Optimize model preview using memoization
  const renderModelPreview = () => {
    if (!svgData) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-muted/30">
          <p className="text-muted-foreground">Loading model...</p>
        </div>
      );
    }

    return (
      <div className="w-full h-full overflow-hidden">
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
          spread={0}
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
      </div>
    );
  };

  return (
    <motion.main
      className="min-h-screen flex flex-col"
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit">
      {/* Fixed header/navbar */}
      <motion.header
        className="sticky top-0 z-10 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}>
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleBackToHome}
              aria-label="Back to home"
              className="rounded-md w-fit px-4 py-2">
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <ModeToggle />
            {svgData && (
              <ExportButtons
                fileName={fileName}
                modelGroupRef={modelGroupRef}
              />
            )}
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <div className="container flex-1 px-4 py-6">
        <AnimatePresence mode="wait">
          {isMobile && !continueOnMobile ? (
            <motion.div
              key="mobile-warning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}>
              <EditorMobileWarning
                onContinue={handleContinueOnMobile}
                onReturn={handleBackToHome}
              />
            </motion.div>
          ) : (
            /* Mobile-first design with order-last for preview on small screens */
            <motion.div
              key="editor-content"
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              variants={staggerContainer(0.2)}
              initial="hidden"
              animate="show">
              {/* 3D Preview - Order first on mobile so it appears at the top */}
              <motion.div
                variants={modelContainerAnimation}
                className="h-[400px] sm:h-[500px] lg:h-[600px] order-first lg:order-last relative overflow-hidden">
                <Card className="w-full h-full flex flex-col overflow-hidden border-[1px] shadow-sm">
                  <CardHeader className="p-4 pb-4 border-b bg-background/80 backdrop-blur-sm z-10">
                    <CardTitle className="text-lg">Preview</CardTitle>
                    <CardDescription className="text-xs">
                      {svgData
                        ? "Interact with your 3D model"
                        : "Loading model..."}
                    </CardDescription>
                  </CardHeader>

                  <div className="flex-grow relative">
                    {renderModelPreview()}
                  </div>
                </Card>
              </motion.div>

              {/* Controls - Shown below the preview on mobile */}
              <motion.div
                className="space-y-6 order-last lg:order-first"
                variants={cardAnimation}>
                <Card>
                  <CardHeader className="p-4 pb-4">
                    <CardTitle className="text-lg">Customize</CardTitle>
                    <CardDescription className="text-xs truncate">
                      {fileName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <Tabs defaultValue="geometry">
                      <TabsList className="w-full flex justify-between mb-4 overflow-x-auto">
                        <TabsTrigger value="geometry" className="flex-1">
                          Geometry
                        </TabsTrigger>
                        <TabsTrigger value="material" className="flex-1">
                          Material
                        </TabsTrigger>
                        <TabsTrigger value="environment" className="flex-1">
                          Environment
                        </TabsTrigger>
                        <TabsTrigger value="background" className="flex-1">
                          Background
                        </TabsTrigger>
                      </TabsList>

                      <AnimatePresence mode="sync">
                        <TabsContent value="geometry" key="geometry">
                          <motion.div
                            key="geometry-content"
                            variants={tabContentAnimation}
                            initial="hidden"
                            animate="show"
                            exit="exit">
                            <GeometryControls
                              depth={depth}
                              setDepth={setDepth}
                              bevelEnabled={bevelEnabled}
                              setBevelEnabled={setBevelEnabled}
                              bevelThickness={bevelThickness}
                              setBevelThickness={setBevelThickness}
                              bevelSize={bevelSize}
                              setBevelSize={setBevelSize}
                              bevelSegments={bevelSegments}
                              setBevelSegments={setBevelSegments}
                              bevelPreset={bevelPreset}
                              setBevelPreset={setBevelPreset}
                              autoRotate={autoRotate}
                              setAutoRotate={setAutoRotate}
                              autoRotateSpeed={autoRotateSpeed}
                              setAutoRotateSpeed={setAutoRotateSpeed}
                            />
                          </motion.div>
                        </TabsContent>

                        <TabsContent value="material" key="material">
                          <motion.div
                            key="material-content"
                            variants={tabContentAnimation}
                            initial="hidden"
                            animate="show"
                            exit="exit">
                            <MaterialControls
                              materialPreset={materialPreset}
                              setMaterialPreset={setMaterialPreset}
                              roughness={roughness}
                              setRoughness={setRoughness}
                              metalness={metalness}
                              setMetalness={setMetalness}
                              clearcoat={clearcoat}
                              setClearcoat={setClearcoat}
                              transmission={transmission}
                              setTransmission={setTransmission}
                              envMapIntensity={envMapIntensity}
                              setEnvMapIntensity={setEnvMapIntensity}
                              useCustomColor={useCustomColor}
                              setUseCustomColor={setUseCustomColor}
                              customColor={customColor}
                              setCustomColor={setCustomColor}
                            />
                          </motion.div>
                        </TabsContent>

                        <TabsContent value="environment" key="environment">
                          <motion.div
                            key="environment-content"
                            variants={tabContentAnimation}
                            initial="hidden"
                            animate="show"
                            exit="exit">
                            <EnvironmentControls
                              useEnvironment={useEnvironment}
                              setUseEnvironment={setUseEnvironment}
                              environmentPreset={environmentPreset}
                              setEnvironmentPreset={setEnvironmentPreset}
                              customHdriUrl={customHdriUrl}
                              setCustomHdriUrl={setCustomHdriUrl}
                              useBloom={useBloom}
                              setUseBloom={setUseBloom}
                              bloomIntensity={bloomIntensity}
                              setBloomIntensity={setBloomIntensity}
                              bloomMipmapBlur={bloomMipmapBlur}
                              setBloomMipmapBlur={setBloomMipmapBlur}
                              modelRotationY={modelRotationY}
                              setModelRotationY={setModelRotationY}
                              toggleVibeMode={toggleVibeMode}
                            />
                          </motion.div>
                        </TabsContent>

                        <TabsContent value="background" key="background">
                          <motion.div
                            key="background-content"
                            variants={tabContentAnimation}
                            initial="hidden"
                            animate="show"
                            exit="exit">
                            <BackgroundControls
                              backgroundColor={backgroundColor}
                              setBackgroundColor={setBackgroundColor}
                              userSelectedBackground={userSelectedBackground}
                              setUserSelectedBackground={
                                setUserSelectedBackground
                              }
                              solidColorPreset={solidColorPreset}
                              setSolidColorPreset={setSolidColorPreset}
                              theme={theme}
                            />
                          </motion.div>
                        </TabsContent>
                      </AnimatePresence>
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.main>
  );
}
