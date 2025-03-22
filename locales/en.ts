export default {
    home: {
        title: "Transform Your Vectors in a New Dimension",
        uploadSection: {
            bestWith: "*Works best with SVGs having simple geometry and transparent background.",
            continueButton: "Continue to Editor",
            processing: "Processing..."
        },
        mobileWarning: {
            title: "Mobile Device Detected",
            description: "The 3D editor works best on desktop devices. Some features may be limited or difficult to use on smaller screens.",
            recommended: "Recommended",
            switchDesktop: "Please switch to a desktop or laptop computer for the best experience.",
            continueButton: "Continue on Mobile Anyway",
            returnButton: "Return to Homepage"
        },
        editorMobileWarning: {
            title: "Mobile Device Detected",
            description: "The 3D editor works best on desktop devices. Some features may be limited or difficult to use on smaller screens.",
            recommended: "Recommended",
            switchDesktop: "Please switch to a desktop or laptop computer for the best experience with the 3D editor.",
            continueButton: "Continue Anyway",
            returnButton: "Return to Homepage"
        },
        footer: {
            hostedOn: "Hosted on",
            ideatedWith: "Ideated with",
            by: "By",
            localizedBy: "Chinese by",
            localizer: "Hu Hongwei"
        },
        loading: "Preparing your 3D model..."
    },
    notFound: {
        title: "Page not found",
        description: "Oops! The page you're looking for doesn't exist. Please check the URL or try searching for something else :D",
        returnHome: "Return Home"
    },
    fileUpload: {
        clickOrDrop: "Click or drop your SVG file here",
        makeThing3D: "Let's make it 3D!",
        convertDescription: "We'll convert it to a 3D model and let you edit it",
        orChooseFrom: "Or choose from below",
        dropHere: "Drop your SVG file here",
        svgErrorMessage: "Please upload an SVG file (.svg)"
    },
    edit: {
        backToHome: "Back",
        preview: {
            title: "Preview",
            loadingSvg: "Loading SVG data...",
            processing: "Processing SVG...",
            interact: "Interact with your 3D model"
        },
        customize: {
            title: "Customize",
        },
        tabs: {
            geometry: "Geometry",
            material: "Material",
            environment: "Environment",
            background: "Background"
        },
        geometryControls: {
            depth: "Thickness",
            bevel: {
                enable: "Enable Bevel",
                thickness: "Bevel Thickness",
                size: "Bevel Size",
                segments: "Bevel Quality",
                presets: {
                    title: "Bevel Style",
                    none: "None",
                    slight: "Slight",
                    medium: "Medium",
                    strong: "Strong",
                    custom: "Custom"
                }
            },
            rotation: {
                autoRotate: "Auto-rotate model",
                speed: "Rotation Speed"
            }
        },
        materialControls: {
            presets: {
                title: "Material Type",
                select: "Select material type",
                metallic: "Metallic",
                plastic: "Plastic",
                clayMatte: "Clay/Matte",
                glass: "Glass",
                custom: "Custom"
            },
            customColor: {
                enable: "Override SVG colors",
                color: "Custom Color"
            },
            properties: {
                roughness: "Roughness",
                metalness: "Metalness",
                clearcoat: "Clearcoat",
                transmission: "Transmission",
                envMapIntensity: "Environment Reflection"
            }
        },
        environmentControls: {
            notice: {
                previewOnly: "Environment settings are for preview only and will not affect the exported 3D model."
            },
            useEnvironment: "Use Environment Lighting",
            presets: {
                title: "Environment Preset",
                select: "Select environment",
                apartment: "Apartment (Indoor)",
                city: "City (Urban)",
                dawn: "Dawn (Sunrise)",
                forest: "Forest (Natural)",
                lobby: "Lobby (Interior)",
                park: "Park (Daytime)",
                studio: "Studio (Neutral)",
                sunset: "Sunset (Warm)",
                warehouse: "Warehouse (Industrial)",
                custom: "Custom"
            },
            customImage: {
                info: "Your image will be used for reflections in the 3D model",
                change: "Change Image"
            },
            vibeMode: {
                enable: "Enable Vibe Mode",
                disable: "Disable Vibe Mode",
                notAvailable: "Vibe Mode Not Available with Custom Images",
                customNotSupported: "Vibe Mode is not available with custom images",
                maintained: "Custom environment maintained",
                disabled: "Vibe Mode has been disabled",
                glowIntensity: "Glow Intensity",
                softGlow: "Soft Glow",
                modelRotation: "Model Rotation"
            },
            errors: {
                noFile: "No file selected",
                unsupportedFormat: "Unsupported file format: Only JPG and PNG are supported",
                fileTooLarge: "File too large: Image must be smaller than 10MB",
                processingFailed: "Failed to process image",
                readFailed: "Failed to read the image file"
            },
            success: {
                imageUploaded: "Image uploaded successfully"
            }
        },
        backgroundControls: {
            notice: {
                previewOnly: "Background settings are for preview only and will not be included in the exported 3D model."
            },
            backgroundColor: "Background Color",
            currentlyUsing: "Currently using:",
            customSelection: "Custom selection",
            themeDefault: "Theme default",
            customColor: "Custom Color",
            resetToThemeDefault: "Reset to Theme Default",
            presets: {
                light: "Light",
                dark: "Dark",
                blue: "Blue",
                gray: "Gray",
                green: "Green"
            }
        },
        export: {
            buttons: {
                exportImage: "Export Image",
                export3D: "Export 3D"
            },
            formats: {
                stl: "Export as STL",
                glb: "Export as GLB",
                gltf: "Export as GLTF"
            },
            quality: {
                low: "Low Quality",
                medium: "Medium Quality",
                high: "High Quality"
            },
            errors: {
                modelNotLoaded: "Error: Cannot export - model not loaded",
                canvasNotFound: "Could not find the 3D renderer",
                canvasContext: "Could not get 2D context for export canvas",
                imageGenerationFailed: "Failed to generate image",
                exportFailed: "Failed to export {format}",
                exportError: "Export failed: {message}",
                unknown: "Unknown error"
            },
            success: {
                imageSaved: "Image saved as {name}",
                modelSaved: "{name} has been downloaded successfully"
            }
        },
        loading: {
            waiting: "Waiting for SVG data...",
            generating: "Generating 3D model...",
            complexSvg: "This may take a moment for complex SVGs"
        },
        error: {
            title: "Error processing SVG",
            tryAgain: "Try Again"
        }
    }
} as const;