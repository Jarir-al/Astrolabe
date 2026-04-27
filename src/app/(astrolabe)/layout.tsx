"use client"
import React from 'react';
import { NavSidebar } from "@/components/NavSidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"




export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <NavSidebar />
      <main className="flex-1 overflow-y-auto bg-slate-50 min-h-screen">
        {/* This trigger is the little button that collapses the sidebar */}
        <div className="p-4 flex items-center border-b bg-white">
         <SidebarTrigger />
          <h1 className="ml-4 font-bold text-slate-700">Astrolabe</h1>
        </div>
        
        {/* Your Dashboard/Projects/Courses content loads here */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}