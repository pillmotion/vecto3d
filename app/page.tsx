"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { FileUpload } from "@/components/file-upload";
import { MobileWarning } from "@/components/mobile-warning";
import { useMobileDetection } from "@/hooks/use-mobile-detection";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { ModeToggle } from "@/components/ui/theme-toggle";
import { motion, AnimatePresence } from "framer-motion";
import { FaGithub } from "react-icons/fa";
import { IoLogoVercel } from "react-icons/io5";
import { ArrowRight, Loader2 } from "lucide-react";
import {
  staggerContainer,
  fadeUp,
  logoAnimation,
} from "@/lib/animation-values";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [svgData, setSvgData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [selectedIcon, setSelectedIcon] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { isMobile, continueOnMobile, handleContinueOnMobile } =
    useMobileDetection();

  const handleFileUpload = (data: string, name: string) => {
    setSvgData(data);
    setFileName(name);
  };

  const handleIconSelect = (iconName: string) => {
    setSelectedIcon(iconName);
  };

  const handleContinue = async () => {
    if (svgData) {
      setIsLoading(true);

      try {
        localStorage.setItem("svgData", svgData);
        localStorage.setItem("fileName", fileName);
        localStorage.setItem("selectedIcon", selectedIcon);

        if (isMobile) {
          localStorage.setItem("continueOnMobile", "true");
        }

        await new Promise((resolve) => setTimeout(resolve, 100));

        router.push("/edit");
      } catch (error) {
        console.error("Error during navigation:", error);
        setIsLoading(false);
      }
    }
  };

  return (
    <motion.main
      className="min-h-screen flex flex-col relative w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      exit={{ opacity: 0 }}>
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}>
            <motion.div
              className="flex flex-col items-center gap-4"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}>
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-xl font-medium">Preparing your 3D model...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header
        className="w-full py-6 px-6 md:px-12 flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}>
        <motion.div
          className="flex items-center space-x-2"
          variants={logoAnimation}
          initial="hidden"
          animate="show">
          <Logo className="h-8 w-8 text-primary" />
          <span className="text-xl font-semibold">Vecto3d</span>
        </motion.div>

        <div className="flex items-center space-x-3">
          <ModeToggle />
          <Link
            href="https://github.com/lakshaybhushan/vecto3d"
            target="_blank"
            rel="noopener noreferrer">
            <Button>
              <FaGithub size={16} />
              <span className="hidden sm:inline">Star it on GitHub</span>
            </Button>
          </Link>
        </div>
      </motion.header>

      <motion.div
        className="flex-1 flex flex-col items-center justify-center px-6 md:px-12 py-8"
        variants={staggerContainer(0.1)}
        initial="hidden"
        animate="show">
        {/* Main Headline */}
        <motion.div className="text-center mb-10 md:mb-16" variants={fadeUp}>
          <motion.h1
            className="font-serif text-4xl md:text-5xl lg:text-8xl tracking-tight leading-tight md:leading-tight"
            variants={fadeUp}>
            Transform Your Vectors <br className="hidden sm:block" />
            <span className="text-primary">in a New Dimension</span>
          </motion.h1>
        </motion.div>

        <AnimatePresence mode="wait">
          {isMobile && !continueOnMobile ? (
            <motion.div
              key="mobile-warning"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
              }}>
              <MobileWarning
                onContinue={handleContinueOnMobile}
                onReturn={() => {}}
              />
            </motion.div>
          ) : (
            <motion.div
              key="desktop-content"
              className="w-full max-w-4xl mx-auto"
              variants={fadeUp}>
              <motion.div
                className="w-full"
                variants={fadeUp}
                transition={{ delay: 0.1 }}>
                <FileUpload
                  onFileUpload={handleFileUpload}
                  fileName={fileName}
                  selectedIcon={selectedIcon}
                  onIconSelect={handleIconSelect}
                />
                <motion.p
                  className="text-base text-center text-muted-foreground mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}>
                  *Works best with SVGs having simple geometry and transparent
                  background.
                </motion.p>
              </motion.div>

              <div className="h-24 mt-2 flex items-center justify-center">
                <AnimatePresence>
                  {svgData && (
                    <motion.div
                      key="continue-button"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 25,
                        mass: 1,
                      }}
                      className="w-full flex justify-center">
                      <RainbowButton
                        className="max-w-xl w-full md:w-1/2 mx-auto text-md py-6"
                        onClick={handleContinue}
                        disabled={isLoading}>
                        <span className="flex items-center gap-2">
                          {isLoading ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              Continue to Editor <ArrowRight size={16} />
                            </>
                          )}
                        </span>
                      </RainbowButton>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer */}
      <motion.footer
        className="w-full py-6 px-6 md:px-12"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}>
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            Hosted on{" "}
            <Link
              href="https://vercel.com"
              className="font-medium text-primary hover:underline flex items-center gap-0.5 transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer">
              <IoLogoVercel size={14} />
              <span className="hidden sm:inline">Vercel</span>
            </Link>
          </div>
          <div className="flex items-center gap-1.5">
            Ideated with{" "}
            <Link
              href="https://v0.dev/chat/three-js-logo-converter-JEQ692TQD4t"
              className="font-medium text-primary hover:underline flex items-center gap-0.5 transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer">
              <span className="hidden sm:inline">
                <svg
                  fill="currentColor"
                  viewBox="0 0 40 20"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  className="size-6">
                  <path d="M23.3919 0H32.9188C36.7819 0 39.9136 3.13165 39.9136 6.99475V16.0805H36.0006V6.99475C36.0006 6.90167 35.9969 6.80925 35.9898 6.71766L26.4628 16.079C26.4949 16.08 26.5272 16.0805 26.5595 16.0805H36.0006V19.7762H26.5595C22.6964 19.7762 19.4788 16.6139 19.4788 12.7508V3.68923H23.3919V12.7508C23.3919 12.9253 23.4054 13.0977 23.4316 13.2668L33.1682 3.6995C33.0861 3.6927 33.003 3.68923 32.9188 3.68923H23.3919V0Z"></path>
                  <path d="M13.7688 19.0956L0 3.68759H5.53933L13.6231 12.7337V3.68759H17.7535V17.5746C17.7535 19.6705 15.1654 20.6584 13.7688 19.0956Z"></path>
                </svg>
              </span>
            </Link>
            <span className="text-muted-foreground">By</span>
            <Link
              href="https://lakshb.dev"
              className="hover:underline font-medium hover:text-primary transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer">
              lakshaybhushan
            </Link>
          </div>
        </div>
      </motion.footer>
    </motion.main>
  );
}
