import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MaterialControlsProps } from "@/lib/types";
import { MATERIAL_PRESETS } from "@/lib/constants";
import { useI18n } from "@/locales/client";

export function MaterialControls({
  materialPreset,
  setMaterialPreset,
  roughness,
  setRoughness,
  metalness,
  setMetalness,
  clearcoat,
  setClearcoat,
  transmission,
  setTransmission,
  envMapIntensity,
  setEnvMapIntensity,
  useCustomColor,
  setUseCustomColor,
  customColor,
  setCustomColor,
}: MaterialControlsProps) {
  const t = useI18n();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="materialPreset">{t('edit.materialControls.presets.title')}</Label>
        <Select
          value={materialPreset}
          onValueChange={(value) => {
            setMaterialPreset(value);
            // Apply preset values when selected
            const preset = MATERIAL_PRESETS.find((p) => p.name === value);
            if (preset) {
              setRoughness(preset.roughness);
              setMetalness(preset.metalness);
              setClearcoat(preset.clearcoat);
              setTransmission(preset.transmission);
              setEnvMapIntensity(preset.envMapIntensity);
            }
          }}>
          <SelectTrigger>
            <SelectValue placeholder={t('edit.materialControls.presets.select')} />
          </SelectTrigger>
          <SelectContent>
            {MATERIAL_PRESETS.map((preset) => (
              <SelectItem key={preset.name} value={preset.name}>
                {preset.name === "metallic" && t('edit.materialControls.presets.metallic')}
                {preset.name === "clay" && t('edit.materialControls.presets.clayMatte')}
                {preset.name === "plastic" && t('edit.materialControls.presets.plastic')}
                {preset.name === "glass" && t('edit.materialControls.presets.glass')}
                {preset.name === "custom" && t('edit.materialControls.presets.custom')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-5 gap-2 mb-3">
        {MATERIAL_PRESETS.map((preset) => (
          <div
            key={preset.name}
            className={`cursor-pointer rounded-md p-2 flex flex-col items-center ${materialPreset === preset.name
              ? "bg-primary/20 ring-1 ring-primary"
              : "hover:bg-muted"
              }`}
            onClick={() => {
              setMaterialPreset(preset.name);
              setRoughness(preset.roughness);
              setMetalness(preset.metalness);
              setClearcoat(preset.clearcoat);
              setTransmission(preset.transmission);
              setEnvMapIntensity(preset.envMapIntensity);
            }}>
            <div
              className="w-12 h-12 rounded-full mb-1"
              style={{
                background: `linear-gradient(135deg, 
                  hsl(210, ${100 - preset.roughness * 100}%, ${50 + preset.metalness * 30}%), 
                  hsl(240, ${100 - preset.roughness * 80}%, ${20 + preset.metalness * 50}%))`,
                boxShadow:
                  preset.clearcoat > 0
                    ? "0 0 10px rgba(255,255,255,0.5) inset"
                    : "none",
                opacity: preset.transmission > 0 ? 0.7 : 1,
              }}
            />
            <span className="text-xs font-medium">
              {preset.name === "metallic" && t('edit.materialControls.presets.metallic')}
              {preset.name === "clay" && t('edit.materialControls.presets.clayMatte')}
              {preset.name === "plastic" && t('edit.materialControls.presets.plastic')}
              {preset.name === "glass" && t('edit.materialControls.presets.glass')}
              {preset.name === "custom" && t('edit.materialControls.presets.custom')}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="useCustomColor"
          checked={useCustomColor}
          onCheckedChange={(checked) => setUseCustomColor(checked as boolean)}
        />
        <Label htmlFor="useCustomColor">{t('edit.materialControls.customColor.enable')}</Label>
      </div>

      {useCustomColor && (
        <div className="space-y-2">
          <Label htmlFor="colorPicker">{t('edit.materialControls.customColor.color')}</Label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              id="colorPicker"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      {materialPreset === "custom" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="roughness">{t('edit.materialControls.properties.roughness')}: {roughness.toFixed(2)}</Label>
            <Slider
              id="roughness"
              min={0}
              max={1}
              step={0.01}
              value={[roughness]}
              onValueChange={(value) => setRoughness(value[0])}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="metalness">{t('edit.materialControls.properties.metalness')}: {metalness.toFixed(2)}</Label>
            <Slider
              id="metalness"
              min={0}
              max={1}
              step={0.01}
              value={[metalness]}
              onValueChange={(value) => setMetalness(value[0])}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clearcoat">{t('edit.materialControls.properties.clearcoat')}: {clearcoat.toFixed(2)}</Label>
            <Slider
              id="clearcoat"
              min={0}
              max={1}
              step={0.01}
              value={[clearcoat]}
              onValueChange={(value) => setClearcoat(value[0])}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transmission">
              {t('edit.materialControls.properties.transmission')}: {transmission.toFixed(2)}
            </Label>
            <Slider
              id="transmission"
              min={0}
              max={1}
              step={0.01}
              value={[transmission]}
              onValueChange={(value) => setTransmission(value[0])}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="envMapIntensity">
              {t('edit.materialControls.properties.envMapIntensity')}: {envMapIntensity.toFixed(1)}
            </Label>
            <Slider
              id="envMapIntensity"
              min={0}
              max={3}
              step={0.1}
              value={[envMapIntensity]}
              onValueChange={(value) => setEnvMapIntensity(value[0])}
            />
          </div>
        </>
      )}
    </div>
  );
}
