import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileType } from "lucide-react";
import { FileUploadProps } from "@/lib/types";
import { motion } from "framer-motion";

export function FileUpload({ onFileUpload, fileName }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const processFile = (file: File) => {
    if (file && file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const svgData = event.target.result as string;
          onFileUpload(svgData, file.name);
          setSvgContent(svgData);
        }
      };
      reader.readAsText(file);
    } else if (file) {
      // Show an error for non-SVG files
      alert("Please upload an SVG file (.svg)");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set isDragging to false if we're leaving the drop zone (not a child element)
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}>
      <Card className="border-none shadow-lg overflow-hidden">
        <CardContent className="p-0">
          <motion.div
            ref={dropZoneRef}
            className={`relative min-h-[300px] flex flex-col items-center justify-center cursor-pointer px-12 py-16 transition-all duration-300 ${
              isDragging
                ? "border-primary border-4 border-dashed bg-primary/10"
                : "border-border border-2 border-dashed hover:bg-muted/30"
            }`}
            onClick={handleUploadClick}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            animate={{
              borderRadius: "12px",
            }}
            style={{
              backgroundColor: "transparent",
            }}
            transition={{
              duration: 0.2,
            }}>
            <input
              type="file"
              ref={fileInputRef}
              accept=".svg"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex flex-col items-center justify-center">
              {/* Display actual SVG or file icon */}
              <motion.div
                className="relative h-fit mb-6 flex items-center justify-center"
                animate={{
                  scale: isDragging ? 1.1 : 1,
                  y: isDragging ? -5 : 0,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}>
                {svgContent ? (
                  <motion.div
                    className="relative z-10 flex items-center justify-center w-36 h-36"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", damping: 20 }}>
                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl transform scale-75" />
                    <div
                      className="relative z-10 w-24 h-24 p-1 rounded-xl bg-background/80 backdrop-blur-sm border-2 border-primary/30 shadow-xl shadow-primary/20 flex items-center justify-center overflow-hidden"
                      dangerouslySetInnerHTML={{
                        __html: svgContent
                          .replace(/width="[^"]*"/, 'width="100%"')
                          .replace(/height="[^"]*"/, 'height="100%"')
                          .replace(/fill="[^"]*"/g, 'fill="currentColor"')
                          .replace(/stroke="[^"]*"/g, 'stroke="currentColor"'),
                      }}
                    />
                  </motion.div>
                ) : (
                  <div>
                    <motion.div
                      className={`relative z-10 p-4 rounded-xl border-2 shadow-lg ${
                        isDragging
                          ? "border-primary bg-primary-foreground"
                          : "border-border bg-muted"
                      }`}
                      animate={{
                        rotate: isDragging ? [-2, 2, -2] : 0,
                      }}
                      transition={{
                        rotate: { repeat: Infinity, duration: 0.5 },
                      }}>
                      <FileType
                        className={`h-14 w-14 ${
                          isDragging
                            ? "text-primary animate-pulse"
                            : "text-primary"
                        }`}
                        strokeWidth={1.5}
                      />
                    </motion.div>
                  </div>
                )}
              </motion.div>

              <div className="text-center space-y-2">
                <motion.div
                  animate={{
                    opacity: isDragging ? 0 : 1,
                    height: isDragging ? 0 : "auto",
                  }}
                  transition={{ duration: 0.2 }}>
                  <p className="text-xl font-medium">
                    {fileName ? (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}>
                        {fileName}
                      </motion.span>
                    ) : (
                      "Click or drop your SVG file here"
                    )}
                  </p>
                  <p className="text-muted-foreground text-sm mt-2">
                    {svgContent
                      ? "Let's make it 3D!"
                      : "We'll convert it to a 3D model and let you edit it"}
                  </p>
                </motion.div>

                <motion.div
                  animate={{
                    opacity: isDragging ? 1 : 0,
                    height: isDragging ? "auto" : 0,
                  }}
                  transition={{ duration: 0.2 }}>
                  <p className="text-xl font-medium text-primary">
                    Drop your SVG file here
                  </p>
                </motion.div>
              </div>
            </div>

            {/* Animated blobs in the background when dragging */}
            {isDragging && (
              <>
                <motion.div
                  className="absolute w-20 h-20 rounded-full bg-primary/20 blur-xl"
                  animate={{
                    x: [0, 30, -30, 0],
                    y: [0, -30, 30, 0],
                    scale: [1, 1.2, 0.8, 1],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                  style={{ top: "20%", left: "20%" }}
                />
                <motion.div
                  className="absolute w-16 h-16 rounded-full bg-primary/20 blur-xl"
                  animate={{
                    x: [0, -40, 40, 0],
                    y: [0, 40, -40, 0],
                    scale: [1, 0.7, 1.3, 1],
                  }}
                  transition={{
                    duration: 7,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                  style={{ bottom: "20%", right: "20%" }}
                />
              </>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
