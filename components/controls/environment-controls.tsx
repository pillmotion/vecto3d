import { useRef } from "react"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"
import { EnvironmentControlsProps } from "@/lib/types"
import { ENVIRONMENT_PRESETS } from "@/lib/constants"
import { toast } from "sonner"

export function EnvironmentControls({
  useEnvironment,
  setUseEnvironment,
  environmentPreset,
  setEnvironmentPreset,
  customHdriUrl,
  setCustomHdriUrl,
  useBloom,
  setUseBloom,
  bloomIntensity,
  setBloomIntensity,
  bloomMipmapBlur,
  setBloomMipmapBlur,
  modelRotationY,
  setModelRotationY,
  toggleVibeMode
}: EnvironmentControlsProps) {
  const hdriFileInputRef = useRef<HTMLInputElement>(null)

  const handleHdriFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    
    if (!file) {
      toast.error("No file selected")
      return
    }
    
    // Check if the file type is supported
    const fileType = file.type.toLowerCase()
    const isJpg = fileType === 'image/jpeg' || fileType === 'image/jpg'
    const isPng = fileType === 'image/png'
    
    if (!isJpg && !isPng) {
      toast.error("Unsupported file format: Only JPG and PNG are supported")
      return
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large: Image must be smaller than 10MB")
      return
    }
    
    const reader = new FileReader()
  
    try {
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomHdriUrl(event.target.result as string)
          setEnvironmentPreset('custom')
          toast.success("Image uploaded successfully")
        } else {
          toast.error("Failed to process image")
        }
      }
      
      reader.onerror = (error) => {
        console.error("FileReader error:", error)
        toast.error("Failed to read the image file")
      }
      
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("File reading error:", error)
      toast.error("Failed to read the image file")
    }
    
    // Clear the input value to allow selecting the same file again
    e.target.value = ''
  }

  return (
    <div className="space-y-4">
      <Alert className="bg-muted/50 mb-4">
        <AlertDescription className="text-xs flex items-center">
          <InfoIcon className="h-4 w-4 mr-2" />
          Environment settings are for preview only and will not affect the exported 3D model.
        </AlertDescription>
      </Alert>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="useEnvironment"
          checked={useEnvironment}
          onCheckedChange={(checked) => setUseEnvironment(checked as boolean)}
        />
        <Label htmlFor="useEnvironment">Use Environment Lighting</Label>
      </div>

      {useEnvironment && (
        <>
          <div className="space-y-2">
            <Label htmlFor="environmentPreset">Environment Preset</Label>
            <Select 
              value={environmentPreset} 
              onValueChange={setEnvironmentPreset}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                {ENVIRONMENT_PRESETS.map((preset) => (
                  <SelectItem key={preset.name} value={preset.name}>
                    {preset.label}
                  </SelectItem>
                ))}
                {customHdriUrl && (
                  <SelectItem value="custom">Custom Image</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Visual Indicators for Environment Presets */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 my-3">
            {ENVIRONMENT_PRESETS.map((preset) => (
              <div 
                key={preset.name} 
                className={`cursor-pointer rounded-md p-2 flex flex-col items-center ${
                  environmentPreset === preset.name ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-muted'
                }`}
                onClick={() => setEnvironmentPreset(preset.name)}
              >
                <div 
                  className="w-12 h-12 rounded-full mb-1 overflow-hidden"
                  style={{ 
                    background: preset.color,
                    boxShadow: '0 0 8px rgba(0,0,0,0.15) inset'
                  }}
                />
                <span className="text-xs font-medium text-center">{preset.label.split(' ')[0]}</span>
              </div>
            ))}
            
            {/* Custom upload option in the grid */}
            <div 
              className={`cursor-pointer rounded-md p-2 flex flex-col items-center ${
                environmentPreset === 'custom' ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-muted'
              }`}
              onClick={() => {
                if (customHdriUrl) {
                  setEnvironmentPreset('custom');
                } else {
                  hdriFileInputRef.current?.click();
                }
              }}
            >
              <input
                ref={hdriFileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png" 
                className="hidden"
                onChange={handleHdriFileChange}
              />
                      
              {customHdriUrl ? (
                <>
                  <div 
                    className="w-12 h-12 rounded-full mb-1 overflow-hidden"
                    style={{ 
                      backgroundImage: `url(${customHdriUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                  <span className="text-xs font-medium">Custom</span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full mb-1 flex items-center justify-center bg-primary/10">
                    <span className="text-2xl font-semibold text-primary">+</span>
                  </div>
                  <span className="text-xs font-medium">Custom</span>
                </>
              )}
            </div>
          </div>

          {environmentPreset === 'custom' && customHdriUrl && (
            <div className="mt-3 p-3 bg-muted/30 rounded-md">
              <div className="flex items-start">
                <InfoIcon className="h-4 w-4 text-muted-foreground mr-2 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Your image will be used for reflections in the 3D model
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 text-xs h-7"
                    onClick={() => hdriFileInputRef.current?.click()}
                  >
                    Change Image
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Vibe Mode with button instead of checkbox - disabled for custom images */}
      <div className="space-y-2 pt-4 mt-4 border-t">
        <div className="flex items-center justify-between">
          <Label htmlFor="vibeMode" className="text-sm font-medium">Vibe Mode</Label>
          {environmentPreset === 'custom' && customHdriUrl ? (
            <Button 
              variant="outline"
              size="sm"
              disabled={true}
              className="opacity-50 cursor-not-allowed"
            >
              Not Available
            </Button>
          ) : (
            <Button 
              variant={useBloom ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const newValue = !useBloom;
                toggleVibeMode(newValue);
              }}
            >
              {useBloom ? "Enabled" : "Enable"}
            </Button>
          )}
        </div>
        
        {environmentPreset === 'custom' && customHdriUrl && (
          <Alert variant="destructive" className="mt-2 py-2">
            <AlertDescription className="text-xs flex items-center">
              <InfoIcon className="h-3 w-3 mr-1" />
              Vibe Mode is not available with custom images
            </AlertDescription>
          </Alert>
        )}
        
        {useBloom && (
          <div className="space-y-3 mt-2 p-3 bg-muted/20 rounded-md">
            <div className="space-y-2">
              <Label htmlFor="bloomIntensity">Glow Intensity: {bloomIntensity.toFixed(1)}</Label>
              <Slider
                id="bloomIntensity"
                min={0.1}
                max={4.0}
                step={0.1}
                value={[bloomIntensity]}
                onValueChange={(value) => setBloomIntensity(value[0])}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="bloomMipmapBlur"
                checked={bloomMipmapBlur}
                onCheckedChange={(checked) => {
                  if (typeof checked === 'boolean') {
                    setBloomMipmapBlur(checked);
                  }
                }}
              />
              <Label htmlFor="bloomMipmapBlur">Soft Glow</Label>
            </div>
            
            {/* Model Rotation Control moved inside Vibe Mode */}
            <div className="space-y-2 mt-2 pt-2 border-t">
              <Label htmlFor="modelRotation">Model Rotation: {(modelRotationY * (180/Math.PI)).toFixed(0)}°</Label>
              <Slider
                id="modelRotation"
                min={0}
                max={2 * Math.PI}
                step={Math.PI / 12}
                value={[modelRotationY]}
                onValueChange={(value) => setModelRotationY(value[0])}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}