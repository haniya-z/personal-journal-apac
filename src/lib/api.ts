import { getAuthToken } from './firebaseClient';

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('User is not authenticated with Firebase. Please sign in.');
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

export async function apiSyncUser() {
  const res = await authFetch('/api/user/sync');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to synchronize with server.');
  }
  return await res.json();
}

export async function apiInitUser(payload: {
  goal: { title: string; description: string; targetDays: number; dailyMinutes: number };
  creatureType: string;
  creatureName: string;
  roadmapData: any;
}) {
  const res = await authFetch('/api/user/init', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to initialize user on server.');
  }
  return await res.json();
}

export async function apiCompleteTask(
  taskId: string,
  extra?: {
    title?: string;
    estimatedMinutes?: number;
    priority?: string;
    category?: string;
    roadmapDayNumber?: number;
    toggle?: boolean;
    uncomplete?: boolean;
  }
) {
  const res = await authFetch('/api/tasks/complete', {
    method: 'POST',
    body: JSON.stringify({ taskId, ...extra }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update task on server.');
  }
  return await res.json();
}

export async function apiCreateTask(payload: {
  title: string;
  estimatedMinutes: number;
  priority: 'high' | 'medium' | 'low';
  category: string;
  roadmapDayNumber?: number;
}) {
  const res = await authFetch('/api/tasks/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create task on server.');
  }
  return await res.json();
}

export async function apiDeleteTask(taskId: string) {
  const res = await authFetch('/api/tasks/delete', {
    method: 'POST',
    body: JSON.stringify({ taskId }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete task.');
  }
  return await res.json();
}

export async function apiChooseEvolution(choice: 'SCHOLAR' | 'ADVENTURER' | 'CREATOR') {
  const res = await authFetch('/api/pet/choose-evolution', {
    method: 'POST',
    body: JSON.stringify({ choice }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to choose evolution path.');
  }
  return await res.json();
}

export async function apiHatchPet() {
  const res = await authFetch('/api/pet/hatch', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to crack and hatch egg.');
  }
  return await res.json();
}

export async function apiPetCare(action: 'feed' | 'pet' | 'meditate' | 'crack') {
  const res = await authFetch('/api/pet/care', {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to perform pet care.');
  }
  return await res.json();
}

export async function apiFocusComplete(minutes: number) {
  const res = await authFetch('/api/focus/complete', {
    method: 'POST',
    body: JSON.stringify({ minutes }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to record focus session.');
  }
  return await res.json();
}

export async function apiJournalReflection(payload: {
  mood: string;
  whatHappened: string;
  feelings?: string;
  wins?: string;
  challenges?: string;
  dayNumber?: number;
  goalTitle?: string;
}) {
  const res = await authFetch('/api/ai/journal-reflection', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate journal reflection.');
  }
  return await res.json();
}

export async function apiCompanionChat(payload: {
  message: string;
  conversationId?: string;
  goalTitle?: string;
}) {
  const res = await authFetch('/api/ai/companion-chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to converse with companion.');
  }
  return await res.json();
}

export async function apiGoalPlanner(payload: {
  goalTitle: string;
  goalDescription?: string;
  targetDays?: number;
  dailyMinutes?: number;
}) {
  const res = await authFetch('/api/ai/goal-planner', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to plan goal.');
  }
  return await res.json();
}

export async function apiUpdatePetName(name: string) {
  const res = await authFetch('/api/pet/update-name', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update pet name.');
  }
  return await res.json();
}

// ==========================================
// GOOGLE CALENDAR & REALITY CHECK API CLIENTS
// - Tokens are strictly held server-side
// - Read-only calendar events
// - Reality Check AI synthesis
// ==========================================

export async function apiGetCalendarStatus(): Promise<{
  connected: boolean;
  connectedAt: string | null;
}> {
  const res = await authFetch('/api/calendar/status');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch calendar status.');
  }
  return await res.json();
}

export async function apiConnectCalendar(accessToken: string): Promise<{
  success: boolean;
  connected: boolean;
  connectedAt?: string;
  message?: string;
}> {
  const res = await authFetch('/api/calendar/connect', {
    method: 'POST',
    body: JSON.stringify({ accessToken }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to connect Google Calendar.');
  }
  return await res.json();
}

export async function apiDisconnectCalendar(): Promise<{
  success: boolean;
  connected: boolean;
}> {
  const res = await authFetch('/api/calendar/disconnect', {
    method: 'POST',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to disconnect Google Calendar.');
  }
  return await res.json();
}

export async function apiGenerateRealityCheck(payload: {
  journalEntryId?: string;
  date?: string;
  whatHappened: string;
  feelings?: string;
  wins?: string;
  challenges?: string;
  mood?: string;
  goalTitle?: string;
}) {
  const res = await authFetch('/api/journal/reality-check', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Failed to generate Reality Check.');
  }
  return await res.json();
}

export async function apiSetCurrentDay(dayNumber: number): Promise<{
  success: boolean;
  currentDayIndex: number;
}> {
  const res = await authFetch('/api/quest/set-day', {
    method: 'POST',
    body: JSON.stringify({ dayNumber }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update quest day.');
  }
  return await res.json();
}

export async function apiCreateJourney(payload: {
  intent: string;
  learningTopic?: string;
  targetDays?: number;
  dailyMinutes?: number;
}): Promise<{
  success: boolean;
  journey: any;
}> {
  const res = await authFetch('/api/ai/create-journey', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate journey with Gemini.');
  }
  return await res.json();
}

export async function apiApplyJourney(payload: {
  journey: any;
  targetDays?: number;
  dailyMinutes?: number;
}): Promise<{
  success: boolean;
  activeQuest: any;
  tasks: any[];
  message: string;
}> {
  const res = await authFetch('/api/ai/apply-journey', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to apply journey.');
  }
  return await res.json();
}

export async function apiGeminiSupportChat(payload: {
  message: string;
  conversationId?: string;
  currentGoal?: string;
  learningTopic?: string;
  currentDay?: number;
  tasksSummary?: string;
}): Promise<{
  reply: string;
  timestamp: string;
}> {
  const res = await authFetch('/api/ai/gemini-support-chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to communicate with Gemini Support.');
  }
  return await res.json();
}

export async function apiGetSupportHistory(conversationId = 'gemini_support_chat'): Promise<{
  success: boolean;
  history: Array<{ role: 'user' | 'model'; content: string; timestamp: string }>;
}> {
  const res = await authFetch(`/api/ai/support-history?conversationId=${encodeURIComponent(conversationId)}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to load support history.');
  }
  return await res.json();
}


