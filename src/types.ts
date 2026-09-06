export type CreatureType = 'green_alien_cosmos' | 'phoenix_dragon_lava' | 'golden_celestial_wolf';

export type EvolutionPathChoice = 'SCHOLAR' | 'ADVENTURER' | 'CREATOR';

export type CreatureStage = 'egg' | 'baby' | 'hatchling' | 'juvenile' | 'awakened';

export type EvolutionStage = CreatureStage;

export type MoodType = 
  | 'transcendent' 
  | 'energetic' 
  | 'peaceful' 
  | 'inspired' 
  | 'steady' 
  | 'overwhelmed' 
  | 'anxious' 
  | 'reflective';

export interface CreatureData {
  id: string;
  name: string;
  type: CreatureType;
  stage: CreatureStage;
  level: number;
  xp: number;
  xpToNextLevel: number;
  health: number; // 0-100
  energy: number; // 0-100
  vitality: number; // 0-100
  affinity: number; // 0-100
  hatchDate: string;
  totalFed: number;
  totalPetted: number;
  unlockedStages: CreatureStage[];
  customTitle?: string;
  dialogueHistory?: string[];
  lastInteracted: string;
  evolutionPath?: EvolutionPathChoice | null;
  pendingEvolutionChoice?: boolean;
}

export interface UserGoal {
  title: string;
  description: string;
  targetDays: number;
  dailyMinutes: number;
  category?: string;
  createdAt?: string;
  targetDate?: string;
}

export interface RoadmapTaskItem {
  id: string;
  title: string;
  estimatedMinutes: number;
  priority: 'high' | 'medium' | 'low';
  category?: string;
}

export interface RoadmapDay {
  dayNumber: number;
  phaseNumber: number;
  title: string;
  theme: string;
  tasks: RoadmapTaskItem[];
  dailyTip: string;
  isMilestone?: boolean;
  milestoneTitle?: string;
  completed?: boolean;
}

export interface RoadmapPhase {
  phaseNumber: number;
  title: string;
  description: string;
  dayRange: string;
}

export interface RoadmapData {
  roadmapTitle: string;
  summary: string;
  estimatedDifficulty: string;
  phases: RoadmapPhase[];
  days: RoadmapDay[];
  generatedAt: string;
}

export interface DailyTask {
  id: string;
  title: string;
  estimatedMinutes: number;
  priority: 'high' | 'medium' | 'low';
  category: string;
  completed: boolean;
  completedAt?: string;
  roadmapDayNumber?: number;
  dateAssigned?: string;
  createdAt?: string;
}

export interface CalendarEventSummary {
  title: string;
  startTime: string;
  endTime: string;
}

export interface RealityCheckInsight {
  insight: string;
  scheduleContext: CalendarEventSummary[];
  scheduleSummary?: string;
  alignmentTakeaway?: string;
  generatedAt: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  dayNumber: number;
  mood: MoodType;
  whatHappened: string;
  feelings: string;
  wins: string;
  challenges: string;
  reflectionInsight?: string;
  actionableAdvice?: string;
  creatureWhisper?: string;
  realityCheck?: RealityCheckInsight;
  xpEarned: number;
  stardustEarned: number;
  createdAt: string;
}

export interface GrowthPoint {
  id: string;
  timestamp: string;
  event: string;
  stage: CreatureStage;
  level: number;
  xp: number;
}

export interface UserProfile {
  id: string;
  email: string;
  createdAt: string;
  goal: UserGoal;
  creature: CreatureData;
  roadmap: RoadmapData | null;
  currentDayIndex: number;
  tasks: DailyTask[];
  journalEntries: JournalEntry[];
  growthTimeline: GrowthPoint[];
  stardust: number;
  calendarConnected?: boolean;
  calendarConnectedAt?: string;
  streak: {
    current: number;
    best: number;
    longest?: number;
    lastActiveDate: string;
  };
}

export interface CreatureArchetypeInfo {
  type: CreatureType;
  name: string;
  title: string;
  element: string;
  themeColor: string;
  accentColor: string;
  bgGradient: string;
  tagline: string;
  description: string;
  philosophy: string;
  lore: string;
  stages: {
    egg: { name: string; desc: string; minLevel: number };
    baby?: { name: string; desc: string; minLevel: number };
    hatchling: { name: string; desc: string; minLevel: number };
    juvenile: { name: string; desc: string; minLevel: number };
    awakened: { name: string; desc: string; minLevel: number };
  };
  perks: string[];
}
