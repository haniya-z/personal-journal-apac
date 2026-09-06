import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Sparkles, 
  Smile, 
  Send, 
  Calendar, 
  Search, 
  Heart, 
  Flame, 
  Lightbulb, 
  MessageSquare, 
  Loader2, 
  CheckCircle2, 
  Award,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Compass,
  Tag,
  Zap,
  Clock,
  ExternalLink,
  Settings,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { UserProfile, JournalEntry, MoodType, RealityCheckInsight } from '../types';
import { MOOD_DEFINITIONS, CREATURE_ARCHETYPES } from '../utils/creatureData';
import { soundFx } from '../utils/audio';
import { apiJournalReflection, apiGenerateRealityCheck } from '../lib/api';

interface JournalViewProps {
  profile: UserProfile;
  onSaveJournalEntry: (entry: JournalEntry, serverResponse?: any) => void;
  onUpdateEntry?: (entry: JournalEntry) => void;
  onSetCurrentDay?: (dayNumber: number) => void;
  onOpenSettings?: () => void;
  preselectedMood?: MoodType | null;
}

export const JournalView: React.FC<JournalViewProps> = ({
  profile,
  onSaveJournalEntry,
  onUpdateEntry,
  onSetCurrentDay,
  onOpenSettings,
  preselectedMood = null,
}) => {
  const { creature, goal, currentDayIndex, journalEntries } = profile;
  const archetype = CREATURE_ARCHETYPES[creature.type];

  // Day Selection & Horizon State
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(() => currentDayIndex || 1);
  const [daySuccessBanner, setDaySuccessBanner] = useState<string | null>(null);

  // Sync selected day when profile currentDayIndex changes
  useEffect(() => {
    if (currentDayIndex) {
      setSelectedDayNumber(currentDayIndex);
    }
  }, [currentDayIndex]);

  // Log Form State
  const [selectedMood, setSelectedMood] = useState<MoodType>(preselectedMood || 'peaceful');
  const [whatHappened, setWhatHappened] = useState('');
  const [feelings, setFeelings] = useState('');
  const [wins, setWins] = useState('');
  const [challenges, setChallenges] = useState('');

  // AI Reflection Generation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeEntryInsight, setActiveEntryInsight] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState<string>('all');
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  // Reality Check State
  const [generatingRealityCheckId, setGeneratingRealityCheckId] = useState<string | null>(null);
  const [realityCheckError, setRealityCheckError] = useState<{ id: string; message: string } | null>(null);
  const [promptConnectCalendarId, setPromptConnectCalendarId] = useState<string | null>(null);

  const handleMoodSelect = (mood: MoodType) => {
    soundFx.playClick();
    setSelectedMood(mood);
  };

  const handleSaveAndReflect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatHappened.trim()) return;

    soundFx.playClick();
    setIsSubmitting(true);
    setDaySuccessBanner(null);

    const dayToLog = selectedDayNumber;
    const targetDays = goal.targetDays || 14;

    try {
      const data = await apiJournalReflection({
        mood: selectedMood,
        whatHappened,
        feelings,
        wins,
        challenges,
        dayNumber: dayToLog,
        goalTitle: goal.title,
      });

      const entryToSave: JournalEntry = data.journalEntry || {
        id: `journal_${Date.now()}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        dayNumber: dayToLog,
        mood: selectedMood,
        whatHappened,
        feelings,
        wins,
        challenges,
        reflectionInsight: data.reflectionInsight || data.summary || 'Your honest reflection creates the bedrock of lasting progress.',
        actionableAdvice: data.actionableAdvice || data.suggestedNextAction || 'Continue honoring small consistent habits tomorrow.',
        creatureWhisper: data.creatureWhisper || `${creature.name} snuggles close, feeling your dedication deeply!`,
        xpEarned: data.xpEarned || 40,
        stardustEarned: data.stardustEarned || 20,
        createdAt: new Date().toISOString(),
      };

      soundFx.playLevelUp();
      onSaveJournalEntry(entryToSave, data);
      setActiveEntryInsight(entryToSave);

      // Advance quest horizon to next day
      const nextDay = data.currentDayIndex || Math.min(targetDays, dayToLog + 1);
      setSelectedDayNumber(nextDay);
      if (onSetCurrentDay) {
        onSetCurrentDay(nextDay);
      }
      setDaySuccessBanner(`✨ Day ${dayToLog} reflection sealed! Quest horizon progressed to Day ${nextDay}.`);

      // Reset form
      setWhatHappened('');
      setFeelings('');
      setWins('');
      setChallenges('');
    } catch (err: any) {
      console.error('Error saving journal log', err);
      // Fallback local display
      const fallbackEntry: JournalEntry = {
        id: `journal_${Date.now()}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        dayNumber: dayToLog,
        mood: selectedMood,
        whatHappened,
        feelings,
        wins,
        challenges,
        reflectionInsight: 'Your honest reflection creates the bedrock of lasting progress.',
        actionableAdvice: 'Continue honoring small consistent habits tomorrow.',
        creatureWhisper: `${creature.name} snuggles close, feeling your dedication deeply!`,
        xpEarned: 40,
        stardustEarned: 20,
        createdAt: new Date().toISOString(),
      };
      onSaveJournalEntry(fallbackEntry);
      setActiveEntryInsight(fallbackEntry);

      const nextDay = Math.min(targetDays, dayToLog + 1);
      setSelectedDayNumber(nextDay);
      if (onSetCurrentDay) {
        onSetCurrentDay(nextDay);
      }
      setDaySuccessBanner(`✨ Day ${dayToLog} reflection recorded! Progressed to Day ${nextDay}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunRealityCheck = async (entry: JournalEntry) => {
    soundFx.playClick();
    setRealityCheckError(null);
    setPromptConnectCalendarId(null);

    // If Google Calendar is not connected, show prompt to open Settings -> Integrations
    if (!profile.calendarConnected) {
      setPromptConnectCalendarId(entry.id);
      return;
    }

    setGeneratingRealityCheckId(entry.id);

    try {
      const response = await apiGenerateRealityCheck({
        journalEntryId: entry.id,
        date: entry.date,
        whatHappened: entry.whatHappened,
        feelings: entry.feelings,
        wins: entry.wins,
        challenges: entry.challenges,
        mood: entry.mood,
        goalTitle: goal.title,
      });

      if (response && response.realityCheck) {
        soundFx.playLevelUp();
        const updatedEntry: JournalEntry = {
          ...entry,
          realityCheck: response.realityCheck,
        };

        if (onUpdateEntry) {
          onUpdateEntry(updatedEntry);
        }

        if (activeEntryInsight && activeEntryInsight.id === entry.id) {
          setActiveEntryInsight(updatedEntry);
        }
      }
    } catch (err: any) {
      console.error('[Reality Check Error]', err);
      const errMsg = err.message || 'Failed to generate Reality Check insight.';
      setRealityCheckError({ id: entry.id, message: errMsg });
      if (errMsg.includes('not connected') || errMsg.includes('expired')) {
        setPromptConnectCalendarId(entry.id);
      }
    } finally {
      setGeneratingRealityCheckId(null);
    }
  };

  // Filtered Archive Logs
  const filteredEntries = journalEntries.filter((entry) => {
    const matchesSearch =
      entry.whatHappened.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.feelings.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.reflectionInsight && entry.reflectionInsight.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (entry.realityCheck?.insight && entry.realityCheck.insight.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesMood = moodFilter === 'all' || entry.mood === moodFilter;
    return matchesSearch && matchesMood;
  });

  // Derived helpers for day selection and progress
  const loggedDayNumbers = new Set(journalEntries.map((e) => Number(e.dayNumber) || 1));
  const existingEntryForSelectedDay = journalEntries.find((e) => Number(e.dayNumber) === selectedDayNumber);
  
  let nextUnloggedDay = 1;
  while (loggedDayNumbers.has(nextUnloggedDay) && nextUnloggedDay < (goal.targetDays || 14)) {
    nextUnloggedDay++;
  }

  const roadmapDayInfo = profile.roadmap?.days?.find((d) => d.dayNumber === selectedDayNumber);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Banner */}
      <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] pointer-events-none" />

        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-xs uppercase tracking-[0.25em] text-amber-500 font-bold">
              Reflection & Whispers
            </span>
            <div className="flex items-center gap-1.5 ml-2 bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5">
              <span className="text-[11px] text-amber-300 font-mono font-medium">
                Day {currentDayIndex} of {goal.targetDays || 14}
              </span>
              <div className="flex items-center gap-0.5 border-l border-white/10 pl-1.5">
                <button
                  type="button"
                  id="journal-prev-day-btn"
                  title="Previous Day"
                  disabled={currentDayIndex <= 1}
                  onClick={() => {
                    const prev = Math.max(1, currentDayIndex - 1);
                    soundFx.playClick();
                    setSelectedDayNumber(prev);
                    onSetCurrentDay?.(prev);
                  }}
                  className="p-0.5 text-white/40 hover:text-white disabled:opacity-20 rounded cursor-pointer"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  id="journal-next-day-btn"
                  title="Next Day"
                  disabled={currentDayIndex >= (goal.targetDays || 14)}
                  onClick={() => {
                    const next = Math.min(goal.targetDays || 14, currentDayIndex + 1);
                    soundFx.playClick();
                    setSelectedDayNumber(next);
                    onSetCurrentDay?.(next);
                  }}
                  className="p-0.5 text-white/40 hover:text-white disabled:opacity-20 rounded cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-serif italic text-white tracking-tight">
            Daily Digital Journal Log
          </div>
          <p className="text-sm text-white/50 max-w-2xl">
            Log your emotional state, events, and triumphs. Gemini provides mindfulness insight while {creature.name} whispers encouraging words. Connect Google Calendar for a realistic schedule cross-examination.
          </p>
        </div>

        {/* Integration Status & Reward Pill */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto relative z-10">
          {/* Calendar Status Indicator */}
          {profile.calendarConnected ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Calendar Synced</span>
            </div>
          ) : (
            <button
              id="header-connect-calendar-btn"
              onClick={onOpenSettings}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono transition-all cursor-pointer"
              title="Connect Google Calendar for Reality Check"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Connect Calendar</span>
            </button>
          )}

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-amber-400 text-xs font-mono">
            <Award className="w-4 h-4 text-amber-400" />
            <span>+50 XP & +25 Stardust / Entry</span>
          </div>
        </div>
      </div>

      {/* AI Insight Highlight Card (Shown after logging) */}
      {activeEntryInsight && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#09090f]/95 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-serif italic text-white">
                Gemini Reflection & {creature.name}'s Whisper
              </h3>
            </div>
            <button
              onClick={() => setActiveEntryInsight(null)}
              className="text-xs text-white/50 hover:text-white cursor-pointer"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Gemini Insight */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                Gemini Psychological Growth Insight:
              </span>
              <p className="text-white/80 leading-relaxed italic">
                "{activeEntryInsight.reflectionInsight}"
              </p>
              {activeEntryInsight.actionableAdvice && (
                <div className="pt-2 border-t border-white/5 text-[11px] text-white/60">
                  <span className="font-semibold text-white/80">Tomorrow's Alignment: </span>
                  {activeEntryInsight.actionableAdvice}
                </div>
              )}
            </div>

            {/* Creature Whisper */}
            <div className="p-4 rounded-2xl bg-white/5 border border-amber-500/30 space-y-2">
              <span className="font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                <Heart className="w-4 h-4 text-rose-400" />
                {creature.name}'s Bond Whisper:
              </span>
              <p className="text-white/90 leading-relaxed italic">
                "{activeEntryInsight.creatureWhisper}"
              </p>
              <div className="pt-2 border-t border-white/5 flex justify-between text-[11px] text-amber-400 font-mono">
                <span>+ {activeEntryInsight.xpEarned} Evolution XP</span>
                <span>+ {activeEntryInsight.stardustEarned} Stardust</span>
              </div>
            </div>
          </div>

          {/* Reality Check Section in Active Highlight Card */}
          <div className="pt-2 border-t border-white/10">
            {activeEntryInsight.realityCheck ? (
              <div className="p-5 rounded-2xl bg-amber-500/[0.07] border border-amber-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs uppercase tracking-wider">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Gemini Reality Check · Schedule Alignment</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Calendar Grounded
                  </span>
                </div>

                <p className="text-white/90 text-xs leading-relaxed italic">
                  "{activeEntryInsight.realityCheck.insight}"
                </p>

                {/* Minimal Calendar Events Display */}
                {activeEntryInsight.realityCheck.scheduleContext && activeEntryInsight.realityCheck.scheduleContext.length > 0 && (
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-white/60">
                      <span className="uppercase tracking-wider font-semibold text-[10px] text-amber-400/80">
                        Actual Schedule Retrieved:
                      </span>
                      <span className="text-[10px] text-white/40">
                        {activeEntryInsight.realityCheck.scheduleContext.length} event(s)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeEntryInsight.realityCheck.scheduleContext.map((ev, i) => (
                        <div
                          key={i}
                          className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-[11px] text-white/90 flex items-center gap-2"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          <span className="font-medium text-white">{ev.title}</span>
                          <span className="text-white/40 text-[10px] font-mono">
                            {ev.startTime}{ev.endTime ? ` - ${ev.endTime}` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeEntryInsight.realityCheck.alignmentTakeaway && (
                  <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2.5">
                    <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-amber-300">Actionable Balance: </span>
                      {activeEntryInsight.realityCheck.alignmentTakeaway}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Run Gemini Reality Check</span>
                  </div>
                  <p className="text-[11px] text-white/50">
                    Connect your journal reflection with your actual calendar schedule for Day {activeEntryInsight.dayNumber}.
                  </p>
                </div>

                <button
                  id="active-entry-reality-check-btn"
                  onClick={() => handleRunRealityCheck(activeEntryInsight)}
                  disabled={generatingRealityCheckId === activeEntryInsight.id}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 self-start sm:self-center"
                >
                  {generatingRealityCheckId === activeEntryInsight.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing Schedule...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Reality Check</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Main Journal Layout: Left New Log Form (7 Cols) / Right Log History Archive (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Col 1: Daily Digital Log Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Day Success Celebration Banner */}
          <AnimatePresence>
            {daySuccessBanner && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-medium">{daySuccessBanner}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDaySuccessBanner(null)}
                  className="text-white/40 hover:text-white text-xs px-2 py-1 rounded cursor-pointer"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interactive Quest Horizon & Day Selector Bar */}
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-md shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span className="text-xs uppercase tracking-wider font-semibold text-white/80">
                    Quest Horizon
                  </span>
                  {selectedDayNumber === currentDayIndex ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                      Active Horizon
                    </span>
                  ) : (
                    <button
                      type="button"
                      id="set-active-horizon-btn"
                      onClick={() => {
                        soundFx.playClick();
                        onSetCurrentDay?.(selectedDayNumber);
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-mono transition-all cursor-pointer"
                    >
                      Set as Active Horizon
                    </button>
                  )}
                </div>
                <div className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <span>Day {selectedDayNumber} of {goal.targetDays || 14}</span>
                  {roadmapDayInfo?.title && (
                    <span className="text-xs font-normal text-white/50 truncate max-w-xs sm:max-w-md">
                      · {roadmapDayInfo.title}
                    </span>
                  )}
                </div>
              </div>

              {/* Prev / Next Stepper Controls */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  id="journal-step-prev-day-btn"
                  disabled={selectedDayNumber <= 1}
                  onClick={() => {
                    const prev = Math.max(1, selectedDayNumber - 1);
                    soundFx.playClick();
                    setSelectedDayNumber(prev);
                    onSetCurrentDay?.(prev);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-xs text-white flex items-center gap-1 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev Day</span>
                </button>

                <button
                  type="button"
                  id="journal-step-next-day-btn"
                  disabled={selectedDayNumber >= (goal.targetDays || 14)}
                  onClick={() => {
                    const next = Math.min(goal.targetDays || 14, selectedDayNumber + 1);
                    soundFx.playClick();
                    setSelectedDayNumber(next);
                    onSetCurrentDay?.(next);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-xs text-white flex items-center gap-1 transition-all cursor-pointer"
                >
                  <span>Next Day</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Day Switcher Carousel */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 pt-1">
              {Array.from({ length: goal.targetDays || 14 }).map((_, idx) => {
                const dayNum = idx + 1;
                const isSelected = selectedDayNumber === dayNum;
                const isLogged = loggedDayNumbers.has(dayNum);
                const isCurrentActive = currentDayIndex === dayNum;

                return (
                  <button
                    key={dayNum}
                    type="button"
                    id={`journal-select-day-${dayNum}`}
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedDayNumber(dayNum);
                      onSetCurrentDay?.(dayNum);
                    }}
                    className={`shrink-0 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-all flex items-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                        : isLogged
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                        : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {isLogged && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    <span>Day {dayNum}</span>
                    {isCurrentActive && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Notification if this day is already logged */}
            {existingEntryForSelectedDay && (
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white/70">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Day {selectedDayNumber} was logged on <strong className="text-white">{existingEntryForSelectedDay.date}</strong>. You can submit another log below, or advance.
                  </span>
                </div>
                {nextUnloggedDay !== selectedDayNumber && (
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedDayNumber(nextUnloggedDay);
                      onSetCurrentDay?.(nextUnloggedDay);
                    }}
                    className="shrink-0 px-3 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span>Advance to Day {nextUnloggedDay}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          <form
            onSubmit={handleSaveAndReflect}
            className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-6"
          >
            {/* 1. Mood Spectrum Picker */}
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-wider font-semibold text-white/70 flex items-center gap-2">
                <Smile className="w-4 h-4 text-amber-400" />
                <span>Select Your Emotional State</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {MOOD_DEFINITIONS.map((m) => {
                  const isSelected = selectedMood === m.type;
                  return (
                    <button
                      key={m.type}
                      type="button"
                      onClick={() => handleMoodSelect(m.type as MoodType)}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                          : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="text-2xl">{m.emoji}</span>
                      <span className="text-[10px] font-medium capitalize truncate w-full text-center">
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. What Happened Today (Event Recap) */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider font-semibold text-white/70 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>What Happened Today?</span>
              </label>
              <textarea
                id="journal-what-happened-input"
                rows={3}
                value={whatHappened}
                onChange={(e) => setWhatHappened(e.target.value)}
                placeholder="Describe key events, milestones achieved, tasks completed, or meetings attended..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-all resize-none"
                required
              />
            </div>

            {/* 3. Emotional State & Internal Reflection */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider font-semibold text-white/70 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>Internal Thoughts & Feelings</span>
              </label>
              <textarea
                id="journal-feelings-input"
                rows={2}
                value={feelings}
                onChange={(e) => setFeelings(e.target.value)}
                placeholder="How did today feel? Were you energized, rushed, calm, or overwhelmed?"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-all resize-none"
              />
            </div>

            {/* 4. Triumphs & Friction Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-semibold text-white/70 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Wins / Proud Moments</span>
                </label>
                <input
                  id="journal-wins-input"
                  type="text"
                  value={wins}
                  onChange={(e) => setWins(e.target.value)}
                  placeholder="e.g. Deep focused for 45m straight"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-semibold text-white/70 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-sky-400" />
                  <span>Challenges / Blockers</span>
                </label>
                <input
                  id="journal-challenges-input"
                  type="text"
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  placeholder="e.g. Distracted in early afternoon"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            {/* 5. Submit Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-[11px] text-white/40 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Rewards: +50 XP & +25 Stardust upon submission</span>
              </div>

              <button
                id="submit-journal-entry-btn"
                type="submit"
                disabled={isSubmitting || !whatHappened.trim()}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini Reflecting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Save Day {selectedDayNumber} & Reflect with Gemini</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Col 2: Journal Log Archive (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
                  Reflections Archive
                </h4>
              </div>
              <span className="text-xs text-white/40 font-mono">
                {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>

            {/* Filter & Search Bar */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-white/40 absolute left-3.5 top-3" />
                <input
                  id="search-journal-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search entries or insights..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>

              {/* Quick Mood Filter Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setMoodFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                    moodFilter === 'all'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-white/5 text-white/50 border border-white/5 hover:text-white'
                  }`}
                >
                  All
                </button>
                {MOOD_DEFINITIONS.map((m) => (
                  <button
                    key={m.type}
                    type="button"
                    onClick={() => setMoodFilter(m.type)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      moodFilter === m.type
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-white/5 text-white/50 border border-white/5 hover:text-white'
                    }`}
                  >
                    <span>{m.emoji}</span>
                    <span className="capitalize">{m.type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Entries Scroll List */}
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {filteredEntries.length === 0 ? (
                <div className="py-12 text-center text-white/40 text-xs space-y-2">
                  <BookOpen className="w-8 h-8 text-white/20 mx-auto" />
                  <p>No journal entries found matching filters.</p>
                </div>
              ) : (
                filteredEntries.map((entry) => {
                  const moodInfo = MOOD_DEFINITIONS.find((m) => m.type === entry.mood) || MOOD_DEFINITIONS[2];
                  const isExpanded = expandedEntryId === entry.id;
                  const isGenerating = generatingRealityCheckId === entry.id;
                  const hasRealityCheck = !!entry.realityCheck;
                  const isPromptingConnect = promptConnectCalendarId === entry.id;

                  return (
                    <div
                      key={entry.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        isExpanded
                          ? 'bg-white/[0.06] border-amber-500/40 shadow-lg'
                          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{moodInfo.emoji}</span>
                          <span className="font-semibold text-white">Day {entry.dayNumber}</span>
                          <span className="text-[10px] text-white/40 font-mono">· {entry.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {hasRealityCheck && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-mono">
                              <Zap className="w-2.5 h-2.5 text-amber-400" />
                              Reality Check
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-amber-400 border border-white/10 font-mono">
                            +{entry.xpEarned} XP
                          </span>
                        </div>
                      </div>

                      {/* Content Preview */}
                      <p className="text-xs text-white/70 leading-relaxed line-clamp-2">
                        {entry.whatHappened}
                      </p>

                      {/* Action Row */}
                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        {/* Toggle Expand */}
                        <button
                          type="button"
                          onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                          className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium cursor-pointer"
                        >
                          <span>{isExpanded ? 'Hide Details' : 'View AI Insights'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {/* Reality Check Button */}
                        <button
                          id={`reality-check-btn-${entry.id}`}
                          type="button"
                          onClick={() => handleRunRealityCheck(entry)}
                          disabled={isGenerating}
                          className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            hasRealityCheck
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                              : 'bg-white/5 border-white/10 text-white/70 hover:text-amber-400 hover:border-amber-500/30'
                          }`}
                          title="Run reality check against your Google Calendar schedule for this day"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Checking...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3 h-3 text-amber-400" />
                              <span>{hasRealityCheck ? 'Re-run Reality Check' : 'Reality Check'}</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Connect Calendar Prompt if user clicks Reality Check without integration */}
                      {isPromptingConnect && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                          <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Connect Google Calendar</span>
                          </div>
                          <p className="text-[11px] text-white/60">
                            To compare your journal reflections with your actual schedule, connect Google Calendar in Settings.
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={onOpenSettings}
                              className="px-3 py-1 rounded-lg bg-white text-black font-semibold text-[10px] uppercase tracking-wider transition-all hover:bg-amber-400 cursor-pointer"
                            >
                              Open Settings → Integrations
                            </button>
                            <button
                              onClick={() => setPromptConnectCalendarId(null)}
                              className="px-2 py-1 text-[10px] text-white/40 hover:text-white cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Reality Check Error message */}
                      {realityCheckError && realityCheckError.id === entry.id && (
                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <span className="text-[11px]">{realityCheckError.message}</span>
                        </div>
                      )}

                      {/* Expanded View */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-2 border-t border-white/5 space-y-3 text-xs"
                          >
                            {entry.feelings && (
                              <div className="text-white/60">
                                <span className="text-white/80 font-semibold block text-[10px] uppercase tracking-wider">
                                  Feelings:
                                </span>
                                <span>{entry.feelings}</span>
                              </div>
                            )}

                            {/* Standard Gemini Insight */}
                            {entry.reflectionInsight && (
                              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-white/80 space-y-1">
                                <span className="font-bold block text-amber-400 text-[10px] uppercase tracking-wider">
                                  Gemini Insight:
                                </span>
                                <p className="italic leading-relaxed">"{entry.reflectionInsight}"</p>
                              </div>
                            )}

                            {/* Companion Whisper */}
                            {entry.creatureWhisper && (
                              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-amber-500/30 text-white/80 space-y-1">
                                <span className="font-bold block text-amber-400 text-[10px] uppercase tracking-wider">
                                  {creature.name}'s Whisper:
                                </span>
                                <p className="italic leading-relaxed text-white/90">"{entry.creatureWhisper}"</p>
                              </div>
                            )}

                            {/* Reality Check Display */}
                            {entry.realityCheck && (
                              <div className="p-3.5 rounded-xl bg-amber-500/[0.08] border border-amber-500/30 space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-[11px] uppercase tracking-wider">
                                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Reality Check Insight</span>
                                  </div>
                                  <span className="text-[10px] text-white/40 font-mono">
                                    Google Calendar
                                  </span>
                                </div>

                                <p className="text-white/90 text-xs italic leading-relaxed">
                                  "{entry.realityCheck.insight}"
                                </p>

                                {/* Day's minimal events */}
                                {entry.realityCheck.scheduleContext && entry.realityCheck.scheduleContext.length > 0 && (
                                  <div className="pt-2 border-t border-white/10 space-y-1.5">
                                    <span className="text-[10px] text-white/50 uppercase tracking-wider font-semibold block">
                                      Day's Schedule:
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {entry.realityCheck.scheduleContext.map((ev, i) => (
                                        <span
                                          key={i}
                                          className="px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-[10px] text-white/90 flex items-center gap-1.5"
                                        >
                                          <Clock className="w-3 h-3 text-amber-400" />
                                          <span className="font-medium text-white">{ev.title}</span>
                                          <span className="text-white/50">
                                            ({ev.startTime}{ev.endTime ? ` - ${ev.endTime}` : ''})
                                          </span>
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {entry.realityCheck.alignmentTakeaway && (
                                  <div className="p-2.5 rounded-lg bg-black/30 border border-amber-500/20 text-[11px] text-amber-200/90 flex items-start gap-2">
                                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                                    <span>{entry.realityCheck.alignmentTakeaway}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
