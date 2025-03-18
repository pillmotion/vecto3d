import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { FileUploadProps } from "@/lib/types"

export function FileUpload({ onFileUpload, fileName }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const processFile = (file: File) => {
    if (file && file.type === "image/svg+xml") {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          onFileUpload(event.target.result as string, file.name)
        }
      }
      reader.readAsText(file)
    } else if (file) {
      // Show an error for non-SVG files
      alert("Please upload an SVG file (.svg)")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragging) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set isDragging to false if we're leaving the drop zone (not a child element)
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFile(files[0])
    }
  }

  return (
    <Card className="border-2 shadow-lg">
      <CardContent className="p-6">
        <div
          ref={dropZoneRef}
          className={`border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/10' 
              : 'hover:bg-muted/30'
          }`}
          onClick={handleUploadClick}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            accept=".svg" 
            className="hidden" 
            onChange={handleFileChange} 
          />
          <Upload className={`h-16 w-16 mb-4 ${isDragging ? 'text-primary animate-pulse' : 'text-primary'}`} />
          <p className="text-center">
            {fileName ? fileName : `${isDragging ? 'Drop SVG file here' : 'Click to upload or drag and drop an SVG file'}`}
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 