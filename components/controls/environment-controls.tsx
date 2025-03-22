import { useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { EnvironmentControlsProps } from "@/lib/types";
import { ENVIRONMENT_PRESETS } from "@/lib/constants";
import { toast } from "sonner";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { motion } from "framer-motion";
import { BsStars } from "react-icons/bs";
import { useI18n } from "@/locales/client";

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
  toggleVibeMode,
}: EnvironmentControlsProps) {
  const hdriFileInputRef = useRef<HTMLInputElement>(null);
  const t = useI18n();

  useEffect(() => {
    if (!useEnvironment && useBloom) {
      toggleVibeMode(false);
    }
  }, [useEnvironment, useBloom, toggleVibeMode]);

  const handleHdriFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      toast.error(t('edit.environmentControls.errors.noFile'));
      return;
    }

    const fileType = file.type.toLowerCase();
    const isJpg = fileType === "image/jpeg" || fileType === "image/jpg";
    const isPng = fileType === "image/png";

    if (!isJpg && !isPng) {
      toast.error(t('edit.environmentControls.errors.unsupportedFormat'));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('edit.environmentControls.errors.fileTooLarge'));
      return;
    }

    const reader = new FileReader();

    try {
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomHdriUrl(event.target.result as string);
          setEnvironmentPreset("custom");
          toast.success(t('edit.environmentControls.success.imageUploaded'));
        } else {
          toast.error(t('edit.environmentControls.errors.processingFailed'));
        }
      };

      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        toast.error(t('edit.environmentControls.errors.readFailed'));
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("File reading error:", error);
      toast.error(t('edit.environmentControls.errors.readFailed'));
    }

    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      <Alert className="bg-muted/50 mb-4">
        <AlertDescription className="text-xs flex items-center">
          <InfoIcon className="h-4 w-4 mr-2" />
          {t('edit.environmentControls.notice.previewOnly')}
        </AlertDescription>
      </Alert>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="useEnvironment"
          checked={useEnvironment}
          onCheckedChange={(checked) => setUseEnvironment(checked as boolean)}
        />
        <Label htmlFor="useEnvironment">{t('edit.environmentControls.useEnvironment')}</Label>
      </div>

      {useEnvironment && (
        <>
          <div className="space-y-2">
            <Label htmlFor="environmentPreset">{t('edit.environmentControls.presets.title')}</Label>
            <Select
              value={environmentPreset}
              onValueChange={setEnvironmentPreset}>
              <SelectTrigger>
                <SelectValue placeholder={t('edit.environmentControls.presets.select')} />
              </SelectTrigger>
              <SelectContent>
                {ENVIRONMENT_PRESETS.map((preset) => (
                  <SelectItem key={preset.name} value={preset.name}>
                    {preset.name === "apartment" && t('edit.environmentControls.presets.apartment')}
                    {preset.name === "city" && t('edit.environmentControls.presets.city')}
                    {preset.name === "dawn" && t('edit.environmentControls.presets.dawn')}
                    {preset.name === "forest" && t('edit.environmentControls.presets.forest')}
                    {preset.name === "lobby" && t('edit.environmentControls.presets.lobby')}
                    {preset.name === "park" && t('edit.environmentControls.presets.park')}
                    {preset.name === "studio" && t('edit.environmentControls.presets.studio')}
                    {preset.name === "sunset" && t('edit.environmentControls.presets.sunset')}
                    {preset.name === "warehouse" && t('edit.environmentControls.presets.warehouse')}
                  </SelectItem>
                ))}
                {customHdriUrl && (
                  <SelectItem value="custom">{t('edit.environmentControls.presets.custom')}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 my-3">
            {ENVIRONMENT_PRESETS.map((preset) => (
              <div
                key={preset.name}
                className={`cursor-pointer rounded-md p-2 flex flex-col items-center ${environmentPreset === preset.name
                    ? "bg-primary/20 ring-1 ring-primary"
                    : "hover:bg-muted"
                  }`}
                onClick={() => setEnvironmentPreset(preset.name)}>
                <div
                  className="w-12 h-12 rounded-full mb-1 overflow-hidden"
                  style={{
                    background: preset.color,
                    boxShadow: "0 0 8px rgba(0,0,0,0.15) inset",
                  }}
                />
                <span className="text-xs font-medium text-center">
                  {preset.name === "apartment" && t('edit.environmentControls.presets.apartment').split(" ")[0]}
                  {preset.name === "city" && t('edit.environmentControls.presets.city').split(" ")[0]}
                  {preset.name === "dawn" && t('edit.environmentControls.presets.dawn').split(" ")[0]}
                  {preset.name === "forest" && t('edit.environmentControls.presets.forest').split(" ")[0]}
                  {preset.name === "lobby" && t('edit.environmentControls.presets.lobby').split(" ")[0]}
                  {preset.name === "park" && t('edit.environmentControls.presets.park').split(" ")[0]}
                  {preset.name === "studio" && t('edit.environmentControls.presets.studio').split(" ")[0]}
                  {preset.name === "sunset" && t('edit.environmentControls.presets.sunset').split(" ")[0]}
                  {preset.name === "warehouse" && t('edit.environmentControls.presets.warehouse').split(" ")[0]}
                </span>
              </div>
            ))}

            <div
              className={`cursor-pointer rounded-md p-2 flex flex-col items-center ${environmentPreset === "custom"
                  ? "bg-primary/20 ring-1 ring-primary"
                  : "hover:bg-muted"
                }`}
              onClick={() => {
                if (customHdriUrl) {
                  setEnvironmentPreset("custom");
                } else {
                  hdriFileInputRef.current?.click();
                }
              }}>
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
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <span className="text-xs font-medium">{t('edit.environmentControls.presets.custom')}</span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full mb-1 flex items-center justify-center bg-primary/10">
                    <span className="text-2xl font-semibold text-primary">
                      +
                    </span>
                  </div>
                  <span className="text-xs font-medium">{t('edit.environmentControls.presets.custom')}</span>
                </>
              )}
            </div>
          </div>

          {environmentPreset === "custom" && customHdriUrl && (
            <div className="mt-3 p-3 bg-muted/30 rounded-md">
              <div className="flex items-start">
                <InfoIcon className="h-4 w-4 text-muted-foreground mr-2 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t('edit.environmentControls.customImage.info')}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs h-7"
                    onClick={() => hdriFileInputRef.current?.click()}>
                    {t('edit.environmentControls.customImage.change')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {useEnvironment && (
        <div className="space-y-4 pt-4 mt-4 border-t">
          <div className="w-full">
            {environmentPreset === "custom" && customHdriUrl ? (
              <Button
                variant="outline"
                size="lg"
                disabled={true}
                className="w-full opacity-50 cursor-not-allowed">
                {t('edit.environmentControls.vibeMode.notAvailable')}
              </Button>
            ) : (
              <RainbowButton
                className={`w-full py-4 text-base font-semibold transition-all ${useBloom ? "animate-rainbow" : "opacity-90 hover:opacity-100"
                  }`}
                onClick={() => {
                  const newValue = !useBloom;
                  toggleVibeMode(newValue);
                }}>
                {useBloom ? t('edit.environmentControls.vibeMode.disable') : t('edit.environmentControls.vibeMode.enable')}
                <BsStars className="w-4 h-4 ml-2" />
              </RainbowButton>
            )}
          </div>

          {environmentPreset === "custom" && customHdriUrl && (
            <Alert variant="destructive" className="mt-2 py-2">
              <AlertDescription className="text-xs flex items-center">
                <InfoIcon className="h-3 w-3 mr-1" />
                {t('edit.environmentControls.vibeMode.customNotSupported')}
              </AlertDescription>
            </Alert>
          )}

          {useBloom && (
            <motion.div
              className="space-y-4 mt-2 p-4 bg-muted/20 rounded-md border border-primary/20"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.15 }}>
              <div className="space-y-2">
                <Label
                  htmlFor="bloomIntensity"
                  className="flex justify-between">
                  <span>{t('edit.environmentControls.vibeMode.glowIntensity')}</span>
                  <span className="text-primary font-mono">
                    {bloomIntensity.toFixed(1)}
                  </span>
                </Label>
                <Slider
                  id="bloomIntensity"
                  min={0.1}
                  max={4.0}
                  step={0.1}
                  value={[bloomIntensity]}
                  onValueChange={(value) => setBloomIntensity(value[0])}
                  className="py-1"
                />
              </div>

              <div className="flex items-center space-x-3 py-1">
                <Checkbox
                  id="bloomMipmapBlur"
                  checked={bloomMipmapBlur}
                  onCheckedChange={(checked) => {
                    if (typeof checked === "boolean") {
                      setBloomMipmapBlur(checked);
                    }
                  }}
                />
                <Label htmlFor="bloomMipmapBlur" className="font-medium">
                  {t('edit.environmentControls.vibeMode.softGlow')}
                </Label>
              </div>

              <div className="space-y-2 pt-3 border-t border-primary/10">
                <Label htmlFor="modelRotation" className="flex justify-between">
                  <span>{t('edit.environmentControls.vibeMode.modelRotation')}</span>
                  <span className="text-primary font-mono">
                    {(modelRotationY * (180 / Math.PI)).toFixed(0)}°
                  </span>
                </Label>
                <Slider
                  id="modelRotation"
                  min={0}
                  max={2 * Math.PI}
                  step={Math.PI / 12}
                  value={[modelRotationY]}
                  onValueChange={(value) => setModelRotationY(value[0])}
                  className="py-1"
                />
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
