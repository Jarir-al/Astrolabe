import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface IngestDeliverablePayload {
  title: string;
  description?: string;
  dueDate?: string; // ISO date string
  pointsPossible?: number;
  categoryName?: string;
}

interface IngestCategoryPayload {
  name: string;
  weight: number;
  dropLowest?: number;
}

interface IngestSyllabusPayload {
  userId: string;
  name: string;
  code: string;
  term?: string;
  instructor?: string;
  instructorEmail?: string;
  officeHours?: string;
  rawJson?: Record<string, unknown>;
  categories?: IngestCategoryPayload[];
  deliverables?: IngestDeliverablePayload[];
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as IngestSyllabusPayload;
    const {
      userId,
      name,
      code,
      term,
      instructor,
      instructorEmail,
      officeHours,
      rawJson,
      categories = [],
      deliverables = [],
    } = body;

    if (!userId || !name || !code) {
      return NextResponse.json(
        { error: 'userId, course name, and course code are required.' },
        { status: 400 }
      );
    }

    // Persist everything atomically
    const newCourse = await prisma.$transaction(async (tx) => {
      // 1. Create Course
      const course = await tx.course.create({
        data: {
          userId,
          name,
          code,
          term,
          instructor,
          instructorEmail,
          officeHours,
          rawExtractedJson: (rawJson as Prisma.InputJsonValue) ?? undefined,
        },
      });

      // 2. Create Grade Categories & map names to generated IDs
      const categoryMap = new Map<string, string>();
      for (const cat of categories) {
        const createdCat = await tx.gradeCategory.create({
          data: {
            courseId: course.id,
            name: cat.name,
            weight: cat.weight,
            dropLowest: cat.dropLowest ?? 0,
          },
        });
        categoryMap.set(cat.name.trim().toLowerCase(), createdCat.id);
      }

      // 3. Create Deliverables linked to their respective categories
      if (deliverables.length > 0) {
        await tx.deliverable.createMany({
          data: deliverables.map((del) => {
            const matchedCategoryId = del.categoryName
              ? categoryMap.get(del.categoryName.trim().toLowerCase())
              : undefined;

            return {
              courseId: course.id,
              title: del.title,
              description: del.description ?? null,
              dueDate: del.dueDate ? new Date(del.dueDate) : null,
              pointsPossible: del.pointsPossible ?? null,
              categoryId: matchedCategoryId ?? null,
            };
          }),
        });
      }

      return course;
    });

    return NextResponse.json({ success: true, courseId: newCourse.id });
  } catch (error) {
    console.error('Failed to ingest syllabus data:', error);
    return NextResponse.json(
      { error: 'Internal server error while saving parsed syllabus.' },
      { status: 500 }
    );
  }
}