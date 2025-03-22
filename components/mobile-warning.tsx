import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Monitor, RotateCcw } from "lucide-react";
import { MobileWarningProps } from "@/lib/types";
import { useI18n } from "@/locales/client";

export function MobileWarning({ onContinue, onReturn }: MobileWarningProps) {
  const t = useI18n();

  return (
    <div className="w-full max-w-md">
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t('home.mobileWarning.title')}</AlertTitle>
        <AlertDescription>
          {t('home.mobileWarning.description')}
        </AlertDescription>
      </Alert>

      <Card className="mb-6">
        <CardContent className="pt-6 pb-4 px-6">
          <div className="flex flex-col items-center text-center mb-4">
            <Monitor className="h-16 w-16 text-primary mb-4" />
            <h2 className="text-xl font-semibold">{t('home.mobileWarning.recommended')}</h2>
            <p className="text-muted-foreground mt-2">
              {t('home.mobileWarning.switchDesktop')}
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={onContinue}>
            {t('home.mobileWarning.continueButton')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function EditorMobileWarning({
  onContinue,
  onReturn,
}: MobileWarningProps) {
  const t = useI18n();

  return (
    <div className="w-full max-w-md mx-auto">
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t('home.editorMobileWarning.title')}</AlertTitle>
        <AlertDescription>
          {t('home.editorMobileWarning.description')}
        </AlertDescription>
      </Alert>

      <Card className="mb-6">
        <CardContent className="pt-6 pb-4 px-6">
          <div className="flex flex-col items-center text-center mb-4">
            <RotateCcw className="h-16 w-16 text-primary mb-4" />
            <h2 className="text-xl font-semibold">{t('home.editorMobileWarning.recommended')}</h2>
            <p className="text-muted-foreground mt-2">
              {t('home.editorMobileWarning.switchDesktop')}
            </p>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <Button variant="default" className="w-full" onClick={onReturn}>
              {t('home.editorMobileWarning.returnButton')}
            </Button>

            <Button variant="outline" className="w-full" onClick={onContinue}>
              {t('home.editorMobileWarning.continueButton')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
