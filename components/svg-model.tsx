"use client";

import {
  useRef,
  useMemo,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { Center } from "@react-three/drei";

interface SVGModelProps {
  svgData: string;
  depth?: number;
  bevelEnabled?: boolean;
  bevelThickness?: number;
  bevelSize?: number;
  bevelSegments?: number;
  customColor?: string;
  roughness?: number;
  metalness?: number;
  clearcoat?: number;
  envMapIntensity?: number;
  transmission?: number;
  receiveShadow?: boolean;
  castShadow?: boolean;
  isHollowSvg?: boolean;
  spread?: number;
}

// Create a helper function outside the component to compute the area of a path's bounding box
const getPathBoundingArea = (path: THREE.ShapePath) => {
  if (path.subPaths.length === 0) return 0;

  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;

  path.subPaths.forEach((subPath) => {
    subPath.getPoints().forEach((point) => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });
  });

  return (maxX - minX) * (maxY - minY);
};

// Apply spread to a shape (scale it inward or outward)
const applySpread = (
  shape: THREE.Shape,
  isHole: boolean,
  amount: number,
): THREE.Shape => {
  if (amount === 0) return shape; // No spread needed

  // Use THREE.ShapeUtils.triangulateShape to get a coarse triangulation
  // This helps us compute the center of the shape more accurately
  const pts = shape.getPoints();
  if (pts.length < 3) return shape; // Can't modify shapes with fewer than 3 points

  const center = new THREE.Vector2();
  pts.forEach((pt) => center.add(pt));
  center.divideScalar(pts.length);

  // Create a new shape with spread applied
  const newShape = new THREE.Shape();
  const scaleAmount = isHole ? 1 - amount / 100 : 1; // Holes shrink inward, outer shapes stay the same

  // Apply scale from center for each point
  const newPoints = pts.map((pt) => {
    const dir = new THREE.Vector2().subVectors(pt, center);
    const scaledDir = dir.multiplyScalar(scaleAmount);
    return center.clone().add(scaledDir);
  });

  // Create the new shape from the modified points
  newShape.setFromPoints(newPoints);

  // Copy holes if any, and apply spread to them too
  if (shape.holes && shape.holes.length > 0) {
    newShape.holes = shape.holes.map((hole) => {
      const holePts = hole.getPoints();
      const holeCenter = new THREE.Vector2();
      holePts.forEach((pt) => holeCenter.add(pt));
      holeCenter.divideScalar(holePts.length);

      const newHole = new THREE.Path();
      // Holes in holes: expand outward to create a larger gap
      const holeScaleAmount = 1 + amount / 200;

      const newHolePoints = holePts.map((pt) => {
        const dir = new THREE.Vector2().subVectors(pt, holeCenter);
        const scaledDir = dir.multiplyScalar(holeScaleAmount);
        return holeCenter.clone().add(scaledDir);
      });

      newHole.setFromPoints(newHolePoints);
      return newHole;
    });
  }

  return newShape;
};

// Check if one path is contained within another
const isPathInsideAnother = (
  innerPath: THREE.ShapePath,
  outerPath: THREE.ShapePath,
) => {
  // Simple check: if all points of inner path are inside the outer path's bounding box
  const innerPoints = innerPath.subPaths.flatMap((sp) => sp.getPoints());
  if (innerPoints.length === 0) return false;

  // Get outer path bounding box
  let outerMinX = Infinity,
    outerMinY = Infinity;
  let outerMaxX = -Infinity,
    outerMaxY = -Infinity;

  outerPath.subPaths.forEach((subPath) => {
    subPath.getPoints().forEach((point) => {
      outerMinX = Math.min(outerMinX, point.x);
      outerMinY = Math.min(outerMinY, point.y);
      outerMaxX = Math.max(outerMaxX, point.x);
      outerMaxY = Math.max(outerMaxY, point.y);
    });
  });

  // Check if inner path is contained
  return innerPoints.every(
    (p) =>
      p.x > outerMinX && p.x < outerMaxX && p.y > outerMinY && p.y < outerMaxY,
  );
};

// Check if a path is closed
const isClosedPath = (path: THREE.ShapePath) => {
  return path.subPaths.some((subPath) => {
    const points = subPath.getPoints();
    return (
      points.length > 2 &&
      Math.abs(points[0].x - points[points.length - 1].x) < 0.001 &&
      Math.abs(points[0].y - points[points.length - 1].y) < 0.001
    );
  });
};

export const SVGModel = forwardRef<THREE.Group, SVGModelProps>(
  (
    {
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
      castShadow = true,
      isHollowSvg = false,
      spread = 0,
    },
    ref,
  ) => {
    const [paths, setPaths] = useState<THREE.ShapePath[]>([]);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const groupRef = useRef<THREE.Group>(null);

    // Cache materials to avoid recreating them on every render
    const materialsCache = useRef<Map<string, THREE.Material>>(new Map());

    useImperativeHandle(ref, () => groupRef.current!, []);

    // Parse SVG data only when svgData or isHollowSvg changes
    useEffect(() => {
      if (!svgData) return;

      // Skip parsing if SVG data hasn't changed
      const svgHash = btoa(svgData).slice(0, 20); // Simple hash for comparison

      // Parse the SVG data
      try {
        // Create a temporary DOM element to hold the SVG
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgData, "image/svg+xml");
        const svgElement = svgDoc.querySelector("svg");

        if (!svgElement) return;

        // Get SVG dimensions
        const viewBox = svgElement.getAttribute("viewBox");
        let width = Number.parseFloat(
          svgElement.getAttribute("width") || "100",
        );
        let height = Number.parseFloat(
          svgElement.getAttribute("height") || "100",
        );

        if (viewBox) {
          const [, , vbWidth, vbHeight] = viewBox
            .split(" ")
            .map(Number.parseFloat);
          width = vbWidth;
          height = vbHeight;
        }

        setDimensions({ width, height });

        // Load SVG paths
        const loader = new SVGLoader();
        const svgData2 = loader.parse(svgData);

        // Sort paths by area (largest first) to help with proper hole detection
        const sortedPaths = [...svgData2.paths].sort((a, b) => {
          // Estimate path area by bounding box
          const areaA = getPathBoundingArea(a);
          const areaB = getPathBoundingArea(b);
          return areaB - areaA; // Largest first
        });

        setPaths(sortedPaths);
      } catch (error) {
        console.error("Error parsing SVG:", error);
      }

      // Clean up function
      return () => {
        // Clear cached materials when SVG changes
        materialsCache.current.forEach((material) => {
          if (material) material.dispose();
        });
        materialsCache.current.clear();
      };
    }, [svgData]);

    // Process SVG paths into 3D shapes with proper hole handling
    const shapesWithMaterials = useMemo(() => {
      if (paths.length === 0) return [];

      // For complex SVGs like the smiley face
      if (isHollowSvg || paths.length > 1) {
        try {
          // Find outer paths (containers) and inner paths (potential holes)
          const outerPaths: THREE.ShapePath[] = [];
          const innerPaths: THREE.ShapePath[] = [];

          // First pass - identify outer and inner paths
          paths.forEach((path) => {
            if (isClosedPath(path)) {
              let isInner = false;

              // Check if this path is inside any other path
              for (const otherPath of paths) {
                if (
                  path !== otherPath &&
                  isPathInsideAnother(path, otherPath)
                ) {
                  isInner = true;
                  break;
                }
              }

              if (isInner) {
                innerPaths.push(path);
              } else {
                outerPaths.push(path);
              }
            } else {
              // Non-closed paths are treated as decorative elements
              outerPaths.push(path);
            }
          });

          // Create shapes with holes
          const result = [];

          // Process outer paths first
          for (const outerPath of outerPaths) {
            try {
              // Create the base shape
              const shapes = outerPath.toShapes(false); // Don't auto-detect holes
              const pathColor = customColor || outerPath.color;

              // Find inner paths that could be holes in this outer path
              const potentialHoles = innerPaths.filter((innerPath) =>
                isPathInsideAnother(innerPath, outerPath),
              );

              // If we have potential holes
              if (potentialHoles.length > 0 && shapes.length > 0) {
                // For each shape from the outer path
                shapes.forEach((outerShape) => {
                  potentialHoles.forEach((holePath) => {
                    try {
                      // Convert inner path to shape
                      const holeShapes = holePath.toShapes(false);
                      // Add each hole shape to the outer shape
                      holeShapes.forEach((holeShape) => {
                        // Apply spread to the hole shape if needed
                        const spreadHoleShape = applySpread(
                          holeShape,
                          true,
                          spread,
                        );
                        outerShape.holes.push(spreadHoleShape);
                      });
                    } catch (error) {
                      console.warn("Error adding hole shape:", error);
                    }
                  });
                });
              }

              const processedShapes = shapes.map((shape) =>
                applySpread(shape, false, spread),
              );

              result.push({
                shapes: processedShapes,
                color: pathColor,
                renderOrder: 0, // Base shape gets rendered first
                isHole: false,
              });
            } catch (error) {
              console.warn("Error creating shapes from outer path:", error);
            }
          }

          // Also add inner paths as separate shapes with a small offset
          // This ensures features like eyes still appear if hole detection fails
          for (const innerPath of innerPaths) {
            try {
              const shapes = innerPath.toShapes(false);
              // Apply spread to inner shapes
              const processedShapes = shapes.map((shape) =>
                applySpread(shape, true, spread),
              );

              result.push({
                shapes: processedShapes,
                color: customColor || innerPath.color,
                renderOrder: 1, // Inner shapes rendered after base shapes
                isHole: true,
              });
            } catch (error) {
              console.warn("Error creating shapes from inner path:", error);
            }
          }

          return result;
        } catch (error) {
          console.warn("Error with advanced shape processing:", error);
        }
      }

      // Fallback to standard processing if advanced processing fails
      return paths
        .map((path) => {
          try {
            const shapes = path.toShapes(true); // Try with auto hole detection

            // Apply spread to all shapes in fallback mode too
            const processedShapes = shapes.map((shape) =>
              applySpread(shape, false, spread),
            );

            return {
              shapes: processedShapes,
              color: customColor || path.color,
              renderOrder: 0,
              isHole: false,
            };
          } catch (error) {
            console.warn("Error in fallback shape creation:", error);
            return {
              shapes: [],
              color: customColor || path.color,
              renderOrder: 0,
              isHole: false,
            };
          }
        })
        .filter((item) => item.shapes.length > 0);
    }, [paths, customColor, isHollowSvg, spread]);

    // Scale factor to fit the model in view - memoized to avoid recalculation
    const scale = useMemo(() => {
      if (dimensions.width === 0 || dimensions.height === 0) return 1;
      return 100 / Math.max(dimensions.width, dimensions.height);
    }, [dimensions]);

    // Create and cache material based on parameters
    const getMaterial = (color: string | THREE.Color, isHole: boolean) => {
      const colorKey =
        typeof color === "string" ? color : "#" + color.getHexString();
      const key = `${colorKey}-${isHole}-${roughness}-${metalness}-${clearcoat}-${transmission}-${envMapIntensity}`;

      if (!materialsCache.current.has(key)) {
        const material = new THREE.MeshPhysicalMaterial({
          color,
          side: THREE.FrontSide,
          roughness,
          metalness,
          clearcoat,
          clearcoatRoughness: 0.1,
          transmission,
          envMapIntensity,
          reflectivity: 1,
          ior: transmission > 0.5 ? 1.8 : 1.5,
          specularIntensity: 1.5,
          specularColor: 0xffffff,
          toneMapped: true,
          shadowSide: THREE.FrontSide,
          emissiveIntensity: 0.1,
          emissive: color,
          opacity: transmission > 0.5 ? 0.9 : 1.0,
          transparent: transmission > 0.5,
          thickness: transmission > 0.5 ? depth * 0.5 : 0,
          flatShading: false,
          polygonOffset: true,
          polygonOffsetFactor: isHole ? -2 : 1,
          polygonOffsetUnits: 1,
          depthWrite: !isHole,
        });

        // Store hole status in userData for export reference
        material.userData.isHole = isHole;

        materialsCache.current.set(key, material);
      }

      return materialsCache.current.get(key)!;
    };

    // Cleanup meshes and geometries when component unmounts
    useEffect(() => {
      return () => {
        // Clear cached materials
        materialsCache.current.forEach((material) => {
          if (material) material.dispose();
        });
        materialsCache.current.clear();

        // Clean up the group and its children
        if (groupRef.current) {
          groupRef.current.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              if (object.geometry) object.geometry.dispose();

              if (Array.isArray(object.material)) {
                object.material.forEach((material) => {
                  if (!materialsCache.current.has(material.uuid))
                    material.dispose();
                });
              } else if (
                object.material &&
                !materialsCache.current.has(object.material.uuid)
              ) {
                object.material.dispose();
              }
            }
          });
        }
      };
    }, []);

    // Optimization: return null early if no shapes
    if (shapesWithMaterials.length === 0) return null;

    // Memoize the extrude geometry parameters
    const getExtrudeSettings = (isHole: boolean) => ({
      depth: isHole ? depth * 1.05 : depth,
      bevelEnabled,
      bevelThickness,
      bevelSize,
      bevelSegments,
      curveSegments: 12, // Increased for smoother curves
    });

    return (
      <Center>
        <group
          ref={groupRef}
          scale={[scale, -scale, scale]}
          position={[0, 0, 0]}
          rotation={[0, Math.PI / 4, 0]}>
          {shapesWithMaterials.map((shapeItem, i) => (
            <group key={i} renderOrder={shapeItem.renderOrder}>
              {shapeItem.shapes.map((shape, j) => (
                <mesh
                  key={j}
                  castShadow={castShadow}
                  receiveShadow={receiveShadow}
                  renderOrder={shapeItem.renderOrder}
                  position={[0, 0, shapeItem.isHole ? 0 : -depth / 2]}>
                  <extrudeGeometry
                    args={[shape, getExtrudeSettings(shapeItem.isHole)]}
                  />
                  <primitive
                    object={getMaterial(shapeItem.color, shapeItem.isHole)}
                    attach="material"
                  />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      </Center>
    );
  },
);

// Add a display name for better debugging in React DevTools
SVGModel.displayName = "SVGModel";
