"use client";

import React, { useState, useEffect } from "react";
import {
  Trash2,
  Mail,
  User,
  BookOpen,
  SlidersHorizontal,
  Calendar,
  MapPin,
  ArrowUpRight,
} from "lucide-react";
import CourseDetailsDrawer, {
  CourseDetailPayload,
  CourseMetadataExtras,
  ExamMilestone,
  DEFAULT_CATEGORIES,
  DEFAULT_EXAM_MILESTONES,
  STANDARD_10_POINT_SCALE,
} from "./CourseDetailsDrawer";
import CourseMetadata from "./CourseMetadata";

export interface CourseInfoCardProps
  extends Partial<CourseDetailPayload>,
    CourseMetadataExtras {
  id?: number | string;
  courseName?: string;
  courseGrade?: number;
  courseCredits?: number;
  courseProfessor?: string;
  courseProfessorEmail?: string;
  onDeleteCourse?: () => void;
  onUpdateCourse?: (updated: CourseDetailPayload & CourseMetadataExtras) => void;
  onAddToStudyPlan?: (exam: ExamMilestone, course: CourseDetailPayload) => void;
  defaultDrawerOpen?: boolean;
}

export default function CourseInfoCard({
  id,
  courseId,
  title,
  courseName,
  currentGrade,
  courseGrade,
  credits,
  courseCredits,
  professor,
  courseProfessor,
  professorEmail,
  courseProfessorEmail,
  categories,
  gradeScale,
  exams,
  onDeleteCourse,
  onUpdateCourse,
  onAddToStudyPlan,
  defaultDrawerOpen = false,
}: CourseInfoCardProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(defaultDrawerOpen);
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);

  const resolvedCourseId = String(courseId ?? id ?? "course-101");
  const resolvedTitle = title || courseName || "Computer Architecture";
  const resolvedGrade = currentGrade ?? courseGrade ?? 94;
  const resolvedCredits = credits ?? courseCredits ?? 4;
  const resolvedProfessor = professor || courseProfessor || "Dr. Elena Vance";
  const resolvedEmail =
    professorEmail || courseProfessorEmail || "evance@university.edu";

  const [localCourse, setLocalCourse] = useState<
    CourseDetailPayload & CourseMetadataExtras
  >({
    courseId: resolvedCourseId,
    title: resolvedTitle,
    currentGrade: resolvedGrade,
    credits: resolvedCredits,
    professor: resolvedProfessor,
    professorEmail: resolvedEmail,
    categories:
      categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES,
    gradeScale:
      gradeScale && gradeScale.length > 0
        ? gradeScale
        : STANDARD_10_POINT_SCALE,
    exams: exams && exams.length > 0 ? exams : DEFAULT_EXAM_MILESTONES,
  });

  useEffect(() => {
    setLocalCourse((prev) => ({
      ...prev,
      courseId: resolvedCourseId,
      title: title || courseName || prev.title,
      currentGrade: currentGrade ?? courseGrade ?? prev.currentGrade,
      credits: credits ?? courseCredits ?? prev.credits,
      professor: professor || courseProfessor || prev.professor,
      professorEmail:
        professorEmail || courseProfessorEmail || prev.professorEmail,
      categories:
        categories && categories.length > 0 ? categories : prev.categories,
      gradeScale:
        gradeScale && gradeScale.length > 0 ? gradeScale : prev.gradeScale,
      exams: exams && exams.length > 0 ? exams : prev.exams,
    }));
  }, [
    resolvedCourseId,
    title,
    courseName,
    currentGrade,
    courseGrade,
    credits,
    courseCredits,
    professor,
    courseProfessor,
    professorEmail,
    courseProfessorEmail,
    categories,
    gradeScale,
    exams,
  ]);

  const handleSave = (updated: CourseDetailPayload & CourseMetadataExtras) => {
    setLocalCourse(updated);
    onUpdateCourse?.(updated);
  };

  const letterGrade = (() => {
    const sorted = [...localCourse.gradeScale].sort(
      (a, b) => b.minScore - a.minScore
    );
    const standing = localCourse.currentGrade ?? 94;
    for (const cutoff of sorted) {
      if (standing >= cutoff.minScore) return cutoff.letter;
    }
    return "F";
  })();

  const upcomingExams = [...localCourse.exams]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 2);

  return (
    <>
      <div
        onClick={() => setIsDrawerOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsDrawerOpen(true);
          }
        }}
        className="group relative mx-auto mb-5 w-full cursor-pointer rounded-2xl border border-white/10 bg-[#070708] p-6 sm:p-7 text-white shadow-xl transition-all duration-200 hover:border-white/25 hover:shadow-2xl focus-visible:ring-2 focus-visible:ring-white/40 outline-none"
      >
        {/* Top Row: Course Title, Metadata & Standing */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2 pr-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#D6CFC2]">
                {localCourse.credits ?? 4} Credits
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[10px] font-medium text-stone-400">
                ID: {localCourse.courseId}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white group-hover:text-[#F5F2EB] transition-colors flex items-center gap-2">
              {localCourse.title}
              <ArrowUpRight className="h-5 w-5 text-stone-500 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
            </h2>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-400">
              <span className="inline-flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-stone-500" />
                {localCourse.professor || "TBA"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-stone-500" />
                {localCourse.professorEmail || "No email"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-stone-500" />
                {localCourse.categories.length} Weighted Categories
              </span>
            </div>
          </div>

          {/* Right Grade Display & Remove Course Button */}
          <div className="flex items-center justify-between sm:justify-end gap-4">
            <div className="text-left sm:text-right">
              <div className="flex items-baseline gap-2 sm:justify-end">
                <span className="text-4xl font-black tracking-tight tabular-nums text-white">
                  {localCourse.currentGrade ?? 94}%
                </span>
                <span className="rounded-lg border border-white/15 bg-white px-2 py-0.5 text-sm font-bold text-black">
                  {letterGrade}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-stone-400">
                Current Standing
              </p>
            </div>

            {onDeleteCourse && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCourse();
                }}
                aria-label={`Delete ${localCourse.title}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-stone-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all hover:border-red-500/40 hover:bg-red-500/15 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Preview Bar: Upcoming Exam Milestones + Separate Triggers for Metadata vs Drawer */}
        <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {upcomingExams.length > 0 ? (
              upcomingExams.map((exam) => (
                <div
                  key={exam.id}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-stone-300"
                >
                  <Calendar className="h-3 w-3 text-[#D6CFC2]" />
                  <span className="font-medium text-white truncate max-w-[160px]">
                    {exam.name}
                  </span>
                  {exam.location && (
                    <>
                      <span className="text-stone-500">·</span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-stone-400">
                        <MapPin className="h-3 w-3 text-stone-500" />
                        {exam.location}
                      </span>
                    </>
                  )}
                </div>
              ))
            ) : (
              <span className="text-xs text-stone-500">
                No upcoming exams or projects scheduled
              </span>
            )}
          </div>

          {/* Separate Action Buttons: Course Metadata vs Upcoming Exams & Projects Drawer */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMetadataOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-[#E5DEC9] transition-all hover:border-white/30 hover:bg-white/10 hover:text-white"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Metadata &amp; Weights
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsDrawerOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white px-4 py-1.5 text-xs font-bold text-black transition-all hover:bg-[#E5DEC9]"
            >
              <Calendar className="h-3.5 w-3.5" />
              Exams &amp; Projects
            </button>
          </div>
        </div>
      </div>

      {/* Separate CourseMetadata Modal (Grade Distribution, Deliverable Weights, Cutoffs) */}
      <CourseMetadata
        open={isMetadataOpen}
        onOpenChange={setIsMetadataOpen}
        course={localCourse}
        onSave={handleSave}
      />

      {/* Slide-Over CourseDetailsDrawer (Upcoming Exams & Projects Only) */}
      <CourseDetailsDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        course={localCourse}
        onSave={handleSave}
        onAddToStudyPlan={onAddToStudyPlan}
        onOpenMetadata={() => setIsMetadataOpen(true)}
      />
    </>
  );
}