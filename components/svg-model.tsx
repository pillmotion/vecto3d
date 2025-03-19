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
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
  onError?: (error: Error) => void;
}

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

const applySpread = (
  shape: THREE.Shape,
  isHole: boolean,
  amount: number,
): THREE.Shape => {
  if (amount === 0) return shape;

  const pts = shape.getPoints();
  if (pts.length < 3) return shape;

  const center = new THREE.Vector2();
  pts.forEach((pt) => center.add(pt));
  center.divideScalar(pts.length);

  const newShape = new THREE.Shape();
  const scaleAmount = isHole ? 1 - amount / 100 : 1;

  const newPoints = pts.map((pt) => {
    const dir = new THREE.Vector2().subVectors(pt, center);
    const scaledDir = dir.multiplyScalar(scaleAmount);
    return center.clone().add(scaledDir);
  });

  newShape.setFromPoints(newPoints);

  if (shape.holes && shape.holes.length > 0) {
    newShape.holes = shape.holes.map((hole) => {
      const holePts = hole.getPoints();
      const holeCenter = new THREE.Vector2();
      holePts.forEach((pt) => holeCenter.add(pt));
      holeCenter.divideScalar(holePts.length);

      const newHole = new THREE.Path();
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

const isPathInsideAnother = (
  innerPath: THREE.ShapePath,
  outerPath: THREE.ShapePath,
) => {
  const innerPoints = innerPath.subPaths.flatMap((sp) => sp.getPoints());
  if (innerPoints.length === 0) return false;

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

  return innerPoints.every(
    (p) =>
      p.x > outerMinX && p.x < outerMaxX && p.y > outerMinY && p.y < outerMaxY,
  );
};

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
      onLoadStart,
      onLoadComplete,
      onError
    },
    ref,
  ) => {
    const [paths, setPaths] = useState<THREE.ShapePath[]>([]);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const groupRef = useRef<THREE.Group>(null);

    const materialsCache = useRef<Map<string, THREE.Material>>(new Map());

    useImperativeHandle(ref, () => groupRef.current!, []);

    useEffect(() => {
      if (!svgData) return;

      const svgHash = btoa(svgData).slice(0, 20);

      onLoadStart?.();

      try {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgData, "image/svg+xml");
        const svgElement = svgDoc.querySelector("svg");

        if (!svgElement) {
          throw new Error("Invalid SVG: No SVG element found");
        }

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

        const loader = new SVGLoader();
        const svgData2 = loader.parse(svgData);
        
        const sortedPaths = [...svgData2.paths].sort((a, b) => {
          const areaA = getPathBoundingArea(a);
          const areaB = getPathBoundingArea(b);
          return areaB - areaA;
        });
        
        setPaths(sortedPaths);

        setTimeout(() => {
          onLoadComplete?.();
        }, 300);
      } catch (error) {
        console.error("Error parsing SVG:", error);
        onError?.(error instanceof Error ? error : new Error("Failed to parse SVG"));
      }

      return () => {
        materialsCache.current.clear();
      };
    }, [svgData, onLoadStart, onLoadComplete, onError]);

    const shapesWithMaterials = useMemo(() => {
      if (paths.length === 0) return [];

      if (isHollowSvg || paths.length > 1) {
        try {
          const outerPaths: THREE.ShapePath[] = [];
          const innerPaths: THREE.ShapePath[] = [];

          paths.forEach((path) => {
            if (isClosedPath(path)) {
              let isInner = false;

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
              outerPaths.push(path);
            }
          });

          const result = [];
          const processedInnerPaths = new Set();

          for (const outerPath of outerPaths) {
            try {
              const shapes = SVGLoader.createShapes(outerPath);
              const pathColor = customColor || outerPath.color;

              const processedShapes = shapes.map((shape) =>
                applySpread(shape, false, spread),
              );

              result.push({
                shapes: processedShapes,
                color: pathColor,
                renderOrder: 0,
                isHole: false,
              });

              innerPaths.forEach((innerPath) => {
                if (isPathInsideAnother(innerPath, outerPath)) {
                  processedInnerPaths.add(innerPath);
                }
              });
            } catch (error) {
              console.warn("Error creating shapes from outer path:", error);
            }
          }

          for (const innerPath of innerPaths) {
            if (!processedInnerPaths.has(innerPath)) {
              try {
                const shapes = SVGLoader.createShapes(innerPath);
                const processedShapes = shapes.map((shape) =>
                  applySpread(shape, true, spread),
                );

                result.push({
                  shapes: processedShapes,
                  color: customColor || innerPath.color,
                  renderOrder: 1,
                  isHole: true,
                });
              } catch (error) {
                console.warn("Error creating shapes from inner path:", error);
              }
            }
          }

          return result;
        } catch (error) {
          console.warn("Error with advanced shape processing:", error);
        }
      }

      return paths
        .map((path) => {
          try {
            const shapes = SVGLoader.createShapes(path);

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

    const scale = useMemo(() => {
      if (dimensions.width === 0 || dimensions.height === 0) return 1;
      return 100 / Math.max(dimensions.width, dimensions.height);
    }, [dimensions]);

    const getMaterial = (color: string | THREE.Color, isHole: boolean) => {
      const colorKey =
        typeof color === "string" ? color : "#" + color.getHexString();
      const key = `${colorKey}-${isHole}-${roughness}-${metalness}-${clearcoat}-${transmission}-${envMapIntensity}`;

      if (!materialsCache.current.has(key)) {
        const material = new THREE.MeshPhysicalMaterial({
          color,
          side: THREE.DoubleSide,
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
          depthWrite: true,
        });

        material.userData.isHole = isHole;

        materialsCache.current.set(key, material);
      }

      return materialsCache.current.get(key)!;
    };

    const handleSvgGroupCreated = (group: THREE.Group) => {
      try {
        
        onLoadComplete?.();
      } catch (error) {
        console.error("Error processing SVG:", error);
        onError?.(error instanceof Error ? error : new Error('Error processing SVG'));
      }
    };

    useEffect(() => {
      return () => {
        materialsCache.current.forEach((material) => {
          if (material) material.dispose();
        });
        materialsCache.current.clear();

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

    if (shapesWithMaterials.length === 0) return null;

    const getExtrudeSettings = (isHole: boolean) => ({
      depth: isHole ? depth * 1.05 : depth,
      bevelEnabled,
      bevelThickness,
      bevelSize,
      bevelSegments,
      curveSegments: 12,
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

SVGModel.displayName = "SVGModel";
