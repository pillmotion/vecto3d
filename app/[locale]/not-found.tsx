"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/locales/client";

export default function NotFound() {
  const t = useI18n();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background">
      <div className="space-y-6">
        <h1 className="text-[12rem] font-bold leading-none tracking-tight text-primary/20">
          404
        </h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('notFound.title')}
          </h2>
          <p className="text-muted-foreground max-w-[400px] mx-auto">
            {t('notFound.description')}
          </p>
        </div>
        <Button asChild className="text-base px-8">
          <Link href="/">{t('notFound.returnHome')}</Link>
        </Button>
      </div>
    </div>
  );
}
