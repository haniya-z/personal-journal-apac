import { UserProfile, CreatureType } from '../types';
import { calculateLevelData } from './creatureData';

const STORAGE_KEY = 'aetheria_journal_user_profiles_v1';
const ACTIVE_USER_KEY = 'aetheria_active_user_email_v1';

export function getStoredProfiles(): Record<string, UserProfile> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading localStorage profiles', e);
    return {};
  }
}

export function getStoredProfile(email: string): UserProfile | null {
  const profiles = getStoredProfiles();
  return profiles[email.toLowerCase()] || null;
}

export function saveStoredProfile(profile: UserProfile): void {
  try {
    const profiles = getStoredProfiles();
    profiles[profile.email.toLowerCase()] = profile;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    localStorage.setItem(ACTIVE_USER_KEY, profile.email.toLowerCase());
  } catch (e) {
    console.error('Error saving profile to localStorage', e);
  }
}

export function saveProfile(profile: UserProfile): void {
  saveStoredProfile(profile);
}

export function getAllExistingEmails(): string[] {
  const profiles = getStoredProfiles();
  return Object.keys(profiles);
}

export function getActiveEmail(): string | null {
  return getActiveUserEmail();
}

export function getActiveUserEmail(): string | null {
  try {
    return localStorage.getItem(ACTIVE_USER_KEY);
  } catch {
    return null;
  }
}

export function setActiveEmail(email: string): void {
  setActiveUserEmail(email);
}

export function setActiveUserEmail(email: string): void {
  try {
    localStorage.setItem(ACTIVE_USER_KEY, email.toLowerCase());
  } catch {
    // ignore
  }
}

export function clearActiveSession(): void {
  try {
    localStorage.removeItem(ACTIVE_USER_KEY);
  } catch {
    // ignore
  }
}

export function createNewUserProfile(
  email: string,
  goalData: { title: string; description: string; targetDays: number; dailyMinutes: number },
  creatureType: CreatureType,
  creatureName: string,
  roadmapData?: any
): UserProfile {
  const initialXP = 0;
  const levelInfo = calculateLevelData(initialXP);
  const now = new Date().toISOString();

  // Initial starter tasks from roadmap if available
  const initialTasks = (roadmapData?.days?.[0]?.tasks || []).map((t: any, idx: number) => ({
    id: `task_init_${idx}_${Date.now()}`,
    title: t.title,
    estimatedMinutes: t.estimatedMinutes || 25,
    priority: t.priority || 'medium',
    category: t.category || 'Foundational Step',
    completed: false,
    roadmapDayNumber: 1,
    dateAssigned: now.split('T')[0],
    createdAt: now,
  }));

  const profile: UserProfile = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: email.toLowerCase(),
    createdAt: now,
    goal: {
      title: goalData.title,
      description: goalData.description,
      targetDays: goalData.targetDays,
      dailyMinutes: goalData.dailyMinutes,
      category: 'Mastery & Growth',
      createdAt: now,
      targetDate: new Date(Date.now() + goalData.targetDays * 24 * 60 * 60 * 1000).toISOString(),
    },
    creature: {
      id: `crt_${Date.now()}`,
      name: creatureName || 'Astral Companion',
      type: creatureType,
      stage: levelInfo.stage,
      level: levelInfo.level,
      xp: initialXP,
      xpToNextLevel: levelInfo.nextLevelThreshold,
      health: 100,
      energy: 100,
      vitality: 100,
      affinity: 25,
      hatchDate: now,
      totalFed: 0,
      totalPetted: 0,
      unlockedStages: ['egg'],
      dialogueHistory: [`I am awakening to guide you toward "${goalData.title}". Let us begin!`],
      lastInteracted: now,
    },
    roadmap: roadmapData || null,
    currentDayIndex: 1,
    tasks: initialTasks,
    journalEntries: [],
    growthTimeline: [
      {
        id: `growth_init`,
        timestamp: now,
        event: `Chose mystical egg for goal: "${goalData.title}"`,
        level: 1,
        stage: 'egg',
        xp: 0,
      },
    ],
    stardust: 50, // Starter stardust
    streak: {
      current: 1,
      best: 1,
      longest: 1,
      lastActiveDate: now.split('T')[0],
    },
  };

  saveStoredProfile(profile);
  return profile;
}
