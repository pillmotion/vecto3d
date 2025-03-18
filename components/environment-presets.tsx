import { useEffect } from "react";
import { Environment } from "@react-three/drei";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { CustomEnvironmentProps, SimpleEnvironmentProps } from "@/lib/types";

/**
 * Custom environment component that uses a texture instead of a direct HDRI
 */
export function CustomEnvironment({ imageUrl }: CustomEnvironmentProps) {
  const texture = useTexture(imageUrl);

  // Convert the texture to an environment map
  useEffect(() => {
    if (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
    }
  }, [texture]);

  return <Environment map={texture} background={false} />;
}

/**
 * Simple environment component without animations
 */
export function SimpleEnvironment({
  environmentPreset,
  customHdriUrl,
}: SimpleEnvironmentProps) {
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
