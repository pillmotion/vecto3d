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
import { useI18n } from "@/locales/client";

interface ExportButtonsProps {
  fileName: string;
  modelGroupRef: React.RefObject<THREE.Group | null>;
}

export function ExportButtons({ fileName, modelGroupRef }: ExportButtonsProps) {
  const t = useI18n();

  const handleExport = async (
    format: "stl" | "gltf" | "glb" | "png",
    resolution?: number,
  ) => {
    console.log("Export attempt:", {
      hasGroupRef: !!modelGroupRef.current,
      fileName,
    });

    if (!modelGroupRef.current || !fileName) {
      console.error("Export failed: Model group or filename missing");
      toast.error(t('edit.export.errors.modelNotLoaded'));
      return;
    }

    console.log("Starting export process for", format);
    const baseName = fileName.replace(".svg", "");

    try {
      if (format === "png") {
        const canvas = document.querySelector("canvas");
        if (!canvas) {
          toast.error(t('edit.export.errors.canvasNotFound'));
          return false;
        }

        const pngResolution = resolution || 1;

        try {
          const exportCanvas = document.createElement("canvas");
          const ctx = exportCanvas.getContext("2d");

          if (!ctx) {
            throw new Error(t('edit.export.errors.canvasContext'));
          }

          exportCanvas.width = canvas.width * pngResolution;
          exportCanvas.height = canvas.height * pngResolution;

          const renderer = (document.querySelector("canvas") as any)?.__r3f
            ?.fiber?.renderer;

          if (renderer) {
            const currentPixelRatio = renderer.getPixelRatio();
            renderer.setPixelRatio(currentPixelRatio * pngResolution);
            renderer.render(renderer.scene, renderer.camera);
            ctx.drawImage(
              canvas,
              0,
              0,
              exportCanvas.width,
              exportCanvas.height,
            );
            renderer.setPixelRatio(currentPixelRatio);
            renderer.render(renderer.scene, renderer.camera);
            renderer.renderLists.dispose();
          } else {
            ctx.drawImage(
              canvas,
              0,
              0,
              exportCanvas.width,
              exportCanvas.height,
            );
          }

          const dataURL = exportCanvas.toDataURL("image/png", 0.95);
          const link = document.createElement("a");
          link.download = `${baseName}.png`;
          link.href = dataURL;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          toast.success(t('edit.export.success.imageSaved', { name: `${baseName}.png` }), { duration: 3000 });
          exportCanvas.remove();
          URL.revokeObjectURL(dataURL);
        } catch (error) {
          console.error("Error exporting PNG:", error);
          toast.error(t('edit.export.errors.imageGenerationFailed'));
        }

        return true;
      }

      const modelGroupClone = modelGroupRef.current.clone();
      modelGroupClone.rotation.y = 0;
      modelGroupClone.updateMatrixWorld(true);

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

      modelGroupClone.traverse((object) => {
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

      if (success) {
        toast.success(
          t('edit.export.success.modelSaved', { name: `${baseName}.${format}` }),
          {
            duration: 3000,
          },
        );
      } else {
        toast.error(t('edit.export.errors.exportFailed', { format: format.toUpperCase() }));
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error(
        t('edit.export.errors.exportError', { message: (error as Error).message || t('edit.export.errors.unknown') }),
      );
    }
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1">
            <Camera className="h-4 w-4 mr-0.5" />
            <span className="hidden sm:inline">{t('edit.export.buttons.exportImage')}</span>
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {PNG_RESOLUTIONS.map((resolution) => (
            <DropdownMenuItem
              key={resolution.multiplier}
              onSelect={() => handleExport("png", resolution.multiplier)}>
              <Image className="h-4 w-4 ml-1" />
              {resolution.multiplier === 1 && t('edit.export.quality.low')}
              {resolution.multiplier === 2 && t('edit.export.quality.medium')}
              {resolution.multiplier === 3 && t('edit.export.quality.high')}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="flex items-center gap-1">
            <Box className="h-4 w-4" />
            <span className="hidden sm:inline">{t('edit.export.buttons.export3D')}</span>
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => handleExport("stl")}>
            <File className="h-4 w-4 mr-0.5" />
            {t('edit.export.formats.stl')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleExport("glb")}>
            <File className="h-4 w-4 mr-0.5" />
            {t('edit.export.formats.glb')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleExport("gltf")}>
            <File className="h-4 w-4 mr-0.5" />
            {t('edit.export.formats.gltf')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
