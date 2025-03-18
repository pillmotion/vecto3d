import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { GeometryControlsProps } from "@/lib/types"
import { BEVEL_PRESETS } from "@/lib/constants"

export function GeometryControls({
  depth,
  setDepth,
  bevelEnabled,
  setBevelEnabled,
  bevelThickness,
  setBevelThickness,
  bevelSize,
  setBevelSize,
  bevelSegments,
  setBevelSegments,
  bevelPreset,
  setBevelPreset,
  autoRotate,
  setAutoRotate,
  autoRotateSpeed,
  setAutoRotateSpeed
}: GeometryControlsProps) {
  // Helper function to convert display rotation value to actual rotation speed
  const displayToActualRotation = (displayValue: number) => {
    return displayValue + 1.5; // Convert 1-5 display scale to 2.5-7.5 actual scale
  }

  // Helper function to convert actual rotation speed to display value
  const actualToDisplayRotation = (actualValue: number) => {
    return actualValue - 1.5; // Convert 2.5-7.5 actual scale to 1-5 display scale
  }

  // Apply bevel preset
  const applyBevelPreset = (presetName: string) => {
    const preset = BEVEL_PRESETS.find(p => p.name === presetName)
    if (preset) {
      setBevelPreset(preset.name)
      setBevelThickness(preset.thickness)
      setBevelSize(preset.size)
      setBevelSegments(preset.segments)
      setBevelEnabled(preset.name !== "none")
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="depth">Thickness: {depth}</Label>
        <Slider
          id="depth"
          min={1}
          max={50}
          step={1}
          value={[depth]}
          onValueChange={(value) => setDepth(value[0])}
        />
      </div>
      
      <div className="space-y-2 pt-2">
        <Label htmlFor="bevelPreset">Bevel Style</Label>
        <div className="grid grid-cols-5 gap-2 mb-3">
          {BEVEL_PRESETS.map((preset) => (
            <div 
              key={preset.name} 
              className={`cursor-pointer rounded-md p-2 flex flex-col items-center ${
                bevelPreset === preset.name ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-muted'
              }`}
              onClick={() => applyBevelPreset(preset.name)}
            >
              <div 
                className="w-12 h-12 rounded-md mb-1 flex items-center justify-center overflow-hidden"
                style={
                  preset.name === "none" 
                    ? { 
                        background: 'transparent',
                        border: '1px solid hsl(210, 40%, 70%)'
                      }
                    : preset.name === "custom" 
                      ? {
                          background: 'linear-gradient(135deg, hsl(250, 60%, 60%), hsl(210, 60%, 50%))',
                          border: '1px solid hsl(210, 40%, 70%)',
                          boxShadow: 'inset 0 0 8px rgba(255,255,255,0.5)',
                          borderRadius: '10%'
                        }
                      : { 
                          position: 'relative',
                          background: 'linear-gradient(135deg, hsl(210, 50%, 65%), hsl(210, 50%, 45%))',
                          border: '1px solid hsl(210, 40%, 70%)',
                          borderRadius: `${preset.size * 25}%`,
                          boxShadow: `
                            inset 0 0 0 ${preset.thickness}px rgba(255,255,255,0.3),
                            0 ${preset.thickness * 2}px ${preset.thickness * 3}px rgba(0,0,0,0.2)
                          `
                        }
                }
              >
                {preset.name === "none" && <span className="text-sm">ー</span>}
                {preset.name === "custom" && (
                  <div className="text-white text-xs font-semibold relative z-10">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 17C3 17.5523 3.44772 18 4 18H10C10.5523 18 11 17.5523 11 17V13H3V17Z" fill="white"/>
                      <path d="M11 13V9C11 8.44772 10.5523 8 10 8H4C3.44772 8 3 8.44772 3 9V13H11Z" fill="white"/>
                      <path d="M12 9C12 8.44772 12.4477 8 13 8H19C19.5523 8 20 8.44772 20 9V17C20 17.5523 19.5523 18 19 18H13C12.4477 18 12 17.5523 12 17V9Z" fill="white"/>
                    </svg>
                  </div>
                )}
              </div>
              <span className="text-xs font-medium">{preset.label}</span>
            </div>
          ))}
        </div>
        
        {/* Only show custom sliders if "custom" preset is selected */}
        {bevelEnabled && bevelPreset === "custom" && (
          <>
            <div className="space-y-2 mt-4">
              <Label htmlFor="bevelThickness">Bevel Thickness: {bevelThickness.toFixed(1)}</Label>
              <Slider
                id="bevelThickness"
                min={0}
                max={3}
                step={0.1}
                value={[bevelThickness]}
                onValueChange={(value) => {
                  setBevelThickness(value[0])
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bevelSize">Bevel Size: {bevelSize.toFixed(1)}</Label>
              <Slider
                id="bevelSize"
                min={0}
                max={2}
                step={0.1}
                value={[bevelSize]}
                onValueChange={(value) => {
                  setBevelSize(value[0])
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bevelSegments">Bevel Quality: {bevelSegments}</Label>
              <Slider
                id="bevelSegments"
                min={1}
                max={10}
                step={1}
                value={[bevelSegments]}
                onValueChange={(value) => {
                  setBevelSegments(value[0])
                }}
              />
            </div>
          </>
        )}
      </div>
      
      <div className="space-y-2 pt-2 mt-2 border-t">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="autoRotate"
            checked={autoRotate}
            onCheckedChange={(checked) => setAutoRotate(checked as boolean)}
          />
          <Label htmlFor="autoRotate">Auto-rotate model</Label>
        </div>
        
        {autoRotate && (
          <div className="space-y-2 pt-2">
            <Label htmlFor="autoRotateSpeed">
              Rotation Speed: {actualToDisplayRotation(autoRotateSpeed).toFixed(1)} 
            </Label>
            <Slider
              id="autoRotateSpeed"
              min={1}
              max={5}
              step={0.5}
              value={[actualToDisplayRotation(autoRotateSpeed)]}
              onValueChange={(value) => setAutoRotateSpeed(displayToActualRotation(value[0]))}
            />
          </div>
        )}
      </div>
    </div>
  )
} 