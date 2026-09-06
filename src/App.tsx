import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  UserProfile, 
  CreatureType, 
  DailyTask, 
  JournalEntry, 
  RoadmapDay, 
  MoodType, 
  EvolutionStage,
  EvolutionPathChoice
} from './types';
import { calculateLevelData, CREATURE_ARCHETYPES } from './utils/creatureData';
import { soundFx } from './utils/audio';

// Firebase Client & Auth
import { auth, onAuthStateChanged, logoutUser, User } from './lib/firebaseClient';

// Authenticated API Service
import {
  apiSyncUser,
  apiInitUser,
  apiCompleteTask,
  apiCreateTask,
  apiDeleteTask,
  apiChooseEvolution,
  apiPetCare,
  apiHatchPet,
  apiFocusComplete,
  apiCompanionChat,
  apiUpdatePetName,
  apiSetCurrentDay,
} from './lib/api';
import { getStoredProfile, saveStoredProfile } from './utils/storage';

function normalizeStage(stage?: string): EvolutionStage {
  if (!stage) return 'egg';
  const lower = stage.toLowerCase();
  if (lower === 'baby') return 'hatchling';
  return lower as EvolutionStage;
}

// Components
import { AuthScreen } from './components/AuthScreen';
import { OnboardingFlow } from './components/OnboardingFlow';
import { Navbar, TabType } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { RoadmapView } from './components/RoadmapView';
import { DailyTasksView } from './components/DailyTasksView';
import { JournalView } from './components/JournalView';
import { CreatureSanctuaryView } from './components/CreatureSanctuaryView';
import { FocusTimerModal } from './components/FocusTimerModal';
import { EvolutionChoiceModal } from './components/EvolutionChoiceModal';
import { SettingsModal } from './components/SettingsModal';
import { DailyIntentModal } from './components/DailyIntentModal';
import { GeminiChatbot } from './components/GeminiChatbot';
import { Loader2, Sparkles } from 'lucide-react';

export default function App() {
  // Step 1: Firebase Auth State & Loading
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [dataSyncing, setDataSyncing] = useState<boolean>(false);

  // App State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Gemini Intent & Support Chatbot
  const [isDailyIntentOpen, setIsDailyIntentOpen] = useState<boolean>(false);
  const [isSupportChatOpen, setIsSupportChatOpen] = useState<boolean>(false);

  // Focus Timer Modal State
  const [isFocusTimerOpen, setIsFocusTimerOpen] = useState(false);
  const [focusTimerInitialMinutes, setFocusTimerInitialMinutes] = useState(25);
  const [focusTimerTaskTitle, setFocusTimerTaskTitle] = useState<string | undefined>(undefined);

  // Pre-selected mood for jump from Dashboard to Journal
  const [preselectedMood, setPreselectedMood] = useState<MoodType | null>(null);

  // Creature Live Dialogue
  const [creatureDialogue, setCreatureDialogue] = useState<string>('');

  // Evolution Celebration Toast Modal
  const [evolutionCelebration, setEvolutionCelebration] = useState<{
    newStage: EvolutionStage;
    newLevel: number;
    creatureName: string;
  } | null>(null);

  // Step 8: Evolution Milestone Choice Modal
  const [isEvolutionChoiceOpen, setIsEvolutionChoiceOpen] = useState(false);

  // ----------------------------------------------------
  // Sync Profile From Firestore via Backend
  // ----------------------------------------------------
  const syncUserData = async (overrideUser?: User | null) => {
    setDataSyncing(true);
    const activeAuthUser = overrideUser !== undefined ? overrideUser : currentUser;
    try {
      const data = await apiSyncUser();
      
      // If server returned uninitialized, check if we have local cache to auto-heal server
      if (!data.initialized || !data.activeQuest) {
        const userEmail = activeAuthUser?.email || data.email || 'traveler@sanctuary.app';
        const localCached = getStoredProfile(userEmail);
        if (localCached && localCached.creature) {
          try {
            await apiInitUser({
              goal: localCached.goal,
              creatureType: localCached.creature.type,
              creatureName: localCached.creature.name,
              roadmapData: localCached.roadmap,
            });
            const healed = await apiSyncUser();
            if (healed && healed.pet) {
              applySyncedRecord(healed, userEmail);
              return;
            }
          } catch (healErr) {
            console.warn('Auto-heal server sync warning:', healErr);
          }
        }
        
        // If the server has a pet or stats anyway, don't kick to onboarding
        if (data.pet) {
          applySyncedRecord(data, userEmail);
          return;
        }

        // Genuine brand new user with no profile
        setProfile(null);
        return;
      }

      const userEmail = data.email || activeAuthUser?.email || 'traveler@sanctuary.app';
      applySyncedRecord(data, userEmail);
    } catch (err) {
      console.warn('Sync user data warning:', err);
      // Fallback: If network error, load cached profile from localStorage
      if (activeAuthUser && !profile) {
        const cached = getStoredProfile(activeAuthUser.email || activeAuthUser.uid);
        if (cached) {
          setProfile(cached);
        }
      }
    } finally {
      setDataSyncing(false);
    }
  };

  const applySyncedRecord = (data: any, userEmail: string) => {
    const petData = data.pet || {};
    const statsData = data.stats || {};
    const activeQuest = data.activeQuest || {};

    // Map backend stage to frontend type
    const stageNormalized = normalizeStage(petData.stage);

    const defaultRoadmap = {
      roadmapTitle: activeQuest.goalTitle ? `${activeQuest.goalTitle} Master Roadmap` : 'Mastery & Growth Quest Master Roadmap',
      summary: 'A structured 14-day progression designed for 30 minutes of daily focus.',
      estimatedDifficulty: 'Intermediate',
      phases: [
        { phaseNumber: 1, title: 'Phase 1: Foundation & Priming', description: 'Establish foundational habits and core basics.', dayRange: 'Days 1-7' },
        { phaseNumber: 2, title: 'Phase 2: Deep Momentum', description: 'Expand practice, overcome friction, and build practical output.', dayRange: 'Days 8-14' },
      ],
      days: [
        {
          dayNumber: 1,
          phaseNumber: 1,
          title: 'Day 1: Foundational Action',
          theme: 'Day 1 Progression',
          tasks: [
            { id: 'task_d1_1', title: 'Kick off Day 1: Establish Your Daily Rhythm', estimatedMinutes: 15, priority: 'high' as const },
            { id: 'task_d1_2', title: 'Deep Focus Session (15 mins)', estimatedMinutes: 15, priority: 'medium' as const },
          ],
          dailyTip: 'Focus on small daily consistency over giant occasional bursts.',
          isMilestone: false,
        },
      ],
      generatedAt: new Date().toISOString(),
    };

    const maxJournalDay = (data.journalEntries || []).reduce((max: number, e: any) => Math.max(max, Number(e.dayNumber) || 0), 0);
    const resolvedDay = activeQuest.currentDayIndex || (maxJournalDay > 0 ? Math.min(activeQuest.targetDays || 14, maxJournalDay + 1) : 1);

    const syncedProfile: UserProfile = {
      id: data.uid,
      email: userEmail,
      createdAt: data.userData?.createdAt || new Date().toISOString(),
      currentDayIndex: resolvedDay,
      stardust: statsData.stardust || 50,
      goal: {
        title: activeQuest.goalTitle || data.userData?.goal?.title || 'Personal Mastery',
        description: activeQuest.goalDescription || data.userData?.goal?.description || '',
        targetDays: activeQuest.targetDays || data.userData?.goal?.targetDays || 14,
        dailyMinutes: activeQuest.dailyMinutes || data.userData?.goal?.dailyMinutes || 30,
      },
      creature: {
        id: `pet_${data.uid}`,
        name: petData.name || 'Astral Companion',
        type: (petData.type || 'golden_celestial_wolf') as CreatureType,
        stage: stageNormalized,
        level: petData.level || 1,
        xp: petData.xp || 0,
        xpToNextLevel: 250,
        health: 100,
        energy: petData.energy ?? 100,
        vitality: petData.vitality ?? 100,
        affinity: petData.affinity ?? 30,
        hatchDate: data.userData?.createdAt || new Date().toISOString(),
        totalFed: 0,
        totalPetted: 0,
        unlockedStages: ['egg', stageNormalized],
        lastInteracted: new Date().toISOString(),
        evolutionPath: petData.evolutionPath || null,
        pendingEvolutionChoice: petData.pendingEvolutionChoice || false,
      },
      roadmap: activeQuest.roadmapData || defaultRoadmap,
      tasks: (data.tasks && data.tasks.length > 0) ? data.tasks : [
        {
          id: `task_d1_1_${Date.now()}`,
          title: `Kick off Day 1: ${activeQuest.goalTitle || 'Personal Mastery'}`,
          estimatedMinutes: 25,
          priority: 'high',
          category: 'Foundational Step',
          completed: false,
          roadmapDayNumber: 1,
          createdAt: new Date().toISOString(),
        }
      ],
      journalEntries: data.journalEntries || [],
      streak: {
        current: Math.max(1, statsData.currentStreak || 1),
        best: Math.max(statsData.currentStreak || 1, statsData.bestStreak || 1),
        longest: Math.max(statsData.currentStreak || 1, statsData.bestStreak || 1),
        lastActiveDate: statsData.lastActiveDate || new Date().toISOString().split('T')[0],
      },
      growthTimeline: (petData.evolutionHistory || []).map((h: any, i: number) => ({
        id: `hist_${i}`,
        timestamp: h.timestamp || new Date().toISOString(),
        event: h.event || 'Productivity step logged',
        stage: (h.stage || 'egg').toLowerCase() as EvolutionStage,
        level: h.level || 1,
        xp: h.xp || 0,
      })),
      calendarConnected: !!data.calendarConnected,
      calendarConnectedAt: data.calendarConnectedAt || undefined,
    };

    setProfile(syncedProfile);
    saveStoredProfile(syncedProfile);

    // Check if user has a pending evolution milestone (500+ XP)
    if (petData.pendingEvolutionChoice && !petData.evolutionPath) {
      setIsEvolutionChoiceOpen(true);
    }

    // Prompt what user wants to learn or accomplish today when they log in
    const sessionPromptKey = `gemini_intent_prompted_${data.uid}_${new Date().toISOString().slice(0, 10)}`;
    if (!sessionStorage.getItem(sessionPromptKey)) {
      sessionStorage.setItem(sessionPromptKey, 'true');
      setIsDailyIntentOpen(true);
    }

    setCreatureDialogue(
      `Welcome to the Astral Sanctuary! I am ${petData.name || 'your Companion'}. Let us conquer your quests together!`
    );
  };

  const handleJourneyApplied = (newQuest: any, newTasks: any[]) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const next: UserProfile = {
        ...prev,
        currentDayIndex: 1,
        goal: {
          title: newQuest.goalTitle,
          description: newQuest.goalDescription || '',
          targetDays: newQuest.targetDays || 14,
          dailyMinutes: newQuest.dailyMinutes || 30,
        },
        roadmap: newQuest.roadmapData || prev.roadmap,
        tasks: newTasks && newTasks.length > 0 ? newTasks : prev.tasks,
      };
      saveStoredProfile(next);
      return next;
    });
    soundFx.playLevelUp();
  };

  // ----------------------------------------------------
  // Step 1: Firebase Auth State Listener & Fast Local Cache Hydration
  // ----------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fast local hydration: load cached profile immediately to prevent onboarding flicker
        const cached = getStoredProfile(user.email || user.uid);
        if (cached && cached.creature) {
          setProfile(cached);
        }
        await syncUserData(user);
      } else {
        setProfile(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Save profile to local persistent storage whenever it changes
  useEffect(() => {
    if (profile && (profile.email || currentUser?.email)) {
      saveStoredProfile(profile);
    }
  }, [profile, currentUser]);

  // ----------------------------------------------------
  // Auth Handlers
  // ----------------------------------------------------
  const handleLogout = async () => {
    soundFx.playClick();
    try {
      await logoutUser();
    } catch (e) {
      console.error('Logout error:', e);
    }
    setCurrentUser(null);
    setProfile(null);
  };

  // ----------------------------------------------------
  // Onboarding Complete Handler
  // ----------------------------------------------------
  const handleCompleteOnboarding = async (
    goal: { title: string; description: string; targetDays: number; dailyMinutes: number },
    creatureType: CreatureType,
    creatureName: string,
    roadmapData: any
  ) => {
    try {
      setDataSyncing(true);
      await apiInitUser({
        goal,
        creatureType,
        creatureName,
        roadmapData,
      });
      await syncUserData();
    } catch (err: any) {
      console.warn('Init user server warning (activating resilient fallback profile):', err);
    } finally {
      // Resilience guarantee: If profile is still null (e.g. slight Firestore indexing delay),
      // populate local profile immediately so the user is NEVER stuck on onboarding!
      setProfile((prev) => {
        if (prev && prev.creature && prev.roadmap) return prev;
        const initialTasks = (
          roadmapData?.days?.[0]?.tasks || 
          roadmapData?.todaysRecommendedTasks || 
          []
        ).map((t: any, idx: number) => ({
          id: t.id || `task_d1_${idx}_${Date.now()}`,
          title: typeof t === 'string' ? t : (t.title || `Day 1 Focus Session ${idx + 1}`),
          estimatedMinutes: typeof t === 'object' && t.estimatedMinutes ? Number(t.estimatedMinutes) : 25,
          priority: (typeof t === 'object' && t.priority) || 'high',
          category: 'Foundational Step',
          completed: false,
          roadmapDayNumber: 1,
          createdAt: new Date().toISOString(),
        }));

        return {
          id: currentUser?.uid || 'user_local',
          email: currentUser?.email || 'traveler@sanctuary.app',
          createdAt: new Date().toISOString(),
          currentDayIndex: 1,
          stardust: 50,
          goal: {
            title: goal.title || 'Personal Mastery',
            description: goal.description || '',
            targetDays: goal.targetDays || 14,
            dailyMinutes: goal.dailyMinutes || 30,
          },
          creature: {
            id: `pet_${currentUser?.uid || 'local'}`,
            name: creatureName || 'Astral Companion',
            type: creatureType || 'golden_celestial_wolf',
            stage: 'egg',
            level: 1,
            xp: 0,
            xpToNextLevel: 250,
            health: 100,
            energy: 100,
            vitality: 100,
            affinity: 30,
            hatchDate: new Date().toISOString(),
            totalFed: 0,
            totalPetted: 0,
            unlockedStages: ['egg'],
            lastInteracted: new Date().toISOString(),
            evolutionPath: null,
            pendingEvolutionChoice: false,
          },
          roadmap: roadmapData,
          tasks: initialTasks.length > 0 ? initialTasks : [
            {
              id: `task_d1_0_${Date.now()}`,
              title: `Kick off Day 1: ${goal.title || 'Personal Quest'}`,
              estimatedMinutes: 25,
              priority: 'high',
              category: 'Foundational Step',
              completed: false,
              roadmapDayNumber: 1,
              createdAt: new Date().toISOString(),
            },
          ],
          journalEntries: [],
          streak: {
            current: 1,
            best: 1,
            longest: 1,
            lastActiveDate: new Date().toISOString().split('T')[0],
          },
          growthTimeline: [
            {
              id: 'hist_init',
              timestamp: new Date().toISOString(),
              event: `Celestial egg chosen for quest: "${goal.title || 'Mastery Quest'}"`,
              stage: 'egg',
              level: 1,
              xp: 0,
            },
          ],
        };
      });

      setCurrentTab('dashboard');
      soundFx.playLevelUp();
      setDataSyncing(false);
    }
  };

  // ----------------------------------------------------
  // Step 7: Resilient Server-Authoritative Task Completion & Toggling
  // Optimistic UI updates ensure instant click feedback; server ensures verified XP.
  // ----------------------------------------------------
  const handleToggleTask = async (taskId: string) => {
    if (!profile) return;
    const task = profile.tasks.find((t) => t.id === taskId);
    if (!task) return;

    soundFx.playClick();
    const isNowCompleted = !task.completed;

    if (isNowCompleted) {
      soundFx.playTaskComplete();
    }

    // 1. Optimistic UI update for immediate click feedback
    setProfile((prev) => {
      if (!prev) return prev;
      const updatedTasks = prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              completed: isNowCompleted,
              completedAt: isNowCompleted ? new Date().toISOString() : undefined,
            }
          : t
      );

      const optimisticXp = isNowCompleted ? prev.creature.xp + 25 : prev.creature.xp;
      const optimisticStardust = isNowCompleted ? prev.stardust + 10 : prev.stardust;

      return {
        ...prev,
        tasks: updatedTasks,
        stardust: optimisticStardust,
        creature: {
          ...prev.creature,
          xp: optimisticXp,
        },
      };
    });

    try {
      const res = await apiCompleteTask(taskId, {
        title: task.title,
        estimatedMinutes: task.estimatedMinutes,
        priority: task.priority,
        category: task.category,
        roadmapDayNumber: task.roadmapDayNumber || profile.currentDayIndex || 1,
        toggle: true,
        uncomplete: !isNowCompleted,
      });

      // Trigger evolution celebration if stage changed (e.g. EGG -> BABY)
      if (res.stageChanged) {
        soundFx.playLevelUp();
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.4 },
          colors: ['#f59e0b', '#10b981', '#fbbf24', '#f97316'],
        });
        setEvolutionCelebration({
          newStage: normalizeStage(res.pet?.stage || 'baby'),
          newLevel: res.pet?.level || 1,
          creatureName: res.pet?.name || profile.creature.name,
        });
      }

      // If evolution milestone reached, prompt for choice
      if (res.pendingEvolutionChoice) {
        setIsEvolutionChoiceOpen(true);
      }

      // Reconcile server-authoritative data if available
      if (res.pet && res.stats) {
        setProfile((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            stardust: res.stats.stardust ?? prev.stardust,
            streak: {
              ...prev.streak,
              current: res.stats.currentStreak ?? prev.streak.current,
              best: res.stats.bestStreak ?? prev.streak.best,
              lastActiveDate: res.stats.lastActiveDate ?? prev.streak.lastActiveDate,
            },
            creature: {
              ...prev.creature,
              xp: res.pet.xp ?? prev.creature.xp,
              level: res.pet.level ?? prev.creature.level,
              stage: (res.pet.stage || prev.creature.stage).toLowerCase() as EvolutionStage,
              vitality: res.pet.vitality ?? prev.creature.vitality,
              energy: res.pet.energy ?? prev.creature.energy,
              affinity: res.pet.affinity ?? prev.creature.affinity,
              evolutionPath: res.pet.evolutionPath ?? prev.creature.evolutionPath,
              pendingEvolutionChoice: res.pet.pendingEvolutionChoice ?? false,
            },
          };
        });
      }

      if (isNowCompleted && res.xpAwarded > 0) {
        setCreatureDialogue(`✨ Quest complete! +${res.xpAwarded} XP awarded by sanctuary oracle!`);
      } else if (!isNowCompleted) {
        setCreatureDialogue(`Quest unmarked.`);
      }
    } catch (err: any) {
      console.warn('Task toggle sync notice (optimistic state preserved):', err);
    }
  };

  const handleAddTask = async (
    title: string,
    estimatedMinutes: number,
    priority: 'high' | 'medium' | 'low',
    category: string
  ) => {
    soundFx.playClick();
    try {
      const created = await apiCreateTask({
        title,
        estimatedMinutes,
        priority,
        category,
        roadmapDayNumber: profile?.currentDayIndex || 1,
      });

      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: [created, ...prev.tasks],
        };
      });
    } catch (err) {
      console.error('Add task error:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    soundFx.playClick();
    try {
      await apiDeleteTask(taskId);
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.filter((t) => t.id !== taskId),
        };
      });
    } catch (err) {
      console.error('Delete task error:', err);
    }
  };

  // ----------------------------------------------------
  // Step 8: Choose Evolution Path Handler
  // ----------------------------------------------------
  const handleChooseEvolution = async (choice: EvolutionPathChoice) => {
    try {
      const res = await apiChooseEvolution(choice);
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.4 },
        colors: ['#f59e0b', '#3b82f6', '#a855f7', '#fbbf24'],
      });

      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          creature: {
            ...prev.creature,
            stage: 'awakened',
            evolutionPath: choice,
            pendingEvolutionChoice: false,
          },
        };
      });

      setIsEvolutionChoiceOpen(false);
      setCreatureDialogue(`🌟 I have awakened as THE ${choice}! Our cosmic bond is eternal!`);
    } catch (err: any) {
      console.error('Evolution choice error:', err);
      throw err;
    }
  };

  // ----------------------------------------------------
  // Journal Save Handler (Step 5B + Step 7/8/9)
  // ----------------------------------------------------
  const handleSaveJournalEntry = (entry: JournalEntry, serverResponse?: any) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const updatedEntries = [entry, ...prev.journalEntries];
      const nextDay = serverResponse?.currentDayIndex || 
        Math.min(prev.goal.targetDays, Math.max(prev.currentDayIndex, (entry.dayNumber || 1) + 1));

      let nextProfile: UserProfile;

      if (serverResponse) {
        if (serverResponse.stageChanged) {
          soundFx.playLevelUp();
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.4 },
            colors: ['#f59e0b', '#10b981', '#fbbf24', '#f97316'],
          });
          setEvolutionCelebration({
            newStage: normalizeStage(serverResponse.pet.stage),
            newLevel: serverResponse.pet.level,
            creatureName: serverResponse.pet.name,
          });
        }

        if (serverResponse.pendingEvolutionChoice) {
          setIsEvolutionChoiceOpen(true);
        }

        nextProfile = {
          ...prev,
          currentDayIndex: nextDay,
          journalEntries: updatedEntries,
          stardust: serverResponse.stats.stardust,
          streak: {
            ...prev.streak,
            current: serverResponse.stats.currentStreak,
            best: serverResponse.stats.bestStreak,
            lastActiveDate: serverResponse.stats.lastActiveDate,
          },
          creature: {
            ...prev.creature,
            xp: serverResponse.pet.xp,
            level: serverResponse.pet.level,
            stage: (serverResponse.pet.stage || 'egg').toLowerCase() as EvolutionStage,
            vitality: serverResponse.pet.vitality,
            energy: serverResponse.pet.energy,
            affinity: serverResponse.pet.affinity,
          },
        };
      } else {
        nextProfile = {
          ...prev,
          currentDayIndex: nextDay,
          journalEntries: updatedEntries,
        };
      }

      saveStoredProfile(nextProfile);
      return nextProfile;
    });

    if (entry.creatureWhisper) {
      setCreatureDialogue(entry.creatureWhisper);
    }
  };

  // ----------------------------------------------------
  // Creature Care Handlers
  // ----------------------------------------------------
  const handleFeedCreature = async () => {
    soundFx.playClick();
    try {
      const res = await apiPetCare('feed');
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          stardust: res.stats.stardust,
          creature: {
            ...prev.creature,
            xp: res.pet.xp,
            level: res.pet.level,
            vitality: res.pet.vitality,
            affinity: res.pet.affinity,
          },
        };
      });
      setCreatureDialogue(res.message);
    } catch (err: any) {
      console.warn('Feed pet error:', err);
    }
  };

  const handlePetCreature = async () => {
    soundFx.playClick();
    try {
      const res = await apiPetCare('pet');
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          creature: {
            ...prev.creature,
            affinity: res.pet.affinity,
          },
        };
      });
      setCreatureDialogue(res.message);
    } catch (err) {
      console.warn('Pet error:', err);
    }
  };

  const handleInteractCreature = async (action: string) => {
    if (!profile) return;
    try {
      const res = await apiCompanionChat({
        message: `[User Action: ${action} with ${profile.creature.name}]`,
        goalTitle: profile.goal.title,
      });
      if (res && res.reply) {
        setCreatureDialogue(res.reply);
      }
    } catch (e) {
      setCreatureDialogue(`${profile.creature.name} radiates a serene, supportive aura.`);
    }
  };

  const handleUpdateCreatureName = async (newName: string) => {
    soundFx.playClick();
    try {
      await apiUpdatePetName(newName);
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          creature: {
            ...prev.creature,
            name: newName,
          },
        };
      });
    } catch (err) {
      console.error('Update pet name error:', err);
    }
  };

  // ----------------------------------------------------
  // Egg Cracking & Hatching Handler
  // ----------------------------------------------------
  const handleHatchCreature = async () => {
    if (!profile) return;
    try {
      soundFx.playEggHatch();
      confetti({
        particleCount: 160,
        spread: 100,
        origin: { y: 0.4 },
        colors: ['#f59e0b', '#10b981', '#fbbf24', '#f97316', '#34d399', '#ffffff'],
      });

      const res = await apiHatchPet();
      const newStage = normalizeStage(res.pet.stage);

      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          stardust: res.stats.stardust,
          creature: {
            ...prev.creature,
            stage: newStage,
            xp: res.pet.xp,
            level: res.pet.level,
            affinity: res.pet.affinity,
            vitality: res.pet.vitality,
            energy: res.pet.energy,
            unlockedStages: Array.from(new Set([...prev.creature.unlockedStages, newStage])),
          },
          growthTimeline: (res.pet.evolutionHistory || []).map((h: any, i: number) => ({
            id: `timeline_${i}`,
            title: h.event,
            stage: normalizeStage(h.stage),
            date: h.timestamp?.split('T')[0] || new Date().toISOString().split('T')[0],
            unlockedFeatures: ['Baby Companion Form', 'Enhanced Stardust Synthesis'],
          })),
        };
      });

      setEvolutionCelebration({
        newStage,
        newLevel: res.pet.level,
        creatureName: res.pet.name,
      });

      setCreatureDialogue(
        `✨ CRACK! The shell shatters and ${res.pet.name} joyfully bursts into the world! (+${res.xpAwarded} XP, +${res.stardustAwarded} Stardust)`
      );
    } catch (err: any) {
      console.error('Error hatching egg:', err);
    }
  };

  // ----------------------------------------------------
  // Focus Session Complete Handler
  // ----------------------------------------------------
  const handleCompleteFocusSession = async (minutes: number) => {
    try {
      const res = await apiFocusComplete(minutes);
      if (res.stageChanged) {
        soundFx.playLevelUp();
        setEvolutionCelebration({
          newStage: normalizeStage(res.pet.stage),
          newLevel: res.pet.level,
          creatureName: res.pet.name,
        });
      }
      if (res.pendingEvolutionChoice) {
        setIsEvolutionChoiceOpen(true);
      }

      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          stardust: res.stats.stardust,
          streak: {
            ...prev.streak,
            current: res.stats.currentStreak,
            best: res.stats.bestStreak,
            lastActiveDate: res.stats.lastActiveDate,
          },
          creature: {
            ...prev.creature,
            xp: res.pet.xp,
            level: res.pet.level,
            stage: normalizeStage(res.pet.stage),
            vitality: res.pet.vitality,
            energy: res.pet.energy,
            affinity: res.pet.affinity,
          },
        };
      });

      setCreatureDialogue(
        `Masterful focus! That ${minutes}-minute session fueled our celestial resonance! (+${res.xpAwarded} XP)`
      );
    } catch (err) {
      console.error('Focus complete error:', err);
    }
  };

  // ----------------------------------------------------
  // Helper Handlers
  // ----------------------------------------------------
  const handleToggleSound = () => {
    const nextState = soundFx.toggle();
    setSoundEnabled(nextState);
  };

  const handleQuickMoodSelect = (mood: MoodType) => {
    soundFx.playClick();
    setPreselectedMood(mood);
    setCurrentTab('journal');
  };

  const handleOpenFocusTimer = (mins = 25, taskTitle?: string) => {
    soundFx.playClick();
    setFocusTimerInitialMinutes(mins);
    setFocusTimerTaskTitle(taskTitle);
    setIsFocusTimerOpen(true);
  };

  const handleSyncDayToTasks = (day: RoadmapDay) => {
    (day.tasks || []).forEach((t) => {
      handleAddTask(t.title, t.estimatedMinutes || 25, t.priority || 'medium', `Day ${day.dayNumber}`);
    });
  };

  const handleSetCurrentDay = (dayNumber: number) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const next = { ...prev, currentDayIndex: dayNumber };
      saveStoredProfile(next);
      return next;
    });
    apiSetCurrentDay(dayNumber).catch((e) => console.warn('Failed to sync quest day:', e));
  };

  const handleUpdateRoadmap = (newRoadmap: any) => {
    setProfile((prev) => prev ? ({ ...prev, roadmap: newRoadmap }) : null);
  };

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updated };
      saveStoredProfile(next);
      return next;
    });
  };

  const handleUpdateJournalEntry = (updatedEntry: JournalEntry) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const updatedEntries = prev.journalEntries.map((e) =>
        e.id === updatedEntry.id ? updatedEntry : e
      );
      const next = { ...prev, journalEntries: updatedEntries };
      saveStoredProfile(next);
      return next;
    });
  };

  // ====================================================
  // SCREEN ROUTING & PROTECTED APPLICATION ROUTES
  // ====================================================

  // 1. Loading State While Authentication or Initial Hydration is in Progress
  if (authLoading || (dataSyncing && !profile)) {
    return (
      <div className="min-h-screen bg-[#050508] text-white flex flex-col items-center justify-center font-sans p-6 text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.25)]">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <Loader2 className="w-20 h-20 text-amber-400/40 animate-spin absolute -top-2 -left-2 pointer-events-none" />
        </div>
        <h2 className="text-xl font-serif italic tracking-tight text-white mb-1">
          Astral Sanctuary
        </h2>
        <p className="text-xs text-white/50 font-mono uppercase tracking-widest">
          Aligning Celestial Constellations & Verifying Identity...
        </p>
      </div>
    );
  }

  // 2. Protected Route: Not Logged In -> Show Firebase Auth Screen
  if (!currentUser) {
    return <AuthScreen onSuccess={syncUserData} />;
  }

  // 3. Logged In, but No Quest / Egg Initialized -> Show Onboarding Flow
  if (!profile || !profile.creature) {
    return (
      <OnboardingFlow
        userEmail={currentUser.email || 'traveler@sanctuary.app'}
        onCompleteOnboarding={handleCompleteOnboarding}
      />
    );
  }

  // 4. Main Authenticated Sanctuary Workspace
  return (
    <div className="min-h-screen bg-[#050508] text-[#e0e0e0] flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200 relative overflow-x-hidden">
      {/* Immersive Subtle Ambient Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-amber-600/5 rounded-full blur-[90px]" />
        <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] bg-yellow-500/[0.02] rounded-full blur-[120px]" />
      </div>

      {/* Universal Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        profile={profile}
        onOpenFocusTimer={() => handleOpenFocusTimer(25)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenDailyIntent={() => setIsDailyIntentOpen(true)}
        onOpenSupportChat={() => setIsSupportChatOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
        <AnimatePresence mode="wait">
          {currentTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <DashboardView
                profile={profile}
                onNavigateTab={setCurrentTab}
                onFeedCreature={handleFeedCreature}
                onPetCreature={handlePetCreature}
                onQuickMoodSelect={handleQuickMoodSelect}
                onInteractCreature={handleInteractCreature}
                onHatchCreature={handleHatchCreature}
                onToggleTask={handleToggleTask}
                onSyncDayToTasks={handleSyncDayToTasks}
                onOpenDailyIntent={() => setIsDailyIntentOpen(true)}
                onOpenSupportChat={() => setIsSupportChatOpen(true)}
                creatureDialogue={creatureDialogue}
              />
            </motion.div>
          )}

          {currentTab === 'roadmap' && (
            <motion.div
              key="roadmap"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <RoadmapView
                profile={profile}
                onSyncDayToTasks={handleSyncDayToTasks}
                onSetCurrentDay={handleSetCurrentDay}
                onUpdateRoadmap={handleUpdateRoadmap}
              />
            </motion.div>
          )}

          {currentTab === 'tasks' && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <DailyTasksView
                profile={profile}
                onToggleTask={handleToggleTask}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
                onOpenFocusTimer={handleOpenFocusTimer}
                onSyncDayToTasks={handleSyncDayToTasks}
              />
            </motion.div>
          )}

          {currentTab === 'journal' && (
            <motion.div
              key="journal"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <JournalView
                profile={profile}
                onSaveJournalEntry={handleSaveJournalEntry}
                onUpdateEntry={handleUpdateJournalEntry}
                onSetCurrentDay={handleSetCurrentDay}
                onOpenSettings={() => setIsSettingsOpen(true)}
                preselectedMood={preselectedMood}
              />
            </motion.div>
          )}

          {currentTab === 'sanctuary' && (
            <motion.div
              key="sanctuary"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <CreatureSanctuaryView
                profile={profile}
                onFeedCreature={handleFeedCreature}
                onPetCreature={handlePetCreature}
                onInteractAction={handleInteractCreature}
                onHatchCreature={handleHatchCreature}
                creatureDialogue={creatureDialogue}
                onUpdateCreatureName={handleUpdateCreatureName}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Focus Timer Modal */}
      <FocusTimerModal
        isOpen={isFocusTimerOpen}
        onClose={() => setIsFocusTimerOpen(false)}
        initialMinutes={focusTimerInitialMinutes}
        taskTitle={focusTimerTaskTitle}
        creatureType={profile.creature.type}
        creatureStage={profile.creature.stage}
        creatureName={profile.creature.name}
        onCompleteFocusSession={handleCompleteFocusSession}
      />

      {/* Evolution Milestone Choice Modal (SCHOLAR, ADVENTURER, CREATOR) */}
      <EvolutionChoiceModal
        isOpen={isEvolutionChoiceOpen}
        creatureName={profile.creature.name}
        onChoose={handleChooseEvolution}
      />

      {/* Settings Modal (Integrations, Google Calendar, Audio, Account) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Evolution Milestone Toast / Modal */}
      <AnimatePresence>
        {evolutionCelebration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-[#09090f]/95 border border-amber-500/40 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(245,158,11,0.25)] space-y-4 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px] pointer-events-none" />
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-200 text-black flex items-center justify-center mx-auto text-2xl font-bold shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                🌟
              </div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-amber-400 font-bold">
                Transcendence Reached
              </div>
              <h3 className="text-2xl font-serif italic text-white">
                Evolution Awakened!
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                {evolutionCelebration.creatureName} reached Level {evolutionCelebration.newLevel} and evolved into its{' '}
                <span className="font-bold uppercase tracking-wider text-amber-400">
                  {evolutionCelebration.newStage}
                </span>{' '}
                form!
              </p>
              <button
                onClick={() => setEvolutionCelebration(null)}
                className="w-full py-3 bg-white hover:bg-amber-400 text-black font-bold uppercase tracking-widest rounded-xl text-xs transition-colors cursor-pointer shadow-lg"
              >
                Honor & Continue
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Gemini Daily Intent Modal: "What do you want to learn or accomplish today?" */}
      <DailyIntentModal
        isOpen={isDailyIntentOpen}
        onClose={() => setIsDailyIntentOpen(false)}
        onJourneyApplied={handleJourneyApplied}
        currentGoalTitle={profile.goal.title}
        userEmail={profile.email}
      />

      {/* 24/7 Gemini Support Chatbot */}
      <GeminiChatbot
        isOpen={isSupportChatOpen}
        onToggle={() => setIsSupportChatOpen(!isSupportChatOpen)}
        currentGoalTitle={profile.goal.title}
        learningTopic={profile.goal.description || profile.goal.title}
        currentDay={profile.currentDayIndex || 1}
        tasksSummary={profile.tasks.map((t) => `• ${t.title} (${t.completed ? 'completed' : 'pending'})`).slice(0, 5).join('\n')}
      />
    </div>
  );
}
