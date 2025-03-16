import * as THREE from "three"
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js"
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js"
import { Group } from 'three'

// Helper function to trigger download
function downloadFile(blob: Blob, filename: string) {
  try {
    const link = document.createElement("a")
    link.style.display = "none"
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
    }, 100)
    console.log(`File "${filename}" download triggered`)
  } catch (error) {
    console.error("Download error:", error)
  }
}

// Export to STL format
export const exportToSTL = (model: THREE.Group, filename: string) => {
  const exporter = new STLExporter()
  const result = exporter.parse(model, { binary: true })
  
  // When binary is true, the result is a binary blob that we can download directly
  const blob = new Blob([result], { type: 'application/octet-stream' })
  downloadBlob(blob, filename)
}

// Export to GLTF/GLB format
export const exportToGLTF = (model: THREE.Group, filename: string, format: 'gltf' | 'glb' = 'glb') => {
  const exporter = new GLTFExporter()
  
  const options = {
    binary: format === 'glb',
    trs: false,
    onlyVisible: true,
    truncateDrawRange: true,
    animations: [],
    forceIndices: false,
    forcePowerOfTwoTextures: false,
  }
  
  exporter.parse(
    model,
    (result: ArrayBuffer | object) => {
      if (format === 'glb') {
        const blob = new Blob([result as ArrayBuffer], { type: 'application/octet-stream' })
        downloadBlob(blob, filename)
      } else {
        const blob = new Blob([JSON.stringify(result)], { type: 'text/plain' })
        downloadBlob(blob, filename)
      }
    },
    (error: ErrorEvent) => {
      console.error('Error during export:', error)
    },
    options
  )
}

const downloadBlob = (blob: Blob, filename: string) => {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  
  // Clean up
  URL.revokeObjectURL(link.href)
}

