"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dialog as SheetPrimitive } from "radix-ui";
import type { CourseWithDetails} from '@/actions/courses';
import {
  X,
  Check,
  AlertTriangle,
  Plus,
  Trash2,
  MapPin,
  Mail,
  User,
  BookOpen,
  SlidersHorizontal,
  Calendar,
  BookMarked,
  Save,
  Loader2,
  FolderKanban,
  GraduationCap,
} from "lucide-react";

// ============================================================================
// Pydantic-Compatible Syllabus Schema Interfaces
// ============================================================================

export interface GradeCategory {
  id: string;
  name: string;        // e.g. "Midterms", "Homework"
  weight: number;      // e.g. 30 (percent)
  dropLowest?: number; // e.g. 1
}

export interface GradeScaleCutoff {
  letter: string;      // e.g. "A", "A-", "B+"
  minScore: number;    // e.g. 93, 90, 87
}

export interface ExamMilestone {
  id: string;
  name: string;
  date: string;
  location?: string;
  weightPercent?: number;
  kind?: "Exam" | "Project" | "Deliverable";
}

export interface CourseDetailPayload {
  courseId: string;
  title: string;
  categories: GradeCategory[];
  gradeScale: GradeScaleCutoff[];
  exams: ExamMilestone[];
}

export interface CourseMetadataExtras {
  professor?: string;
  professorEmail?: string;
  credits?: number;
  currentGrade?: number;
}

export interface CourseDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: CourseDetailPayload & CourseMetadataExtras;
  onSave?: (updated: CourseDetailPayload & CourseMetadataExtras) => void;
  onAddToStudyPlan?: (exam: ExamMilestone, course: CourseDetailPayload) => void;
  onOpenMetadata?: () => void;
  studyViewRoute?: string;
  autoSave?: boolean;
}

// import type { CourseWithDetails } from '@/app/actions/courses';

// export function mapPrismaCourseToDrawer(course: CourseWithDetails) {
//   return {
//     id: course.id,
//     title: course.name,
//     code: course.code,
//     term: course.term ?? '',
//     instructor: {
//       name: course.instructor ?? '',
//       email: course.instructorEmail ?? '',
//       officeHours: course.officeHours ?? '',
//     },
//     // Map database categories to whatever your drawer's UI uses
//     categories: course.gradeCategories.map((cat) => ({
//       id: cat.id,
//       name: cat.name,
//       weight: cat.weight,
//       dropLowest: cat.dropLowest,
//     })),
//     // Map deliverables/assignments to your drawer's list structure
//     assignments: course.deliverables.map((del) => ({
//       id: del.id,
//       title: del.title,
//       dueDate: del.dueDate ? del.dueDate.toISOString() : null,
//       points: del.pointsPossible ?? 0,
//       completed: del.isCompleted,
//       categoryName: del.category?.name ?? 'General',
//     })),
//   };
// }

// ============================================================================
// Presets & Defaults
// ============================================================================

export const STANDARD_10_POINT_SCALE: GradeScaleCutoff[] = [
  { letter: "A", minScore: 93 },
  { letter: "A-", minScore: 90 },
  { letter: "B+", minScore: 87 },
  { letter: "B", minScore: 83 },
  { letter: "B-", minScore: 80 },
  { letter: "C+", minScore: 77 },
  { letter: "C", minScore: 73 },
  { letter: "C-", minScore: 70 },
  { letter: "D", minScore: 60 },
];

export const CUSTOM_COURSE_CURVE_SCALE: GradeScaleCutoff[] = [
  { letter: "A", minScore: 90 },
  { letter: "A-", minScore: 86 },
  { letter: "B+", minScore: 82 },
  { letter: "B", minScore: 78 },
  { letter: "B-", minScore: 74 },
  { letter: "C+", minScore: 70 },
  { letter: "C", minScore: 66 },
  { letter: "C-", minScore: 62 },
  { letter: "D", minScore: 55 },
];

export const DEFAULT_CATEGORIES: GradeCategory[] = [
  { id: "cat-exams", name: "Exams", weight: 45, dropLowest: 0 },
  { id: "cat-hw", name: "Homework", weight: 25, dropLowest: 1 },
  { id: "cat-proj", name: "Final Project", weight: 20, dropLowest: 0 },
  { id: "cat-part", name: "Participation", weight: 10, dropLowest: 0 },
];

export const DEFAULT_EXAM_MILESTONES: ExamMilestone[] = [
  {
    id: "exam-1",
    name: "Midterm Exam I: Pipelining & ISA",
    date: "2026-10-24",
    location: "Gates Hall 104",
    weightPercent: 20,
    kind: "Exam",
  },
  {
    id: "exam-2",
    name: "Cache Simulator Architecture Project",
    date: "2026-11-08",
    location: "Canvas / GitHub",
    weightPercent: 10,
    kind: "Project",
  },
  {
    id: "exam-3",
    name: "Midterm Exam II: Memory Hierarchy",
    date: "2026-11-19",
    location: "Gates Hall 104",
    weightPercent: 25,
    kind: "Exam",
  },
  {
    id: "exam-4",
    name: "Final Out-of-Order Processor Core Project",
    date: "2026-12-11",
    location: "Systems Lab 302",
    weightPercent: 20,
    kind: "Project",
  },
];

function inferKind(item: ExamMilestone): "Exam" | "Project" {
  if (item.kind === "Project" || item.kind === "Deliverable") return "Project";
  if (item.kind === "Exam") return "Exam";
  const lower = item.name.toLowerCase();
  if (
    lower.includes("project") ||
    lower.includes("lab") ||
    lower.includes("deliverable") ||
    lower.includes("simulator") ||
    lower.includes("core")
  ) {
    return "Project";
  }
  return "Exam";
}

function formatDateBadge(dateStr: string): { month: string; day: string } {
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return { month: "TBD", day: "--" };
  }
  const month = parsed
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();
  const day = String(parsed.getDate()).padStart(2, "0");
  return { month, day };
}

export function CourseDetailsDrawer({
  open,
  onOpenChange,
  course,
  onSave,
  onAddToStudyPlan,
  onOpenMetadata,
  studyViewRoute = "/courses?view=studying#study-tools",
  autoSave = true,
}: CourseDetailsDrawerProps) {
  const router = useRouter();

  const [exams, setExams] = useState<ExamMilestone[]>(
    course.exams?.length ? course.exams : DEFAULT_EXAM_MILESTONES
  );
  const [filterTab, setFilterTab] = useState<"all" | "Exam" | "Project">("all");

  // Add Exam / Project Form State
  const [showAddExam, setShowAddExam] = useState(false);
  const [newExam, setNewExam] = useState<{
    name: string;
    date: string;
    location: string;
    kind: "Exam" | "Project";
  }>({
    name: "",
    date: "",
    location: "",
    kind: "Exam",
  });

  // Persistence State
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [addedStudyExamId, setAddedStudyExamId] = useState<string | null>(null);

  useEffect(() => {
    setExams(course.exams?.length ? course.exams : DEFAULT_EXAM_MILESTONES);
    setIsDirty(false);
    setSaveStatus("idle");
    setSaveError(null);
  }, [course.courseId, course.exams]);

  const currentGrade = course.currentGrade ?? 94;
  const gradeScale = course.gradeScale?.length
    ? course.gradeScale
    : STANDARD_10_POINT_SCALE;

  const currentLetterGrade = useMemo(() => {
    const sorted = [...gradeScale].sort((a, b) => b.minScore - a.minScore);
    for (const cutoff of sorted) {
      if (currentGrade >= cutoff.minScore) return cutoff.letter;
    }
    return "F";
  }, [gradeScale, currentGrade]);

  // ==========================================================================
  // Persistence: PATCH /api/courses/[id]
  // ==========================================================================
  const buildPayload = useCallback((): CourseDetailPayload &
    CourseMetadataExtras => {
    return {
      courseId: String(course.courseId || "course-101"),
      title: course.title || "Computer Architecture",
      categories: course.categories?.length
        ? course.categories
        : DEFAULT_CATEGORIES,
      gradeScale,
      exams,
      professor: course.professor || "Dr. Elena Vance",
      professorEmail: course.professorEmail || "evance@university.edu",
      credits: course.credits ?? 4,
      currentGrade,
    };
  }, [course, gradeScale, exams, currentGrade]);

  const persistScheduleChanges = useCallback(
    async (payloadToSave?: CourseDetailPayload & CourseMetadataExtras) => {
      const payload = payloadToSave ?? buildPayload();
      setSaveStatus("saving");
      setSaveError(null);

      try {
        const res = await fetch(
          `/api/courses/${encodeURIComponent(payload.courseId)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              courseId: payload.courseId,
              title: payload.title,
              categories: payload.categories,
              gradeScale: payload.gradeScale,
              exams: payload.exams,
            } satisfies CourseDetailPayload),
          }
        );

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed with status ${res.status}`);
        }

        onSave?.(payload);
        setIsDirty(false);
        setSaveStatus("saved");
        return true;
      } catch (err) {
        onSave?.(payload);
        setSaveStatus("error");
        setSaveError(
          err instanceof Error ? err.message : "Failed to save schedule"
        );
        return false;
      }
    },
    [buildPayload, onSave]
  );

  useEffect(() => {
    if (!autoSave || !isDirty) return;
    const timer = setTimeout(() => {
      void persistScheduleChanges();
    }, 850);
    return () => clearTimeout(timer);
  }, [autoSave, isDirty, exams, persistScheduleChanges]);

  // ==========================================================================
  // Exam & Project Schedule Handlers
  // ==========================================================================
  const updateExam = (
    id: string,
    field: keyof ExamMilestone,
    value: string | number | undefined
  ) => {
    setExams((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, [field]: value } : ex))
    );
    setIsDirty(true);
  };

  const handleCreateExam = () => {
    if (!newExam.name.trim() || !newExam.date) return;
    const created: ExamMilestone = {
      id: `exam-${Date.now()}`,
      name: newExam.name.trim(),
      date: newExam.date,
      location: newExam.location.trim() || "TBA",
      kind: newExam.kind,
    };
    setExams((prev) => [...prev, created]);
    setNewExam({ name: "", date: "", location: "", kind: "Exam" });
    setShowAddExam(false);
    setIsDirty(true);
  };

  const removeExam = (id: string) => {
    setExams((prev) => prev.filter((ex) => ex.id !== id));
    setIsDirty(true);
  };

  const handleAddToStudyPlan = (exam: ExamMilestone) => {
    const payload = buildPayload();

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("astrolabe:add-to-study-plan", {
          detail: {
            courseId: payload.courseId,
            courseTitle: payload.title,
            exam,
          },
        })
      );

      try {
        const existingRaw = localStorage.getItem("astrolabe-study-plan");
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        const filtered = Array.isArray(existing)
          ? existing.filter((item: { id?: string }) => item.id !== exam.id)
          : [];
        localStorage.setItem(
          "astrolabe-study-plan",
          JSON.stringify([
            ...filtered,
            {
              ...exam,
              courseId: payload.courseId,
              courseTitle: payload.title,
              addedAt: new Date().toISOString(),
            },
          ])
        );
      } catch {
        // Ignore storage quota errors
      }
    }

    setAddedStudyExamId(exam.id);
    onAddToStudyPlan?.(exam, payload);

    const targetUrl = studyViewRoute.includes("?")
      ? `${studyViewRoute.split("#")[0]}&examId=${encodeURIComponent(
          exam.id
        )}&examName=${encodeURIComponent(exam.name)}#study-tools`
      : `${studyViewRoute}?examId=${encodeURIComponent(exam.id)}#study-tools`;

    router.push(targetUrl, { scroll: false });
  };

  const sortedExams = useMemo(
    () => [...exams].sort((a, b) => a.date.localeCompare(b.date)),
    [exams]
  );

  const filteredExams = useMemo(() => {
    if (filterTab === "all") return sortedExams;
    return sortedExams.filter((item) => inferKind(item) === filterTab);
  }, [sortedExams, filterTab]);

  const examCount = useMemo(
    () => sortedExams.filter((item) => inferKind(item) === "Exam").length,
    [sortedExams]
  );
  const projectCount = useMemo(
    () => sortedExams.filter((item) => inferKind(item) === "Project").length,
    [sortedExams]
  );

  return (
    <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <SheetPrimitive.Portal>
        {/* 25% Black Backdrop Overlay with blur-sm */}
        <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/25 backdrop-blur-sm transition-opacity duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />

        {/* Right-aligned Slide-Over Drawer focused on Upcoming Exams & Projects */}
        <SheetPrimitive.Content
          aria-label={`${course.title} Upcoming Exams and Projects Drawer`}
          onEscapeKeyDown={() => onOpenChange(false)}
          // Changed Font FROM SANS TO MONO, SUBJECT TO CHANGE AND COLOR TO PURPLE CHANGELONG
          onPointerDownOutside={() => onOpenChange(false)}
          className="fixed z-50 flex flex-col bg-[#1b1a38] text-white font-mono shadow-[0_0_60px_rgba(0,0,0,0.85)] outline-none transition-transform duration-300 ease-out
            inset-x-0 bottom-0 h-[92vh] w-full rounded-t-3xl border-t border-white/10
            md:top-0 md:right-0 md:bottom-0 md:left-auto md:h-screen md:w-[550px] md:max-w-[600px] md:rounded-none md:border-t-0 md:border-l md:border-white/10
            data-[state=open]:animate-in data-[state=closed]:animate-out
            max-md:data-[state=open]:slide-in-from-bottom max-md:data-[state=closed]:slide-out-to-bottom
            md:data-[state=open]:slide-in-from-right md:data-[state=closed]:slide-out-to-right"
        >
          {/* Mobile Grab Handle */}
          <div className="flex justify-center pt-3 pb-1 md:hidden">
            <div className="h-1 w-10 rounded-full bg-white/20" />
          </div>

          {/* ===============================================================
              1. HEADER
             =============================================================== */}
          <div className="relative shrink-0 border-b border-white/10 px-6 pt-5 pb-5 bg-gradient-to-b from-white/[0.03] to-transparent">
            <SheetPrimitive.Close
              aria-label="Close drawer"
              className="absolute top-5 right-5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-stone-400 transition-colors hover:border-white/25 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 outline-none"
            >
              <X className="h-4 w-4" />
            </SheetPrimitive.Close>

            <div className="mb-2 flex flex-wrap items-center gap-2 pr-10">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#D6CFC2]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D6CFC2]" />
                EXAMS &amp; PROJECTS SCHEDULE
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white px-2.5 py-0.5 text-[11px] font-bold tracking-tight text-black">
                {currentGrade}% · {currentLetterGrade}
              </span>
              {saveStatus === "saved" && !isDirty && (
                <span className="inline-flex items-center gap-1 text-[11px] text-[#D6CFC2]">
                  <Check className="h-3 w-3" />
                  Synced
                </span>
              )}
            </div>

            <div className="pr-10">
              {/* Note Change: Increased font size */}
              <SheetPrimitive.Title className="text-5xl font-bold tracking-tight text-white leading-snug">
                {course.title || "Computer Architecture"}
              </SheetPrimitive.Title>

              <SheetPrimitive.Description asChild>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-400">
                  <span className="inline-flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-stone-500" />
                    {course.professor || "Dr. Elena Vance"}
                  </span>
                  <span className="text-white/20">•</span>
                  <a
                    href={`mailto:${course.professorEmail || ""}`}
                    className="inline-flex items-center gap-1.5 text-stone-400 hover:text-[#E5DEC9] transition-colors underline-offset-2 hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5 text-stone-500" />
                    {course.professorEmail || "evance@university.edu"}
                  </a>
                  <span className="text-white/20">•</span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-stone-300">
                    <BookOpen className="h-3.5 w-3.5 text-stone-500" />
                    {course.credits ?? 4} Credits
                  </span>
                </div>
              </SheetPrimitive.Description>
            </div>

            {/* Quick Link to open separate CourseMetadata panel if user wants to change weights/cutoffs */}
            {onOpenMetadata && (
              <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-stone-400">
                  Need to adjust syllabus weights or grade cutoffs?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenMetadata();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold text-[#E5DEC9] transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white"
                >
                  <SlidersHorizontal className="h-3 w-3" />
                  Course Metadata &amp; Weights
                </button>
              </div>
            )}
          </div>

          {/* ===============================================================
              SCROLLABLE BODY: UPCOMING EXAMS & PROJECTS ONLY
             =============================================================== */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Summary Counters */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3.5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black text-[#D6CFC2]">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-lg font-black tabular-nums text-white leading-none">
                    {examCount}
                  </p>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Upcoming Exams
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3.5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black text-[#D6CFC2]">
                  <FolderKanban className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-lg font-black tabular-nums text-white leading-none">
                    {projectCount}
                  </p>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Course Projects
                  </p>
                </div>
              </div>
            </div>

            {/* Filter Bar + Add Milestone Trigger */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div
                role="group"
                aria-label="Filter schedule items"
                className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1"
              >
                <button
                  type="button"
                  onClick={() => setFilterTab("all")}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                    filterTab === "all"
                      ? "bg-white text-black font-semibold"
                      : "text-stone-400 hover:text-white"
                  }`}
                >
                  All ({sortedExams.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("Exam")}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                    filterTab === "Exam"
                      ? "bg-white text-black font-semibold"
                      : "text-stone-400 hover:text-white"
                  }`}
                >
                  Exams ({examCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("Project")}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                    filterTab === "Project"
                      ? "bg-white text-black font-semibold"
                      : "text-stone-400 hover:text-white"
                  }`}
                >
                  Projects ({projectCount})
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowAddExam(!showAddExam)}
                className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-white/30 hover:bg-white hover:text-black"
              >
                <Plus className="h-3.5 w-3.5" />
                {showAddExam ? "Cancel" : "Add Exam / Project"}
              </button>
            </div>

            {/* Inline Add Exam or Project Form */}
            {showAddExam && (
              <div className="space-y-2.5 rounded-xl border border-white/15 bg-white/[0.03] p-3.5">
                <div className="grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    placeholder="Exam or Project Title"
                    value={newExam.name}
                    onChange={(e) =>
                      setNewExam({ ...newExam, name: e.target.value })
                    }
                    className="col-span-8 rounded-lg border border-white/10 bg-black px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/30"
                  />
                  <select
                    value={newExam.kind}
                    onChange={(e) =>
                      setNewExam({
                        ...newExam,
                        kind: e.target.value as "Exam" | "Project",
                      })
                    }
                    className="col-span-4 rounded-lg border border-white/10 bg-black px-2 py-1.5 text-xl text-stone-200 outline-none focus:border-white/30"
                  >
                    <option value="Exam">Exam</option>
                    <option value="Project">Project</option>
                  </select>
                </div>

                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-6 flex items-center gap-1.5 rounded-lg border border-white/10 bg-black px-2.5 py-1.5">
                    <Calendar className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                    <input
                      type="date"
                      value={newExam.date}
                      onChange={(e) =>
                        setNewExam({ ...newExam, date: e.target.value })
                      }
                      className="w-full bg-transparent text-xs text-stone-200 outline-none [color-scheme:dark]"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Location / Room (e.g. Gates 104)"
                    value={newExam.location}
                    onChange={(e) =>
                      setNewExam({ ...newExam, location: e.target.value })
                    }
                    className="col-span-6 rounded-lg border border-white/10 bg-black px-2.5 py-1.5 text-xs text-stone-200 outline-none focus:border-white/30"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCreateExam}
                  className="w-full rounded-lg bg-white py-1.5 text-xs font-semibold text-black transition-colors hover:bg-stone-200"
                >
                  Save to Course Schedule
                </button>
              </div>
            )}

            {/* Chronological List of Upcoming Exams & Projects */}
            <div className="space-y-3">
              {filteredExams.length > 0 ? (
                filteredExams.map((exam) => {
                  const badge = formatDateBadge(exam.date);
                  const kind = inferKind(exam);
                  const isAdded = addedStudyExamId === exam.id;

                  return (
                    <div
                      key={exam.id}
                      className="group rounded-xl border border-white/10 bg-white/[0.02] p-3.5 transition-colors hover:border-white/20 hover:bg-white/[0.035] space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Date Badge */}
                          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-white/10 bg-black text-center">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[#D6CFC2]">
                              {badge.month}
                            </span>
                            <span className="text-sm font-black leading-tight tabular-nums text-white">
                              {badge.day}
                            </span>
                          </div>

                          {/* Editable Milestone Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                  kind === "Project"
                                    ? "bg-[#D6CFC2]/15 text-[#E5DEC9] border border-[#D6CFC2]/30"
                                    : "bg-white/10 text-white border border-white/15"
                                }`}
                              >
                                {kind}
                              </span>
                              <input
                                type="text"
                                value={exam.name}
                                onChange={(e) =>
                                  updateExam(exam.id, "name", e.target.value)
                                }
                                aria-label="Exam or project title"
                                className="w-full truncate rounded border border-transparent bg-transparent px-1.5 py-0.5 text-xs font-semibold text-white hover:border-white/10 focus:border-white/25 focus:bg-black outline-none"
                              />
                            </div>

                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                              {/* Editable Date Picker */}
                              <label className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/60 px-2 py-0.5 text-[11px] text-stone-300 focus-within:border-white/30">
                                <Calendar className="h-3 w-3 text-stone-500" />
                                <input
                                  type="date"
                                  value={exam.date}
                                  onChange={(e) =>
                                    updateExam(exam.id, "date", e.target.value)
                                  }
                                  aria-label={`${exam.name} date`}
                                  className="bg-transparent text-[11px] text-stone-300 outline-none [color-scheme:dark]"
                                />
                              </label>

                              {/* Editable Location */}
                              <label className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/60 px-2 py-0.5 text-[11px] text-stone-300 focus-within:border-white/30">
                                <MapPin className="h-3 w-3 text-stone-500 shrink-0" />
                                <input
                                  type="text"
                                  value={exam.location ?? ""}
                                  placeholder="Room / Location"
                                  onChange={(e) =>
                                    updateExam(
                                      exam.id,
                                      "location",
                                      e.target.value
                                    )
                                  }
                                  aria-label={`${exam.name} location`}
                                  className="w-28 bg-transparent text-[11px] text-stone-300 outline-none"
                                />
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => removeExam(exam.id)}
                          aria-label={`Remove ${exam.name}`}
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-stone-500 hover:bg-white/10 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Per-Exam Action Bar: "Add to Study Plan" */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-2">
                        <span className="text-[10px] text-stone-500">
                          {exam.weightPercent !== undefined
                            ? `Syllabus Weight: ${exam.weightPercent}%`
                            : "Scheduled Milestone"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddToStudyPlan(exam)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                            isAdded
                              ? "border-[#D6CFC2]/40 bg-[#D6CFC2] text-black"
                              : "border-white/15 bg-white/[0.05] text-stone-200 hover:border-white/35 hover:bg-white hover:text-black"
                          }`}
                        >
                          <BookMarked className="h-3 w-3" />
                          {isAdded ? "Added to Study Plan" : "Add to Study Plan"}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 py-8 text-center text-xs text-stone-500">
                  No upcoming items in this view.
                </div>
              )}
            </div>
          </div>

          {/* ===============================================================
              PERSISTENCE FOOTER BAR
             =============================================================== */}
          <div className="shrink-0 border-t border-white/10 bg-[#050506] px-6 py-4">
            {saveError && (
              <p className="mb-2 text-xs text-red-300 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                {saveError}
              </p>
            )}

            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] text-stone-400">
                {saveStatus === "saving" ? (
                  <span className="inline-flex items-center gap-1.5 text-stone-300">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#D6CFC2]" />
                    PATCH /api/courses/{course.courseId || "101"}...
                  </span>
                ) : isDirty ? (
                  <span className="text-amber-200/90">
                    Unsaved schedule changes · Auto-saving
                  </span>
                ) : saveStatus === "saved" ? (
                  <span className="text-[#D6CFC2]">
                    Schedule saved to /api/courses/{course.courseId || "101"}
                  </span>
                ) : (
                  <span>Press Esc or click outside to close</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <SheetPrimitive.Close asChild>
                  <button
                    type="button"
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-stone-300 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
                  >
                    Close
                  </button>
                </SheetPrimitive.Close>

                <button
                  type="button"
                  disabled={saveStatus === "saving"}
                  onClick={() => void persistScheduleChanges()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-black transition-all hover:bg-[#E5DEC9] active:scale-[0.99] disabled:opacity-50"
                >
                  {saveStatus === "saving" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}

export default CourseDetailsDrawer;

