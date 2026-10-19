'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

export async function getCourses(userId: string) {
  try {
    return await prisma.course.findMany({
      where: { userId },
      include: {
        gradeCategories: true,
        deliverables: {
          orderBy: { dueDate: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    throw new Error('Could not retrieve courses.');
  }
}

export async function createCourse(data: {
  userId: string;
  name: string;
  code: string;
  term?: string;
  instructor?: string;
  rawExtractedJson?: Prisma.InputJsonValue;
}) {
  try {
    const course = await prisma.course.create({
      data: {
        userId: data.userId,
        name: data.name,
        code: data.code,
        term: data.term,
        instructor: data.instructor,
        rawExtractedJson: data.rawExtractedJson ?? Prisma.JsonNull,
      },
    });

    revalidatePath('/courses');
    return { success: true, course };
  } catch (error) {
    console.error('Failed to create course:', error);
    return { success: false, error: 'Database creation failed.' };
  }
}


export async function getCourseDetails(courseId: string) {
  return await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      gradeCategories: true,
      deliverables: {
        orderBy: { dueDate: 'asc' },
        include: {
          category: true,
        },
      },
    },
  });
}

export type CourseWithDetails = NonNullable<
  Awaited<ReturnType<typeof getCourseDetails>>
>;