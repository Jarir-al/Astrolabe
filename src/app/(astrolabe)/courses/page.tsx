"use client";

import React, { useState, useEffect } from "react";
import CourseCard from "@/components/CourseInfoCard";
import {
  CourseDetailPayload,
  CourseMetadataExtras,
  ExamMilestone,
  DEFAULT_CATEGORIES,
  DEFAULT_EXAM_MILESTONES,
  STANDARD_10_POINT_SCALE,
} from "@/components/CourseDetailsDrawer";
import {
  PlusCircle,
  ChevronDown,
  ChevronUp,
  BookMarked,
  Calendar,
  MapPin,
  Trash2,
} from "lucide-react";

interface StoredCourse extends CourseDetailPayload, CourseMetadataExtras {
  id: number;
}

interface StudyPlanEntry extends ExamMilestone {
  courseId: string;
  courseTitle: string;
  addedAt?: string;
}

const INITIAL_SAMPLE_COURSE: StoredCourse = {
  id: 101,
  courseId: "cs-3410",
  title: "Computer Architecture",
  currentGrade: 94,
  credits: 4,
  professor: "Dr. Elena Vance",
  professorEmail: "evance@university.edu",
  categories: DEFAULT_CATEGORIES,
  gradeScale: STANDARD_10_POINT_SCALE,
  exams: DEFAULT_EXAM_MILESTONES,
};

function normalizeStoredCourse(raw: Record<string, unknown>, idx: number): StoredCourse {
  const numericId = typeof raw.id === "number" ? raw.id : 100 + idx;
  return {
    id: numericId,
    courseId: String(raw.courseId ?? raw.id ?? `course-${numericId}`),
    title: String(raw.title ?? raw.courseName ?? "Computer Architecture"),
    currentGrade: Number(raw.currentGrade ?? raw.courseGrade ?? 94),
    credits: Number(raw.credits ?? raw.courseCredits ?? 4),
    professor: String(raw.professor ?? raw.courseProfessor ?? "Dr. Elena Vance"),
    professorEmail: String(
      raw.professorEmail ?? raw.courseProfessorEmail ?? "evance@university.edu"
    ),
    categories: Array.isArray(raw.categories) && raw.categories.length > 0
      ? (raw.categories as StoredCourse["categories"])
      : DEFAULT_CATEGORIES,
    gradeScale: Array.isArray(raw.gradeScale) && raw.gradeScale.length > 0
      ? (raw.gradeScale as StoredCourse["gradeScale"])
      : Array.isArray(raw.thresholds) && raw.thresholds.length > 0
      ? (raw.thresholds as StoredCourse["gradeScale"])
      : STANDARD_10_POINT_SCALE,
    exams: Array.isArray(raw.exams) && raw.exams.length > 0
      ? (raw.exams as StoredCourse["exams"])
      : DEFAULT_EXAM_MILESTONES,
  };
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<StoredCourse[]>([]);
  const [studyPlan, setStudyPlan] = useState<StudyPlanEntry[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const savedCourses = localStorage.getItem("my-courses");
    if (savedCourses) {
      try {
        const parsed = JSON.parse(savedCourses);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCourses(
            parsed.map((item, idx) =>
              normalizeStoredCourse(item as Record<string, unknown>, idx)
            )
          );
        } else {
          setCourses([INITIAL_SAMPLE_COURSE]);
        }
      } catch (e) {
        console.error("Failed to parse saved courses", e);
        setCourses([INITIAL_SAMPLE_COURSE]);
      }
    } else {
      setCourses([INITIAL_SAMPLE_COURSE]);
    }

    const savedStudyPlan = localStorage.getItem("astrolabe-study-plan");
    if (savedStudyPlan) {
      try {
        const parsedPlan = JSON.parse(savedStudyPlan);
        if (Array.isArray(parsedPlan)) {
          setStudyPlan(parsedPlan);
        }
      } catch {
        // Ignore parse errors
      }
    }

    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (hasHydrated) {
      localStorage.setItem("my-courses", JSON.stringify(courses));
    }
  }, [courses, hasHydrated]);

  // Listen for custom "astrolabe:add-to-study-plan" event dispatched by CourseDetailsDrawer
  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{
        courseId: string;
        courseTitle: string;
        exam: ExamMilestone;
      }>;
      if (!custom.detail?.exam) return;
      const { courseId, courseTitle, exam } = custom.detail;
      setStudyPlan((prev) => {
        const filtered = prev.filter((item) => item.id !== exam.id);
        return [
          ...filtered,
          {
            ...exam,
            courseId,
            courseTitle,
            addedAt: new Date().toISOString(),
          },
        ];
      });
    };

    window.addEventListener("astrolabe:add-to-study-plan", handler);
    return () =>
      window.removeEventListener("astrolabe:add-to-study-plan", handler);
  }, []);

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    grade: "",
    credits: "",
    prof: "",
    email: "",
  });

  const addCourse = () => {
    if (!formData.name || !formData.grade) return;
    const id = Date.now();
    const newCourse: StoredCourse = {
      id,
      courseId: `course-${id}`,
      title: formData.name,
      currentGrade: parseInt(formData.grade) || 0,
      credits: parseInt(formData.credits) || 0,
      professor: formData.prof,
      professorEmail: formData.email,
      categories: DEFAULT_CATEGORIES,
      gradeScale: STANDARD_10_POINT_SCALE,
      exams: DEFAULT_EXAM_MILESTONES,
    };
    setCourses((prev) => [...prev, newCourse]);
    setFormData({ name: "", grade: "", credits: "", prof: "", email: "" });
    setShowAddForm(false);
  };

  const deleteCourse = (id: number) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCourse = (
    id: number,
    updated: CourseDetailPayload & CourseMetadataExtras
  ) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated, id } : c))
    );
  };

  const removeStudyPlanItem = (examId: string) => {
    setStudyPlan((prev) => {
      const next = prev.filter((item) => item.id !== examId);
      localStorage.setItem("astrolabe-study-plan", JSON.stringify(next));
      return next;
    });
  };

  if (!hasHydrated) {
    return <div className="max-w-5xl mx-auto p-6 opacity-0">Loading...</div>;
  }

  const visibleCourses = showAll ? courses : courses.slice(0, 1);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 1. Header */}
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter text-black">
          Academics
        </h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-full font-bold hover:bg-gray-800 transition-all text-sm"
        >
          <PlusCircle className="w-4 h-4" />{" "}
          {showAddForm ? "Cancel" : "Add Course"}
        </button>
      </div>

      {/* 2. Add Course Form (Full Width) */}
      {showAddForm && (
        <div className="mb-10 p-6 bg-gray-100 rounded-sm grid grid-cols-1 md:grid-cols-2 gap-4 border-l-4 border-amber-500 shadow-sm">
          <input
            placeholder="Course Name"
            className="p-2 border text-black"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <input
            placeholder="Grade (%)"
            type="number"
            className="p-2 border text-black"
            value={formData.grade}
            onChange={(e) =>
              setFormData({ ...formData, grade: e.target.value })
            }
          />
          <input
            placeholder="Credits"
            type="number"
            className="p-2 border text-black"
            value={formData.credits}
            onChange={(e) =>
              setFormData({ ...formData, credits: e.target.value })
            }
          />
          <input
            placeholder="Professor Name"
            className="p-2 border text-black"
            value={formData.prof}
            onChange={(e) => setFormData({ ...formData, prof: e.target.value })}
          />
          <input
            placeholder="Professor Email"
            className="p-2 border text-black col-span-full"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
          <button
            onClick={addCourse}
            className="bg-amber-500 text-white font-bold py-3 hover:bg-amber-600 transition-colors col-span-full"
          >
            Save Course
          </button>
        </div>
      )}

      {/* 3. Courses Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
            Your Courses
          </h2>
          <span className="text-xs text-gray-400">
            Click any course card to open CourseDetailsDrawer
          </span>
        </div>
        <div className="flex flex-col gap-4">
          {visibleCourses.length > 0 ? (
            visibleCourses.map((course, idx) => (
              <CourseCard
                key={course.id}
                {...course}
                defaultDrawerOpen={idx === 0}
                onDeleteCourse={() => deleteCourse(course.id)}
                onUpdateCourse={(updated) => updateCourse(course.id, updated)}
              />
            ))
          ) : (
            <p className="text-gray-400 italic text-sm">
              No courses added yet.
            </p>
          )}
        </div>

        {/* Dropdown Toggle Button */}
        {courses.length > 1 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full mt-4 py-3 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-black hover:bg-gray-50 transition-all border border-dashed border-gray-200"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4" /> Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" /> View {courses.length - 1}{" "}
                other courses
              </>
            )}
          </button>
        )}
      </div>

      {/* 4. Study Plan & Tools Section (Target of "Add to Study Plan") */}
      <div id="study-tools" className="pt-10 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
            Active Study Plan
          </h2>
          <span className="text-xs text-gray-400">
            {studyPlan.length} milestone{studyPlan.length === 1 ? "" : "s"} queued
          </span>
        </div>

        {studyPlan.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {studyPlan.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-black/10 bg-[#070708] p-4 text-white shadow-sm"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <BookMarked className="h-3.5 w-3.5 text-[#D6CFC2] shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D6CFC2]">
                      {item.courseTitle}
                    </span>
                  </div>
                  <p className="truncate text-sm font-bold text-white">
                    {item.name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-stone-400">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-stone-500" />
                      {item.date}
                    </span>
                    {item.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-stone-500" />
                        {item.location}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.weightPercent !== undefined && (
                    <span className="rounded-lg border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-bold text-[#E5DEC9]">
                      {item.weightPercent}%
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeStudyPlanItem(item.id)}
                    aria-label={`Remove ${item.name} from study plan`}
                    className="rounded-lg p-1.5 text-stone-400 hover:bg-white/10 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-400">
            Open a course drawer and click &ldquo;Add to Study Plan&rdquo; on any
            exam milestone to queue it here.
          </div>
        )}
      </div>
    </div>
  );
}