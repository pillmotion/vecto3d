"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { FileUpload } from "@/components/file-upload"
import { MobileWarning } from "@/components/mobile-warning"
import { useMobileDetection } from "@/hooks/use-mobile-detection"
import { RainbowButton } from "@/components/ui/rainbow-button"
import { motion, AnimatePresence } from "framer-motion"
import { 
  staggerContainer, 
  fadeUp, 
  logoAnimation, 
  listItem, 
  scaleUp, 
  buttonAnimation
} from "@/lib/animation-values"

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
    <motion.main 
      className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="w-full max-w-5xl px-4 sm:px-6 flex flex-col items-center"
        variants={staggerContainer()}
        initial="hidden"
        animate="show"
      >
        <motion.div className="text-center mb-8" variants={fadeUp}>
          <motion.div 
            className="flex items-center justify-center mb-4"
            variants={fadeUp}
          >
            <motion.div variants={logoAnimation}>
              <Logo className="h-16 w-16 text-primary mr-2" />
            </motion.div>
            <motion.h1 
              className="text-6xl font-bold tracking-tighter"
              variants={fadeUp}
            >
              Vecto3D
            </motion.h1>
          </motion.div>
          <motion.p 
            className="text-xl text-muted-foreground max-w-md mx-auto"
            variants={fadeUp}
          >
            Transform your SVG designs into stunning 3D models with a single click
          </motion.p>
        </motion.div>

        <AnimatePresence mode="wait">
          {isMobile && !continueOnMobile ? (
            <motion.div
              key="mobile-warning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <MobileWarning onContinue={handleContinueOnMobile} onReturn={() => {}} />
            </motion.div>
          ) : (
            <motion.div 
              key="desktop-content"
              className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-4xl items-center"
              variants={staggerContainer(0.15)}
              initial="hidden"
              animate="show"
            >
              <motion.div className="flex flex-col space-y-4" variants={fadeUp}>
                <motion.h2 
                  className="text-2xl font-semibold tracking-tight"
                  variants={fadeUp}
                >
                  How it works
                </motion.h2>
                <motion.div 
                  className="flex items-start space-x-3"
                  variants={listItem}
                >
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center shrink-0">1</div>
                  <p>Upload your SVG file</p>
                </motion.div>
                <motion.div 
                  className="flex items-start space-x-3"
                  variants={listItem}
                >
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center shrink-0">2</div>
                  <p>Customize parameters and settings</p>
                </motion.div>
                <motion.div 
                  className="flex items-start space-x-3"
                  variants={listItem}
                >
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center shrink-0">3</div>
                  <p>Export your 3D model</p>
                </motion.div>
              </motion.div>

              <motion.div 
                className="flex flex-col"
                variants={scaleUp}
              >
                <FileUpload 
                  onFileUpload={handleFileUpload} 
                  fileName={fileName} 
                />
                
                <AnimatePresence>
                  {svgData && (
                    <motion.div
                      key="continue-button"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ type: "spring", damping: 15 }}
                    >
                      <RainbowButton 
                        className="w-full mt-4 text-md py-6"
                        onClick={handleContinue}
                      >
                        Continue to Editor
                      </RainbowButton>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          className="mt-16 text-center text-sm text-muted-foreground"
          variants={fadeUp}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Vibe coded with <Link href="https://v0.dev" className="text-primary font-mono" target="_blank" rel="noopener noreferrer">v0.dev</Link> + Copilot by <Link href="https://lakshb.dev" className="underline" target="_blank" rel="noopener noreferrer">Lakshay Bhushan</Link>
        </motion.div>
      </motion.div>
    </motion.main>
  )
}

