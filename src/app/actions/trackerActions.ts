'use server';

console.log('🔥 trackerActions.ts loaded');

import prisma from '@/lib/prisma';
import type { DailyEntry, FailureLog, WeeklyGoal, WeeklyReview, FocusSession, DailyEntryFormData } from '@/types';
import { revalidatePath } from 'next/cache';
import { createDailyEntry } from '@/lib/scoring';
import { auth } from '@clerk/nextjs/server';

// --------------- Daily Entries ---------------

export async function getEntries(): Promise<DailyEntry[]> {
  console.log('🔍 getEntries called');
  try {
    const { userId } = await auth();
    if (!userId) {
      console.log('🚫 No userId found in getEntries');
      return [];
    }

    const entries = await prisma.dailyEntry.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });
    console.log(`📊 Found ${entries.length} entries for user ${userId}`);
    return entries as unknown as DailyEntry[];
  } catch (error) {
    console.error('❌ Failed to fetch entries:', error);
    return [];
  }
}

export async function upsertEntry(formData: DailyEntryFormData) {
  console.log('🚀 upsertEntry called');
  try {
    const { userId } = await auth();
    console.log('👤 userId:', userId);
    if (!userId) return { success: false, error: 'Unauthorized' };

    const entryData = createDailyEntry(formData);
    console.log('📦 Entry data:', entryData.date);
    
    const entry = await prisma.dailyEntry.upsert({
      where: { 
        userId_date: {
          userId,
          date: entryData.date
        }
      },
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
        userId,
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

    console.log('✅ Upsert successful');
    revalidatePath('/');
    return { success: true, entry };
  } catch (error) {
    console.error('❌ Upsert error:', error);
    return { success: false, error: String(error) };
  }
}

export async function deleteEntry(id: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false };

    await prisma.dailyEntry.deleteMany({ 
      where: { id, userId } 
    });
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
    const { userId } = await auth();
    if (!userId) return [];

    const failures = await prisma.failureLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
    return failures as unknown as FailureLog[];
  } catch (error) {
    console.error('Failed to fetch failures:', error);
    return [];
  }
}

export async function addFailure(data: Omit<FailureLog, 'id' | 'userId'>) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false };

    const failure = await prisma.failureLog.create({
      data: {
        userId,
        date: data.date,
        missedTask: data.missedTask,
        reason: data.reason,
        rootCause: data.rootCause,
        fixAction: data.fixAction,
        category: data.category,
      },
    });
    revalidatePath('/');
    return { success: true, failure: failure as unknown as FailureLog };
  } catch (error) {
    console.error('Failed to add failure:', error);
    return { success: false };
  }
}

export async function deleteFailure(id: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false };

    await prisma.failureLog.deleteMany({ 
      where: { id, userId } 
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// --------------- Weekly Goals ---------------

export async function getGoals(): Promise<WeeklyGoal[]> {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    return await prisma.weeklyGoal.findMany({
      where: { userId }
    }) as unknown as WeeklyGoal[];
  } catch (error) {
    return [];
  }
}

export async function upsertGoal(goal: Omit<WeeklyGoal, 'userId'>) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false };

    const result = await prisma.weeklyGoal.upsert({
      where: { 
        userId_weekStart: {
          userId,
          weekStart: goal.weekStart
        }
      },
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
        userId,
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
    const { userId } = await auth();
    if (!userId) return [];

    return await prisma.weeklyReview.findMany({
      where: { userId }
    }) as unknown as WeeklyReview[];
  } catch (error) {
    return [];
  }
}

export async function addReview(data: Omit<WeeklyReview, 'id' | 'createdAt' | 'userId'>) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false };

    const review = await prisma.weeklyReview.upsert({
      where: { 
        userId_weekStart: {
          userId,
          weekStart: data.weekStart
        }
      },
      update: {
        metGoals: data.metGoals,
        whatWentWrong: data.whatWentWrong,
        whatToImprove: data.whatToImprove,
        rating: data.rating,
      },
      create: {
        userId,
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
    const { userId } = await auth();
    if (!userId) return [];

    const sessions = await prisma.focusSession.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
    });
    return sessions as unknown as FocusSession[];
  } catch (error) {
    return [];
  }
}

export async function addFocusSession(data: Omit<FocusSession, 'id' | 'userId'>) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false };

    const session = await prisma.focusSession.create({
      data: {
        userId,
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
    const { userId } = await auth();
    if (!userId) return { success: false };

    // Clear existing for this user
    await prisma.dailyEntry.deleteMany({ where: { userId } });
    await prisma.failureLog.deleteMany({ where: { userId } });
    await prisma.weeklyGoal.deleteMany({ where: { userId } });

    // Seed
    const entriesWithAuth = entries.map(e => ({ ...e, userId }));
    const failuresWithAuth = failures.map(f => ({ ...f, userId }));
    const goalsWithAuth = goals.map(g => ({ ...g, userId }));

    await prisma.dailyEntry.createMany({ data: entriesWithAuth });
    await prisma.failureLog.createMany({ data: failuresWithAuth });
    await prisma.weeklyGoal.createMany({ data: goalsWithAuth });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Seed Error:', error);
    return { success: false };
  }
}

export async function clearDatabase() {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false };

    await prisma.dailyEntry.deleteMany({ where: { userId } });
    await prisma.failureLog.deleteMany({ where: { userId } });
    await prisma.weeklyGoal.deleteMany({ where: { userId } });
    await prisma.weeklyReview.deleteMany({ where: { userId } });
    await prisma.focusSession.deleteMany({ where: { userId } });
    
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
