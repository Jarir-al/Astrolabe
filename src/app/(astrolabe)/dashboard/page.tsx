import React from 'react';
import ExamCard from "@/components/ExamCard";

export default function WelcomeDashboard() {
  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      {/* Header Area */}
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
          Astrolabe <span className="text-purple-200">A Path To The Stars</span>
        </h1>
        <p className="text-slate-500 mt-2">Welcome back. Your current galaxy in a nutshell.</p>
      </header>

      {/* The Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Project Module - Large Card */}
        <div className="md:col-span-2 bg-white  p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-6">
            <h3 className="font-bold text-xl">Active Projects</h3>
            <button className="text-sm text-blue-600 font-semibold">+ Add New</button>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50  border border-slate-100 flex justify-between items-center">
              <div>
                <h4 className="font-bold">Startupr</h4>
                <p className="text-xs text-slate-500">Building a CRM tailored for Coffee Shops</p>
              </div>
              <span className="text-xs font-mono bg-green-100 text-green-700 px-2 py-1 rounded">Resume Ready</span>
            </div>
            {/* Add more project rows here */}

            <div className="p-4 bg-slate-50  border border-slate-100 flex justify-between items-center">
              <div>
                <h4 className="font-bold">Creative Film</h4>
                <p className="text-xs text-slate-500">Short Film about Depression</p>
              </div>
              <span className="text-xs font-mono bg-green-100 text-green-700 px-2 py-1 rounded">Leadership Ready</span>
            </div>
            
          </div>
        </div>

        {/* GPA Tracker - Small Square Card */}
        <div className="bg-blue-600 -3xlrounded p-8 text-white shadow-lg shadow-blue-200">
          <h3 className="font-semibold text-blue-100 uppercase text-xs tracking-widest">Current Semester GPA</h3>
          <p className="text-6xl font-black mt-4 italic">3.85</p>
          <div className="mt-8 bg-blue-500/30 p-3  backdrop-blur-sm">
            <p className="text-xs">Let's go up! up! up!</p>
          </div>
        </div>

        {/*Upcoming Exams - Large Square Card */}
        {/* The Container: Forced to stay a row, items don't stretch vertically */}
<div className="flex flex-wrap md:flex-nowrap gap-6 w-full items-start py-10">
  
  {/* Exam Card 1 */}
  <ExamCard subject="Organic Chemistry" date="April 15" testType = "Midterm" />
  <ExamCard subject="Differential Calculus" date="April 19"  testType = "Midterm" />
  <ExamCard subject="Physics Mechanics" date="April 23"  testType = "Final" />

</div>


        

        {/* Networking Score - Wide Card */}
        <div className="md:col-span-3 bg-white  p-8 shadow-sm border border-slate-200">
          <h3 className="font-bold text-xl mb-4">LinkedIn Approachability</h3>
          <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full w-[65%]"></div>
          </div>
          <p className="text-sm text-slate-500 mt-3">AI Suggestion: "Your headline is missing key engineering keywords."</p>
        </div>

      </div>
    </div>
  );
}
