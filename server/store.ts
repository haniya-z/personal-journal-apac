import fs from 'fs';
import path from 'path';
import { adminDb } from './firebaseAdmin';
import { PetDoc, StatsDoc, calculateLevelFromXp } from './progression';

export interface UserStoreRecord {
  uid: string;
  email?: string;
  initialized: boolean;
  userData: any;
  pet: PetDoc;
  stats: StatsDoc;
  activeQuest: any;
  tasks: any[];
  journalEntries: any[];
  conversations: Record<string, any[]>;
  calendarAccessToken?: string;
  calendarConnectedAt?: string;
  updatedAt: string;
}

// In-memory cache for low latency
const memoryCache = new Map<string, UserStoreRecord>();

// Base directory for durable file-backed persistence in container workspace
const DATA_DIR = path.resolve(process.cwd(), '.data', 'users');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    console.warn('[Storage] Notice creating storage directory:', e);
  }
}

function getUserFilePath(uid: string): string {
  // Sanitize UID to prevent directory traversal
  const safeUid = uid.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(DATA_DIR, `${safeUid}.json`);
}

// Write serialization queue per user to prevent race conditions & concurrent file corruption
const writeQueues = new Map<string, Promise<void>>();

function queueFileWrite(uid: string, writeFn: () => void): Promise<void> {
  const currentPromise = writeQueues.get(uid) || Promise.resolve();
  const nextPromise = currentPromise
    .then(() => {
      writeFn();
    })
    .catch((err) => {
      console.warn(`[Storage] Write error for ${uid}:`, err);
    });
  writeQueues.set(uid, nextPromise);
  return nextPromise;
}

function loadUserFromFile(uid: string): UserStoreRecord | null {
  try {
    ensureDataDir();
    const filePath = getUserFilePath(uid);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      if (!raw || raw.trim().length === 0) return null;
      try {
        return JSON.parse(raw) as UserStoreRecord;
      } catch (parseErr: any) {
        // Self-healing: repair unescaped control characters in string literals
        let sanitized = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        try {
          return JSON.parse(sanitized) as UserStoreRecord;
        } catch {
          sanitized = sanitized.replace(/(["'])(?:(?=(\\?))\2[\s\S])*?\1/g, (match) => {
            return match
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t');
          });
          return JSON.parse(sanitized) as UserStoreRecord;
        }
      }
    }
  } catch (e) {
    console.warn(`[Storage] Could not read cache file for ${uid}:`, e);
  }
  if (memoryCache.has(uid)) {
    return memoryCache.get(uid)!;
  }
  return null;
}

function saveUserToFile(uid: string, record: UserStoreRecord): void {
  try {
    ensureDataDir();
    const filePath = getUserFilePath(uid);
    // Atomic write via temp file + rename to prevent partial/corrupted reads
    const tempPath = `${filePath}.${Date.now()}.${Math.random().toString(36).substring(2, 8)}.tmp`;
    const serialized = JSON.stringify(record, null, 2);
    fs.writeFileSync(tempPath, serialized, 'utf8');
    fs.renameSync(tempPath, filePath);
  } catch (e) {
    console.warn(`[Storage] Could not write cache file for ${uid}:`, e);
  }
}

let hasWarnedAdminDb = false;

/**
 * Creates default pet document
 */
export function createDefaultPet(name = 'Astral Companion', type = 'golden_celestial_wolf'): PetDoc {
  const now = new Date().toISOString();
  return {
    name,
    type,
    stage: 'EGG',
    xp: 0,
    level: 1,
    evolutionPath: null,
    pendingEvolutionChoice: false,
    affinity: 30,
    vitality: 100,
    energy: 100,
    evolutionHistory: [
      {
        event: 'Egg slumbering in celestial sanctuary',
        stage: 'EGG',
        level: 1,
        xp: 0,
        timestamp: now,
      },
    ],
  };
}

/**
 * Creates default stats document
 */
export function createDefaultStats(): StatsDoc {
  const now = new Date().toISOString();
  return {
    totalXp: 0,
    tasksCompleted: 0,
    currentStreak: 1,
    bestStreak: 1,
    lastActiveDate: now.split('T')[0],
    stardust: 50,
  };
}

/**
 * Creates default structured roadmap so user always has an active quest roadmap
 */
export function createDefaultRoadmap(goalTitle = 'Mastery & Growth Quest', targetDays = 14, dailyMinutes = 30) {
  const daysCount = Math.max(7, Math.min(60, targetDays));
  const mins = Math.max(15, Math.min(180, dailyMinutes));
  const days = Array.from({ length: daysCount }).map((_, idx) => ({
    dayNumber: idx + 1,
    phaseNumber: Math.floor(idx / 7) + 1,
    title: `Day ${idx + 1}: Foundational Action`,
    theme: `Day ${idx + 1} Progression`,
    tasks: [
      {
        id: `task_${idx + 1}_1`,
        title: `Core Focus Session: ${goalTitle} (Day ${idx + 1})`,
        estimatedMinutes: Math.round(mins * 0.5),
        priority: 'high',
      },
      {
        id: `task_${idx + 1}_2`,
        title: `Practical Application & Review (${Math.round(mins * 0.5)} mins)`,
        estimatedMinutes: Math.round(mins * 0.5),
        priority: 'medium',
      },
    ],
    dailyTip: 'Focus on small daily consistency over giant occasional bursts.',
    isMilestone: (idx + 1) % 7 === 0 || idx + 1 === daysCount,
    milestoneTitle: `Milestone Checkpoint ${Math.floor((idx + 1) / 7) + 1}`,
  }));

  return {
    roadmapTitle: `${goalTitle} Master Roadmap`,
    summary: `A structured ${daysCount}-day progression designed for ${mins} minutes of daily focus.`,
    estimatedDifficulty: 'Intermediate',
    phases: [
      { phaseNumber: 1, title: 'Phase 1: Foundation & Priming', description: 'Establish foundational habits and core basics.', dayRange: 'Days 1-7' },
      { phaseNumber: 2, title: 'Phase 2: Deep Momentum', description: 'Expand practice, overcome friction, and build practical output.', dayRange: 'Days 8-14' },
    ],
    days,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Retrieves the full user record.
 * Tries in-memory -> file-backed store -> adminDb (if available, without throwing).
 */
export async function getOrCreateUserRecord(
  uid: string,
  email = 'traveler@sanctuary.app'
): Promise<UserStoreRecord> {
  // 1. Check memory cache
  let record = memoryCache.get(uid);
  if (record) {
    if (!record.activeQuest) {
      const goalTitle = record.userData?.goal?.title || 'Mastery & Growth Quest';
      record.activeQuest = {
        goalTitle,
        goalDescription: record.userData?.goal?.description || 'Consistent daily progression in the astral sanctuary.',
        targetDays: record.userData?.goal?.targetDays || 14,
        dailyMinutes: record.userData?.goal?.dailyMinutes || 30,
        roadmapData: createDefaultRoadmap(goalTitle, 14, 30),
        currentDayIndex: 1,
        createdAt: record.pet?.evolutionHistory?.[0]?.timestamp || new Date().toISOString(),
      };
      record.initialized = true;
      saveUserToFile(uid, record);
    }
    return record;
  }

  // 2. Check local disk persistence
  const fileRecord = loadUserFromFile(uid);
  if (fileRecord) {
    if (!fileRecord.activeQuest) {
      const goalTitle = fileRecord.userData?.goal?.title || 'Mastery & Growth Quest';
      fileRecord.activeQuest = {
        goalTitle,
        goalDescription: fileRecord.userData?.goal?.description || 'Consistent daily progression in the astral sanctuary.',
        targetDays: fileRecord.userData?.goal?.targetDays || 14,
        dailyMinutes: fileRecord.userData?.goal?.dailyMinutes || 30,
        roadmapData: createDefaultRoadmap(goalTitle, 14, 30),
        currentDayIndex: 1,
        createdAt: fileRecord.pet?.evolutionHistory?.[0]?.timestamp || new Date().toISOString(),
      };
      fileRecord.initialized = true;
      if (!fileRecord.tasks || fileRecord.tasks.length === 0) {
        fileRecord.tasks = [
          {
            id: `task_d1_1_${Date.now()}`,
            title: `Kick off Day 1: ${goalTitle}`,
            estimatedMinutes: 25,
            priority: 'high',
            category: 'Foundational Step',
            completed: false,
            roadmapDayNumber: 1,
            createdAt: new Date().toISOString(),
          },
          {
            id: `task_d1_2_${Date.now()}`,
            title: `Log a thoughtful reflection in the sanctuary journal`,
            estimatedMinutes: 15,
            priority: 'medium',
            category: 'Daily Reflection',
            completed: false,
            roadmapDayNumber: 1,
            createdAt: new Date().toISOString(),
          },
        ];
      }
      saveUserToFile(uid, fileRecord);
    }
    memoryCache.set(uid, fileRecord);
    return fileRecord;
  }

  // 3. Attempt Firestore Admin read (gracefully falls back if IAM permission denied)
  try {
    const userDocRef = adminDb.collection('users').doc(uid);
    const [userDoc, petDocSnap, statsDocSnap, questDocSnap, tasksSnap, journalsSnap] =
      await Promise.all([
        userDocRef.get(),
        userDocRef.collection('pet').doc('state').get(),
        userDocRef.collection('stats').doc('summary').get(),
        userDocRef.collection('quests').doc('active_quest').get(),
        userDocRef.collection('tasks').orderBy('createdAt', 'desc').get(),
        userDocRef.collection('journals').orderBy('createdAt', 'desc').limit(30).get(),
      ]);

    const tasks: any[] = [];
    tasksSnap.forEach((doc) => tasks.push({ id: doc.id, ...doc.data() }));

    const journalEntries: any[] = [];
    journalsSnap.forEach((doc) => journalEntries.push({ id: doc.id, ...doc.data() }));

    const activeQuest = questDocSnap.exists ? questDocSnap.data() : null;
    const pet = petDocSnap.exists ? (petDocSnap.data() as PetDoc) : createDefaultPet();
    const stats = statsDocSnap.exists ? (statsDocSnap.data() as StatsDoc) : createDefaultStats();
    const userData = userDoc.exists ? userDoc.data() : null;

    record = {
      uid,
      email: userData?.email || email,
      initialized: userDoc.exists || !!activeQuest,
      userData,
      pet,
      stats,
      activeQuest,
      tasks,
      journalEntries,
      conversations: {},
      updatedAt: new Date().toISOString(),
    };

    if (!record.activeQuest) {
      const goalTitle = record.userData?.goal?.title || 'Mastery & Growth Quest';
      record.activeQuest = {
        goalTitle,
        goalDescription: record.userData?.goal?.description || 'Consistent daily progression in the astral sanctuary.',
        targetDays: record.userData?.goal?.targetDays || 14,
        dailyMinutes: record.userData?.goal?.dailyMinutes || 30,
        roadmapData: createDefaultRoadmap(goalTitle, 14, 30),
        createdAt: record.pet?.evolutionHistory?.[0]?.timestamp || new Date().toISOString(),
      };
      record.initialized = true;
      if (record.tasks.length === 0) {
        record.tasks = [
          {
            id: `task_d1_1_${Date.now()}`,
            title: `Kick off Day 1: ${goalTitle}`,
            estimatedMinutes: 25,
            priority: 'high',
            category: 'Foundational Step',
            completed: false,
            roadmapDayNumber: 1,
            createdAt: new Date().toISOString(),
          },
          {
            id: `task_d1_2_${Date.now()}`,
            title: `Log a thoughtful reflection in the sanctuary journal`,
            estimatedMinutes: 15,
            priority: 'medium',
            category: 'Daily Reflection',
            completed: false,
            roadmapDayNumber: 1,
            createdAt: new Date().toISOString(),
          },
        ];
      }
    }

    memoryCache.set(uid, record);
    saveUserToFile(uid, record);
    return record;
  } catch (err: any) {
    if (!hasWarnedAdminDb) {
      console.log(
        '[Storage Engine] Firestore Admin ADC unavailable; activating resilient local store mode.'
      );
      hasWarnedAdminDb = true;
    }
  }

  // 4. Default fresh record with guaranteed active quest
  const defaultGoalTitle = 'Mastery & Growth Quest';
  const defaultRoadmap = createDefaultRoadmap(defaultGoalTitle, 14, 30);
  const now = new Date().toISOString();

  record = {
    uid,
    email,
    initialized: true,
    userData: {
      email,
      displayName: 'Seeker',
      createdAt: now,
      updatedAt: now,
      goal: {
        title: defaultGoalTitle,
        description: 'Consistent daily progression in the astral sanctuary.',
        targetDays: 14,
        dailyMinutes: 30,
      },
    },
    pet: createDefaultPet(),
    stats: createDefaultStats(),
    activeQuest: {
      goalTitle: defaultGoalTitle,
      goalDescription: 'Consistent daily progression in the astral sanctuary.',
      targetDays: 14,
      dailyMinutes: 30,
      roadmapData: defaultRoadmap,
      currentDayIndex: 1,
      createdAt: now,
    },
    tasks: [
      {
        id: `task_d1_1_${Date.now()}`,
        title: `Kick off Day 1: ${defaultGoalTitle}`,
        estimatedMinutes: 25,
        priority: 'high',
        category: 'Foundational Step',
        completed: false,
        roadmapDayNumber: 1,
        createdAt: now,
      },
      {
        id: `task_d1_2_${Date.now()}`,
        title: `Log a thoughtful reflection in the sanctuary journal`,
        estimatedMinutes: 15,
        priority: 'medium',
        category: 'Daily Reflection',
        completed: false,
        roadmapDayNumber: 1,
        createdAt: now,
      },
    ],
    journalEntries: [],
    conversations: {},
    updatedAt: now,
  };

  memoryCache.set(uid, record);
  saveUserToFile(uid, record);
  return record;
}

/**
 * Saves and updates user record across memory, file persistence, and fires background Firestore sync.
 */
export async function saveUserRecord(record: UserStoreRecord): Promise<void> {
  record.updatedAt = new Date().toISOString();
  memoryCache.set(record.uid, record);
  
  // Serialize file persistence per user to prevent concurrent race conditions
  await queueFileWrite(record.uid, () => {
    saveUserToFile(record.uid, record);
  });

  // Background async sync to Firestore Admin (non-blocking, never throws to caller)
  (async () => {
    try {
      const userRef = adminDb.collection('users').doc(record.uid);
      if (record.userData) {
        await userRef.set(record.userData, { merge: true });
      }
      if (record.pet) {
        await userRef.collection('pet').doc('state').set(record.pet);
      }
      if (record.stats) {
        await userRef.collection('stats').doc('summary').set(record.stats);
      }
      if (record.activeQuest) {
        await userRef.collection('quests').doc('active_quest').set(record.activeQuest);
      }
    } catch {
      // Intentionally silent in background sync
    }
  })().catch(() => {});
}
