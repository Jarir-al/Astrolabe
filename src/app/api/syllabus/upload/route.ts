import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { CourseWithDetails } from '@/actions/courses';

interface FastApiGradeCategory {
  category_name: string;
  raw_weight_or_points?: string;
  normalized_percentage: number;
}

interface FastApiGradeCutoff {
  letter: string;
  min_score: number;
  max_score?: number | null;
  raw_range?: string | null;
}

interface FastApiDeliverable {
  title: string;
  type: string;
  due_date?: string | null;
  date_notes?: string | null;
  raw_points?: string | null;
  weight_percentage?: number | null;
}

interface FastApiCourseSyllabus {
  course_code: string;
  course_title: string;
  instructor?: string | null;
  office_hours?: string | null;
  location?: string | null;
  total_course_points?: string | null;
  grade_distribution?: FastApiGradeCategory[];
  letter_grade_scale?: FastApiGradeCutoff[];
  deliverables?: FastApiDeliverable[];
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No syllabus PDF file provided.' }, { status: 400 });
    }

    let parsedData: FastApiCourseSyllabus | null = null;

    // 1. Forward the file to the local FastAPI microservice
    try {
      const fastApiFormData = new FormData();
      fastApiFormData.append('file', file);

      const fastApiResponse = await fetch('http://127.0.0.1:8000/api/parse-syllabus', {
        method: 'POST',
        body: fastApiFormData,
      });

      if (fastApiResponse.ok) {
        parsedData = (await fastApiResponse.json()) as FastApiCourseSyllabus;
      } else {
        console.warn(`FastAPI returned status ${fastApiResponse.status}`);
      }
    } catch (fastApiErr) {
      console.warn('FastAPI connection failed:', fastApiErr);
    }

    // Fallback: If FastAPI is unreachable or didn't return data, provide intelligent fallback
    if (!parsedData) {
      return NextResponse.json(
        {
          error:
            'Could not extract syllabus via microservice. Please ensure the Python syllabus parser is running at http://127.0.0.1:8000 (uvicorn main:app --port 8000).',
        },
        { status: 502 }
      );
    }

    // 2. Transform the extracted syllabus into our unified CourseWithDetails format
    const courseId = `course-${Date.now()}`;
    const code = parsedData.course_code || 'COURSE 101';
    const name = parsedData.course_title || file.name.replace(/\.[^/.]+$/, '');
    const instructor = parsedData.instructor || null;
    const officeHours = parsedData.office_hours || null;

    // Map Grade Distribution & Weights
    const gradeCategories = (parsedData.grade_distribution || []).map((cat, idx) => {
      let weightVal = 0;
      if (typeof cat.normalized_percentage === 'number') {
        weightVal =
          cat.normalized_percentage <= 1.0
            ? Math.round(cat.normalized_percentage * 100)
            : Math.round(cat.normalized_percentage);
      } else if (cat.raw_weight_or_points) {
        const match = cat.raw_weight_or_points.match(/(\d+(?:\.\d+)?)/);
        if (match) weightVal = Math.round(parseFloat(match[1]));
      }

      return {
        id: `cat-${courseId}-${idx}`,
        courseId,
        name: cat.category_name,
        weight: weightVal,
        dropLowest: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    // Map Deliverables, Due Dates & Exams
    const deliverables = (parsedData.deliverables || []).map((del, idx) => {
      let parsedDate: Date | null = null;
      if (del.due_date) {
        const d = new Date(del.due_date);
        if (!Number.isNaN(d.getTime())) {
          parsedDate = d;
        }
      }

      let points: number | null = null;
      if (typeof del.weight_percentage === 'number') {
        points =
          del.weight_percentage <= 1.0
            ? Math.round(del.weight_percentage * 100)
            : Math.round(del.weight_percentage);
      } else if (del.raw_points) {
        const num = parseFloat(del.raw_points);
        if (!Number.isNaN(num)) points = num;
      }

      // Match category
      const matchedCategory = gradeCategories.find(
        (cat) =>
          cat.name.toLowerCase().includes((del.type || '').toLowerCase()) ||
          del.title.toLowerCase().includes(cat.name.toLowerCase())
      );

      return {
        id: `del-${courseId}-${idx}`,
        courseId,
        categoryId: matchedCategory?.id ?? null,
        title: del.title,
        description: del.date_notes ?? null,
        dueDate: parsedDate,
        pointsPossible: points,
        pointsEarned: null,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: matchedCategory ? { ...matchedCategory } : null,
      };
    });

    // Map Letter Grade Cutoffs
    const letterGradeScale = (parsedData.letter_grade_scale || []).map((cutoff) => {
      const minScore =
        cutoff.min_score <= 1.0
          ? Math.round(cutoff.min_score * 100)
          : Math.round(cutoff.min_score);
      return {
        letter: cutoff.letter,
        minScore,
      };
    });

    const constructedCourse: CourseWithDetails = {
      id: courseId,
      name,
      code,
      term: 'Fall 2026',
      instructor,
      instructorEmail: null,
      officeHours,
      syllabusUrl: file.name,
      rawExtractedJson: parsedData as any,
      userId: 'user-default',
      createdAt: new Date(),
      updatedAt: new Date(),
      gradeCategories,
      deliverables,
    };

    // 3. Atomically persist to Neon PostgreSQL via Prisma if connected
    try {
      const user = await prisma.user.upsert({
        where: { email: 'student@astrolabe.edu' },
        update: {},
        create: {
          id: 'user-default',
          email: 'student@astrolabe.edu',
          name: 'Student',
        },
      });

      const dbCourse = await prisma.$transaction(async (tx) => {
        const created = await tx.course.create({
          data: {
            userId: user.id,
            name,
            code,
            term: 'Fall 2026',
            instructor,
            officeHours,
            syllabusUrl: file.name,
            rawExtractedJson: parsedData as any,
          },
        });

        const categoryMap = new Map<string, string>();
        for (const cat of gradeCategories) {
          const createdCat = await tx.gradeCategory.create({
            data: {
              courseId: created.id,
              name: cat.name,
              weight: cat.weight,
              dropLowest: cat.dropLowest,
            },
          });
          categoryMap.set(cat.name.trim().toLowerCase(), createdCat.id);
        }

        if (deliverables.length > 0) {
          await tx.deliverable.createMany({
            data: deliverables.map((del) => {
              const catId = del.category?.name
                ? categoryMap.get(del.category.name.trim().toLowerCase())
                : undefined;
              return {
                courseId: created.id,
                title: del.title,
                description: del.description,
                dueDate: del.dueDate,
                pointsPossible: del.pointsPossible,
                categoryId: catId ?? null,
              };
            }),
          });
        }

        return created;
      });

      constructedCourse.id = dbCourse.id;
    } catch (dbError) {
      console.warn('Prisma database persistence skipped (offline or not configured):', dbError);
    }

    return NextResponse.json({
      success: true,
      course: constructedCourse,
      letterGradeScale: letterGradeScale.length > 0 ? letterGradeScale : undefined,
      rawExtracted: parsedData,
    });
  } catch (error) {
    console.error('Failed to process syllabus upload:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to parse and extract syllabus.',
      },
      { status: 500 }
    );
  }
}