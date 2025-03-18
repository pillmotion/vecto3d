"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { FileUpload } from "@/components/file-upload"
import { MobileWarning } from "@/components/mobile-warning"
import { useMobileDetection } from "@/hooks/use-mobile-detection"

export default function Home() {
  const [svgData, setSvgData] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const router = useRouter()
  const { isMobile, continueOnMobile, handleContinueOnMobile } = useMobileDetection()

  const handleFileUpload = (data: string, name: string) => {
    setSvgData(data)
    setFileName(name)
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

        {isMobile && !continueOnMobile ? (
          <MobileWarning onContinue={handleContinueOnMobile} onReturn={() => {}} />
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

            <div className="flex flex-col">
              <FileUpload 
                onFileUpload={handleFileUpload} 
                fileName={fileName} 
              />
              
              {svgData && (
                <Button 
                  className="w-full mt-4 text-md py-6"
                  size="lg"
                  onClick={handleContinue}
                >
                  Continue to Editor
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="mt-16 text-center text-sm text-muted-foreground">
          Vibe coded with <Link href="https://v0.dev" className="text-primary font-mono" target="_blank" rel="noopener noreferrer">v0.dev</Link> + Copilot by <Link href="https://lakshb.dev" className="underline" target="_blank" rel="noopener noreferrer">Lakshay Bhushan</Link>
        </div>
      </div>
    </main>
  )
}

