"use client";

import React from "react";
import { NavSidebar } from "@/components/NavSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/themes/theme-toggler";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <NavSidebar />
      <main className="flex-1 overflow-y-auto bg-background text-foreground min-h-screen">
        {/* Header bar with collapse trigger, title, and theme toggler */}
        <div className="p-4 flex items-center justify-between border-b border-border bg-card">
          <div className="flex items-center">
            <SidebarTrigger />
            <h1 className="ml-4 font-bold text-foreground">Astrolabe</h1>
          </div>
          <ThemeToggle />
        </div>

        {/* Dashboard/Projects/Courses content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
