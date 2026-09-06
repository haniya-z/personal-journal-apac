import { GoogleGenAI } from '@google/genai';
import { getOrCreateUserRecord, saveUserRecord } from './store';

// Secret Manager and Environment configuration
// The GEMINI_API_KEY is securely sourced from process.env.GEMINI_API_KEY.
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please check Google Cloud Secret Manager or environment variables.');
  }
  return new GoogleGenAI({ apiKey });
}

// Recommended valid models in priority order.
// Starts with gemini-flash-latest and gemini-3.1-flash-lite to bypass temporary 503 spikes on gemini-3.8-flash.
const FALLBACK_MODELS = [
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.1-pro-preview',
];

async function callGeminiWithFallback(params: {
  contents: any;
  config?: any;
}): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const ai = getGeminiClient();

  for (const model of FALLBACK_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });

      if (response.text && response.text.trim().length > 0) {
        return response.text.trim();
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const isDemandSpike =
        errMsg.includes('503') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('high demand') ||
        errMsg.includes('429');

      if (isDemandSpike) {
        // Immediately try next model in fallback list without spamming warnings
        continue;
      }
      console.warn(`[Gemini Model ${model}] notice:`, errMsg);
    }
  }
  return null;
}

/**
 * A. Goal Planner
 * Input: goal string, e.g. "I want to build a portfolio website."
 * Output structured data:
 * - goal
 * - milestones
 * - tasks
 * - estimated effort
 * - suggested order
 * - today's recommended tasks
 */
export async function planGoalWithGemini(params: {
  goalInput: string;
  targetDays?: number;
  dailyMinutes?: number;
}) {
  const { goalInput, targetDays = 14, dailyMinutes = 30 } = params;

  const prompt = `Deconstruct and architect a step-by-step master plan for the following goal:
Goal: "${goalInput}"
Target Timeline: ${targetDays} days
Daily Focus Commitment: ${dailyMinutes} minutes/day

You must return strictly valid JSON matching this schema:
{
  "goal": string,
  "estimatedEffort": string (e.g., "14 days at 30 mins/day (approx 7 total hours)"),
  "milestones": [
    { "title": string, "day": number, "description": string }
  ],
  "tasks": [
    { "title": string, "estimatedEffort": string, "priority": "high"|"medium"|"low", "suggestedOrder": number, "dayNumber": number }
  ],
  "suggestedOrder": string[],
  "todaysRecommendedTasks": [
    { "title": string, "estimatedMinutes": number, "priority": "high"|"medium"|"low" }
  ],
  "phases": [
    { "phaseNumber": number, "title": string, "description": string, "dayRange": string }
  ],
  "days": [
    {
      "dayNumber": number,
      "phaseNumber": number,
      "title": string,
      "theme": string,
      "dailyTip": string,
      "tasks": [
        { "id": string, "title": string, "estimatedMinutes": number, "priority": "high"|"medium"|"low" }
      ]
    }
  ]
}`;

  const generated = await callGeminiWithFallback({
    contents: prompt,
    config: {
      systemInstruction: 'You are an elite productivity engineer. Break user ambitions down into crystal clear, actionable milestones and daily focus sessions. Return strictly valid JSON.',
      responseMimeType: 'application/json',
    },
  });

  if (generated) {
    try {
      return JSON.parse(generated);
    } catch (e) {
      console.warn('Failed to parse Gemini Goal Planner JSON output:', e);
    }
  }

  // Resilient domain fallback if API is unreachable
  return generateDynamicGoalPlanFallback(goalInput, targetDays, dailyMinutes);
}

/**
 * Creates a tailored learning & accomplishment journey based on what the user wants to learn/accomplish today
 */
export async function createJourneyWithGemini(params: {
  intent: string;
  targetDays?: number;
  dailyMinutes?: number;
  learningTopic?: string;
}) {
  const { intent, targetDays = 14, dailyMinutes = 30, learningTopic } = params;

  const prompt = `The user wants to learn or accomplish the following:
Intent: "${intent}"
Learning Topic: "${learningTopic || intent}"
Target Timeline: ${targetDays} days
Daily Time Commitment: ${dailyMinutes} minutes/day

Synthesize a comprehensive, personalized journey and daily curriculum.
You must return strictly valid JSON matching this schema:
{
  "journeyTitle": string,
  "learningTopic": string,
  "overview": string,
  "todaysFocus": string,
  "mentorAdvice": string,
  "todaysTasks": [
    { "title": string, "estimatedMinutes": number, "priority": "high"|"medium"|"low", "stepTip": string }
  ],
  "milestones": [
    { "title": string, "day": number, "description": string }
  ],
  "phases": [
    { "phaseNumber": number, "title": string, "description": string, "dayRange": string }
  ],
  "days": [
    {
      "dayNumber": number,
      "phaseNumber": number,
      "title": string,
      "theme": string,
      "dailyTip": string,
      "tasks": [
        { "id": string, "title": string, "estimatedMinutes": number, "priority": "high"|"medium"|"low" }
      ]
    }
  ]
}`;

  const generated = await callGeminiWithFallback({
    contents: prompt,
    config: {
      systemInstruction: 'You are an inspiring mentor and curriculum architect. Turn the user\'s learning and accomplishment ambition into an exciting, step-by-step master plan with concrete today tasks. Return strictly valid JSON.',
      responseMimeType: 'application/json',
    },
  });

  if (generated) {
    try {
      const parsed = JSON.parse(generated);
      if (parsed.journeyTitle && parsed.days) {
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse Gemini Journey creation JSON:', e);
    }
  }

  // Resilient fallback plan
  const fallbackPlan = generateDynamicGoalPlanFallback(intent, targetDays, dailyMinutes);
  return {
    journeyTitle: intent,
    learningTopic: learningTopic || intent,
    overview: `A structured ${targetDays}-day learning & execution journey dedicated to mastering ${intent}.`,
    todaysFocus: `Kick off Day 1 foundational concepts and build early momentum for ${intent}.`,
    mentorAdvice: `Focus on consistent 25-minute deliberate practice blocks. Deep engagement beats marathon sessions!`,
    todaysTasks: fallbackPlan.todaysRecommendedTasks.map((t, i) => ({
      title: t.title,
      estimatedMinutes: t.estimatedMinutes,
      priority: t.priority,
      stepTip: i === 0 ? 'Establish clarity on core definitions' : 'Implement a hands-on proof of concept',
    })),
    milestones: fallbackPlan.milestones,
    phases: fallbackPlan.phases,
    days: fallbackPlan.days,
  };
}

function generateDynamicGoalPlanFallback(goal: string, targetDays: number, dailyMinutes: number) {
  const milestones = [
    { title: 'Foundations & Architecture', day: Math.max(1, Math.round(targetDays * 0.25)), description: 'Clarify initial requirements and set up essentials.' },
    { title: 'Core Implementation Sprint', day: Math.max(2, Math.round(targetDays * 0.5)), description: 'Build and test primary mechanics and deliverables.' },
    { title: 'Refinement & Review', day: Math.max(3, Math.round(targetDays * 0.75)), description: 'Polish details, verify edge cases, and eliminate friction.' },
    { title: 'Mastery Launch & Capstone', day: targetDays, description: 'Celebrate completion and reflect on key accomplishments.' },
  ];

  const todaysRecommendedTasks = [
    { title: `Define primary requirements for: ${goal}`, estimatedMinutes: Math.round(dailyMinutes * 0.4), priority: 'high' as const },
    { title: `Execute 1st deep focus implementation sprint`, estimatedMinutes: Math.round(dailyMinutes * 0.4), priority: 'high' as const },
    { title: `Log progress notes and plan Day 2 priorities`, estimatedMinutes: Math.round(dailyMinutes * 0.2), priority: 'medium' as const },
  ];

  const days = Array.from({ length: targetDays }).map((_, idx) => {
    const dayNumber = idx + 1;
    const isMilestone = dayNumber % 7 === 0 || dayNumber === targetDays;
    return {
      dayNumber,
      phaseNumber: dayNumber <= Math.round(targetDays / 2) ? 1 : 2,
      title: `Day ${dayNumber}: ${isMilestone ? 'Sprint Milestone Checkpoint' : 'Deliberate Implementation'}`,
      theme: `Focus on step ${dayNumber} of ${targetDays}`,
      dailyTip: 'Eliminate all tab multitasking. Focus strictly on one atomic deliverable at a time.',
      tasks: [
        { id: `task_${dayNumber}_1`, title: `Primary quest focus for Day ${dayNumber}`, estimatedMinutes: Math.round(dailyMinutes * 0.6), priority: 'high' as const },
        { id: `task_${dayNumber}_2`, title: `Review output and record findings`, estimatedMinutes: Math.round(dailyMinutes * 0.4), priority: 'medium' as const },
      ],
    };
  });

  return {
    goal,
    estimatedEffort: `${targetDays} days at ${dailyMinutes} mins/day (approx ${Math.round((targetDays * dailyMinutes) / 60)} total hours)`,
    milestones,
    tasks: days.flatMap((d) => d.tasks.map((t, i) => ({
      title: t.title,
      estimatedEffort: `${t.estimatedMinutes} mins`,
      priority: t.priority,
      suggestedOrder: d.dayNumber * 10 + i,
      dayNumber: d.dayNumber,
    }))),
    suggestedOrder: milestones.map((m) => m.title),
    todaysRecommendedTasks,
    phases: [
      { phaseNumber: 1, title: 'Phase 1: Foundation & Prototype', description: 'Lay the groundwork and create the core structure.', dayRange: `Days 1-${Math.round(targetDays / 2)}` },
      { phaseNumber: 2, title: 'Phase 2: Refinement & Mastery', description: 'Iterate, finalize details, and achieve milestone launch.', dayRange: `Days ${Math.round(targetDays / 2) + 1}-${targetDays}` },
    ],
    days,
  };
}

/**
 * B. Journal Reflection
 * Input: user journal entry
 * Output:
 * - summary
 * - progress
 * - obstacles
 * - suggested next action
 * - creatureWhisper
 */
export async function reflectOnJournalWithGemini(params: {
  mood: string;
  whatHappened: string;
  feelings?: string;
  wins?: string;
  challenges?: string;
  petName?: string;
  petType?: string;
  petStage?: string;
  goalTitle?: string;
  dayNumber?: number;
}) {
  const {
    mood,
    whatHappened,
    feelings = '',
    wins = '',
    challenges = '',
    petName = 'Astral Companion',
    petType = 'Celestial Guide',
    petStage = 'EGG',
    goalTitle = 'Personal Mastery',
    dayNumber = 1,
  } = params;

  const prompt = `Analyze this daily productivity journal entry for Day ${dayNumber} toward the goal "${goalTitle}":
- User Mood: ${mood}
- What Happened: "${whatHappened}"
- Feelings: "${feelings}"
- Wins: "${wins}"
- Challenges / Obstacles: "${challenges}"
- Pet Companion: ${petName} (${petType}, form: ${petStage})

Generate an empathetic, structured analysis strictly matching this JSON schema:
{
  "summary": string (Concise executive summary of the entry),
  "progress": string (Clear assessment of what progress was achieved),
  "obstacles": string (Identification of primary obstacles or frictions encountered),
  "suggestedNextAction": string (Single highest-leverage recommendation for tomorrow),
  "creatureWhisper": string (Heartwarming in-character message from ${petName})
}`;

  const generated = await callGeminiWithFallback({
    contents: prompt,
    config: {
      systemInstruction: 'You are an insightful mindfulness mentor and productivity coach. Provide constructive, high-empathy feedback and structured reflections in valid JSON format.',
      responseMimeType: 'application/json',
    },
  });

  if (generated) {
    try {
      return JSON.parse(generated);
    } catch (e) {
      console.warn('Failed to parse Gemini Journal Reflection JSON:', e);
    }
  }

  // Resilient fallback
  return {
    summary: `Day ${dayNumber} reflection: Dedicated focus and honest journaling observed under the ${mood} state.`,
    progress: wins ? `Progress celebrated: ${wins}` : `Consistent daily tracking maintained on schedule.`,
    obstacles: challenges ? `Friction noted: ${challenges}. Maintain patience and adapt your strategy.` : 'No critical blockers reported today.',
    suggestedNextAction: 'Prepare your workspace and list your single most important task the evening prior.',
    creatureWhisper: `${petName} snuggles close to your side with celestial warmth: "I witnessed your effort today! Every single step forges our bond stronger!"`,
  };
}

/**
 * C. Multi-turn AI Companion
 * - The user can have an ongoing conversation about their current goals and progress.
 * - Conversation history must be isolated by authenticated user.
 * - Do not send another user's data to Gemini.
 * - Only send the minimum context required.
 * - Do not send the entire journal database to Gemini by default.
 */
export async function chatWithCompanionIsolated(params: {
  uid: string;
  message: string;
  conversationId?: string;
  petName: string;
  petType: string;
  petStage: string;
  goalTitle: string;
}) {
  const { uid, message, conversationId = 'default_companion_chat', petName, petType, petStage, goalTitle } = params;

  // Retrieve user conversation history from resilient store
  const userRecord = await getOrCreateUserRecord(uid);
  if (!userRecord.conversations) {
    userRecord.conversations = {};
  }
  const existingMsgs = userRecord.conversations[conversationId] || [];

  // Fetch only the most recent 6 messages to keep context minimal, token-efficient, and strictly isolated
  const recentMsgs = existingMsgs.slice(-6);

  const conversationHistory: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> = [];
  for (const m of recentMsgs) {
    if (m.role && m.content) {
      conversationHistory.push({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      });
    }
  }

  const systemInstruction = `You are ${petName}, a loyal mythical creature companion (${petType}, currently in ${petStage} stage) in the Sanctuary of Growth.
The user is working diligently on their goal: "${goalTitle}".
Guidelines:
1. Speak with warmth, encouragement, and in-character personality (with playful sounds like chirps, cosmic howls, or purrs).
2. Answer the user's questions directly, give pragmatic micro-productivity advice, and keep them motivated.
3. Keep responses concise (2-4 sentences) and engaging.
4. You only have access to this user's current goal and their recent dialogue. Maintain absolute confidentiality.`;

  const apiKey = process.env.GEMINI_API_KEY;
  let replyText = `${petName} gazes upon you with steady cosmic affection: "I am right here with you on our path to ${goalTitle}!"`;

  if (apiKey) {
    try {
      const ai = getGeminiClient();
      const chat = ai.chats.create({
        model: 'gemini-flash-latest',
        config: {
          systemInstruction,
          temperature: 0.7,
        },
        history: conversationHistory,
      });

      const response = await chat.sendMessage({ message });
      if (response.text && response.text.trim()) {
        replyText = response.text.trim();
      }
    } catch (chatError) {
      const fallbackPrompt = `${systemInstruction}\nUser: ${message}\n${petName}:`;
      const fallbackText = await callGeminiWithFallback({
        contents: fallbackPrompt,
      });
      if (fallbackText) {
        replyText = fallbackText;
      }
    }
  }

  const now = new Date().toISOString();
  const cleanMessage = message.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  const cleanReply = replyText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Persist user and companion message in user's isolated store
  if (!userRecord.conversations[conversationId]) {
    userRecord.conversations[conversationId] = [];
  }
  userRecord.conversations[conversationId].push(
    { role: 'user', content: cleanMessage, timestamp: now },
    { role: 'model', content: cleanReply, timestamp: new Date(Date.now() + 100).toISOString() }
  );
  await saveUserRecord(userRecord);

  return { reply: cleanReply, timestamp: now };
}

/**
 * Gemini Support Chatbot: dedicated 24/7 AI mentor and companion for guidance,
 * learning explanations, task breakdowns, motivation, and practical support.
 */
export async function chatWithGeminiSupport(params: {
  uid: string;
  message: string;
  conversationId?: string;
  currentGoal?: string;
  learningTopic?: string;
  currentDay?: number;
  tasksSummary?: string;
  petName?: string;
}) {
  const {
    uid,
    message,
    conversationId = 'gemini_support_chat',
    currentGoal = 'Personal Growth & Mastery',
    learningTopic,
    currentDay = 1,
    tasksSummary = '',
    petName = 'Celestial Companion',
  } = params;

  const userRecord = await getOrCreateUserRecord(uid);
  if (!userRecord.conversations) {
    userRecord.conversations = {};
  }

  const existingHistory = userRecord.conversations[conversationId] || [];
  const recentTurns = existingHistory.slice(-12);

  const conversationHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
  for (const item of recentTurns) {
    if (item.content && typeof item.content === 'string') {
      conversationHistory.push({
        role: item.role === 'user' ? 'user' : 'model',
        parts: [{ text: item.content }],
      });
    }
  }

  const systemInstruction = `You are Gemini, an intelligent, empathetic, and encouraging AI Support Mentor within the Astral Sanctuary app.
The user is working on their journey: "${currentGoal}".
${learningTopic ? `Learning Topic: "${learningTopic}"` : ''}
Current Horizon: Day ${currentDay}
Current Tasks & Focus: ${tasksSummary || 'Daily focus sessions'}
Companion Creature: ${petName}

Core Capabilities & Guidelines:
1. Support & Guidance: Help the user understand what they are learning, break down difficult concepts into simple analogies, and suggest immediate practical exercises.
2. Daily Accomplishment: When they ask about today's tasks or goals, provide concise, step-by-step action plans, Pomodoro breakdowns, or checklists.
3. Motivation & Mindfulness: If the user feels overwhelmed, fatigued, or stuck, offer empathetic psychological encouragement, celebrate small wins, and provide gentle micro-habits.
4. Tone & Style: Warm, lucid, structured, and proactive. Use bullet points or code snippets when helpful. Keep responses focused and readable (typically 2-5 concise paragraphs or structured bullets).
5. Always address the user directly and be their supportive learning ally.`;

  const apiKey = process.env.GEMINI_API_KEY;
  let replyText = `I am here to support your learning journey with "${currentGoal}"! What would you like to explore or conquer right now?`;

  if (apiKey) {
    try {
      const ai = getGeminiClient();
      const chat = ai.chats.create({
        model: 'gemini-flash-latest',
        config: {
          systemInstruction,
          temperature: 0.7,
        },
        history: conversationHistory,
      });

      const response = await chat.sendMessage({ message });
      if (response.text && response.text.trim()) {
        replyText = response.text.trim();
      }
    } catch (chatError) {
      const fallbackPrompt = `${systemInstruction}\nUser: ${message}\nGemini:`;
      const fallbackText = await callGeminiWithFallback({
        contents: fallbackPrompt,
      });
      if (fallbackText) {
        replyText = fallbackText;
      }
    }
  }

  const now = new Date().toISOString();
  const cleanMessage = message.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  const cleanReply = replyText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  if (!userRecord.conversations[conversationId]) {
    userRecord.conversations[conversationId] = [];
  }
  userRecord.conversations[conversationId].push(
    { role: 'user', content: cleanMessage, timestamp: now },
    { role: 'model', content: cleanReply, timestamp: new Date(Date.now() + 100).toISOString() }
  );
  await saveUserRecord(userRecord);

  return { reply: cleanReply, timestamp: now };
}

export interface MinimalCalendarEvent {
  title: string;
  startTime: string;
  endTime: string;
}

/**
 * Reality Check: Connects user's journal reflection with actual Google Calendar schedule
 * using minimal context (title, start time, end time).
 */
export async function generateRealityCheckWithGemini(params: {
  date: string;
  whatHappened: string;
  feelings?: string;
  wins?: string;
  challenges?: string;
  mood?: string;
  goalTitle?: string;
  events: MinimalCalendarEvent[];
}): Promise<{
  insight: string;
  scheduleSummary: string;
  alignmentTakeaway: string;
}> {
  const {
    date,
    whatHappened,
    feelings = '',
    wins = '',
    challenges = '',
    mood = 'reflective',
    goalTitle = 'Personal Growth',
    events = [],
  } = params;

  const scheduleText = events.length > 0
    ? events.map(e => `- [${e.startTime} to ${e.endTime}] ${e.title}`).join('\n')
    : 'No scheduled calendar events recorded on this date.';

  const prompt = `You are an empathic, psychologically astute productivity coach and mindfulness mentor.
Perform a thoughtful "Reality Check" connecting the user's subjective journal reflection with their OBJECTIVE schedule (minimal calendar events) on that day.

JOURNAL ENTRY:
- Date: ${date}
- Goal Alignment: "${goalTitle}"
- Logged Mood: ${mood}
- What Happened (User's words): "${whatHappened}"
- Internal Feelings / Mindset: "${feelings}"
- Wins: "${wins}"
- Obstacles / Challenges: "${challenges}"

ACTUAL SCHEDULE CONTEXT (Minimal Calendar Events):
${scheduleText}

TASK:
1. Compare their subjective feelings (e.g., guilt, feeling unproductive, feeling rushed or drained) with their actual calendar demands (e.g. meeting density, fragmented hours, deep focus blocks, or an open day).
2. Validate their emotional reality with objective facts (e.g., "Feeling drained makes total sense—you navigated multiple back-to-back commitments without cognitive transition buffer").
3. Deliver constructive, grounding advice for tomorrow's time allocation.

Provide strictly valid JSON in this schema:
{
  "insight": string (A compassionate 2-3 sentence reality check connecting the journal with their actual schedule),
  "scheduleSummary": string (1 concise sentence summarizing the objective schedule load for that day),
  "alignmentTakeaway": string (1 practical action to better align daily energy with schedule demands)
}`;

  const generated = await callGeminiWithFallback({
    contents: prompt,
    config: {
      systemInstruction: 'You are an expert productivity analyst and empathetic mindfulness counselor. Analyze schedule vs. perception and output strictly valid JSON.',
      responseMimeType: 'application/json',
    },
  });

  if (generated) {
    try {
      const parsed = JSON.parse(generated);
      if (parsed.insight) {
        return {
          insight: parsed.insight,
          scheduleSummary: parsed.scheduleSummary || (events.length > 0 ? `Tracked ${events.length} schedule commitments.` : 'No scheduled calendar events.'),
          alignmentTakeaway: parsed.alignmentTakeaway || 'Protect dedicated focus blocks with calendar boundaries.',
        };
      }
    } catch (e) {
      console.warn('Failed to parse Gemini Reality Check JSON:', e);
    }
  }

  // Resilient fallback
  const eventCount = events.length;
  const scheduleSummary = eventCount > 0 
    ? `You navigated ${eventCount} scheduled event${eventCount > 1 ? 's' : ''} across this day.`
    : 'Your calendar had no scheduled events on this date.';

  return {
    insight: eventCount > 0
      ? `Looking at your schedule of ${eventCount} scheduled event${eventCount > 1 ? 's' : ''}, your feelings of ${mood} reflect the cognitive context-switching of your day. Honor what you accomplished amidst structured time commitments.`
      : `With an open calendar, the friction you noted in "${challenges || whatHappened}" often stems from the burden of self-structuring. Be gentle with yourself and create one clear micro-block for tomorrow.`,
    scheduleSummary,
    alignmentTakeaway: 'Protect a 30-minute unscheduled decompression block before beginning your core focus tasks tomorrow.',
  };
}

