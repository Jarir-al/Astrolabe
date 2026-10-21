"use client";

import React, { useState, useEffect, useRef } from "react";
import CourseCard from "@/components/CourseInfoCard";
import { CourseDetailsDrawer } from "@/components/CourseDetailsDrawer";
import { mapPrismaCourseToDrawer } from "@/lib/course-adapter";
import type { CourseWithDetails } from "@/actions/courses";
import type { ExamMilestone } from "@/components/CourseDetailsDrawer";
import {
  PlusCircle,
  ChevronDown,
  ChevronUp,
  BookMarked,
  Calendar,
  MapPin,
  Trash2,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface StudyPlanEntry extends ExamMilestone {
  courseId: string;
  courseTitle: string;
  addedAt?: string;
}

const SAMPLE_PRISMA_COURSE: CourseWithDetails = {
  id: "cs-3410",
  name: "Computer Architecture",
  code: "CS 3410",
  term: "Fall 2026",
  instructor: "Dr. Elena Vance",
  instructorEmail: "evance@university.edu",
  officeHours: "MW 2:00 PM - 4:00 PM",
  syllabusUrl: null,
  rawExtractedJson: null,
  userId: "user-default",
  createdAt: new Date(),
  updatedAt: new Date(),
  gradeCategories: [
    {
      id: "cat-exams",
      courseId: "cs-3410",
      name: "Exams",
      weight: 45,
      dropLowest: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "cat-hw",
      courseId: "cs-3410",
      name: "Homework",
      weight: 25,
      dropLowest: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "cat-proj",
      courseId: "cs-3410",
      name: "Final Project",
      weight: 20,
      dropLowest: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "cat-part",
      courseId: "cs-3410",
      name: "Participation",
      weight: 10,
      dropLowest: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  deliverables: [
    {
      id: "del-1",
      courseId: "cs-3410",
      categoryId: "cat-exams",
      title: "Midterm Exam I: Pipelining & ISA",
      description: null,
      dueDate: new Date("2026-10-24T00:00:00.000Z"),
      pointsPossible: 20,
      pointsEarned: null,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: null,
    },
    {
      id: "del-2",
      courseId: "cs-3410",
      categoryId: "cat-proj",
      title: "Cache Simulator Architecture Project",
      description: null,
      dueDate: new Date("2026-11-08T00:00:00.000Z"),
      pointsPossible: 10,
      pointsEarned: null,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: null,
    },
    {
      id: "del-3",
      courseId: "cs-3410",
      categoryId: "cat-exams",
      title: "Midterm Exam II: Memory Hierarchy",
      description: null,
      dueDate: new Date("2026-11-19T00:00:00.000Z"),
      pointsPossible: 25,
      pointsEarned: null,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: null,
    },
    {
      id: "del-4",
      courseId: "cs-3410",
      categoryId: "cat-exams",
      title: "Final Exam: Out-of-Order Execution",
      description: null,
      dueDate: new Date("2026-12-11T00:00:00.000Z"),
      pointsPossible: 20,
      pointsEarned: null,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: null,
    },
  ],
};

export default function CoursesPage({
  courses: initialCourses,
}: {
  courses?: CourseWithDetails[];
}) {
  const [coursesList, setCoursesList] = useState<CourseWithDetails[]>(
    initialCourses && initialCourses.length > 0
      ? initialCourses
      : [SAMPLE_PRISMA_COURSE]
  );
  const [selectedCourse, setSelectedCourse] = useState<CourseWithDetails | null>(
    initialCourses?.[0] ?? SAMPLE_PRISMA_COURSE
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [studyPlan, setStudyPlan] = useState<StudyPlanEntry[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Form & Mode State
  const [showAddForm, setShowAddForm] = useState(false);
  const [addMode, setAddMode] = useState<"syllabus" | "manual">("syllabus");

  // Syllabus Upload & Extraction State
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractStep, setExtractStep] = useState<string>("");
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractedCourse, setExtractedCourse] = useState<CourseWithDetails | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Manual Form State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    credits: "4",
    prof: "",
    email: "",
  });

  const handleOpenCourse = (course: CourseWithDetails) => {
    setSelectedCourse(course);
    setIsDrawerOpen(true);
  };

  useEffect(() => {
    const savedCourses = localStorage.getItem("my-courses-prisma");
    if (savedCourses) {
      try {
        const parsed = JSON.parse(savedCourses);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCoursesList(parsed);
          setSelectedCourse(parsed[0]);
        }
      } catch {
        // Ignore parse error
      }
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
    if (hasHydrated && coursesList.length > 0) {
      localStorage.setItem("my-courses-prisma", JSON.stringify(coursesList));
    }
  }, [coursesList, hasHydrated]);

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
        const next = [
          ...filtered,
          {
            ...exam,
            courseId,
            courseTitle,
            addedAt: new Date().toISOString(),
          },
        ];
        localStorage.setItem("astrolabe-study-plan", JSON.stringify(next));
        return next;
      });
    };

    window.addEventListener("astrolabe:add-to-study-plan", handler);
    return () =>
      window.removeEventListener("astrolabe:add-to-study-plan", handler);
  }, []);

  // Handle Drag & Drop / File Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setExtractError("Please upload a PDF syllabus document (.pdf).");
        return;
      }
      setSyllabusFile(file);
      setExtractError(null);
      setExtractedCourse(null);
    }
  };

  // Auto-Extract from Syllabus via API
  const handleExtractSyllabus = async () => {
    if (!syllabusFile) return;

    setIsExtracting(true);
    setExtractError(null);
    setExtractStep("Uploading syllabus PDF...");

    try {
      const stepTimer1 = setTimeout(() => {
        setExtractStep("Gemini parsing syllabus structure...");
      }, 1200);

      const stepTimer2 = setTimeout(() => {
        setExtractStep("Extracting grade categories & weight percentages...");
      }, 2600);

      const stepTimer3 = setTimeout(() => {
        setExtractStep("Detecting exam milestones, projects & due dates...");
      }, 4200);

      const bodyData = new FormData();
      bodyData.append("file", syllabusFile);

      const res = await fetch("/api/syllabus/upload", {
        method: "POST",
        body: bodyData,
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to extract syllabus. Check parser service.");
      }

      setExtractStep("Extraction complete!");
      setExtractedCourse(data.course);
    } catch (err) {
      console.error("Syllabus extraction error:", err);
      setExtractError(
        err instanceof Error
          ? err.message
          : "Extraction failed. Please verify that the syllabus extractor microservice is running."
      );
    } finally {
      setIsExtracting(false);
    }
  };

  // Confirm Extracted Course and Add to List
  const handleConfirmExtractedCourse = () => {
    if (!extractedCourse) return;

    setCoursesList((prev) => [extractedCourse, ...prev]);
    setSelectedCourse(extractedCourse);
    setIsDrawerOpen(true); // Automatically open the drawer to review exams & dates!

    // Reset Form State
    setShowAddForm(false);
    setSyllabusFile(null);
    setExtractedCourse(null);
    setExtractStep("");
  };

  // Manual Add Course
  const addCourseManual = () => {
    if (!formData.name) return;
    const newId = `course-${Date.now()}`;
    const newPrismaCourse: CourseWithDetails = {
      id: newId,
      name: formData.name,
      code: formData.code || "CS 1000",
      term: "Fall 2026",
      instructor: formData.prof || null,
      instructorEmail: formData.email || null,
      officeHours: null,
      syllabusUrl: null,
      rawExtractedJson: null,
      userId: "user-default",
      createdAt: new Date(),
      updatedAt: new Date(),
      gradeCategories: [
        {
          id: `cat-${Date.now()}-1`,
          courseId: newId,
          name: "Exams",
          weight: 50,
          dropLowest: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: `cat-${Date.now()}-2`,
          courseId: newId,
          name: "Assignments",
          weight: 50,
          dropLowest: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      deliverables: [],
    };

    setCoursesList((prev) => [newPrismaCourse, ...prev]);
    setSelectedCourse(newPrismaCourse);
    setFormData({ name: "", code: "", credits: "4", prof: "", email: "" });
    setShowAddForm(false);
  };

  const deleteCourse = (id: string) => {
    setCoursesList((prev) => prev.filter((c) => c.id !== id));
    if (selectedCourse?.id === id) {
      const remaining = coursesList.filter((c) => c.id !== id);
      setSelectedCourse(remaining[0] ?? null);
    }
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

  const visibleCourses = showAll ? coursesList : coursesList.slice(0, 1);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 1. Header */}
      <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-foreground">
            Academics
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your courses, syllabus grading weights, and exam schedules
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setExtractedCourse(null);
            setExtractError(null);
          }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-bold hover:bg-primary/90 transition-all text-sm shadow-md active:scale-[0.99] cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />{" "}
          {showAddForm ? "Cancel" : "Add Course"}
        </button>
      </div>

      {/* 2. Add Course Form with AI Syllabus Auto-Extraction */}
      {showAddForm && (
        <div className="mb-10 rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-xl transition-all">
          {/* Mode Tabs */}
          <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAddMode("syllabus")}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  addMode === "syllabus"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Sparkles className="h-4 w-4 text-amber-400" />
                Auto-Extract from Syllabus (PDF)
              </button>
              <button
                type="button"
                onClick={() => setAddMode("manual")}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  addMode === "manual"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                Manual Entry
              </button>
            </div>

            <span className="text-[11px] font-medium text-muted-foreground hidden sm:inline">
              {addMode === "syllabus"
                ? "Auto-generates weights, deliverables & exams"
                : "Enter course details manually"}
            </span>
          </div>

          {/* TAB 1: Auto-Extract from Syllabus */}
          {addMode === "syllabus" && (
            <div className="space-y-5">
              {!extractedCourse ? (
                <>
                  {/* Dropzone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                      syllabusFile
                        ? "border-primary bg-muted/40"
                        : "border-border hover:border-foreground/40 hover:bg-muted/30"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm group-hover:scale-105 transition-transform mb-3">
                      {isExtracting ? (
                        <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
                      ) : (
                        <FileText className="h-6 w-6 text-amber-300" />
                      )}
                    </div>

                    {syllabusFile ? (
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground">
                          {syllabusFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(syllabusFile.size / 1024).toFixed(1)} KB · Ready to extract
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground">
                          Drag and drop course syllabus PDF here, or browse files
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Supports course syllabi in PDF format (.pdf)
                        </p>
                      </div>
                    )}
                  </div>

                  {extractError && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400 p-3.5 text-xs">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{extractError}</span>
                    </div>
                  )}

                  {/* Extract Button & Status */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      {isExtracting && (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
                          <span className="font-medium text-foreground animate-pulse">
                            {extractStep}
                          </span>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={!syllabusFile || isExtracting}
                      onClick={handleExtractSyllabus}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-40 transition-all active:scale-[0.99] cursor-pointer"
                    >
                      {isExtracting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-amber-400" />
                      )}
                      <span>
                        {isExtracting ? "Extracting Course Details..." : "Auto-Extract Course Data"}
                      </span>
                    </button>
                  </div>
                </>
              ) : (
                /* Extracted Course Preview Card */
                <div className="space-y-5 rounded-2xl border border-border bg-muted/30 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-black uppercase text-foreground">
                          {extractedCourse.code}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border dark:border-emerald-800/50 px-2 py-0.5 text-[10px] font-bold">
                          <CheckCircle2 className="h-3 w-3" /> Successfully Parsed
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-foreground tracking-tight">
                        {extractedCourse.name}
                      </h3>
                      {extractedCourse.instructor && (
                        <p className="text-xs text-muted-foreground">
                          Instructor: <strong className="text-foreground">{extractedCourse.instructor}</strong>
                          {extractedCourse.officeHours && ` · ${extractedCourse.officeHours}`}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setExtractedCourse(null);
                        setSyllabusFile(null);
                      }}
                      className="text-xs font-semibold text-muted-foreground hover:text-foreground underline underline-offset-2 cursor-pointer"
                    >
                      Upload Different File
                    </button>
                  </div>

                  {/* Grade Categories & Weights Preview */}
                  <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                      <span>Grade Distribution &amp; Weights ({extractedCourse.gradeCategories.length} Categories)</span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-black">
                        Total: {extractedCourse.gradeCategories.reduce((s, c) => s + c.weight, 0)}%
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {extractedCourse.gradeCategories.map((cat) => (
                        <div
                          key={cat.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1 text-xs text-foreground font-medium"
                        >
                          <span>{cat.name}</span>
                          <span className="rounded bg-primary text-primary-foreground px-1.5 py-0.2 text-[10px] font-bold">
                            {cat.weight}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deliverables & Exams Schedule Preview */}
                  <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                      <span>Deliverables &amp; Exam Dates ({extractedCourse.deliverables.length} Items Found)</span>
                      <span className="text-[11px] text-muted-foreground">Chronological schedule</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {extractedCourse.deliverables.map((del) => {
                        const dateStr = del.dueDate
                          ? new Date(del.dueDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "TBD";
                        const isExam =
                          del.title.toLowerCase().includes("exam") ||
                          del.title.toLowerCase().includes("midterm") ||
                          del.title.toLowerCase().includes("final");

                        return (
                          <div
                            key={del.id}
                            className={`flex items-center justify-between gap-2 rounded-lg border p-2 text-xs ${
                              isExam
                                ? "border-amber-300 bg-amber-50/60 dark:border-amber-700/60 dark:bg-amber-950/40 font-semibold text-foreground"
                                : "border-border bg-muted/60 text-foreground"
                            }`}
                          >
                            <span className="truncate max-w-[170px]" title={del.title}>
                              {del.title}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-muted-foreground">
                              <span>{dateStr}</span>
                              {del.pointsPossible !== null && (
                                <span className="rounded bg-muted px-1 text-[10px] font-bold text-foreground">
                                  {del.pointsPossible}%
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Confirmation Actions */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setExtractedCourse(null)}
                      className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                    >
                      Re-Extract
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmExtractedCourse}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all active:scale-[0.99] cursor-pointer"
                    >
                      <span>Add Course &amp; Open Schedule</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Manual Entry Form */}
          {addMode === "manual" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="Course Name (e.g. Operating Systems)"
                className="p-2.5 border border-input bg-background rounded-lg text-foreground placeholder:text-muted-foreground text-xs outline-none focus:border-ring"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <input
                placeholder="Course Code (e.g. CS 4410)"
                className="p-2.5 border border-input bg-background rounded-lg text-foreground placeholder:text-muted-foreground text-xs outline-none focus:border-ring"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
              <input
                placeholder="Credits"
                type="number"
                className="p-2.5 border border-input bg-background rounded-lg text-foreground placeholder:text-muted-foreground text-xs outline-none focus:border-ring"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
              />
              <input
                placeholder="Professor Name"
                className="p-2.5 border border-input bg-background rounded-lg text-foreground placeholder:text-muted-foreground text-xs outline-none focus:border-ring"
                value={formData.prof}
                onChange={(e) => setFormData({ ...formData, prof: e.target.value })}
              />
              <input
                placeholder="Professor Email"
                className="p-2.5 border border-input bg-background rounded-lg text-foreground placeholder:text-muted-foreground text-xs col-span-full outline-none focus:border-ring"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <button
                type="button"
                onClick={addCourseManual}
                className="bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors col-span-full text-xs shadow-md cursor-pointer"
              >
                Save Course Manually
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. Courses Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Your Courses ({coursesList.length})
          </h2>
          <span className="text-xs text-muted-foreground">
            Click any course card to open Schedule &amp; Deliverables Drawer
          </span>
        </div>
        <div className="flex flex-col gap-4">
          {visibleCourses.length > 0 ? (
            visibleCourses.map((course) => {
              const mapped = mapPrismaCourseToDrawer(course);
              return (
                <div
                  key={course.id}
                  onClick={() => handleOpenCourse(course)}
                  className="cursor-pointer"
                >
                  <CourseCard
                    courseId={mapped.courseId}
                    title={mapped.title}
                    categories={mapped.categories}
                    gradeScale={mapped.gradeScale}
                    exams={mapped.exams}
                    professor={mapped.professor}
                    professorEmail={mapped.professorEmail}
                    credits={mapped.credits}
                    currentGrade={mapped.currentGrade ?? 94}
                    onDeleteCourse={() => deleteCourse(course.id)}
                  />
                </div>
              );
            })
          ) : (
            <p className="text-muted-foreground italic text-sm">
              No courses added yet. Upload a syllabus above to get started!
            </p>
          )}
        </div>

        {/* Dropdown Toggle Button */}
        {coursesList.length > 1 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full mt-4 py-3 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted transition-all border border-dashed border-border rounded-lg cursor-pointer"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4" /> Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" /> View {coursesList.length - 1}{" "}
                other courses
              </>
            )}
          </button>
        )}
      </div>

      {/* Wire database-backed Prisma course data into CourseDetailsDrawer */}
      <CourseDetailsDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        course={mapPrismaCourseToDrawer(selectedCourse)}
      />

      {/* 4. Study Plan Section */}
      <div id="study-tools" className="pt-10 border-t border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Active Study Plan
          </h2>
          <span className="text-xs text-muted-foreground">
            {studyPlan.length} milestone{studyPlan.length === 1 ? "" : "s"} queued
          </span>
        </div>

        {studyPlan.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {studyPlan.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-[#070708] p-4 text-white shadow-sm"
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
                    className="rounded-lg p-1.5 text-stone-400 hover:bg-white/10 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            Open a course drawer and click &ldquo;Add to Study Plan&rdquo; on any
            exam milestone to queue it here.
          </div>
        )}
      </div>
    </div>
  );
}
