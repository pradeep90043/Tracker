'use server';

import prisma from '@/lib/prisma';
import type { DailyEntry, FailureLog, WeeklyGoal, WeeklyReview, FocusSession, DailyEntryFormData } from '@/types';
import { revalidatePath } from 'next/cache';
import { createDailyEntry } from '@/lib/scoring';

// --------------- Daily Entries ---------------

export async function getEntries(): Promise<DailyEntry[]> {
  try {
    const entries = await prisma.dailyEntry.findMany({
      orderBy: { date: 'asc' },
    });
    return entries as unknown as DailyEntry[];
  } catch (error) {
    console.error('Failed to fetch entries:', error);
    return [];
  }
}

export async function upsertEntry(formData: DailyEntryFormData) {
  try {
    const entryData = createDailyEntry(formData);
    
    const entry = await prisma.dailyEntry.upsert({
      where: { date: entryData.date },
      update: {
        dsaHours: entryData.dsaHours,
        dsaProblemsSolved: entryData.dsaProblemsSolved,
        dsaTopic: entryData.dsaTopic,
        backendHours: entryData.backendHours,
        backendTopic: entryData.backendTopic,
        aiHours: entryData.aiHours,
        aiTopic: entryData.aiTopic,
        projectWork: entryData.projectWork,
        revision: entryData.revision,
        deepWork: entryData.deepWork,
        totalHours: entryData.totalHours,
        score: entryData.score,
        performanceLevel: entryData.performanceLevel,
        passed: entryData.passed,
      },
      create: {
        date: entryData.date,
        dsaHours: entryData.dsaHours,
        dsaProblemsSolved: entryData.dsaProblemsSolved,
        dsaTopic: entryData.dsaTopic,
        backendHours: entryData.backendHours,
        backendTopic: entryData.backendTopic,
        aiHours: entryData.aiHours,
        aiTopic: entryData.aiTopic,
        projectWork: entryData.projectWork,
        revision: entryData.revision,
        deepWork: entryData.deepWork,
        totalHours: entryData.totalHours,
        score: entryData.score,
        performanceLevel: entryData.performanceLevel,
        passed: entryData.passed,
      },
    });

    revalidatePath('/');
    return { success: true, entry };
  } catch (error) {
    console.error('Failed to upsert entry:', error);
    return { success: false, error: 'Database error' };
  }
}

export async function deleteEntry(id: string) {
  try {
    await prisma.dailyEntry.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete entry:', error);
    return { success: false };
  }
}

// --------------- Failure Logs ---------------

export async function getFailures(): Promise<FailureLog[]> {
  try {
    const failures = await prisma.failureLog.findMany({
      orderBy: { date: 'desc' },
    });
    return failures as unknown as FailureLog[];
  } catch (error) {
    console.error('Failed to fetch failures:', error);
    return [];
  }
}

export async function addFailure(data: Omit<FailureLog, 'id'>) {
  try {
    const failure = await prisma.failureLog.create({
      data: {
        date: data.date,
        missedTask: data.missedTask,
        reason: data.reason,
        rootCause: data.rootCause,
        fixAction: data.fixAction,
        category: data.category,
      },
    });
    revalidatePath('/');
    return { success: true, failure };
  } catch (error) {
    console.error('Failed to add failure:', error);
    return { success: false };
  }
}

export async function deleteFailure(id: string) {
  try {
    await prisma.failureLog.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// --------------- Weekly Goals ---------------

export async function getGoals(): Promise<WeeklyGoal[]> {
  try {
    return await prisma.weeklyGoal.findMany() as unknown as WeeklyGoal[];
  } catch (error) {
    return [];
  }
}

export async function upsertGoal(goal: WeeklyGoal) {
  try {
    const result = await prisma.weeklyGoal.upsert({
      where: { weekStart: goal.weekStart },
      update: {
        dsaTopics: goal.dsaTopics,
        backendTopics: goal.backendTopics,
        aiTopics: goal.aiTopics,
        projectGoal: goal.projectGoal,
        dsaTopicsCompleted: goal.dsaTopicsCompleted,
        backendTopicsCompleted: goal.backendTopicsCompleted,
        aiTopicsCompleted: goal.aiTopicsCompleted,
        projectGoalCompleted: goal.projectGoalCompleted,
      },
      create: {
        weekStart: goal.weekStart,
        weekEnd: goal.weekEnd,
        dsaTopics: goal.dsaTopics,
        backendTopics: goal.backendTopics,
        aiTopics: goal.aiTopics,
        projectGoal: goal.projectGoal,
        dsaTopicsCompleted: goal.dsaTopicsCompleted,
        backendTopicsCompleted: goal.backendTopicsCompleted,
        aiTopicsCompleted: goal.aiTopicsCompleted,
        projectGoalCompleted: goal.projectGoalCompleted,
      },
    });
    revalidatePath('/');
    return { success: true, goal: result };
  } catch (error) {
    return { success: false };
  }
}

// --------------- Weekly Reviews ---------------

export async function getReviews(): Promise<WeeklyReview[]> {
  try {
    return await prisma.weeklyReview.findMany() as unknown as WeeklyReview[];
  } catch (error) {
    return [];
  }
}

export async function addReview(data: Omit<WeeklyReview, 'id' | 'createdAt'>) {
  try {
    const review = await prisma.weeklyReview.upsert({
      where: { weekStart: data.weekStart },
      update: {
        metGoals: data.metGoals,
        whatWentWrong: data.whatWentWrong,
        whatToImprove: data.whatToImprove,
        rating: data.rating,
      },
      create: {
        weekStart: data.weekStart,
        weekEnd: data.weekEnd,
        metGoals: data.metGoals,
        whatWentWrong: data.whatWentWrong,
        whatToImprove: data.whatToImprove,
        rating: data.rating,
      },
    });
    revalidatePath('/');
    return { success: true, review };
  } catch (error) {
    return { success: false };
  }
}

// --------------- Focus Sessions ---------------

export async function getFocusSessions(): Promise<FocusSession[]> {
  try {
    const sessions = await prisma.focusSession.findMany({
      orderBy: { completedAt: 'desc' },
    });
    return sessions as unknown as FocusSession[];
  } catch (error) {
    return [];
  }
}

export async function addFocusSession(data: Omit<FocusSession, 'id'>) {
  try {
    const session = await prisma.focusSession.create({
      data: {
        date: data.date,
        category: data.category,
        durationMinutes: data.durationMinutes,
      },
    });
    revalidatePath('/');
    return { success: true, session };
  } catch (error) {
    return { success: false };
  }
}

// --------------- Mock Data (Server Side) ---------------

export async function seedDatabase(entries: any[], failures: any[], goals: any[]) {
  try {
    // Clear existing
    await prisma.dailyEntry.deleteMany();
    await prisma.failureLog.deleteMany();
    await prisma.weeklyGoal.deleteMany();

    // Seed
    await prisma.dailyEntry.createMany({ data: entries });
    await prisma.failureLog.createMany({ data: failures });
    await prisma.weeklyGoal.createMany({ data: goals });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Seed Error:', error);
    return { success: false };
  }
}

export async function clearDatabase() {
  try {
    await prisma.dailyEntry.deleteMany();
    await prisma.failureLog.deleteMany();
    await prisma.weeklyGoal.deleteMany();
    await prisma.weeklyReview.deleteMany();
    await prisma.focusSession.deleteMany();
    
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
