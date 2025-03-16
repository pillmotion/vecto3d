"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Monitor, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Logo } from "@/components/ui/logo"
import Link from "next/link"
export default function Home() {
  const [svgData, setSvgData] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const [isMobile, setIsMobile] = useState<boolean>(false)
  const [continueAnywayMobile, setContinueAnywayMobile] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Detect mobile device on mount and window resize
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Check on initial load
    checkIsMobile()
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIsMobile)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === "image/svg+xml") {
      setFileName(file.name)
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setSvgData(event.target.result as string)
        }
      }
      reader.readAsText(file)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleContinue = () => {
    if (svgData) {
      // Store SVG data in localStorage to access it on the edit page
      localStorage.setItem('svgData', svgData)
      localStorage.setItem('fileName', fileName)
      
      // Store the mobile device preference
      if (isMobile) {
        localStorage.setItem('continueOnMobile', 'true')
      }
      
      router.push('/edit')
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/50">
      <div className="w-full max-w-5xl px-4 sm:px-6 flex flex-col items-center">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Logo className="h-16 w-16 text-primary mr-2" />
            <h1 className="text-6xl font-bold tracking-tighter">Vecto3D</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            Transform your SVG designs into stunning 3D models with a single click
          </p>
        </div>

        {isMobile && !continueAnywayMobile ? (
          <div className="w-full max-w-md">
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Mobile Device Detected</AlertTitle>
              <AlertDescription>
                The 3D editor works best on desktop devices. Some features may be 
                limited or difficult to use on smaller screens.
              </AlertDescription>
            </Alert>
            
            <Card className="mb-6">
              <CardContent className="pt-6 pb-4 px-6">
                <div className="flex flex-col items-center text-center mb-4">
                  <Monitor className="h-16 w-16 text-primary mb-4" />
                  <h2 className="text-xl font-semibold">Recommended</h2>
                  <p className="text-muted-foreground mt-2">
                    Please switch to a desktop or laptop computer for the best experience.
                  </p>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => setContinueAnywayMobile(true)}
                >
                  Continue on Mobile Anyway
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-4xl items-center">
            <div className="flex flex-col space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center shrink-0">1</div>
                <p>Upload your SVG file</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center shrink-0">2</div>
                <p>Customize parameters and settings</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center shrink-0">3</div>
                <p>Export your 3D model</p>
              </div>
            </div>

            <Card className="border-2 shadow-lg">
              <CardContent className="p-6">
                <div
                  className="border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={handleUploadClick}
                >
                  <input type="file" ref={fileInputRef} accept=".svg" className="hidden" onChange={handleFileChange} />
                  <Upload className="h-16 w-16 text-primary mb-4" />
                  <p className="text-center">
                    {fileName ? fileName : "Click to upload or drag and drop an SVG file"}
                  </p>
                </div>
                
                {svgData && (
                  <Button 
                    className="w-full mt-4 text-md py-6"
                    size="lg"
                    onClick={handleContinue}
                  >
                    Continue to Editor
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-16 text-center text-sm text-muted-foreground">
          Vibe coded with <Link href="https://v0.dev" className="text-primary font-mono" target="_blank" rel="noopener noreferrer">v0.dev</Link> + Copilot by <Link href="https://lakshb.dev" className="underline" target="_blank" rel="noopener noreferrer">Lakshay Bhushan</Link>
        </div>
      </div>
    </main>
  )
}

