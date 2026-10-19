"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  X,
  Check,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  FileText,
  Sparkles,
  Mail,
  User,
  BookOpen,
  RefreshCw,
  SlidersHorizontal,
  Save,
  Loader2,
} from "lucide-react";
import type {
  GradeCategory,
  GradeScaleCutoff,
  CourseDetailPayload,
  CourseMetadataExtras,
} from "./CourseDetailsDrawer";
import {
  STANDARD_10_POINT_SCALE,
  CUSTOM_COURSE_CURVE_SCALE,
  DEFAULT_CATEGORIES,
} from "./CourseDetailsDrawer";

export interface CourseMetadataProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: "modal" | "inline";
  course: CourseDetailPayload & CourseMetadataExtras;
  onSave?: (updated: CourseDetailPayload & CourseMetadataExtras) => void;
  autoSave?: boolean;
}

const SEGMENT_COLORS = [
  "bg-white",
  "bg-[#D6CFC2]",
  "bg-[#9E9689]",
  "bg-[#6E675F]",
  "bg-amber-200/80",
  "bg-stone-500",
];

export function CourseMetadata({
  open = false,
  onOpenChange,
  mode = "modal",
  course,
  onSave,
  autoSave = true,
}: CourseMetadataProps) {
  // Course Identity & Instructor Metadata
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

  // Grade Distribution & Deliverable Weights
  const [categories, setCategories] = useState<GradeCategory[]>(
    course.categories?.length ? course.categories : DEFAULT_CATEGORIES
  );

  // Letter Grade Scale Cutoffs
  const [gradeScale, setGradeScale] = useState<GradeScaleCutoff[]>(
    course.gradeScale?.length
      ? course.gradeScale
      : STANDARD_10_POINT_SCALE.map((c) => ({ ...c }))
  );
  const [scalePreset, setScalePreset] = useState<"standard" | "curve">(
    "standard"
  );

  // Persistence & Syllabus Sync State
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSyncingPdf, setIsSyncingPdf] = useState(false);
  const [pdfSyncMessage, setPdfSyncMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync local state when course prop changes
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
    setIsDirty(false);
    setSaveStatus("idle");
    setSaveError(null);
  }, [
    course.courseId,
    course.title,
    course.professor,
    course.professorEmail,
    course.credits,
    course.currentGrade,
    course.categories,
    course.gradeScale,
  ]);

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
  // 2. Grade Scale Adjuster & Sorted Validation
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
  // 3. Category Helpers
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

  // ==========================================================================
  // 4. Persistence (PATCH /api/courses/[id])
  // ==========================================================================
  const buildPayload = useCallback((): CourseDetailPayload &
    CourseMetadataExtras => {
    return {
      courseId: String(course.courseId || "course-101"),
      title,
      categories,
      gradeScale,
      exams: course.exams || [],
      professor,
      professorEmail,
      credits,
      currentGrade,
    };
  }, [
    course.courseId,
    course.exams,
    title,
    categories,
    gradeScale,
    professor,
    professorEmail,
    credits,
    currentGrade,
  ]);

  const persistMetadataChanges = useCallback(
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

  useEffect(() => {
    if (!autoSave || !isDirty || !isScaleSorted) return;
    const timer = setTimeout(() => {
      void persistMetadataChanges();
    }, 850);
    return () => clearTimeout(timer);
  }, [
    autoSave,
    isDirty,
    isScaleSorted,
    title,
    categories,
    gradeScale,
    professor,
    professorEmail,
    credits,
    currentGrade,
    persistMetadataChanges,
  ]);

  const handleSyllabusSync = async (file: File) => {
    setIsSyncingPdf(true);
    setPdfSyncMessage("Extracting syllabus with Gemini AI...");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/syllabus/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to extract syllabus.");
      }

      if (data.course) {
        if (data.course.name) setTitle(data.course.name);
        if (data.course.instructor) setProfessor(data.course.instructor);
        if (data.course.instructorEmail) setProfessorEmail(data.course.instructorEmail);
        if (Array.isArray(data.course.gradeCategories) && data.course.gradeCategories.length > 0) {
          setCategories(
            data.course.gradeCategories.map((c: any) => ({
              id: c.id,
              name: c.name,
              weight: c.weight,
              dropLowest: c.dropLowest ?? 0,
            }))
          );
        }
        if (Array.isArray(data.letterGradeScale) && data.letterGradeScale.length > 0) {
          setGradeScale(data.letterGradeScale);
        }
      }

      setPdfSyncMessage(`Successfully extracted weights & grading policy from ${file.name}`);
      setIsDirty(true);
    } catch (err) {
      setPdfSyncMessage(
        err instanceof Error ? err.message : "Failed to extract syllabus."
      );
    } finally {
      setIsSyncingPdf(false);
    }
  };

  const metadataBody = (
    <div className="flex flex-col bg-[#070708] text-white font-sans">
      {/* Header */}
      <div className="relative border-b border-white/10 px-6 pt-5 pb-5 bg-gradient-to-b from-white/[0.03] to-transparent">
        {mode === "modal" && (
          <DialogPrimitive.Close
            aria-label="Close metadata settings"
            className="absolute top-5 right-5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-stone-400 transition-colors hover:border-white/25 hover:bg-white/10 hover:text-white outline-none"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        )}

        <div className="mb-2 flex flex-wrap items-center gap-2 pr-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#D6CFC2]">
            <SlidersHorizontal className="h-3 w-3 text-[#D6CFC2]" />
            COURSE METADATA &amp; GRADING POLICY
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
              Saved
            </span>
          )}
        </div>

        {/* Editable Course Identity Fields */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-6">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-1">
              Course Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setIsDirty(true);
              }}
              className="w-full rounded-lg border border-white/10 bg-black px-3 py-1.5 text-sm font-bold text-white outline-none focus:border-white/35"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-1">
              Credits
            </label>
            <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black px-3 py-1.5">
              <BookOpen className="h-3.5 w-3.5 text-stone-500 shrink-0" />
              <input
                type="number"
                min={0}
                max={12}
                value={credits}
                onChange={(e) => {
                  setCredits(Number(e.target.value) || 0);
                  setIsDirty(true);
                }}
                className="w-full bg-transparent text-sm font-semibold text-white outline-none"
              />
            </div>
          </div>
          <div className="sm:col-span-3">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-1">
              Current Standing (%)
            </label>
            <input
              type="number"
              min={0}
              max={110}
              value={currentGrade}
              onChange={(e) => {
                setCurrentGrade(Number(e.target.value) || 0);
                setIsDirty(true);
              }}
              className="w-full rounded-lg border border-white/10 bg-black px-3 py-1.5 text-sm font-semibold text-white outline-none focus:border-white/35"
            />
          </div>

          <div className="sm:col-span-6">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-1">
              Instructor Name
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black px-3 py-1.5">
              <User className="h-3.5 w-3.5 text-stone-500 shrink-0" />
              <input
                type="text"
                value={professor}
                onChange={(e) => {
                  setProfessor(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Professor Name"
                className="w-full bg-transparent text-xs text-stone-200 outline-none"
              />
            </div>
          </div>
          <div className="sm:col-span-6">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-1">
              Instructor Email
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black px-3 py-1.5">
              <Mail className="h-3.5 w-3.5 text-stone-500 shrink-0" />
              <input
                type="email"
                value={professorEmail}
                onChange={(e) => {
                  setProfessorEmail(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Professor Email"
                className="w-full bg-transparent text-xs text-stone-200 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Body: Grade Distributions & Deliverable Weights + Letter Grade Scale */}
      <div className="max-h-[68vh] overflow-y-auto px-6 py-5 space-y-7">
        {/* 1. Grade Distribution & Weighting */}
        <section aria-labelledby="meta-weights-heading" className="space-y-3.5">
          <div>
            <h3
              id="meta-weights-heading"
              className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-300"
            >
              Grade Distribution &amp; Deliverable Weights
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Configure syllabus category weights and drop-lowest rules
            </p>
          </div>

          {/* Visual Summary Card */}
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
                  Total Weight Balance
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

          {/* Categories Table */}
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

        {/* 2. Letter Grade Thresholds / Score Ranges */}
        <section aria-labelledby="meta-scale-heading" className="space-y-3.5">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3
                id="meta-scale-heading"
                className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-300"
              >
                Letter Grade Thresholds &amp; Cutoffs
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Strictly descending score cutoffs (A &gt; A- &gt; B+)
              </p>
            </div>

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

          {!isScaleSorted && scaleConflictIndex >= 0 && (
            <div
              role="alert"
              className="flex items-center justify-between gap-2 rounded-xl border border-red-400/40 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-200"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-300 shrink-0" />
                <span>
                  <strong>{gradeScale[scaleConflictIndex].letter}</strong> (
                  {gradeScale[scaleConflictIndex].minScore}%) must be strictly
                  greater than{" "}
                  <strong>{gradeScale[scaleConflictIndex + 1].letter}</strong> (
                  {gradeScale[scaleConflictIndex + 1].minScore}%).
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

            <div className="grid grid-cols-3 gap-2">
              {gradeScale.map((cutoff, idx) => {
                const isCurrent = cutoff.letter === currentLetterGrade;
                const hasConflict =
                  idx === scaleConflictIndex || idx === scaleConflictIndex + 1;
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
                          updateCutoffScore(idx, Number(e.target.value) || 0)
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

        {/* Syllabus Re-extract */}
        <div className="pt-1">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleSyllabusSync(file);
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
                ? "Re-extracting syllabus weights & cutoffs..."
                : "Sync / Re-extract Weights from Syllabus"}
            </span>
            <Sparkles className="h-3.5 w-3.5 text-stone-500 group-hover:text-[#D6CFC2]" />
          </button>
          {pdfSyncMessage && (
            <p className="mt-1.5 text-center text-[11px] text-[#D6CFC2]">
              {pdfSyncMessage}
            </p>
          )}
        </div>
      </div>

      {/* Footer Persistence Bar */}
      <div className="border-t border-white/10 bg-[#050506] px-6 py-4">
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
                Saving metadata...
              </span>
            ) : isDirty ? (
              <span className="text-amber-200/90">
                Unsaved metadata changes
              </span>
            ) : saveStatus === "saved" ? (
              <span className="text-[#D6CFC2]">
                Metadata synced to /api/courses/{course.courseId || "101"}
              </span>
            ) : (
              <span>Course grading weights &amp; scale configuration</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {mode === "modal" && (
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-stone-300 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
                >
                  Done
                </button>
              </DialogPrimitive.Close>
            )}

            <button
              type="button"
              disabled={saveStatus === "saving" || !isScaleSorted}
              onClick={() => void persistMetadataChanges()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-black transition-all hover:bg-[#E5DEC9] active:scale-[0.99] disabled:opacity-50"
            >
              {saveStatus === "saving" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save Metadata
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (mode === "inline") {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
        {metadataBody}
      </div>
    );
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          aria-label={`${title} Course Metadata and Grading Settings`}
          className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/15 bg-[#070708] shadow-[0_0_60px_rgba(0,0,0,0.9)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          <DialogPrimitive.Title className="sr-only">
            {title} Metadata &amp; Grading Policy
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Configure course instructor details, syllabus grade distributions, and letter grade cutoffs.
          </DialogPrimitive.Description>
          {metadataBody}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default CourseMetadata;

