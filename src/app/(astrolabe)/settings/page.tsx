"use client";

import React, { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Laptop } from "lucide-react";

const emptySubscribe = () => () => {};

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your application preferences and appearance.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card text-card-foreground p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Appearance</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select your preferred interface theme.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-all cursor-pointer ${
              mounted && theme === "light"
                ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/20"
                : "border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sun className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-sm font-semibold text-foreground">Light</p>
              <p className="text-xs text-muted-foreground">Crisp, clean theme</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-all cursor-pointer ${
              mounted && theme === "dark"
                ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/20"
                : "border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Moon className="h-5 w-5 text-blue-400" />
            <div>
              <p className="text-sm font-semibold text-foreground">Dark</p>
              <p className="text-xs text-muted-foreground">Low-light space aesthetic</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme("system")}
            className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-all cursor-pointer ${
              mounted && theme === "system"
                ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/20"
                : "border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Laptop className="h-5 w-5 text-purple-400" />
            <div>
              <p className="text-sm font-semibold text-foreground">System</p>
              <p className="text-xs text-muted-foreground">Syncs with OS settings</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
