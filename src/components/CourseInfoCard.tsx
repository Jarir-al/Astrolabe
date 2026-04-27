"use client";

import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Trash2, Mail, User, BookOpen } from 'lucide-react';

// --- ExamCard Component (Inner) ---
interface ExamCardProps {
  subject: string;
  date: string;
  testType: string;
  onRemove: () => void;
}

function ExamCard({ subject, date, testType, onRemove }: ExamCardProps) {
  return (
    <div className="bg-amber-600/50 p-4 text-white w-full rounded-sm border border-white/20 mb-3 group relative">
      <button onClick={onRemove} className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-300">
        <Trash2 className="w-4 h-4" />
      </button>
      <h3 className="uppercase text-[10px] font-bold opacity-70">Upcoming Exam</h3>
      <p className="text-lg font-black mt-1">{subject}</p>
      <div className="flex justify-between items-end mt-2">
        <p className="text-sm opacity-90">{date}</p>
        <p className="text-[10px] bg-white/20 px-2 py-0.5 rounded uppercase">{testType}</p>
      </div>
    </div>
  );
}

// --- Main CourseCard Component ---
export default function CourseInfoCard({ 
  courseName, 
  courseGrade, 
  courseCredits, 
  courseProfessor, 
  courseProfessorEmail,
  onDeleteCourse // New prop to remove the whole course
}: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [exams, setExams] = useState<{subject: string, date: string, testType: string}[]>([]);
  
  const [newSubject, setNewSubject] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newType, setNewType] = useState("Midterm");

  // Auto-remove expired exams
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const validExams = exams.filter(exam => new Date(exam.date) >= today);
    if (validExams.length !== exams.length) setExams(validExams);
  }, [exams]);

  return (
    <div className="bg-amber-500 p-8 text-white w-full max-w-[90%] mx-auto rounded-sm shadow-lg mb-6 relative group">
      {/* Remove Course Button */}
      <button 
        onClick={onDeleteCourse}
        className="absolute top-4 right-4 p-2 bg-red-600/20 hover:bg-red-600 rounded-full transition-all opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight">{courseName}</h2>
          <div className="flex flex-wrap gap-4 mt-2 text-sm font-medium opacity-90">
            <span className="flex items-center gap-1"><User className="w-4 h-4" /> {courseProfessor}</span>
            <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {courseProfessorEmail}</span>
            <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {courseCredits} Credits</span>
          </div>
        </div>
        <h3 className="text-5xl font-black">{courseGrade}%</h3>
      </div>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-all"
      >
        {isOpen ? 'Hide Dashboard' : 'Manage Exams'}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="mt-6 pt-6 border-t border-white/30 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-bold uppercase opacity-60 mb-4">Current Schedule</p>
            {exams.length > 0 ? (
              exams.map((exam, index) => (
                <ExamCard key={index} {...exam} onRemove={() => setExams(exams.filter((_, i) => i !== index))} />
              ))
            ) : (
              <p className="text-sm italic opacity-50">No exams scheduled.</p>
            )}
          </div>
          
          <div className="bg-black/10 p-4 rounded-sm space-y-3 h-fit">
            <p className="text-xs font-bold uppercase opacity-70">Quick Add Exam</p>
            <input 
              type="text" placeholder="Subject" 
              className="w-full bg-white/10 p-2 rounded-sm outline-none focus:ring-1 ring-white"
              value={newSubject} onChange={(e) => setNewSubject(e.target.value)}
            />
            <div className="flex gap-2">
              <input 
                type="date" className="flex-1 bg-white/10 p-2 rounded-sm outline-none"
                value={newDate} onChange={(e) => setNewDate(e.target.value)}
              />
              <select 
                className="bg-white/10 p-2 rounded-sm outline-none text-black"
                value={newType} onChange={(e) => setNewType(e.target.value)}
              >
                <option value="Quiz">Quiz</option>
                <option value="Midterm">Midterm</option>
                <option value="Final">Final</option>
              </select>
            </div>
            <button 
              onClick={() => {
                if(!newSubject || !newDate) return;
                setExams([...exams, {subject: newSubject, date: newDate, testType: newType}]);
                setNewSubject(""); setNewDate("");
              }}
              className="w-full py-2 bg-white text-amber-600 font-bold rounded-sm hover:bg-amber-50 transition-colors flex justify-center items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add to Schedule
            </button>
          </div>
        </div>
      )}
    </div>
  );
}