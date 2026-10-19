import type { CourseWithDetails } from '@/actions/courses';
import {
  CourseDetailPayload,
  CourseMetadataExtras,
  GradeCategory,
  ExamMilestone,
  STANDARD_10_POINT_SCALE,
} from '@/components/CourseDetailsDrawer';

function formatDueDate(dueDate: Date | string | null | undefined): string {
  if (!dueDate) {
    return new Date().toISOString().split('T')[0];
  }
  const d = dueDate instanceof Date ? dueDate : new Date(dueDate);
  return Number.isNaN(d.getTime())
    ? new Date().toISOString().split('T')[0]
    : d.toISOString().split('T')[0];
}

export function mapPrismaCourseToDrawer(
  course: CourseWithDetails
): CourseDetailPayload & CourseMetadataExtras;
export function mapPrismaCourseToDrawer(
  course?: CourseWithDetails | null
): CourseDetailPayload & CourseMetadataExtras;
export function mapPrismaCourseToDrawer(
  course?: CourseWithDetails | null
): CourseDetailPayload & CourseMetadataExtras {
  if (!course) {
    return {
      courseId: '',
      title: 'Untitled Course',
      categories: [],
      gradeScale: STANDARD_10_POINT_SCALE,
      exams: [],
      professor: undefined,
      professorEmail: undefined,
      credits: undefined,
      currentGrade: undefined,
    };
  }

  // Filter deliverables with "exam", "midterm", or "final" in the title into ExamMilestone[]
  const examDeliverables = (course.deliverables ?? []).filter((d) => {
    const titleLower = d.title.toLowerCase();
    return (
      titleLower.includes('exam') ||
      titleLower.includes('midterm') ||
      titleLower.includes('final')
    );
  });

  const exams: ExamMilestone[] = examDeliverables.map((del) => ({
    id: del.id,
    name: del.title, // <-- uses 'name', not 'title'
    date: formatDueDate(del.dueDate), // matching expected date format (YYYY-MM-DD)
    weightPercent: del.pointsPossible ?? undefined,
    kind: 'Exam',
  }));

  // Map database GradeCategories to Drawer GradeCategories
  const categories: GradeCategory[] = (course.gradeCategories ?? []).map(
    (cat) => ({
      id: cat.id,
      name: cat.name,
      weight: cat.weight,
      dropLowest: cat.dropLowest ?? 0,
    })
  );

  // Map course.code + course.name -> title
  const title = course.code ? `${course.code}: ${course.name}` : course.name;

  return {
    courseId: course.id,
    title,
    categories,
    gradeScale: STANDARD_10_POINT_SCALE,
    exams,
    professor: course.instructor ?? undefined,
    professorEmail: course.instructorEmail ?? undefined,
    credits: 3,
    currentGrade: undefined,
  };
}