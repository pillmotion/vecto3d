import * as THREE from "three"
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js"
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js"

// Helper function to trigger download
function downloadBlob(blob: Blob, filename: string) {
  try {
    console.log(`Triggering download for ${filename}`, blob)
    
    const link = document.createElement("a")
    link.style.display = "none"
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    
    // Log after click to verify it happened
    console.log("Download link clicked")
    
    // Cleanup after a delay to ensure the download starts
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
      console.log("Cleanup completed")
    }, 200)
  } catch (error) {
    console.error("Download error:", error)
  }
}

// Export to STL format
export const exportToSTL = (model: THREE.Group, filename: string) => {
  try {
    console.log("Exporting STL...", model)
    
    // Ensure model exists and has children
    if (!model || !model.children || model.children.length === 0) {
      console.error("Invalid model for STL export:", model)
      throw new Error("Invalid model: Model is empty or undefined")
    }
    
    // Create a copy to avoid modifying the original
    const modelForExport = model.clone()
    
    // Force update matrices to ensure correct geometry
    modelForExport.updateMatrixWorld(true)
    
    const exporter = new STLExporter()
    console.log("STL Exporter created")
    
    const result = exporter.parse(modelForExport, { binary: true })
    console.log("STL parsing completed, result type:", typeof result, "size:", result.byteLength)
    
    // When binary is true, the result is a binary blob that we can download directly
    const blob = new Blob([result], { type: 'application/octet-stream' })
    console.log("STL Blob created, size:", blob.size)
    
    downloadBlob(blob, filename)
    
    // Clean up cloned model
    modelForExport.traverse((obj: THREE.Object3D) => {
      // Cast to Mesh to access geometry and material
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m: THREE.Material) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
    
    return true
  } catch (error) {
    console.error("STL export error:", error)
    throw error
  }
}

// Export to GLTF/GLB format
export const exportToGLTF = (model: THREE.Group, filename: string, format: 'gltf' | 'glb' = 'glb') => {
  try {
    console.log("Exporting GLTF/GLB...", model)
    
    // Ensure model exists and has children
    if (!model || !model.children || model.children.length === 0) {
      console.error("Invalid model for GLTF export:", model)
      throw new Error("Invalid model: Model is empty or undefined")
    }
    
    // Create a copy to avoid modifying the original
    const modelForExport = model.clone()
    
    // Force update matrices to ensure correct geometry
    modelForExport.updateMatrixWorld(true)
    
    console.log("GLTF Model prepared:", modelForExport)
    
    const exporter = new GLTFExporter()
    console.log("GLTF Exporter created")
    
    const options = {
      binary: format === 'glb',
      trs: false,
      onlyVisible: true,
      truncateDrawRange: true,
      animations: [],
      forceIndices: false,
      forcePowerOfTwoTextures: false,
    }
    
    console.log("GLTF Export options:", options)
    
    exporter.parse(
      modelForExport,
      (result: ArrayBuffer | object) => {
        console.log("GLTF parsing completed, result type:", typeof result)
        
        if (format === 'glb') {
          const blob = new Blob([result as ArrayBuffer], { type: 'application/octet-stream' })
          console.log("GLB Blob created, size:", blob.size)
          downloadBlob(blob, filename)
        } else {
          const blob = new Blob([JSON.stringify(result)], { type: 'text/plain' })
          console.log("GLTF Blob created, size:", blob.size)
          downloadBlob(blob, filename)
        }
        
        // Clean up cloned model
        modelForExport.traverse((obj: THREE.Object3D) => {
          // Cast to Mesh to access geometry and material
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m: THREE.Material) => m.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        });
      },
      (error: ErrorEvent) => {
        console.error('Error during GLTF export:', error)
        throw error
      },
      options
    )
    
    return true
  } catch (error) {
    console.error("GLTF/GLB export error:", error)
    throw error
  }
}

