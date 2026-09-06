import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { 
  authenticateFirebaseUser, 
  AuthenticatedRequest 
} from "./server/firebaseAdmin";
import { 
  getOrCreatePetAndStats, 
  recordProductivityAction, 
  chooseEvolutionBranch,
  hatchEgg,
  calculateLevelFromXp,
  EVOLUTION_MILESTONE_XP
} from "./server/progression";
import { 
  getOrCreateUserRecord, 
  saveUserRecord,
  createDefaultRoadmap
} from "./server/store";
import { 
  planGoalWithGemini, 
  reflectOnJournalWithGemini, 
  chatWithCompanionIsolated,
  chatWithGeminiSupport,
  createJourneyWithGemini,
  generateRealityCheckWithGemini,
  MinimalCalendarEvent
} from "./server/geminiService";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

// Health check for Cloud Run ingress and uptime monitoring
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "astral-growth-sanctuary",
    environment: process.env.NODE_ENV || "development",
  });
});

// Onboarding discovery conversation (can run before user creates profile)
app.post("/api/ai/onboarding-chat", async (req, res) => {
  try {
    const { messages } = req.body;
    let lastUserMessage = "Hello! I am ready to start my journey.";
    if (messages && messages.length > 0) {
      lastUserMessage = messages[messages.length - 1].content;
    }

    const plan = await planGoalWithGemini({
      goalInput: lastUserMessage,
      targetDays: 14,
      dailyMinutes: 30,
    });

    res.json({
      reply: `I hear your ambition with crystalline clarity! Let us forge your quest for "${lastUserMessage}". Choose your daily focus duration and prepare to bond with your mythical companion egg!`,
      previewPlan: plan,
    });
  } catch (error: any) {
    console.error("Error in /api/ai/onboarding-chat:", error);
    res.json({
      reply: "Welcome to the Astral Sanctuary. What dream or skill do you wish to conquer together?",
    });
  }
});

// ==========================================
// AUTHENTICATED ENDPOINTS (STEPS 1, 4, 7, 8, 9)
// Note: All private endpoints verify the Firebase Bearer token server-side.
// The user's UID is derived EXCLUSIVELY from the verified token (req.user.uid).
// Any client-supplied UID in body or params is strictly ignored.
// ==========================================

/**
 * Sync entire user profile, pet state, stats, active quest, tasks, and journals
 */
app.get("/api/user/sync", authenticateFirebaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const email = req.user!.email || "traveler@sanctuary.app";

    const record = await getOrCreateUserRecord(uid, email);

    // Resilience guarantee: If user has a pet or stats, ensure activeQuest is present so they never get stuck on onboarding
    if (!record.activeQuest) {
      const goalTitle = record.userData?.goal?.title || "Mastery & Growth Quest";
      record.activeQuest = {
        goalTitle,
        goalDescription: record.userData?.goal?.description || "Consistent daily progression in the astral sanctuary.",
        targetDays: record.userData?.goal?.targetDays || 14,
        dailyMinutes: record.userData?.goal?.dailyMinutes || 30,
        roadmapData: createDefaultRoadmap(goalTitle, 14, 30),
        currentDayIndex: 1,
        createdAt: record.pet?.evolutionHistory?.[0]?.timestamp || new Date().toISOString(),
      };
      record.initialized = true;
      if (!record.tasks || record.tasks.length === 0) {
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
      await saveUserRecord(record);
    } else if (!record.activeQuest.currentDayIndex) {
      // Auto-compute from logged journal entries if not set
      const entries = record.journalEntries || [];
      const maxLoggedDay = entries.reduce((max: number, e: any) => Math.max(max, Number(e.dayNumber) || 0), 0);
      record.activeQuest.currentDayIndex = maxLoggedDay > 0
        ? Math.min(record.activeQuest.targetDays || 14, maxLoggedDay + 1)
        : 1;
      await saveUserRecord(record);
    }

    res.json({
      uid,
      email,
      initialized: record.initialized,
      userData: record.userData,
      pet: record.pet,
      stats: record.stats,
      activeQuest: record.activeQuest,
      tasks: record.tasks || [],
      journalEntries: record.journalEntries || [],
      calendarConnected: !!record.calendarAccessToken,
      calendarConnectedAt: record.calendarConnectedAt || null,
    });
  } catch (error: any) {
    console.error("Error in /api/user/sync:", error);
    res.status(500).json({ error: "Failed to synchronize user state." });
  }
});

/**
 * Initialize user profile and seed initial quests and starter tasks.
 * PRESERVES existing pet XP, stage, evolution, and user streaks!
 */
app.post("/api/user/init", authenticateFirebaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const email = req.user!.email || req.body.email || "traveler@sanctuary.app";
    const { goal, creatureType, creatureName, roadmapData } = req.body;
    const now = new Date().toISOString();

    const record = await getOrCreateUserRecord(uid, email);

    // 1. Set root profile
    record.initialized = true;
    record.email = email;
    record.userData = {
      email,
      displayName: creatureName ? `${creatureName}'s Guardian` : (record.userData?.displayName || "Seeker"),
      createdAt: record.userData?.createdAt || now,
      updatedAt: now,
      goal: goal || record.userData?.goal || {
        title: "Mastery Quest",
        description: "Consistent daily progression",
        targetDays: 14,
        dailyMinutes: 30,
      },
    };

    // 2. Pet state: PRESERVE existing XP, stage, level, affinity, and history if pet already exists!
    if (record.pet && (record.pet.xp > 0 || record.pet.stage !== "EGG")) {
      // Pet has already progressed: preserve everything, only updating name if provided
      if (creatureName) record.pet.name = creatureName;
    } else {
      // Pet is still an egg or new: initialize or update name/type
      record.pet = {
        name: creatureName || record.pet?.name || "Astral Companion",
        type: creatureType || record.pet?.type || "golden_celestial_wolf",
        stage: record.pet?.stage || "EGG",
        xp: record.pet?.xp || 0,
        level: record.pet?.level || 1,
        evolutionPath: record.pet?.evolutionPath || null,
        pendingEvolutionChoice: record.pet?.pendingEvolutionChoice || false,
        affinity: record.pet?.affinity || 30,
        vitality: record.pet?.vitality ?? 100,
        energy: record.pet?.energy ?? 100,
        evolutionHistory: (record.pet?.evolutionHistory && record.pet.evolutionHistory.length > 0)
          ? record.pet.evolutionHistory
          : [
              {
                event: `Celestial egg chosen for quest: "${goal?.title || "Mastery Quest"}"`,
                stage: "EGG",
                level: 1,
                xp: 0,
                timestamp: now,
              },
            ],
      };
    }

    // 3. Stats summary: PRESERVE existing streaks, tasksCompleted, and stardust!
    if (record.stats) {
      record.stats.currentStreak = Math.max(1, record.stats.currentStreak || 1);
      record.stats.bestStreak = Math.max(record.stats.currentStreak, record.stats.bestStreak || 1);
      record.stats.stardust = Math.max(50, record.stats.stardust || 50);
      record.stats.tasksCompleted = record.stats.tasksCompleted || 0;
      record.stats.lastActiveDate = record.stats.lastActiveDate || now.split("T")[0];
    } else {
      record.stats = {
        totalXp: record.pet?.xp || 0,
        tasksCompleted: 0,
        currentStreak: 1,
        bestStreak: 1,
        lastActiveDate: now.split("T")[0],
        stardust: 50,
      };
    }

    // 4. Save active quest & roadmap with deep sanitization
    const goalTitle = goal?.title || record.activeQuest?.goalTitle || "Mastery Quest";
    const targetDays = Number(goal?.targetDays) || record.activeQuest?.targetDays || 14;
    const dailyMinutes = Number(goal?.dailyMinutes) || record.activeQuest?.dailyMinutes || 30;
    const sanitizedRoadmap = roadmapData 
      ? JSON.parse(JSON.stringify(roadmapData)) 
      : (record.activeQuest?.roadmapData || createDefaultRoadmap(goalTitle, targetDays, dailyMinutes));

    const currentDayIndex = Math.max(1, Number(req.body.currentDayIndex) || record.activeQuest?.currentDayIndex || 1);

    record.activeQuest = {
      goalTitle,
      goalDescription: goal?.description || record.activeQuest?.goalDescription || "",
      targetDays,
      dailyMinutes,
      roadmapData: sanitizedRoadmap,
      currentDayIndex,
      createdAt: record.activeQuest?.createdAt || now,
    };

    // 5. Seed initial tasks if none exist, otherwise retain existing tasks
    if (!record.tasks || record.tasks.length === 0) {
      const initialTasks: any[] = [];
      try {
        const day1Tasks = sanitizedRoadmap?.days?.[0]?.tasks 
          || sanitizedRoadmap?.todaysRecommendedTasks 
          || [
            { title: `Kick off Day 1: ${goalTitle}`, estimatedMinutes: 25, priority: 'high' }
          ];

        for (let i = 0; i < day1Tasks.length; i++) {
          const taskItem = day1Tasks[i];
          if (!taskItem) continue;
          const title = typeof taskItem === 'string' 
            ? taskItem 
            : (taskItem.title || `Day 1 Focus Session ${i + 1}`);
          const estimatedMinutes = typeof taskItem === 'object' && taskItem.estimatedMinutes 
            ? Number(taskItem.estimatedMinutes) 
            : 25;
          const priority = typeof taskItem === 'object' && taskItem.priority 
            ? taskItem.priority 
            : "high";

          const taskId = `task_d1_${i}_${Date.now()}`;
          const taskDoc = {
            id: taskId,
            title: String(title),
            estimatedMinutes: estimatedMinutes || 25,
            priority: priority || "high",
            category: "Foundational Step",
            completed: false,
            roadmapDayNumber: 1,
            createdAt: now,
          };
          initialTasks.push(taskDoc);
        }
      } catch (taskSeedError) {
        console.warn("Non-fatal task seeding warning in /api/user/init:", taskSeedError);
      }
      record.tasks = initialTasks;
    }

    await saveUserRecord(record);

    res.json({
      success: true,
      pet: record.pet,
      stats: record.stats,
      tasks: record.tasks,
    });
  } catch (error: any) {
    console.error("Error in /api/user/init:", error);
    res.status(500).json({ error: "Failed to initialize user profile." });
  }
});

// ==========================================
// STEP 5A: GOAL PLANNER (GEMINI)
// ==========================================
app.post("/api/ai/goal-planner", authenticateFirebaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { goalTitle, goalDescription, targetDays, dailyMinutes } = req.body;
    const plan = await planGoalWithGemini({
      goalInput: `${goalTitle || "Personal Mastery"}. ${goalDescription || ""}`,
      targetDays: parseInt(targetDays) || 14,
      dailyMinutes: parseInt(dailyMinutes) || 30,
    });

    res.json(plan);
  } catch (error: any) {
    console.error("Error in /api/ai/goal-planner:", error);
    res.status(500).json({ error: "Failed to plan goal with AI." });
  }
});

// Compatibility route for legacy frontend call
app.post("/api/ai/generate-roadmap", authenticateFirebaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { goalTitle, goalDescription, targetDays, dailyMinutes } = req.body;
    const plan = await planGoalWithGemini({
      goalInput: `${goalTitle || "Personal Mastery"}. ${goalDescription || ""}`,
      targetDays: parseInt(targetDays) || 14,
      dailyMinutes: parseInt(dailyMinutes) || 30,
    });
    res.json(plan);
  } catch (error: any) {
    console.error("Error in /api/ai/generate-roadmap:", error);
    res.status(500).json({ error: "Failed to generate roadmap." });
  }
});

// ==========================================
// STEP 5B + STEP 7/8/9: JOURNAL REFLECTION (GEMINI + SERVER-AUTHORITATIVE XP)
// ==========================================
app.post("/api/ai/journal-reflection", authenticateFirebaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const { mood, whatHappened, feelings, wins, challenges, dayNumber, goalTitle } = req.body;

    const { petData } = await getOrCreatePetAndStats(uid);

    // 1. Generate structured reflection via server-side Gemini service
    const reflection = await reflectOnJournalWithGemini({
      mood: mood || "reflective",
      whatHappened: whatHappened || "Focused effort logged",
      feelings,
      wins,
      challenges,
      petName: petData.name,
      petType: petData.type,
      petStage: petData.stage,
      goalTitle,
      dayNumber: parseInt(dayNumber) || 1,
    });

    // 2. Server-authoritative XP and progression award (Step 7, 8, 9)
    // Submitting a thoughtful daily reflection is a meaningful productivity action
    const BASE_JOURNAL_XP = 40;
    const BASE_JOURNAL_STARDUST = 20;

    const progressionResult = await recordProductivityAction({
      uid,
      actionLabel: `Logged Day ${dayNumber || 1} Journal Reflection`,
      baseXp: BASE_JOURNAL_XP,
      baseStardust: BASE_JOURNAL_STARDUST,
    });

    // 3. Persist journal entry strictly under users/{uid}/journals/{journalId}
    const cleanStr = (s: any) => typeof s === 'string' ? s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') : '';
    const journalId = `journal_${Date.now()}`;
    const now = new Date().toISOString();
    const journalDoc = {
      id: journalId,
      date: now.split("T")[0],
      dayNumber: parseInt(dayNumber) || 1,
      mood: cleanStr(mood) || "reflective",
      whatHappened: cleanStr(whatHappened),
      feelings: cleanStr(feelings),
      wins: cleanStr(wins),
      challenges: cleanStr(challenges),
      reflectionSummary: cleanStr(reflection.summary),
      reflectionProgress: cleanStr(reflection.progress),
      reflectionObstacles: cleanStr(reflection.obstacles),
      reflectionNextAction: cleanStr(reflection.suggestedNextAction),
      reflectionInsight: cleanStr(`${reflection.summary}\n\n${reflection.progress}`),
      actionableAdvice: cleanStr(reflection.suggestedNextAction),
      creatureWhisper: cleanStr(reflection.creatureWhisper),
      xpEarned: BASE_JOURNAL_XP,
      stardustEarned: BASE_JOURNAL_STARDUST,
      createdAt: now,
    };

    const record = await getOrCreateUserRecord(uid);
    if (!record.journalEntries) {
      record.journalEntries = [];
    }
    record.journalEntries.unshift(journalDoc);

    // Automatically advance active quest horizon to next day upon completing reflection
    const currentLoggedDay = parseInt(dayNumber) || record.activeQuest?.currentDayIndex || 1;
    const targetDays = record.activeQuest?.targetDays || 14;
    const nextDayIndex = Math.min(targetDays, currentLoggedDay + 1);
    if (record.activeQuest) {
      record.activeQuest.currentDayIndex = nextDayIndex;
    }
    await saveUserRecord(record);

    res.json({
      ...reflection,
      xpEarned: BASE_JOURNAL_XP,
      stardustEarned: BASE_JOURNAL_STARDUST,
      journalEntry: journalDoc,
      currentDayIndex: nextDayIndex,
      pet: progressionResult.pet,
      stats: progressionResult.stats,
      stageChanged: progressionResult.stageChanged,
      pendingEvolutionChoice: progressionResult.pendingEvolutionChoice,
    });
  } catch (error: any) {
    console.error("Error in /api/ai/journal-reflection:", error);
    res.status(500).json({ error: "Failed to process journal reflection." });
  }
});

// ==========================================
// QUEST PROGRESSION: SET / ADVANCE CURRENT DAY
// ==========================================
app.post("/api/quest/set-day", authenticateFirebaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const dayNumber = Math.max(1, parseInt(req.body.dayNumber) || 1);
    const record = await getOrCreateUserRecord(uid);
    if (!record.activeQuest) {
      record.activeQuest = {};
    }
    record.activeQuest.currentDayIndex = dayNumber;
    await saveUserRecord(record);
    res.json({ success: true, currentDayIndex: dayNumber });
  } catch (error: any) {
    console.error("Error in /api/quest/set-day:", error);
    res.status(500).json({ error: "Failed to update quest day." });
  }
});

// ==========================================
// GOOGLE CALENDAR INTEGRATION & REALITY CHECK
// - OAuth token kept strictly server-side
// - Read-only calendar events access
// - Minimal context query (title, start time, end time for relevant day only)
// - Gemini Reality Check linking journal reflection to actual schedule
// ==========================================

// 1. Calendar Status Check (Never exposes access token)
app.get("/api/calendar/status", authenticateFirebaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const record = await getOrCreateUserRecord(uid);
    res.json({
      connected: !!record.calendarAccessToken,
      connectedAt: record.calendarConnectedAt || null,
    });
  } catch (error: any) {
    console.error("Error in /api/calendar/status:", error);
    res.status(500).json({ error: "Failed to fetch calendar status." });
  }
});

// 2. Connect Calendar (Receives client-acquired token, tests it, stores server-side only)
app.post("/api/calendar/connect", authenticateFirebaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const { accessToken } = req.body;

    if (!accessToken || typeof accessToken !== "string") {
      res.status(400).json({ error: "accessToken is required." });
      return;
    }

    // Verify token validity against Google Calendar API
    const testRes = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=1", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!testRes.ok) {
      const errText = await testRes.text();
      console.warn("[Google Calendar] Token validation failed:", testRes.status, errText);
      res.status(400).json({ error: "Google Calendar authorization failed or token is invalid." });
      return;
    }

    // Persist token safely server-side
    const record = await getOrCreateUserRecord(uid);
    record.calendarAccessToken = accessToken;
    record.calendarConnectedAt = new Date().toISOString();
    await saveUserRecord(record);

    res.json({
      success: true,
      connected: true,
      connectedAt: record.calendarConnectedAt,
      message: "Google Calendar connected successfully with read-only access.",
    });
  } catch (error: any) {
    console.error("Error in /api/calendar/connect:", error);
    res.status(500).json({ error: "Failed to connect Google Calendar." });
  }
});

// 3. Disconnect Calendar
app.post("/api/calendar/disconnect", authenticateFirebaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const record = await getOrCreateUserRecord(uid);
    delete record.calendarAccessToken;
    delete record.calendarConnectedAt;
    await saveUserRecord(record);

    res.json({
      success: true,
      connected: false,
      message: "Google Calendar disconnected.",
    });
  } catch (error: any) {
    console.error("Error in /api/calendar/disconnect:", error);
    res.status(500).json({ error: "Failed to disconnect calendar." });
  }
});

// 4. Reality Check: Retrieve relevant day's calendar events & synthesize with Gemini
app.post("/api/journal/reality-check", authenticateFirebaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const { journalEntryId, date, whatHappened, feelings, wins, challenges, mood, goalTitle } = req.body;

    const record = await getOrCreateUserRecord(uid);

    if (!record.calendarAccessToken) {
      res.status(400).json({
        error: "CALENDAR_NOT_CONNECTED",
        message: "Google Calendar is not connected. Please connect under Settings → Integrations.",
      });
      return;
    }

    // Determine 24-hour window for the relevant journal entry date
    let targetDate = new Date();
    if (date) {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        targetDate = parsed;
      }
    }

    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const day = targetDate.getDate();
    // UTC window covering start and end of that calendar day
    const timeMin = new Date(Date.UTC(year, month, day, 0, 0, 0)).toISOString();
    const timeMax = new Date(Date.UTC(year, month, day, 23, 59, 59, 999)).toISOString();

    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=50`;

    const calRes = await fetch(calendarUrl, {
      headers: {
        Authorization: `Bearer ${record.calendarAccessToken}`,
      },
    });

    if (calRes.status === 401 || calRes.status === 403) {
      delete record.calendarAccessToken;
      delete record.calendarConnectedAt;
      await saveUserRecord(record);
      res.status(401).json({
        error: "CALENDAR_TOKEN_EXPIRED",
        message: "Google Calendar authorization expired. Please reconnect under Settings → Integrations.",
      });
      return;
    }

    if (!calRes.ok) {
      console.warn("[Google Calendar] Failed to fetch events:", calRes.status);
      res.status(502).json({ error: "Failed to fetch calendar events from Google Calendar." });
      return;
    }

    const calData = await calRes.json();

    // Extract ONLY minimal context: title, start time, end time
    const minimalEvents: MinimalCalendarEvent[] = (calData.items || []).map((item: any) => {
      let formattedStart = item.start?.dateTime || item.start?.date || "All Day";
      let formattedEnd = item.end?.dateTime || item.end?.date || "";
      try {
        if (item.start?.dateTime) {
          formattedStart = new Date(item.start.dateTime).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          });
        }
        if (item.end?.dateTime) {
          formattedEnd = new Date(item.end.dateTime).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          });
        }
      } catch {}

      return {
        title: item.summary || "Untitled Event",
        startTime: formattedStart,
        endTime: formattedEnd,
      };
    });

    // Send journal entry + minimal calendar context to Gemini
    const realityCheck = await generateRealityCheckWithGemini({
      date: date || targetDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      whatHappened: whatHappened || "",
      feelings: feelings || "",
      wins: wins || "",
      challenges: challenges || "",
      mood: mood || "reflective",
      goalTitle: goalTitle || record.activeQuest?.goalTitle || "Personal Mastery",
      events: minimalEvents,
    });

    const realityCheckPayload = {
      insight: realityCheck.insight,
      scheduleContext: minimalEvents,
      scheduleSummary: realityCheck.scheduleSummary,
      alignmentTakeaway: realityCheck.alignmentTakeaway,
      generatedAt: new Date().toISOString(),
    };

    // Store realityCheck onto the user's journal entry in record if journalEntryId provided
    if (journalEntryId && record.journalEntries) {
      const entryIdx = record.journalEntries.findIndex((e: any) => e.id === journalEntryId);
      if (entryIdx !== -1) {
        record.journalEntries[entryIdx].realityCheck = realityCheckPayload;
        await saveUserRecord(record);
      }
    }

    res.json({
      success: true,
      journalEntryId,
      realityCheck: realityCheckPayload,
    });
  } catch (error: any) {
    console.error("Error in /api/journal/reality-check:", error);
    res.status(500).json({ error: "Failed to generate reality check." });
  }
});

// ==========================================
// STEP 5C: MULTI-TURN AI COMPANION (ISOLATED HISTORY)
// ==========================================
app.post("/api/ai/companion-chat", authenticateFirebaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const { message, conversationId, goalTitle } = req.body;

    if (!message || !message.trim()) {
      res.status(400).json({ error: "Message content cannot be empty." });
      return;
    }

    const { petData } = await getOrCreatePetAndStats(uid);

    const chatResponse = await chatWithCompanionIsolated({
      uid,
      message: message.trim(),
      conversationId: conversationId || "default_companion_chat",
      petName: petData.name,
      petType: petData.type,
      petStage: petData.stage,
      goalTitle: goalTitle || "Personal Mastery",
    });

    res.json(chatResponse);
  } catch (error: any) {
    console.error("Error in /api/ai/companion-chat:", error);
    res.status(500).json({ error: "Failed to process companion chat." });
  }
});

// Legacy creature dialogue route forwarding to isolated companion
app.post("/api/ai/creature-dialogue", authenticateFirebaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const { actionType, currentMood, goalTitle } = req.body;
    const { petData } = await getOrCreatePetAndStats(uid);

    const chatResponse = await chatWithCompanionIsolated({
      uid,
      message: `[Action: ${actionType || "greet"}, Mood: ${currentMood || "peaceful"}]`,
      petName: petData.name,
      petType: petData.type,
      petStage: petData.stage,
      goalTitle: goalTitle || "Personal Mastery",
    });

    res.json({ message: chatResponse.reply });
  } catch (error: any) {
    console.error("Error in /api/ai/creature-dialogue:", error);
    res.json({ message: "The companion gazes upon you with steadfast cosmic love. ✨" });
  }
});

// ==========================================
// GEMINI JOURNEY CREATOR & DEDICATED SUPPORT CHATBOT
// ==========================================

/**
 * Creates a tailored learning & accomplishment journey when user specifies what they want to learn/accomplish today
 */
app.post("/api/ai/create-journey", authenticateFirebaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { intent, learningTopic, targetDays, dailyMinutes } = req.body;
    if (!intent || !intent.trim()) {
      res.status(400).json({ error: "Please provide what you want to learn or accomplish." });
      return;
    }

    const journey = await createJourneyWithGemini({
      intent: intent.trim(),
      learningTopic: learningTopic?.trim(),
      targetDays: parseInt(targetDays) || 14,
      dailyMinutes: parseInt(dailyMinutes) || 30,
    });

    res.json({ success: true, journey });
  } catch (error: any) {
    console.error("Error in /api/ai/create-journey:", error);
    res.status(500).json({ error: "Failed to generate journey with Gemini." });
  }
});

/**
 * Applies a generated journey to the user's active quest, tasks, and roadmap
 */
app.post("/api/ai/apply-journey", authenticateFirebaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const { journey, targetDays = 14, dailyMinutes = 30 } = req.body;

    if (!journey || !journey.journeyTitle) {
      res.status(400).json({ error: "Invalid journey payload." });
      return;
    }

    const record = await getOrCreateUserRecord(uid);
    const now = new Date().toISOString();

    // 1. Update active quest
    record.activeQuest = {
      goalTitle: journey.journeyTitle,
      goalDescription: journey.overview || journey.todaysFocus || "",
      targetDays: parseInt(targetDays) || journey.days?.length || 14,
      dailyMinutes: parseInt(dailyMinutes) || 30,
      roadmapData: journey,
      currentDayIndex: 1,
      createdAt: now,
    };

    if (!record.userData) {
      record.userData = {};
    }
    record.userData.goal = {
      title: journey.journeyTitle,
      description: journey.overview || "",
      targetDays: parseInt(targetDays) || 14,
      dailyMinutes: parseInt(dailyMinutes) || 30,
    };

    // 2. Synthesize today's tasks from the journey
    const initialTasks: any[] = [];
    const sourceTasks = journey.todaysTasks || journey.days?.[0]?.tasks || [];

    sourceTasks.forEach((t: any, idx: number) => {
      const title = typeof t === "string" ? t : (t.title || `Day 1 Step ${idx + 1}`);
      const estimatedMinutes = typeof t === "object" && t.estimatedMinutes ? Number(t.estimatedMinutes) : 25;
      const priority = typeof t === "object" && t.priority ? t.priority : "high";
      const taskId = `task_journey_${idx}_${Date.now()}`;

      initialTasks.push({
        id: taskId,
        title: String(title),
        estimatedMinutes,
        priority,
        category: "Learning & Implementation",
        completed: false,
        roadmapDayNumber: 1,
        createdAt: now,
      });
    });

    record.tasks = initialTasks;
    await saveUserRecord(record);

    res.json({
      success: true,
      activeQuest: record.activeQuest,
      tasks: record.tasks,
      message: `Journey for "${journey.journeyTitle}" has been initiated!`,
    });
  } catch (error: any) {
    console.error("Error in /api/ai/apply-journey:", error);
    res.status(500).json({ error: "Failed to apply journey." });
  }
});

/**
 * Gemini Chatbot Support conversation
 */
app.post("/api/ai/gemini-support-chat", authenticateFirebaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const { message, conversationId, currentGoal, learningTopic, currentDay, tasksSummary } = req.body;

    if (!message || !message.trim()) {
      res.status(400).json({ error: "Message content cannot be empty." });
      return;
    }

    const { petData } = await getOrCreatePetAndStats(uid);

    const chatResponse = await chatWithGeminiSupport({
      uid,
      message: message.trim(),
      conversationId: conversationId || "gemini_support_chat",
      currentGoal: currentGoal || "Personal Mastery & Learning",
      learningTopic,
      currentDay: parseInt(currentDay) || 1,
      tasksSummary,
      petName: petData.name,
    });

    res.json(chatResponse);
  } catch (error: any) {
    console.error("Error in /api/ai/gemini-support-chat:", error);
    res.status(500).json({ error: "Failed to chat with Gemini Support." });
  }
});

/**
 * Retrieve chat history for Gemini Support Chatbot
 */
app.get("/api/ai/support-history", authenticateFirebaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const conversationId = (req.query.conversationId as string) || "gemini_support_chat";
    const record = await getOrCreateUserRecord(uid);

    const history = record.conversations?.[conversationId] || [];
    res.json({ success: true, history });
  } catch (error: any) {
    console.error("Error in /api/ai/support-history:", error);
    res.status(500).json({ error: "Failed to retrieve support history." });
  }
});

// ==========================================
// STEP 7: SERVER-AUTHORITATIVE XP & IDEMPOTENT TASK COMPLETION
// The client cannot send {"xp": 999999}.
// Client sends: "task 123 was completed".
// Server verifies user, verifies task exists, verifies task belongs to user,
// verifies task not already completed, calculates legitimate XP, records completion,
// awards XP, updates progression.
// ==========================================
app.post("/api/tasks/complete", authenticateFirebaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const { taskId, title, estimatedMinutes, priority, category, roadmapDayNumber, toggle, uncomplete } = req.body;

    if (!taskId) {
      res.status(400).json({ error: "taskId is required." });
      return;
    }

    const record = await getOrCreateUserRecord(uid);
    if (!record.tasks) {
      record.tasks = [];
    }

    let taskIndex = record.tasks.findIndex((t: any) => t.id === taskId);
    let taskData: any = null;

    if (taskIndex === -1) {
      taskData = {
        id: taskId,
        title: title || "Daily Productivity Quest",
        estimatedMinutes: Number(estimatedMinutes) || 25,
        priority: priority || "high",
        category: category || "Foundational Step",
        completed: false,
        roadmapDayNumber: Number(roadmapDayNumber) || 1,
        createdAt: new Date().toISOString(),
      };
      record.tasks.unshift(taskData);
      taskIndex = 0;
    } else {
      taskData = record.tasks[taskIndex];
    }

    // Toggle back to uncompleted if requested
    if (uncomplete === true || (toggle && taskData.completed === true)) {
      taskData.completed = false;
      taskData.uncompletedAt = new Date().toISOString();
      record.tasks[taskIndex] = taskData;
      await saveUserRecord(record);

      const { petData, statsData } = await getOrCreatePetAndStats(uid);
      res.json({
        success: true,
        uncompleted: true,
        alreadyCompleted: false,
        task: taskData,
        pet: petData,
        stats: statsData,
        xpAwarded: 0,
        stardustAwarded: 0,
        stageChanged: false,
        pendingEvolutionChoice: false,
      });
      return;
    }

    // IDEMPOTENCY CHECK: Completing the same task twice MUST NOT award XP twice
    if (taskData.completed === true) {
      const { petData, statsData } = await getOrCreatePetAndStats(uid);
      res.json({
        alreadyCompleted: true,
        message: "Task was already completed. No duplicate XP awarded.",
        task: taskData,
        pet: petData,
        stats: statsData,
        xpAwarded: 0,
        stardustAwarded: 0,
      });
      return;
    }

    // Determine legitimate XP reward based on task duration & priority
    const minutes = taskData.estimatedMinutes || 25;
    const priorityMultiplier = taskData.priority === "high" ? 1.2 : taskData.priority === "low" ? 0.8 : 1.0;
    const legitimateXp = Math.min(Math.max(Math.round((minutes >= 30 ? 35 : 25) * priorityMultiplier), 15), 50);
    const legitimateStardust = 10;

    const now = new Date().toISOString();

    // Mark task completed
    taskData.completed = true;
    taskData.completedAt = now;
    taskData.xpRewarded = legitimateXp;
    record.tasks[taskIndex] = taskData;
    await saveUserRecord(record);

    // Record productivity action on server
    const progressionResult = await recordProductivityAction({
      uid,
      actionLabel: `Completed Quest: "${taskData.title}"`,
      baseXp: legitimateXp,
      baseStardust: legitimateStardust,
      isTaskCompletion: true,
    });

    res.json({
      success: true,
      alreadyCompleted: false,
      task: taskData,
      pet: progressionResult.pet,
      stats: progressionResult.stats,
      xpAwarded: legitimateXp,
      stardustAwarded: legitimateStardust,
      stageChanged: progressionResult.stageChanged,
      pendingEvolutionChoice: progressionResult.pendingEvolutionChoice,
    });
  } catch (error: any) {
    console.error("Error in /api/tasks/complete:", error);
    res.status(500).json({ error: "Failed to complete task server-authoritatively." });
  }
});

// Create task in user's isolated collection
app.post("/api/tasks/create", authenticateFirebaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const { title, estimatedMinutes, priority, category, roadmapDayNumber } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ error: "Task title cannot be empty." });
      return;
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const taskDoc = {
      id: taskId,
      title: title.trim(),
      estimatedMinutes: parseInt(estimatedMinutes) || 25,
      priority: ["high", "medium", "low"].includes(priority) ? priority : "medium",
      category: category || "General Quest",
      completed: false,
      roadmapDayNumber: parseInt(roadmapDayNumber) || 1,
      createdAt: now,
    };

    const record = await getOrCreateUserRecord(uid);
    if (!record.tasks) {
      record.tasks = [];
    }
    record.tasks.unshift(taskDoc);
    await saveUserRecord(record);

    res.json(taskDoc);
  } catch (error: any) {
    console.error("Error in /api/tasks/create:", error);
    res.status(500).json({ error: "Failed to create task." });
  }
});

// Delete task from user's isolated collection
app.post("/api/tasks/delete", authenticateFirebaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const { taskId } = req.body;
    if (!taskId) {
      res.status(400).json({ error: "taskId is required." });
      return;
    }

    const record = await getOrCreateUserRecord(uid);
    if (record.tasks) {
      record.tasks = record.tasks.filter((t: any) => t.id !== taskId);
      await saveUserRecord(record);
    }

    res.json({ success: true, taskId });
  } catch (error: any) {
    console.error("Error in /api/tasks/delete:", error);
    res.status(500).json({ error: "Failed to delete task." });
  }
});

// ==========================================
// STEP 8: PET PROGRESSION & EVOLUTION CHOICE
// At 500 XP milestone: user chooses SCHOLAR, ADVENTURER, or CREATOR.
// Server verifies eligibility before applying choice.
// ==========================================
app.post("/api/pet/choose-evolution", authenticateFirebaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const { choice } = req.body;

    if (!choice || !["SCHOLAR", "ADVENTURER", "CREATOR"].includes(choice)) {
      res.status(400).json({ error: "Invalid evolution choice. Must be SCHOLAR, ADVENTURER, or CREATOR." });
      return;
    }

    const updatedPet = await chooseEvolutionBranch({
      uid,
      choice,
    });

    res.json({
      success: true,
      pet: updatedPet,
      message: `Evolution path chosen: ${choice}! Your companion has awakened!`,
    });
  } catch (error: any) {
    console.error("Error in /api/pet/choose-evolution:", error);
    res.status(400).json({ error: error.message || "Failed to set evolution choice." });
  }
});

// ==========================================
// EGG CRACKING & HATCHING ENDPOINT
// Allows user to crack open and hatch their egg directly!
// ==========================================
app.post("/api/pet/hatch", authenticateFirebaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const result = await hatchEgg(uid);
    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Error in /api/pet/hatch:", error);
    res.status(500).json({ error: "Failed to crack and hatch egg." });
  }
});

// Pet care actions: feed, pet, meditate, crack
app.post("/api/pet/care", authenticateFirebaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const { action } = req.body;
    const { record, petData, statsData } = await getOrCreatePetAndStats(uid);

    const now = new Date().toISOString();

    if (action === "crack") {
      const result = await hatchEgg(uid);
      res.json({
        success: true,
        ...result,
      });
      return;
    }

    if (action === "feed") {
      const STARDUST_COST = 10;
      if (statsData.stardust < STARDUST_COST) {
        res.status(400).json({ error: "Insufficient Stardust. Complete productivity quests to gather more!" });
        return;
      }

      // Safe XP from feeding
      const FEED_XP = 15;
      const newXp = petData.xp + FEED_XP;
      const newLevel = calculateLevelFromXp(newXp);

      const updatedPet = {
        ...petData,
        xp: newXp,
        level: newLevel,
        vitality: Math.min(100, petData.vitality + 15),
        affinity: Math.min(100, petData.affinity + 10),
        lastFedAt: now,
      };

      const updatedStats = {
        ...statsData,
        stardust: statsData.stardust - STARDUST_COST,
        totalXp: statsData.totalXp + FEED_XP,
      };

      record.pet = updatedPet;
      record.stats = updatedStats;
      await saveUserRecord(record);

      res.json({
        success: true,
        pet: updatedPet,
        stats: updatedStats,
        message: `*Munch crunch!* The celestial stardust fills ${petData.name} with radiant vitality! (+${FEED_XP} XP)`,
      });
      return;
    }

    if (action === "pet") {
      const updatedPet = {
        ...petData,
        affinity: Math.min(100, petData.affinity + 5),
        lastPettedAt: now,
      };
      record.pet = updatedPet;
      await saveUserRecord(record);

      res.json({
        success: true,
        pet: updatedPet,
        stats: statsData,
        message: `${petData.name} leans warmly into your palm with joyful celestial purrs!`,
      });
      return;
    }

    res.status(400).json({ error: "Unknown care action." });
  } catch (error: any) {
    console.error("Error in /api/pet/care:", error);
    res.status(500).json({ error: "Failed to perform pet care." });
  }
});

// Focus Session Completion
app.post("/api/focus/complete", authenticateFirebaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const { minutes } = req.body;
    const validMinutes = Math.min(Math.max(parseInt(minutes) || 25, 5), 120);

    // Calculated server-side (cannot be manipulated by frontend)
    const legitimateXp = Math.min(Math.round(validMinutes * 1.2), 60);
    const legitimateStardust = Math.min(Math.round(validMinutes * 0.6), 30);

    const progression = await recordProductivityAction({
      uid,
      actionLabel: `Completed ${validMinutes}-minute Deep Focus Session`,
      baseXp: legitimateXp,
      baseStardust: legitimateStardust,
    });

    res.json({
      success: true,
      minutes: validMinutes,
      xpAwarded: legitimateXp,
      stardustAwarded: legitimateStardust,
      pet: progression.pet,
      stats: progression.stats,
      stageChanged: progression.stageChanged,
      pendingEvolutionChoice: progression.pendingEvolutionChoice,
    });
  } catch (error: any) {
    console.error("Error in /api/focus/complete:", error);
    res.status(500).json({ error: "Failed to record focus session." });
  }
});

// Update pet name
app.post("/api/pet/update-name", authenticateFirebaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const { name } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: "Name cannot be empty." });
      return;
    }

    const { record, petData } = await getOrCreatePetAndStats(uid);
    const updated = { ...petData, name: name.trim().slice(0, 30) };
    record.pet = updated;
    await saveUserRecord(record);

    res.json({ success: true, pet: updated });
  } catch (error: any) {
    console.error("Error in /api/pet/update-name:", error);
    res.status(500).json({ error: "Failed to update pet name." });
  }
});

// ==========================================
// VITE MIDDLEWARE & PRODUCTION STATIC SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Astral Sanctuary server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
