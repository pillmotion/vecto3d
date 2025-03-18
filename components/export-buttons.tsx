import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Box, Camera, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import * as THREE from "three";
import { exportToSTL, exportToGLTF } from "@/lib/exporters";
import { PNG_RESOLUTIONS } from "@/lib/constants";
import { File, Image } from "lucide-react";
interface ExportButtonsProps {
  fileName: string;
  modelGroupRef: React.RefObject<THREE.Group | null>;
}

export function ExportButtons({ fileName, modelGroupRef }: ExportButtonsProps) {
  const handleExport = async (
    format: "stl" | "gltf" | "glb" | "png",
    resolution?: number,
  ) => {
    // Log what we have to debug
    console.log("Export attempt:", {
      hasGroupRef: !!modelGroupRef.current,
      fileName,
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
          const exportCanvas = document.createElement("canvas");
          const ctx = exportCanvas.getContext("2d");

          if (!ctx) {
            throw new Error("Could not get 2D context for export canvas");
          }

          // Set the export canvas size based on the resolution
          exportCanvas.width = canvas.width * pngResolution;
          exportCanvas.height = canvas.height * pngResolution;

          // Get the WebGL renderer from Three.js
          const renderer = (document.querySelector("canvas") as any)?.__r3f
            ?.fiber?.renderer;

          if (renderer) {
            // Save current pixel ratio
            const currentPixelRatio = renderer.getPixelRatio();

            // Set higher pixel ratio for the screenshot
            renderer.setPixelRatio(currentPixelRatio * pngResolution);

            // Force a render at the higher resolution
            renderer.render(renderer.scene, renderer.camera);

            // Capture the high-resolution render
            ctx.drawImage(
              canvas,
              0,
              0,
              exportCanvas.width,
              exportCanvas.height,
            );

            // Reset pixel ratio to original
            renderer.setPixelRatio(currentPixelRatio);

            // Render once more at original resolution
            renderer.render(renderer.scene, renderer.camera);

            // Free up GPU resources by explicitly calling dispose where possible
            renderer.renderLists.dispose();
          } else {
            // Fallback if we can't access the renderer
            ctx.drawImage(
              canvas,
              0,
              0,
              exportCanvas.width,
              exportCanvas.height,
            );
          }

          // Get the image data as PNG
          const dataURL = exportCanvas.toDataURL("image/png", 0.95);

          // Create and trigger download
          const link = document.createElement("a");
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
        success = await exportToGLTF(
          modelGroupClone,
          `${baseName}.${format}`,
          format,
        );
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
            mesh.material.forEach((material: THREE.Material) =>
              material.dispose(),
            );
          } else {
            mesh.material.dispose();
          }
        }
      });

      // Only show success message
      if (success) {
        toast.success(
          `${baseName}.${format} has been downloaded successfully`,
          {
            duration: 3000,
          },
        );
      } else {
        toast.error(`Failed to export ${format.toUpperCase()}`);
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error(
        `Export failed: ${(error as Error).message || "Unknown error"}`,
      );
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Export Image Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1">
            <Camera className="h-4 w-4 mr-0.5" />
            <span className="hidden sm:inline">Export Image</span>
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {PNG_RESOLUTIONS.map((resolution) => (
            <DropdownMenuItem
              key={resolution.multiplier}
              onSelect={() => handleExport("png", resolution.multiplier)}>
              <Image className="h-4 w-4 ml-1" />
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
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => handleExport("stl")}>
            <File className="h-4 w-4 mr-0.5" />
            Export as STL
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleExport("glb")}>
            <File className="h-4 w-4 mr-0.5" />
            Export as GLB
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleExport("gltf")}>
            <File className="h-4 w-4 mr-0.5" />
            Export as GLTF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
