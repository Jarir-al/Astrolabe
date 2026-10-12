import { NextRequest, NextResponse } from "next/server";
import type { CourseDetailPayload } from "@/components/CourseDetailsDrawer";

// In-memory store for dev/runtime persistence across requests
const courseStore = new Map<string, CourseDetailPayload>();

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const existing = courseStore.get(id);

  if (!existing) {
    return NextResponse.json(
      { error: `Course ${id} not found` },
      { status: 404 }
    );
  }

  return NextResponse.json(existing, { status: 200 });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await req.json()) as Partial<CourseDetailPayload>;

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 }
      );
    }

    // Validate GradeScaleCutoff strict descending order if provided
    if (Array.isArray(body.gradeScale)) {
      for (let i = 0; i < body.gradeScale.length - 1; i++) {
        if (body.gradeScale[i].minScore <= body.gradeScale[i + 1].minScore) {
          return NextResponse.json(
            {
              error: `Invalid grade scale: ${body.gradeScale[i].letter} (${body.gradeScale[i].minScore}%) must be strictly greater than ${body.gradeScale[i + 1].letter} (${body.gradeScale[i + 1].minScore}%).`,
            },
            { status: 422 }
          );
        }
      }
    }

    const updated: CourseDetailPayload = {
      courseId: id,
      title: body.title ?? "Untitled Course",
      categories: Array.isArray(body.categories) ? body.categories : [],
      gradeScale: Array.isArray(body.gradeScale) ? body.gradeScale : [],
      exams: Array.isArray(body.exams) ? body.exams : [],
    };

    courseStore.set(id, updated);

    return NextResponse.json(
      {
        ok: true,
        updatedAt: new Date().toISOString(),
        data: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update course",
      },
      { status: 500 }
    );
  }
}

