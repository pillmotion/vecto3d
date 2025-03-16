"use client"

import { useRef } from "react"

import { useEffect, useMemo, useState, forwardRef, useImperativeHandle } from "react"
import * as THREE from "three"
import { SVGLoader } from "three/addons/loaders/SVGLoader.js"
import { Center } from "@react-three/drei"

interface SVGModelProps {
  svgData: string
  depth?: number
  bevelEnabled?: boolean
  bevelThickness?: number
  bevelSize?: number
  bevelSegments?: number
  customColor?: string
  roughness?: number
  metalness?: number
  clearcoat?: number
  envMapIntensity?: number
  transmission?: number
  receiveShadow?: boolean
  castShadow?: boolean
}

export const SVGModel = forwardRef<THREE.Group, SVGModelProps>(({ 
  svgData, 
  depth = 20, 
  bevelEnabled = true,
  bevelThickness = 1,
  bevelSize = 0.5,
  bevelSegments = 3,
  customColor,
  roughness = 0.3,
  metalness = 0.5,
  clearcoat = 0,
  envMapIntensity = 1,
  transmission = 0,
  receiveShadow = true,
  castShadow = true
}, ref) => {
  const [paths, setPaths] = useState<THREE.ShapePath[]>([])
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const groupRef = useRef<THREE.Group>(null)

  useImperativeHandle(ref, () => groupRef.current!, [])

  useEffect(() => {
    if (!svgData) return

    // Create a temporary DOM element to hold the SVG
    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(svgData, "image/svg+xml")
    const svgElement = svgDoc.querySelector("svg")

    if (!svgElement) return

    // Get SVG dimensions
    const viewBox = svgElement.getAttribute("viewBox")
    let width = Number.parseFloat(svgElement.getAttribute("width") || "100")
    let height = Number.parseFloat(svgElement.getAttribute("height") || "100")

    if (viewBox) {
      const [, , vbWidth, vbHeight] = viewBox.split(" ").map(Number.parseFloat)
      width = vbWidth
      height = vbHeight
    }

    setDimensions({ width, height })

    // Load SVG paths
    const loader = new SVGLoader()
    const svgData2 = loader.parse(svgData)
    setPaths(svgData2.paths)
  }, [svgData])

  // Create 3D shapes from SVG paths
  const shapes = useMemo(() => {
    return paths.map((path) => {
      const shapes = path.toShapes(true)
      return { shapes, color: customColor || path.color }
    })
  }, [paths, customColor])

  // Scale factor to fit the model in view
  const scale = useMemo(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return 1
    return 100 / Math.max(dimensions.width, dimensions.height)
  }, [dimensions])

  if (paths.length === 0) return null

  return (
    <Center>
      <group ref={groupRef} scale={[scale, -scale, scale]} position={[0, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
        {shapes.map((shape, i) => (
          <group key={i}>
            {shape.shapes.map((s, j) => (
              <mesh key={j} castShadow={castShadow} receiveShadow={receiveShadow}>
                <extrudeGeometry
                  args={[
                    s,
                    {
                      depth: depth,
                      bevelEnabled: bevelEnabled,
                      bevelThickness: bevelThickness,
                      bevelSize: bevelSize,
                      bevelSegments: bevelSegments,
                    },
                  ]}
                  center
                />
                <meshPhysicalMaterial 
                  color={shape.color} 
                  side={THREE.DoubleSide} 
                  roughness={roughness} 
                  metalness={metalness}
                  clearcoat={clearcoat}
                  clearcoatRoughness={0.1}
                  transmission={transmission}
                  envMapIntensity={envMapIntensity}
                  reflectivity={1}
                  ior={transmission > 0.5 ? 1.8 : 1.5}
                  specularIntensity={1.5}
                  specularColor={0xffffff}
                  toneMapped={true}
                  shadowSide={THREE.FrontSide}
                  emissiveIntensity={0.1}
                  emissive={shape.color}
                  opacity={transmission > 0.5 ? 0.9 : 1.0}
                  transparent={transmission > 0.5}
                  thickness={transmission > 0.5 ? depth * 0.5 : 0}
                />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </Center>
  )
})

SVGModel.displayName = "SVGModel"

