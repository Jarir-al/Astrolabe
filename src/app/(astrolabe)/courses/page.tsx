"use client";

import React, { useState, useEffect } from 'react';
import CourseCard from "@/components/CourseInfoCard";
import PomodoroTimer from './PomoTimer';
import { PlusCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface Course {
  id: number;
  courseName: string;
  courseGrade: number;
  courseCredits: number;
  courseProfessor: string;
  courseProfessorEmail: string;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [showAll, setShowAll] = useState(false); // Toggle for dropdown logic

  useEffect(() => {
    const savedCourses = localStorage.getItem("my-courses");
    if (savedCourses) {
      try {
        setCourses(JSON.parse(savedCourses));
      } catch (e) {
        console.error("Failed to parse saved courses", e);
      }
    }
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (hasHydrated) {
      localStorage.setItem("my-courses", JSON.stringify(courses));
    }
  }, [courses, hasHydrated]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', grade: '', credits: '', prof: '', email: ''
  });

  const addCourse = () => {
    if (!formData.name || !formData.grade) return;
    const newCourse: Course = {
      id: Date.now(),
      courseName: formData.name,
      courseGrade: parseInt(formData.grade) || 0,
      courseCredits: parseInt(formData.credits) || 0,
      courseProfessor: formData.prof,
      courseProfessorEmail: formData.email
    };
    setCourses(prev => [...prev, newCourse]);
    setFormData({ name: '', grade: '', credits: '', prof: '', email: '' });
    setShowAddForm(false);
  };

  const deleteCourse = (id: number) => {
    setCourses(prev => prev.filter(c => c.id !== id));
  };

  if (!hasHydrated) {
    return <div className="max-w-5xl mx-auto p-6 opacity-0">Loading...</div>;
  }

  // --- LOGIC FOR DROPDOWN ---
  // If showAll is true, show everyone. If false, show only the first 3.
  const visibleCourses = showAll ? courses : courses.slice(0, 1);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 1. Header */}
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter text-black">Academics</h1>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-full font-bold hover:bg-gray-800 transition-all text-sm"
        >
          <PlusCircle className="w-4 h-4" /> {showAddForm ? "Cancel" : "Add Course"}
        </button>
      </div>

      {/* 2. Add Course Form (Full Width) */}
      {showAddForm && (
        <div className="mb-10 p-6 bg-gray-100 rounded-sm grid grid-cols-1 md:grid-cols-2 gap-4 border-l-4 border-amber-500 shadow-sm">
          <input placeholder="Course Name" className="p-2 border text-black" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <input placeholder="Grade (%)" type="number" className="p-2 border text-black" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} />
          <input placeholder="Credits" type="number" className="p-2 border text-black" value={formData.credits} onChange={e => setFormData({...formData, credits: e.target.value})} />
          <input placeholder="Professor Name" className="p-2 border text-black" value={formData.prof} onChange={e => setFormData({...formData, prof: e.target.value})} />
          <input placeholder="Professor Email" className="p-2 border text-black col-span-full" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <button onClick={addCourse} className="bg-amber-500 text-white font-bold py-3 hover:bg-amber-600 transition-colors col-span-full">Save Course</button>
        </div>
      )}

      {/* 3. Courses Section (Stacked Rows) */}
      <div className="mb-12">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">Your Courses</h2>
        <div className="flex flex-col gap-4">
          {visibleCourses.length > 0 ? (
            visibleCourses.map(course => (
              <CourseCard key={course.id} {...course} onDeleteCourse={() => deleteCourse(course.id)} />
            ))
          ) : (
            <p className="text-gray-400 italic text-sm">No courses added yet.</p>
          )}
        </div>

        {/* Dropdown Toggle Button */}
        {courses.length > 1 && (
          <button 
            onClick={() => setShowAll(!showAll)}
            className="w-full mt-4 py-3 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-black hover:bg-gray-50 transition-all border border-dashed border-gray-200"
          >
            {showAll ? (
              <><ChevronUp className="w-4 h-4" /> Show Less</>
            ) : (
              <><ChevronDown className="w-4 h-4" /> View  {courses.length-1} other courses</>
            )}
          </button>
        )}
      </div>

      {/* 4. Tools Section (Horizontal Layout or Grid) */}
      <div className="pt-10 border-t border-gray-200">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6">Study Tools</h2>
        <PomodoroTimer />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start"> 
          <div className="bg-white p-8 border-2 border-dashed border-gray-200 rounded-sm flex flex-col items-center justify-center min-h-[200px]">
             <p className="text-[10px] uppercase font-black text-gray-300 tracking-[0.3em]">
               Study Schedule
             </p>
             <p className="text-[9px] text-gray-400 mt-2 font-bold">MODULE LOCKED</p>
          </div>
        </div>
      </div>
    </div>
  );
}