import { getOrCreateUserRecord, saveUserRecord, createDefaultPet, createDefaultStats } from './store';

export interface PetDoc {
  name: string;
  type: string;
  stage: 'EGG' | 'BABY' | 'JUVENILE' | 'AWAKENED';
  xp: number;
  level: number;
  evolutionPath: 'SCHOLAR' | 'ADVENTURER' | 'CREATOR' | null;
  pendingEvolutionChoice: boolean;
  affinity: number;
  vitality: number;
  energy: number;
  lastFedAt?: string;
  lastPettedAt?: string;
  evolutionHistory: Array<{
    event: string;
    stage: string;
    level: number;
    xp: number;
    timestamp: string;
  }>;
}

export interface StatsDoc {
  totalXp: number;
  tasksCompleted: number;
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string;
  stardust: number;
}

// Evolution XP Thresholds
export const EVOLUTION_MILESTONE_XP = 500; // Unlocks choice of SCHOLAR / ADVENTURER / CREATOR
export const JUVENILE_THRESHOLD_XP = 250;

/**
 * Calculates current level and stage based on XP and existing state
 */
export function calculateLevelFromXp(xp: number): number {
  if (xp < 100) return 1;
  if (xp < 250) return 2;
  if (xp < 500) return 3;
  if (xp < 900) return 4;
  if (xp < 1400) return 5;
  return Math.floor(xp / 300) + 1;
}

/**
 * Ensures a user's pet and stats documents exist in Firestore
 */
export async function getOrCreatePetAndStats(uid: string, defaultName = 'Astral Companion', defaultType = 'golden_celestial_wolf') {
  const record = await getOrCreateUserRecord(uid);
  if (!record.pet) {
    record.pet = createDefaultPet(defaultName, defaultType);
  }
  if (!record.stats) {
    record.stats = createDefaultStats();
  }

  // Backward compatible reference interface for callers
  const petRef = {
    set: async (val: PetDoc) => {
      record.pet = val;
      await saveUserRecord(record);
    },
    get: async () => ({ exists: true, data: () => record.pet }),
  };

  const statsRef = {
    set: async (val: StatsDoc) => {
      record.stats = val;
      await saveUserRecord(record);
    },
    get: async () => ({ exists: true, data: () => record.stats }),
  };

  return { record, petRef, statsRef, petData: record.pet, statsData: record.stats };
}

/**
 * Helper to compute updated streak based on calendar date difference
 */
export function calculateUpdatedStreak(lastActiveDate: string, currentStreak: number, bestStreak: number): {
  newCurrentStreak: number;
  newBestStreak: number;
  todayDate: string;
} {
  const now = new Date();
  const todayDate = now.toISOString().split('T')[0];

  const current = Math.max(1, currentStreak || 1);
  const best = Math.max(current, bestStreak || 1);

  if (!lastActiveDate) {
    return { newCurrentStreak: current, newBestStreak: best, todayDate };
  }

  if (lastActiveDate === todayDate) {
    return { newCurrentStreak: current, newBestStreak: best, todayDate };
  }

  // Calculate calendar days difference accurately
  const [y1, m1, d1] = lastActiveDate.split('-').map(Number);
  const [y2, m2, d2] = todayDate.split('-').map(Number);
  const utc1 = Date.UTC(y1, (m1 || 1) - 1, d1 || 1);
  const utc2 = Date.UTC(y2, (m2 || 1) - 1, d2 || 1);
  const diffDays = Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));

  let newStreak = current;
  if (diffDays === 1) {
    // Consecutive calendar day -> advance streak!
    newStreak = current + 1;
  } else if (diffDays > 1) {
    // Missed one or more days -> reset to 1
    newStreak = 1;
  }
  // If diffDays <= 0 (e.g. timezone shift or same day), retain current streak

  return {
    newCurrentStreak: newStreak,
    newBestStreak: Math.max(newStreak, best),
    todayDate,
  };
}

/**
 * Server-authoritative action processing: awards XP, progresses pet stage, checks evolution milestone, updates streak.
 */
export async function recordProductivityAction(params: {
  uid: string;
  actionLabel: string;
  baseXp: number;
  baseStardust: number;
  isTaskCompletion?: boolean;
}) {
  const { uid, actionLabel, baseXp, baseStardust, isTaskCompletion } = params;
  const { record, petData, statsData } = await getOrCreatePetAndStats(uid);

  const now = new Date().toISOString();
  let newXp = petData.xp + baseXp;
  let newLevel = calculateLevelFromXp(newXp);
  let newStage = petData.stage;
  let pendingChoice = petData.pendingEvolutionChoice;
  let evolutionPath = petData.evolutionPath;

  // RULE 1: First meaningful productivity action hatches EGG into BABY
  if (petData.stage === 'EGG') {
    newStage = 'BABY';
    petData.evolutionHistory.push({
      event: `✨ The egg cracked and awakened into a BABY form! (${actionLabel})`,
      stage: 'BABY',
      level: newLevel,
      xp: newXp,
      timestamp: now,
    });
  } 
  // RULE 2: Transition from BABY to JUVENILE at threshold
  else if (petData.stage === 'BABY' && newXp >= JUVENILE_THRESHOLD_XP) {
    newStage = 'JUVENILE';
    petData.evolutionHistory.push({
      event: `✨ Reached JUVENILE form with steadfast dedication!`,
      stage: 'JUVENILE',
      level: newLevel,
      xp: newXp,
      timestamp: now,
    });
  }

  // RULE 3: Evolution Milestone Reached (500+ XP)
  // Pause automatic evolution until parent/user chooses: SCHOLAR, ADVENTURER, or CREATOR
  if (newXp >= EVOLUTION_MILESTONE_XP && !evolutionPath && !pendingChoice) {
    pendingChoice = true;
    petData.evolutionHistory.push({
      event: `🌟 Evolution Milestone reached! Awaiting choice: SCHOLAR, ADVENTURER, or CREATOR.`,
      stage: newStage,
      level: newLevel,
      xp: newXp,
      timestamp: now,
    });
  }

  // Calculate streak update based on today's date
  const streakUpdate = calculateUpdatedStreak(
    statsData.lastActiveDate,
    statsData.currentStreak,
    statsData.bestStreak
  );

  const updatedPet: PetDoc = {
    ...petData,
    xp: newXp,
    level: newLevel,
    stage: newStage,
    pendingEvolutionChoice: pendingChoice,
    evolutionPath,
    vitality: Math.min(100, petData.vitality + 5),
    energy: Math.min(100, petData.energy + 5),
    affinity: Math.min(100, petData.affinity + 2),
    evolutionHistory: [
      ...petData.evolutionHistory,
      {
        event: `+${baseXp} XP: ${actionLabel}`,
        stage: newStage,
        level: newLevel,
        xp: newXp,
        timestamp: now,
      },
    ],
  };

  const updatedStats: StatsDoc = {
    ...statsData,
    totalXp: statsData.totalXp + baseXp,
    stardust: statsData.stardust + baseStardust,
    tasksCompleted: isTaskCompletion ? statsData.tasksCompleted + 1 : statsData.tasksCompleted,
    currentStreak: streakUpdate.newCurrentStreak,
    bestStreak: streakUpdate.newBestStreak,
    lastActiveDate: streakUpdate.todayDate,
  };

  record.pet = updatedPet;
  record.stats = updatedStats;
  await saveUserRecord(record);

  return {
    pet: updatedPet,
    stats: updatedStats,
    xpAwarded: baseXp,
    stardustAwarded: baseStardust,
    stageChanged: newStage !== petData.stage,
    pendingEvolutionChoice: pendingChoice,
  };
}

/**
 * Server-authoritative Evolution Milestone choice handler:
 * Validates eligibility (must be pending choice and XP >= 500), then sets path and awakens pet.
 */
export async function chooseEvolutionBranch(params: {
  uid: string;
  choice: 'SCHOLAR' | 'ADVENTURER' | 'CREATOR';
}) {
  const { uid, choice } = params;
  if (!['SCHOLAR', 'ADVENTURER', 'CREATOR'].includes(choice)) {
    throw new Error('Invalid evolution choice. Must be SCHOLAR, ADVENTURER, or CREATOR.');
  }

  const { petRef, petData } = await getOrCreatePetAndStats(uid);

  // Strict verification: user must be eligible!
  if (!petData.pendingEvolutionChoice && petData.evolutionPath !== null) {
    throw new Error('User has already chosen an evolution branch.');
  }

  if (petData.xp < EVOLUTION_MILESTONE_XP) {
    throw new Error(`Ineligible for evolution milestone. Requires at least ${EVOLUTION_MILESTONE_XP} XP.`);
  }

  const now = new Date().toISOString();
  const updatedPet: PetDoc = {
    ...petData,
    evolutionPath: choice,
    pendingEvolutionChoice: false,
    stage: 'AWAKENED',
    evolutionHistory: [
      ...petData.evolutionHistory,
      {
        event: `🌌 Chosen Evolution Path: ${choice}! Awakened into full majesty!`,
        stage: 'AWAKENED',
        level: petData.level,
        xp: petData.xp,
        timestamp: now,
      },
    ],
  };

  await petRef.set(updatedPet);
  return updatedPet;
}

/**
 * Server-authoritative Egg Cracking / Hatching handler:
 * Transitions EGG into BABY/hatchling form, awards initial hatch bonus XP & Stardust,
 * and records event in evolution history.
 */
export async function hatchEgg(uid: string) {
  const { petRef, statsRef, petData, statsData } = await getOrCreatePetAndStats(uid);
  const now = new Date().toISOString();

  const stageUpper = (petData.stage || '').toUpperCase();
  if (stageUpper !== 'EGG') {
    return {
      alreadyHatched: true,
      pet: petData,
      stats: statsData,
      xpAwarded: 0,
      stardustAwarded: 0,
      message: `${petData.name} has already hatched!`,
    };
  }

  const HATCH_XP = 50;
  const HATCH_STARDUST = 25;
  const newXp = (petData.xp || 0) + HATCH_XP;
  const newLevel = calculateLevelFromXp(newXp);
  const newStage: 'BABY' = 'BABY';

  const history = Array.isArray(petData.evolutionHistory) ? petData.evolutionHistory : [];
  history.push({
    event: `✨ The egg cracked open with radiant celestial light! A curious hatchling has awakened!`,
    stage: 'BABY',
    level: newLevel,
    xp: newXp,
    timestamp: now,
  });

  const updatedPet: PetDoc = {
    ...petData,
    stage: newStage,
    xp: newXp,
    level: newLevel,
    affinity: Math.min(100, (petData.affinity || 30) + 25),
    vitality: 100,
    energy: 100,
    evolutionHistory: history,
  };

  const updatedStats: StatsDoc = {
    ...statsData,
    stardust: (statsData.stardust || 50) + HATCH_STARDUST,
    totalXp: (statsData.totalXp || 0) + HATCH_XP,
  };

  await Promise.all([
    petRef.set(updatedPet),
    statsRef.set(updatedStats),
  ]);

  return {
    alreadyHatched: false,
    pet: updatedPet,
    stats: updatedStats,
    xpAwarded: HATCH_XP,
    stardustAwarded: HATCH_STARDUST,
    message: `✨ CRACK! The shell shatters and ${updatedPet.name} joyfully awakens! (+${HATCH_XP} XP, +${HATCH_STARDUST} Stardust)`,
  };
}
