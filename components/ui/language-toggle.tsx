"use client";

import { useChangeLocale, useCurrentLocale } from "@/locales/client";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";

const languageCodes = ["en", "zh"] as const;
type LanguageCode = typeof languageCodes[number];

export function LanguageToggle() {
    const changeLocale = useChangeLocale();
    const currentLocale = useCurrentLocale();

    const handleLanguageChange = (locale: LanguageCode) => {
        changeLocale(locale);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="bg-forground border border-stone-300 dark:border-stone-600"
                >
                    <Languages className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Toggle language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {languageCodes.map((code) => (
                    <DropdownMenuItem
                        key={code}
                        onClick={() => handleLanguageChange(code)}
                        className={currentLocale === code ? "bg-accent font-medium" : ""}
                    >
                        {code === "en" ? "English" : "中文"}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}