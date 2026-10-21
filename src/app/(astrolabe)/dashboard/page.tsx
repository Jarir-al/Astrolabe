import React from 'react';
import ExamCard from "@/components/ExamCard";

export default function WelcomeDashboard() {
  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      {/* Header Area */}
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
          Astrolabe <span className="text-purple-600 dark:text-purple-300 text-xl font-normal block sm:inline sm:ml-2">A Path To The Stars</span>
        </h1>
        <p className="text-muted-foreground mt-2">Welcome back. Your current galaxy in a nutshell.</p>
      </header>

      {/* The Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Project Module - Large Card */}
        <div className="md:col-span-2 bg-card text-card-foreground p-8 shadow-sm border border-border rounded-xl hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-6">
            <h3 className="font-bold text-xl">Active Projects</h3>
            <button className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline">+ Add New</button>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-muted/40 border border-border rounded-lg flex justify-between items-center">
              <div>
                <h4 className="font-bold">Startupr</h4>
                <p className="text-xs text-muted-foreground">Building a CRM tailored for Coffee Shops</p>
              </div>
              <span className="text-xs font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border dark:border-emerald-800/50 px-2 py-1 rounded">
                Resume Ready
              </span>
            </div>

            <div className="p-4 bg-muted/40 border border-border rounded-lg flex justify-between items-center">
              <div>
                <h4 className="font-bold">Creative Film</h4>
                <p className="text-xs text-muted-foreground">Short Film about Depression</p>
              </div>
              <span className="text-xs font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border dark:border-emerald-800/50 px-2 py-1 rounded">
                Leadership Ready
              </span>
            </div>
            
          </div>
        </div>

        {/* GPA Tracker - Small Square Card (Intentional Brand Color Preserved) */}
        <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-lg shadow-blue-500/20 dark:shadow-none">
          <h3 className="font-semibold text-blue-100 uppercase text-xs tracking-widest">Current Semester GPA</h3>
          <p className="text-6xl font-black mt-4 italic">3.85</p>
          <div className="mt-8 bg-blue-500/30 p-3 rounded-xl backdrop-blur-sm">
            <p className="text-xs">Let&apos;s go up! up! up!</p>
          </div>
        </div>

        {/* Upcoming Exams - Large Square Card */}
        <div className="flex flex-wrap md:flex-nowrap gap-6 w-full items-start py-10 md:col-span-3">
          <ExamCard subject="Organic Chemistry" date="April 15" testType="Midterm" />
          <ExamCard subject="Differential Calculus" date="April 19" testType="Midterm" />
          <ExamCard subject="Physics Mechanics" date="April 23" testType="Final" />
        </div>

        {/* Networking Score - Wide Card */}
        <div className="md:col-span-3 bg-card text-card-foreground p-8 shadow-sm border border-border rounded-xl">
          <h3 className="font-bold text-xl mb-4">LinkedIn Approachability</h3>
          <div className="w-full bg-muted h-4 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full w-[65%]"></div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">AI Suggestion: &quot;Your headline is missing key engineering keywords.&quot;</p>
        </div>

      </div>
    </div>
  );
}
