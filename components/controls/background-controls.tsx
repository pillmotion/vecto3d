import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { BackgroundControlsProps } from "@/lib/types";
import {
  SOLID_COLOR_PRESETS,
  DARK_MODE_COLOR,
  LIGHT_MODE_COLOR,
} from "@/lib/constants";
import { useI18n } from "@/locales/client";

export function BackgroundControls({
  backgroundColor,
  setBackgroundColor,
  userSelectedBackground,
  setUserSelectedBackground,
  solidColorPreset,
  setSolidColorPreset,
  theme,
}: BackgroundControlsProps) {
  const t = useI18n();

  const handleBackgroundChange = (color: string, preset: string) => {
    setUserSelectedBackground(true);
    setSolidColorPreset(preset);
    setBackgroundColor(color);
  };

  return (
    <div className="space-y-4">
      <Alert className="bg-muted/50 mb-4">
        <AlertDescription className="text-xs flex items-center">
          <InfoIcon className="h-4 w-4 mr-2" />
          {t('edit.backgroundControls.notice.previewOnly')}
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <Label>{t('edit.backgroundControls.backgroundColor')}</Label>
        <div className="flex items-center mb-2 text-sm text-muted-foreground">
          <span>
            {t('edit.backgroundControls.currentlyUsing')}{" "}
            {userSelectedBackground
              ? t('edit.backgroundControls.customSelection')
              : t('edit.backgroundControls.themeDefault')}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {SOLID_COLOR_PRESETS.map((preset) => (
            <div
              key={preset.name}
              className={`cursor-pointer rounded-md p-2 flex flex-col items-center ${solidColorPreset === preset.name
                  ? "bg-primary/20 ring-1 ring-primary"
                  : "hover:bg-muted"
                }`}
              onClick={() => handleBackgroundChange(preset.color, preset.name)}>
              <div
                className="w-12 h-12 rounded-full mb-1"
                style={{
                  background: preset.color,
                }}
              />
              <span className="text-xs font-medium">
                {preset.name === "light" && t('edit.backgroundControls.presets.light')}
                {preset.name === "dark" && t('edit.backgroundControls.presets.dark')}
                {preset.name === "blue" && t('edit.backgroundControls.presets.blue')}
                {preset.name === "gray" && t('edit.backgroundControls.presets.gray')}
                {preset.name === "green" && t('edit.backgroundControls.presets.green')}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-2">
          <Label htmlFor="backgroundColor">{t('edit.backgroundControls.customColor')}</Label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              id="backgroundColor"
              value={backgroundColor}
              onChange={(e) => handleBackgroundChange(e.target.value, "custom")}
              className="w-10 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={backgroundColor}
              onChange={(e) => handleBackgroundChange(e.target.value, "custom")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setUserSelectedBackground(false);
              if (theme === "dark") {
                setBackgroundColor(DARK_MODE_COLOR);
                setSolidColorPreset("dark");
              } else {
                setBackgroundColor(LIGHT_MODE_COLOR);
                setSolidColorPreset("light");
              }
            }}
            className="w-full">
            {t('edit.backgroundControls.resetToThemeDefault')}
          </Button>
        </div>
      </div>
    </div>
  );
}
