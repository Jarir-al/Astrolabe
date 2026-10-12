"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dialog as SheetPrimitive } from "radix-ui";
import {
  X,
  Pencil,
  Check,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  MapPin,
  FileText,
  Sparkles,
  Mail,
  User,
  BookOpen,
  RefreshCw,
  SlidersHorizontal,
  Calendar,
  BookMarked,
  Save,
  Loader2,
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
  studyViewRoute?: string;
  autoSave?: boolean;
}

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
  },
  {
    id: "exam-2",
    name: "Cache Simulator Deliverable",
    date: "2026-11-08",
    location: "Canvas / GitHub",
    weightPercent: 10,
  },
  {
    id: "exam-3",
    name: "Midterm Exam II: Memory Hierarchy",
    date: "2026-11-19",
    location: "Gates Hall 104",
    weightPercent: 25,
  },
  {
    id: "exam-4",
    name: "Final Out-of-Order Processor Core",
    date: "2026-12-11",
    location: "Systems Lab 302",
    weightPercent: 20,
  },
];

const SEGMENT_COLORS = [
  "bg-white",
  "bg-[#D6CFC2]",
  "bg-[#9E9689]",
  "bg-[#6E675F]",
  "bg-amber-200/80",
  "bg-stone-500",
];

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
  studyViewRoute = "/courses?view=studying#study-tools",
  autoSave = true,
}: CourseDetailsDrawerProps) {
  const router = useRouter();

  // Header & Metadata State
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [title, setTitle] = useState(course.title || "Computer Architecture");
  const [professor, setProfessor] = useState(
    course.professor || "Dr. Elena Vance"
  );
  const [professorEmail, setProfessorEmail] = useState(
    course.professorEmail || "evance@university.edu"
  );
  const [credits, setCredits] = useState<number>(course.credits ?? 4);
  const [currentGrade, setCurrentGrade] = useState<number>(
    course.currentGrade ?? 94
  );

  // Core Schema State
  const [categories, setCategories] = useState<GradeCategory[]>(
    course.categories?.length ? course.categories : DEFAULT_CATEGORIES
  );
  const [gradeScale, setGradeScale] = useState<GradeScaleCutoff[]>(
    course.gradeScale?.length
      ? course.gradeScale
      : STANDARD_10_POINT_SCALE.map((c) => ({ ...c }))
  );
  const [scalePreset, setScalePreset] = useState<"standard" | "curve">(
    "standard"
  );
  const [exams, setExams] = useState<ExamMilestone[]>(
    course.exams?.length ? course.exams : DEFAULT_EXAM_MILESTONES
  );

  // Add Exam Form State
  const [showAddExam, setShowAddExam] = useState(false);
  const [newExam, setNewExam] = useState<{
    name: string;
    date: string;
    location: string;
    weightPercent: string;
  }>({
    name: "",
    date: "",
    location: "",
    weightPercent: "15",
  });

  // Persistence & Feedback State
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [addedStudyExamId, setAddedStudyExamId] = useState<string | null>(null);
  const [isSyncingPdf, setIsSyncingPdf] = useState(false);
  const [pdfSyncMessage, setPdfSyncMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync incoming prop changes when switching courses
  useEffect(() => {
    setTitle(course.title || "Computer Architecture");
    setProfessor(course.professor || "Dr. Elena Vance");
    setProfessorEmail(course.professorEmail || "evance@university.edu");
    setCredits(course.credits ?? 4);
    setCurrentGrade(course.currentGrade ?? 94);
    setCategories(
      course.categories?.length ? course.categories : DEFAULT_CATEGORIES
    );
    setGradeScale(
      course.gradeScale?.length
        ? course.gradeScale
        : STANDARD_10_POINT_SCALE.map((c) => ({ ...c }))
    );
    setExams(course.exams?.length ? course.exams : DEFAULT_EXAM_MILESTONES);
    setIsDirty(false);
    setSaveStatus("idle");
    setSaveError(null);
  }, [course.courseId]);

  // ==========================================================================
  // 1. Dynamic Weight Validator
  // ==========================================================================
  const totalWeight = useMemo(() => {
    const raw = categories.reduce(
      (sum, cat) => sum + (Number.isFinite(cat.weight) ? cat.weight : 0),
      0
    );
    return Math.round(raw * 10) / 10;
  }, [categories]);

  const isWeightValid = totalWeight === 100;

  const handleAutoNormalizeWeights = () => {
    if (categories.length === 0) return;
    if (totalWeight <= 0) {
      const equal = Math.floor(100 / categories.length);
      const next = categories.map((c, idx) => ({
        ...c,
        weight: idx === 0 ? 100 - equal * (categories.length - 1) : equal,
      }));
      setCategories(next);
      setIsDirty(true);
      return;
    }

    let running = 0;
    const next = categories.map((c, idx) => {
      if (idx === categories.length - 1) {
        return { ...c, weight: Math.max(0, 100 - running) };
      }
      const normalized = Math.round((c.weight / totalWeight) * 100);
      running += normalized;
      return { ...c, weight: normalized };
    });
    setCategories(next);
    setIsDirty(true);
  };

  // ==========================================================================
  // 2. Grade Scale Sorted Validation
  // ==========================================================================
  const scaleConflictIndex = useMemo(() => {
    for (let i = 0; i < gradeScale.length - 1; i++) {
      if (gradeScale[i].minScore <= gradeScale[i + 1].minScore) {
        return i;
      }
    }
    return -1;
  }, [gradeScale]);

  const isScaleSorted = scaleConflictIndex === -1;

  const enforceSortedScale = () => {
    const next = gradeScale.map((item) => ({ ...item }));
    for (let i = 1; i < next.length; i++) {
      if (next[i].minScore >= next[i - 1].minScore) {
        next[i].minScore = Math.max(0, next[i - 1].minScore - 1);
      }
    }
    setGradeScale(next);
    setIsDirty(true);
  };

  const updateCutoffScore = (index: number, rawValue: number) => {
    const clamped = Math.max(0, Math.min(100, rawValue));
    const next = gradeScale.map((item, idx) =>
      idx === index ? { ...item, minScore: clamped } : item
    );
    setGradeScale(next);
    setScalePreset("curve");
    setIsDirty(true);
  };

  // Clamp cutoff to strict descending bounds on blur
  const handleCutoffBlur = (index: number) => {
    const upperBound = index > 0 ? gradeScale[index - 1].minScore - 1 : 100;
    const lowerBound =
      index < gradeScale.length - 1
        ? gradeScale[index + 1].minScore + 1
        : 0;
    const current = gradeScale[index].minScore;
    if (current > upperBound || current < lowerBound) {
      const safeVal = Math.max(lowerBound, Math.min(upperBound, current));
      const next = gradeScale.map((item, idx) =>
        idx === index ? { ...item, minScore: safeVal } : item
      );
      setGradeScale(next);
    }
  };

  const applyScalePreset = (preset: "standard" | "curve") => {
    setScalePreset(preset);
    const next = (
      preset === "standard"
        ? STANDARD_10_POINT_SCALE
        : CUSTOM_COURSE_CURVE_SCALE
    ).map((c) => ({ ...c }));
    setGradeScale(next);
    setIsDirty(true);
  };

  const currentLetterGrade = useMemo(() => {
    const sorted = [...gradeScale].sort((a, b) => b.minScore - a.minScore);
    for (const cutoff of sorted) {
      if (currentGrade >= cutoff.minScore) return cutoff.letter;
    }
    return "F";
  }, [gradeScale, currentGrade]);

  // ==========================================================================
  // 4. Persistence: PATCH /api/courses/[id] (Debounced Auto-Save + Explicit Save)
  // ==========================================================================
  const buildPayload = useCallback((): CourseDetailPayload &
    CourseMetadataExtras => {
    return {
      courseId: String(course.courseId || "course-101"),
      title,
      categories,
      gradeScale,
      exams,
      professor,
      professorEmail,
      credits,
      currentGrade,
    };
  }, [
    course.courseId,
    title,
    categories,
    gradeScale,
    exams,
    professor,
    professorEmail,
    credits,
    currentGrade,
  ]);

  const persistCourseChanges = useCallback(
    async (payloadToSave?: CourseDetailPayload & CourseMetadataExtras) => {
      const payload = payloadToSave ?? buildPayload();

      if (!isScaleSorted) {
        setSaveStatus("error");
        setSaveError(
          "Fix grade cutoff order before saving (each cutoff must be strictly greater than the next)."
        );
        return false;
      }

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
        // Still invoke local callback so client state remains responsive
        onSave?.(payload);
        setSaveStatus("error");
        setSaveError(
          err instanceof Error ? err.message : "Failed to save changes"
        );
        return false;
      }
    },
    [buildPayload, isScaleSorted, onSave]
  );

  // Debounced auto-save when dirty & valid
  useEffect(() => {
    if (!autoSave || !isDirty || !isScaleSorted) return;
    const timer = setTimeout(() => {
      void persistCourseChanges();
    }, 850);
    return () => clearTimeout(timer);
  }, [
    autoSave,
    isDirty,
    isScaleSorted,
    title,
    categories,
    gradeScale,
    exams,
    professor,
    professorEmail,
    credits,
    currentGrade,
    persistCourseChanges,
  ]);

  // ==========================================================================
  // Category & Exam Mutation Helpers
  // ==========================================================================
  const updateCategory = (
    id: string,
    field: keyof GradeCategory,
    value: string | number | undefined
  ) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, [field]: value } : cat))
    );
    setIsDirty(true);
  };

  const addCategory = () => {
    const remaining = Math.max(0, Math.round(100 - totalWeight));
    setCategories((prev) => [
      ...prev,
      {
        id: `cat-${Date.now()}`,
        name: "New Category",
        weight: remaining,
        dropLowest: 0,
      },
    ]);
    setIsDirty(true);
  };

  const removeCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setIsDirty(true);
  };

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
      weightPercent: Math.max(
        0,
        Math.min(100, Number(newExam.weightPercent) || 0)
      ),
    };
    setExams((prev) => [...prev, created]);
    setNewExam({ name: "", date: "", location: "", weightPercent: "15" });
    setShowAddExam(false);
    setIsDirty(true);
  };

  const removeExam = (id: string) => {
    setExams((prev) => prev.filter((ex) => ex.id !== id));
    setIsDirty(true);
  };

  // 3. Exam Schedule Manager: "Add to Study Plan"
  const handleAddToStudyPlan = (exam: ExamMilestone) => {
    const payload = buildPayload();

    // 1. Dispatch custom DOM event for study widgets
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

      // Persist in localStorage study queue
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

    // Navigate / push to Studying view
    const targetUrl = studyViewRoute.includes("?")
      ? `${studyViewRoute.split("#")[0]}&examId=${encodeURIComponent(
          exam.id
        )}&examName=${encodeURIComponent(exam.name)}#study-tools`
      : `${studyViewRoute}?examId=${encodeURIComponent(exam.id)}#study-tools`;

    router.push(targetUrl, { scroll: false });
  };

  // Syllabus Re-extract Simulation
  const handleSyllabusSync = (fileName?: string) => {
    setIsSyncingPdf(true);
    setTimeout(() => {
      setIsSyncingPdf(false);
      setPdfSyncMessage(
        fileName
          ? `Re-extracted weights & milestones from ${fileName}`
          : "Synced with course syllabus PDF"
      );
      setIsDirty(true);
    }, 800);
  };

  const sortedExams = useMemo(
    () => [...exams].sort((a, b) => a.date.localeCompare(b.date)),
    [exams]
  );

  return (
    <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <SheetPrimitive.Portal>
        {/* 25% Black Backdrop Overlay with blur-sm (Outside click closes drawer) */}
        <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/25 backdrop-blur-sm transition-opacity duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />

        {/* Right-aligned Slide-Over Drawer (480px-520px on Desktop, Bottom Sheet on Mobile) */}
        <SheetPrimitive.Content
          aria-label={`${title} Course Details Drawer`}
          onEscapeKeyDown={() => onOpenChange(false)}
          onPointerDownOutside={() => onOpenChange(false)}
          className="fixed z-50 flex flex-col bg-[#070708] text-white font-sans shadow-[0_0_60px_rgba(0,0,0,0.85)] outline-none transition-transform duration-300 ease-out
            inset-x-0 bottom-0 h-[92vh] w-full rounded-t-3xl border-t border-white/10
            md:top-0 md:right-0 md:bottom-0 md:left-auto md:h-screen md:w-[500px] md:max-w-[520px] md:rounded-none md:border-t-0 md:border-l md:border-white/10
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
            {/* Distinct 'X' Close Button pinned at top-right */}
            <SheetPrimitive.Close
              aria-label="Close drawer"
              className="absolute top-5 right-5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-stone-400 transition-colors hover:border-white/25 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 outline-none"
            >
              <X className="h-4 w-4" />
            </SheetPrimitive.Close>

            {/* Status Pill Row */}
            <div className="mb-2 flex flex-wrap items-center gap-2 pr-10">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#D6CFC2]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D6CFC2]" />
                SYLLABUS SCHEMA
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white px-2.5 py-0.5 text-[11px] font-bold tracking-tight text-black">
                {currentGrade}% · {currentLetterGrade}
              </span>
              {saveStatus === "saving" && (
                <span className="inline-flex items-center gap-1 text-[11px] text-stone-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </span>
              )}
              {saveStatus === "saved" && !isDirty && (
                <span className="inline-flex items-center gap-1 text-[11px] text-[#D6CFC2]">
                  <Check className="h-3 w-3" />
                  Synced
                </span>
              )}
            </div>

            {!isEditingHeader ? (
              <div className="pr-10">
                <div className="flex items-center gap-2.5">
                  <SheetPrimitive.Title className="text-xl font-bold tracking-tight text-white leading-snug">
                    {title}
                  </SheetPrimitive.Title>
                  <button
                    type="button"
                    onClick={() => setIsEditingHeader(true)}
                    aria-label="Edit course header"
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-stone-400 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Professor, email, and credit count in muted compact secondary text */}
                <SheetPrimitive.Description asChild>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-400">
                    <span className="inline-flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-stone-500" />
                      {professor || "TBA"}
                    </span>
                    <span className="text-white/20">•</span>
                    <a
                      href={`mailto:${professorEmail}`}
                      className="inline-flex items-center gap-1.5 text-stone-400 hover:text-[#E5DEC9] transition-colors underline-offset-2 hover:underline"
                    >
                      <Mail className="h-3.5 w-3.5 text-stone-500" />
                      {professorEmail || "No email"}
                    </a>
                    <span className="text-white/20">•</span>
                    <span className="inline-flex items-center gap-1.5 font-medium text-stone-300">
                      <BookOpen className="h-3.5 w-3.5 text-stone-500" />
                      {credits} {credits === 1 ? "Credit" : "Credits"}
                    </span>
                  </div>
                </SheetPrimitive.Description>
              </div>
            ) : (
              <div className="mt-1 space-y-2.5 pr-10 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <SheetPrimitive.Title className="sr-only">
                  Edit {title}
                </SheetPrimitive.Title>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Course Title"
                    className="w-full rounded-lg border border-white/15 bg-black px-2.5 py-1.5 text-sm font-bold text-white outline-none focus:border-white/40"
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditingHeader(false)}
                    className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-white px-3 text-xs font-semibold text-black hover:bg-stone-200 transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Done
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={professor}
                    onChange={(e) => {
                      setProfessor(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Professor Name"
                    className="rounded-lg border border-white/10 bg-black px-2.5 py-1.5 text-xs text-stone-200 outline-none focus:border-white/30"
                  />
                  <input
                    type="email"
                    value={professorEmail}
                    onChange={(e) => {
                      setProfessorEmail(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Professor Email"
                    className="rounded-lg border border-white/10 bg-black px-2.5 py-1.5 text-xs text-stone-200 outline-none focus:border-white/30"
                  />
                  <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black px-2.5 py-1.5">
                    <span className="text-[11px] text-stone-400">Credits:</span>
                    <input
                      type="number"
                      min={0}
                      max={12}
                      value={credits}
                      onChange={(e) => {
                        setCredits(Number(e.target.value) || 0);
                        setIsDirty(true);
                      }}
                      className="w-full bg-transparent text-xs font-semibold text-white outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black px-2.5 py-1.5">
                    <span className="text-[11px] text-stone-400">Standing %:</span>
                    <input
                      type="number"
                      min={0}
                      max={110}
                      value={currentGrade}
                      onChange={(e) => {
                        setCurrentGrade(Number(e.target.value) || 0);
                        setIsDirty(true);
                      }}
                      className="w-full bg-transparent text-xs font-semibold text-white outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ===============================================================
              SCROLLABLE CONTENT
             =============================================================== */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
            {/* =============================================================
                2. GRADE DISTRIBUTION & DYNAMIC WEIGHT VALIDATOR
               ============================================================= */}
            <section aria-labelledby="drawer-weights-heading" className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3
                    id="drawer-weights-heading"
                    className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-300"
                  >
                    Grade Distribution &amp; Weighting
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Syllabus categories &amp; drop-lowest policies
                  </p>
                </div>
              </div>

              {/* Visual Weight Summary Card + Dynamic Warning Pill */}
              <div
                className={`rounded-xl border p-4 transition-colors ${
                  isWeightValid
                    ? "border-white/10 bg-white/[0.025]"
                    : "border-amber-400/40 bg-amber-500/[0.06]"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    {isWeightValid ? (
                      <CheckCircle2 className="h-4 w-4 text-[#D6CFC2]" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-300" />
                    )}
                    <span className="text-xs font-medium text-stone-200">
                      Weight Allocation
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isWeightValid && (
                      <button
                        type="button"
                        onClick={handleAutoNormalizeWeights}
                        className="rounded-lg border border-amber-300/35 bg-amber-300/15 px-2.5 py-1 text-[11px] font-semibold text-amber-200 transition-colors hover:bg-amber-300/25"
                      >
                        Auto-normalize weights
                      </button>
                    )}
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${
                        isWeightValid
                          ? "bg-white text-black"
                          : "bg-amber-300 text-black"
                      }`}
                    >
                      {totalWeight}% / 100%
                    </span>
                  </div>
                </div>

                {/* Segmented Bar */}
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10 flex gap-0.5 p-0.5">
                  {categories.map((cat, idx) => {
                    const pct = Math.max(
                      0,
                      Math.min(100, (cat.weight / Math.max(100, totalWeight)) * 100)
                    );
                    if (pct <= 0) return null;
                    return (
                      <div
                        key={cat.id}
                        style={{ width: `${pct}%` }}
                        title={`${cat.name}: ${cat.weight}%`}
                        className={`h-full first:rounded-l-full last:rounded-r-full transition-all duration-300 ${
                          SEGMENT_COLORS[idx % SEGMENT_COLORS.length]
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Required Warning Pill when total !== 100 */}
                {!isWeightValid ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-400/35 bg-amber-500/15 px-3 py-1 text-[11px] font-semibold text-amber-200"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                    <span>
                      Total weights equal {totalWeight}%. Must equal 100%.
                    </span>
                  </div>
                ) : (
                  <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
                    {categories.map((cat, idx) => (
                      <span
                        key={cat.id}
                        className="inline-flex items-center gap-1.5 text-[11px] text-stone-400"
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            SEGMENT_COLORS[idx % SEGMENT_COLORS.length]
                          }`}
                        />
                        <span className="text-stone-300">{cat.name}</span>
                        <span className="tabular-nums text-stone-500">
                          {cat.weight}%
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Interactive Categories Table */}
              <div className="rounded-xl border border-white/10 bg-white/[0.015] overflow-hidden">
                <div className="grid grid-cols-12 gap-2 border-b border-white/10 bg-white/[0.03] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                  <div className="col-span-5">Category Name</div>
                  <div className="col-span-3 text-right">Weight (%)</div>
                  <div className="col-span-3 text-center">Drop Lowest</div>
                  <div className="col-span-1" />
                </div>

                <div className="divide-y divide-white/10">
                  {categories.map((cat, idx) => {
                    const dropCount = cat.dropLowest ?? 0;
                    return (
                      <div
                        key={cat.id}
                        className="grid grid-cols-12 items-center gap-2 px-3.5 py-2.5 transition-colors hover:bg-white/[0.02]"
                      >
                        {/* Category Name */}
                        <div className="col-span-5 flex items-center gap-2">
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${
                              SEGMENT_COLORS[idx % SEGMENT_COLORS.length]
                            }`}
                          />
                          <input
                            type="text"
                            value={cat.name}
                            onChange={(e) =>
                              updateCategory(cat.id, "name", e.target.value)
                            }
                            aria-label="Category name"
                            className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-xs font-medium text-white transition-colors hover:border-white/10 focus:border-white/25 focus:bg-black outline-none"
                          />
                        </div>

                        {/* Weight (%) */}
                        <div className="col-span-3 flex items-center justify-end">
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={cat.weight}
                              onChange={(e) =>
                                updateCategory(
                                  cat.id,
                                  "weight",
                                  Math.max(0, Number(e.target.value) || 0)
                                )
                              }
                              aria-label={`${cat.name} weight percentage`}
                              className="w-16 rounded-lg border border-white/10 bg-black pr-5 pl-2 py-1 text-right text-xs font-semibold tabular-nums text-white outline-none transition-colors focus:border-white/35"
                            />
                            <span className="pointer-events-none absolute right-2 text-[11px] text-stone-500">
                              %
                            </span>
                          </div>
                        </div>

                        {/* Drop Lowest */}
                        <div className="col-span-3 flex items-center justify-center">
                          {dropCount > 0 ? (
                            <div className="inline-flex items-center rounded-lg border border-white/15 bg-white/[0.06] p-0.5">
                              <button
                                type="button"
                                onClick={() =>
                                  updateCategory(
                                    cat.id,
                                    "dropLowest",
                                    Math.max(0, dropCount - 1)
                                  )
                                }
                                aria-label="Decrease drop lowest"
                                className="h-5 w-5 rounded-md text-xs text-stone-300 hover:bg-white/10 hover:text-white"
                              >
                                -
                              </button>
                              <span className="px-1.5 text-[11px] font-semibold tabular-nums text-[#E5DEC9]">
                                {dropCount}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateCategory(
                                    cat.id,
                                    "dropLowest",
                                    Math.min(5, dropCount + 1)
                                  )
                                }
                                aria-label="Increase drop lowest"
                                className="h-5 w-5 rounded-md text-xs text-stone-300 hover:bg-white/10 hover:text-white"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                updateCategory(cat.id, "dropLowest", 1)
                              }
                              className="rounded-lg border border-white/10 bg-transparent px-2.5 py-1 text-[11px] text-stone-500 transition-colors hover:border-white/20 hover:text-stone-300"
                            >
                              None
                            </button>
                          )}
                        </div>

                        {/* Delete Category */}
                        <div className="col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeCategory(cat.id)}
                            aria-label={`Remove ${cat.name}`}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-stone-500 transition-colors hover:bg-white/10 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add Category Button with Dashed Outline */}
              <button
                type="button"
                onClick={addCategory}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.01] py-2.5 text-xs font-medium text-stone-300 transition-all hover:border-white/30 hover:bg-white/[0.04] hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Category
              </button>
            </section>

            <div className="border-t border-white/10" />

            {/* =============================================================
                3. GRADE SCALE ADJUSTER (WITH SORTED VALIDATION & PRESETS)
               ============================================================= */}
            <section aria-labelledby="drawer-scale-heading" className="space-y-3.5">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3
                    id="drawer-scale-heading"
                    className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-300"
                  >
                    Letter Grade Thresholds
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Strictly descending score cutoffs (e.g. A &gt; A- &gt; B+)
                  </p>
                </div>

                {/* Presets: "Standard 10-Point Scale" vs "Custom Course Curve" */}
                <div
                  role="group"
                  aria-label="Grading scale presets"
                  className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1"
                >
                  <button
                    type="button"
                    onClick={() => applyScalePreset("standard")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                      scalePreset === "standard"
                        ? "bg-white text-black font-semibold shadow-xs"
                        : "text-stone-400 hover:text-white"
                    }`}
                  >
                    Standard 10-Point Scale
                  </button>
                  <button
                    type="button"
                    onClick={() => applyScalePreset("curve")}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                      scalePreset === "curve"
                        ? "bg-[#D6CFC2] text-black font-semibold shadow-xs"
                        : "text-stone-400 hover:text-white"
                    }`}
                  >
                    <SlidersHorizontal className="h-3 w-3" />
                    Custom Course Curve
                  </button>
                </div>
              </div>

              {/* Sorted Validation Alert if any adjacent cutoffs violate strict descending order */}
              {!isScaleSorted && scaleConflictIndex >= 0 && (
                <div
                  role="alert"
                  className="flex items-center justify-between gap-2 rounded-xl border border-red-400/40 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-200"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-300 shrink-0" />
                    <span>
                      <strong>{gradeScale[scaleConflictIndex].letter}</strong> (
                      {gradeScale[scaleConflictIndex].minScore}%) must be
                      strictly greater than{" "}
                      <strong>
                        {gradeScale[scaleConflictIndex + 1].letter}
                      </strong>{" "}
                      ({gradeScale[scaleConflictIndex + 1].minScore}%).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={enforceSortedScale}
                    className="shrink-0 rounded-lg border border-red-300/30 bg-red-400/20 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-red-400/30"
                  >
                    Fix Order
                  </button>
                </div>
              )}

              {/* Visual Horizontal Bracket + Inline Cutoff Inputs */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 space-y-3">
                {/* Horizontal Bracket Bar */}
                <div className="relative flex h-6 w-full overflow-hidden rounded-lg border border-white/10 bg-black">
                  {gradeScale.map((t, i) => {
                    const upper = i === 0 ? 100 : gradeScale[i - 1].minScore;
                    const lower = t.minScore;
                    const span = Math.max(2, ((upper - lower) / 45) * 100);
                    const isCurrentBand =
                      currentGrade >= lower && (i === 0 || currentGrade < upper);
                    return (
                      <div
                        key={t.letter}
                        style={{ width: `${span}%` }}
                        className={`flex items-center justify-center border-r border-white/10 text-[10px] font-bold transition-colors last:border-r-0 ${
                          isCurrentBand
                            ? "bg-white text-black"
                            : i % 2 === 0
                            ? "bg-white/[0.06] text-stone-300"
                            : "bg-white/[0.02] text-stone-400"
                        }`}
                        title={`${t.letter}: ≥ ${t.minScore}%`}
                      >
                        {t.letter}
                      </div>
                    );
                  })}
                </div>

                {/* Inline Number Inputs for Each Letter Grade Cutoff */}
                <div className="grid grid-cols-3 gap-2">
                  {gradeScale.map((cutoff, idx) => {
                    const isCurrent = cutoff.letter === currentLetterGrade;
                    const hasConflict =
                      idx === scaleConflictIndex ||
                      idx === scaleConflictIndex + 1;
                    const maxAllowed =
                      idx > 0 ? gradeScale[idx - 1].minScore - 1 : 100;
                    const minAllowed =
                      idx < gradeScale.length - 1
                        ? gradeScale[idx + 1].minScore + 1
                        : 0;

                    return (
                      <div
                        key={cutoff.letter}
                        className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 transition-colors ${
                          hasConflict
                            ? "border-red-400/60 bg-red-500/10"
                            : isCurrent
                            ? "border-white/35 bg-white/[0.08]"
                            : "border-white/10 bg-black/50"
                        }`}
                      >
                        <span
                          className={`text-xs font-bold ${
                            isCurrent ? "text-white" : "text-stone-300"
                          }`}
                        >
                          {cutoff.letter}
                        </span>

                        <div className="flex items-center gap-0.5">
                          <span className="text-[10px] text-stone-500">≥</span>
                          <input
                            type="number"
                            min={minAllowed}
                            max={maxAllowed}
                            value={cutoff.minScore}
                            onChange={(e) =>
                              updateCutoffScore(
                                idx,
                                Number(e.target.value) || 0
                              )
                            }
                            onBlur={() => handleCutoffBlur(idx)}
                            aria-label={`${cutoff.letter} minimum score cutoff`}
                            className="w-11 rounded border border-white/15 bg-black px-1 py-0.5 text-right text-xs font-semibold tabular-nums text-[#E5DEC9] outline-none focus:border-white/40"
                          />
                          <span className="text-[10px] text-stone-500">%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <div className="border-t border-white/10" />

            {/* =============================================================
                4. EXAM SCHEDULE MANAGER ("Add to Study Plan" + Editable Dates/Locations)
               ============================================================= */}
            <section aria-labelledby="drawer-exams-heading" className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3
                    id="drawer-exams-heading"
                    className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-300"
                  >
                    Upcoming Exams &amp; Deliverables
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Editable dates, room locations &amp; study plan integration
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddExam(!showAddExam)}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-stone-200 transition-colors hover:border-white/25 hover:bg-white/10 hover:text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {showAddExam ? "Cancel" : "Add Exam"}
                </button>
              </div>

              {/* Inline Add Exam Milestone Form */}
              {showAddExam && (
                <div className="space-y-2.5 rounded-xl border border-white/15 bg-white/[0.03] p-3.5">
                  <input
                    type="text"
                    placeholder="Exam or Milestone Name (e.g. Midterm II)"
                    value={newExam.name}
                    onChange={(e) =>
                      setNewExam({ ...newExam, name: e.target.value })
                    }
                    className="w-full rounded-lg border border-white/10 bg-black px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/30"
                  />
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-5 flex items-center gap-1.5 rounded-lg border border-white/10 bg-black px-2.5 py-1.5">
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
                      placeholder="Location (e.g. Gates 104)"
                      value={newExam.location}
                      onChange={(e) =>
                        setNewExam({ ...newExam, location: e.target.value })
                      }
                      className="col-span-4 rounded-lg border border-white/10 bg-black px-2.5 py-1.5 text-xs text-stone-200 outline-none focus:border-white/30"
                    />
                    <div className="col-span-3 relative flex items-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="Weight"
                        value={newExam.weightPercent}
                        onChange={(e) =>
                          setNewExam({
                            ...newExam,
                            weightPercent: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-white/10 bg-black pr-5 pl-2 py-1.5 text-right text-xs text-white outline-none focus:border-white/30"
                      />
                      <span className="pointer-events-none absolute right-2 text-[11px] text-stone-500">
                        %
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateExam}
                    className="w-full rounded-lg bg-white py-1.5 text-xs font-semibold text-black transition-colors hover:bg-stone-200"
                  >
                    Add Exam Milestone
                  </button>
                </div>
              )}

              {/* Chronological Exam Items with Editable Date Pickers, Locations & "Add to Study Plan" */}
              <div className="space-y-2.5">
                {sortedExams.length > 0 ? (
                  sortedExams.map((exam) => {
                    const badge = formatDateBadge(exam.date);
                    const isAdded = addedStudyExamId === exam.id;

                    return (
                      <div
                        key={exam.id}
                        className="group rounded-xl border border-white/10 bg-white/[0.02] p-3.5 transition-colors hover:border-white/20 hover:bg-white/[0.035] space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Date Badge */}
                            <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border border-white/10 bg-black text-center">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-[#D6CFC2]">
                                {badge.month}
                              </span>
                              <span className="text-sm font-black leading-tight tabular-nums text-white">
                                {badge.day}
                              </span>
                            </div>

                            {/* Editable Exam Title */}
                            <div className="min-w-0 flex-1">
                              <input
                                type="text"
                                value={exam.name}
                                onChange={(e) =>
                                  updateExam(exam.id, "name", e.target.value)
                                }
                                aria-label="Exam milestone name"
                                className="w-full truncate rounded border border-transparent bg-transparent px-1.5 py-0.5 text-xs font-semibold text-white hover:border-white/10 focus:border-white/25 focus:bg-black outline-none"
                              />
                              <div className="mt-1 flex flex-wrap items-center gap-2 pl-1.5">
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

                          {/* Weight Pill & Delete */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="relative flex items-center">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={exam.weightPercent ?? 0}
                                onChange={(e) =>
                                  updateExam(
                                    exam.id,
                                    "weightPercent",
                                    Math.max(0, Number(e.target.value) || 0)
                                  )
                                }
                                aria-label={`${exam.name} weight percent`}
                                className="w-13 rounded-lg border border-white/10 bg-black pr-4 pl-1.5 py-1 text-right text-xs font-bold tabular-nums text-[#E5DEC9] outline-none focus:border-white/30"
                              />
                              <span className="pointer-events-none absolute right-1.5 text-[10px] text-stone-500">
                                %
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeExam(exam.id)}
                              aria-label={`Remove ${exam.name}`}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-stone-500 hover:bg-white/10 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Action Bar per Exam: "Add to Study Plan" */}
                        <div className="flex items-center justify-between border-t border-white/5 pt-2">
                          <span className="text-[10px] text-stone-500">
                            Milestone ID: {exam.id}
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
                  <div className="rounded-xl border border-dashed border-white/10 py-6 text-center text-xs text-stone-500">
                    No upcoming exams or deliverables scheduled.
                  </div>
                )}
              </div>

              {/* Sync / Re-extract from Syllabus Button */}
              <div className="pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleSyllabusSync(file.name);
                  }}
                />
                <button
                  type="button"
                  disabled={isSyncingPdf}
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-2.5 text-xs font-medium text-stone-300 transition-all hover:border-white/25 hover:bg-white/[0.06] hover:text-white disabled:opacity-60"
                >
                  {isSyncingPdf ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#D6CFC2]" />
                  ) : (
                    <span className="inline-flex items-center rounded border border-white/15 bg-black px-1.5 py-0.5 text-[10px] font-bold text-[#D6CFC2]">
                      <FileText className="mr-1 h-3 w-3" />
                      PDF
                    </span>
                  )}
                  <span>
                    {isSyncingPdf
                      ? "Re-extracting syllabus schema..."
                      : "Sync / Re-extract from Syllabus"}
                  </span>
                  <Sparkles className="h-3.5 w-3.5 text-stone-500 group-hover:text-[#D6CFC2]" />
                </button>
                {pdfSyncMessage && (
                  <p className="mt-1.5 text-center text-[11px] text-[#D6CFC2]">
                    {pdfSyncMessage}
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* ===============================================================
              5. PERSISTENCE FOOTER BAR (Explicit "Save Changes" -> PATCH /api/courses/[id])
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
                    Unsaved changes · Auto-saving enabled
                  </span>
                ) : saveStatus === "saved" ? (
                  <span className="text-[#D6CFC2]">
                    All changes saved to /api/courses/{course.courseId || "101"}
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
                  disabled={saveStatus === "saving" || !isScaleSorted}
                  onClick={() => void persistCourseChanges()}
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

