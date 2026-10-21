"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) { //Our theme provider accepts the same props as the themeprovider from next-themes bu bringing the nextthemesprovider component "typeof"
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  );
}

