import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Flame, 
  Heart, 
  Zap, 
  Shield, 
  Compass, 
  CheckCircle2, 
  BookOpen, 
  ArrowRight, 
  Smile, 
  TrendingUp, 
  MessageSquare, 
  Award,
  ChevronRight,
  Wand2,
  Bot
} from 'lucide-react';
import { UserProfile, MoodType } from '../types';
import { CREATURE_ARCHETYPES, MOOD_DEFINITIONS, calculateLevelData } from '../utils/creatureData';
import { CreatureAvatar } from './CreatureAvatar';
import { soundFx } from '../utils/audio';

interface DashboardViewProps {
  profile: UserProfile;
  onNavigateTab: (tab: any) => void;
  onFeedCreature: () => void;
  onPetCreature: () => void;
  onQuickMoodSelect: (mood: MoodType) => void;
  onInteractCreature: (action: string) => void;
  onHatchCreature?: () => void;
  onToggleTask?: (taskId: string) => void;
  onSyncDayToTasks?: (day: any) => void;
  onOpenDailyIntent?: () => void;
  onOpenSupportChat?: () => void;
  creatureDialogue: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  onNavigateTab,
  onFeedCreature,
  onPetCreature,
  onQuickMoodSelect,
  onInteractCreature,
  onHatchCreature,
  onToggleTask,
  onSyncDayToTasks,
  onOpenDailyIntent,
  onOpenSupportChat,
  creatureDialogue,
}) => {
  const { creature, goal, roadmap, currentDayIndex, streak, tasks, journalEntries, stardust } = profile;
  const archetype = CREATURE_ARCHETYPES[creature.type];
  const levelInfo = calculateLevelData(creature.xp);

  const [interactionFeedback, setInteractionFeedback] = useState<string | null>(null);
  const [crackCount, setCrackCount] = useState<number>(0);
  const [isHatching, setIsHatching] = useState<boolean>(false);

  const handleTapEgg = () => {
    if (creature.stage !== 'egg' || isHatching) return;
    const nextCracks = Math.min(3, crackCount + 1);
    setCrackCount(nextCracks);
    soundFx.playEggCrack(nextCracks);
    setInteractionFeedback('crack');
    setTimeout(() => setInteractionFeedback(null), 1000);

    if (nextCracks >= 3) {
      handleTriggerHatch();
    }
  };

  const handleTriggerHatch = async () => {
    if (isHatching) return;
    setIsHatching(true);
    setInteractionFeedback('crack');
    soundFx.playEggCrack(3);
    setTimeout(async () => {
      try {
        await onHatchCreature?.();
        setCrackCount(0);
      } finally {
        setIsHatching(false);
      }
    }, 500);
  };

  const handleFeed = () => {
    soundFx.playFeed();
    setInteractionFeedback('feed');
    onFeedCreature();
    setTimeout(() => setInteractionFeedback(null), 1200);
  };

  const handlePet = () => {
    soundFx.playPet(creature.type);
    setInteractionFeedback('pet');
    onPetCreature();
    setTimeout(() => setInteractionFeedback(null), 1200);
  };

  const handleAction = (action: string) => {
    soundFx.playClick();
    setInteractionFeedback(action);
    onInteractCreature(action);
    setTimeout(() => setInteractionFeedback(null), 1200);
  };

  // Current day tasks summary
  const todayTasks = tasks.filter((t) => !t.roadmapDayNumber || t.roadmapDayNumber === currentDayIndex);
  const completedTodayCount = todayTasks.filter((t) => t.completed).length;
  const currentRoadmapDay = roadmap?.days?.find((d) => d.dayNumber === currentDayIndex);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Banner: Personal Odyssey Header (Immersive Design Theme) */}
      <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <h1 className="text-xs uppercase tracking-[0.3em] text-amber-500 font-bold">
                Personal Odyssey · Day {currentDayIndex} of {goal.targetDays}
              </h1>
              <span className="text-[11px] text-white/40 font-mono hidden sm:inline ml-2">
                ({goal.dailyMinutes}m daily commitment)
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-serif italic text-white tracking-tight">
              {goal.title}
            </div>
            <p className="text-sm text-white/40 mt-1 max-w-2xl leading-relaxed">
              {currentRoadmapDay?.theme ? `Focus: ${currentRoadmapDay.theme} — ${currentRoadmapDay.title}` : goal.description}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              id="dash-quick-quest-btn"
              onClick={() => onNavigateTab('tasks')}
              className="px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-amber-400 transition-colors shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>Daily Quests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              id="dash-quick-journal-btn"
              onClick={() => onNavigateTab('journal')}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-amber-500/10 border border-white/10 text-white font-semibold text-xs uppercase tracking-wider hover:border-amber-500/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Log Feelings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Gemini Daily Intent & Journey Creator Bar */}
      <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-600/10 border border-amber-500/25 rounded-3xl p-5 sm:p-6 backdrop-blur-md shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-start sm:items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-black font-bold shadow-lg shadow-amber-500/20 shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                Gemini Odyssey Intelligence
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 font-mono">
                Conversational Journey Creator
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-serif text-white tracking-tight">
              What do you want to learn or accomplish today?
            </h2>
            <p className="text-xs sm:text-sm text-white/60 max-w-xl leading-relaxed">
              Tell Gemini what you want to achieve or explore. Gemini will architect your daily curriculum, synchronize actionable tasks, and accompany you with 24/7 support.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0 pt-2 md:pt-0">
          {onOpenDailyIntent && (
            <button
              id="dash-plan-journey-btn"
              type="button"
              onClick={() => {
                soundFx.playClick();
                onOpenDailyIntent();
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Wand2 className="w-4 h-4" />
              <span>Create Journey</span>
            </button>
          )}

          {onOpenSupportChat && (
            <button
              id="dash-ask-gemini-btn"
              type="button"
              onClick={() => {
                soundFx.playClick();
                onOpenSupportChat();
              }}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 text-white/90 hover:text-amber-300 font-medium text-xs tracking-wider transition-all flex items-center gap-2 cursor-pointer"
            >
              <Bot className="w-4 h-4 text-amber-400" />
              <span>Ask Gemini Support</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Creature Sanctuary Hero + Quick Action Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Col 1: Creature Companion Hero Card (7 Cols) */}
        <div className="lg:col-span-7 bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl flex flex-col justify-between relative overflow-hidden">
          {/* Rotating celestial orbit background rings */}
          <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
            <div className="w-72 h-72 border border-amber-500/30 rounded-full animate-spin-slow" />
            <div className="absolute w-96 h-96 border border-amber-500/10 rounded-full animate-spin-reverse-slow" />
          </div>

          {/* Top Stage Header */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/5 border border-white/15 flex items-center justify-center text-amber-400 text-xs font-mono">
                ★
              </div>
              <div>
                <h3 className="text-lg font-serif italic text-white flex items-center gap-2">
                  {creature.name}
                </h3>
                <p className="text-xs text-white/40">
                  {archetype.name} · {archetype.element}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('sanctuary')}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer uppercase tracking-wider font-semibold"
            >
              <span>Sanctuary</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Egg Awakening Prompt Banner if in Egg stage */}
          {creature.stage === 'egg' && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="my-3 w-full bg-gradient-to-r from-amber-500/20 via-yellow-500/25 to-amber-500/20 border-2 border-amber-500/40 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_0_20px_rgba(245,158,11,0.2)] relative z-10"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shrink-0">
                  🥚
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      Egg Ready to Hatch!
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 font-mono font-bold">
                      {crackCount}/3 Cracks
                    </span>
                  </div>
                  <p className="text-[11px] text-white/70 mt-0.5">
                    Tap the egg {3 - crackCount > 0 ? `${3 - crackCount} more time${3 - crackCount > 1 ? 's' : ''}` : ''} or click Crack Now to awaken your companion!
                  </p>
                </div>
              </div>

              <button
                id="dash-crack-egg-cta-btn"
                type="button"
                onClick={handleTriggerHatch}
                disabled={isHatching}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 shrink-0 cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isHatching ? 'Hatching...' : 'Crack Egg Now!'}</span>
              </button>
            </motion.div>
          )}

          {/* Creature Stage Rendering & Dialogue Bubble */}
          <div className="my-6 flex flex-col items-center justify-center relative z-10">
            {/* Dialogue Bubble */}
            <motion.div
              key={creatureDialogue}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 text-xs text-white/90 mb-4 shadow-xl relative"
            >
              <div className="flex items-start gap-2.5">
                <MessageSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="italic leading-relaxed">{creatureDialogue || `${creature.name} watches you with calm focus.`}</span>
              </div>
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-black border-r border-b border-white/10 rotate-45" />
            </motion.div>

            {/* Interactive Avatar with Stage Badge */}
            <div className="relative flex flex-col items-center justify-center">
              <div
                id="dash-creature-avatar-container"
                onClick={creature.stage === 'egg' ? handleTapEgg : undefined}
                className={`h-48 sm:h-56 w-full flex items-center justify-center ${creature.stage === 'egg' ? 'cursor-pointer group' : ''}`}
                title={creature.stage === 'egg' ? 'Click egg to crack the shell!' : undefined}
              >
                <CreatureAvatar
                  type={creature.type}
                  stage={creature.stage}
                  size="xl"
                  isInteracting={!!interactionFeedback}
                  interactionType={interactionFeedback}
                  showAura={true}
                  crackLevel={crackCount}
                  className={creature.stage === 'egg' ? 'transition-transform group-hover:scale-105 active:scale-95' : ''}
                />
              </div>
              <div className="mt-2 bg-black/80 backdrop-blur-md px-4 py-1 rounded-full border border-amber-500/50 text-[10px] font-bold tracking-widest text-amber-400">
                LVL {levelInfo.level.toString().padStart(2, '0')} · {creature.stage.toUpperCase()}
              </div>
              {creature.stage === 'egg' && (
                <span className="mt-1 text-[10px] text-amber-400/80 font-mono tracking-wider animate-pulse">
                  ⚡ Tap egg to crack shell ({crackCount}/3)
                </span>
              )}
            </div>
          </div>

          {/* Nurture Evolution XP Progress Bar (Immersive Design Theme) */}
          <div className="space-y-2 mb-6 bg-white/[0.02] p-4 rounded-2xl border border-white/5 relative z-10">
            <div className="flex justify-between items-end mb-1">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-white/40">Growth Horizon</span>
                <span className="text-xl font-mono text-white">{Math.round(levelInfo.progressPercent)}%</span>
              </div>
              <div className="text-[11px] text-amber-400 font-mono">
                {levelInfo.xpInLevel} / {levelInfo.xpNeeded} XP
              </div>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${levelInfo.progressPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Interaction Actions */}
          <div className="grid grid-cols-3 gap-3 relative z-10">
            {creature.stage === 'egg' ? (
              <>
                <button
                  id="dash-feed-btn"
                  type="button"
                  onClick={handleFeed}
                  disabled={stardust < 10}
                  className="p-3 rounded-2xl bg-white/5 hover:bg-amber-500/15 border border-white/10 text-xs font-semibold text-white/80 hover:text-amber-300 disabled:opacity-30 transition-all flex flex-col items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Feed Stardust</span>
                  <span className="text-[9px] text-white/40 font-mono">-10 Stardust</span>
                </button>

                <button
                  id="dash-crack-tap-btn"
                  type="button"
                  onClick={handleTapEgg}
                  disabled={isHatching}
                  className="p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-all flex flex-col items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Crack Shell</span>
                  <span className="text-[9px] text-amber-400/70 font-mono">{crackCount}/3 Cracks</span>
                </button>

                <button
                  id="dash-hatch-now-btn"
                  type="button"
                  onClick={handleTriggerHatch}
                  disabled={isHatching}
                  className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/40 text-xs font-semibold text-amber-200 transition-all flex flex-col items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>{isHatching ? 'Hatching...' : 'Crack & Hatch!'}</span>
                  <span className="text-[9px] text-amber-300/80 font-mono">Awaken Baby</span>
                </button>
              </>
            ) : (
              <>
                <button
                  id="dash-feed-btn"
                  type="button"
                  onClick={handleFeed}
                  disabled={stardust < 10}
                  className="p-3 rounded-2xl bg-white/5 hover:bg-amber-500/15 border border-white/10 text-xs font-semibold text-white/80 hover:text-amber-300 disabled:opacity-30 transition-all flex flex-col items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Feed Stardust</span>
                  <span className="text-[9px] text-white/40 font-mono">-10 Stardust</span>
                </button>

                <button
                  id="dash-pet-btn"
                  type="button"
                  onClick={handlePet}
                  className="p-3 rounded-2xl bg-white/5 hover:bg-rose-500/15 border border-white/10 text-xs font-semibold text-white/80 hover:text-rose-300 transition-all flex flex-col items-center gap-1 cursor-pointer"
                >
                  <Heart className="w-4 h-4 text-rose-400" />
                  <span>Pet & Bond</span>
                  <span className="text-[9px] text-white/40 font-mono">+Affinity</span>
                </button>

                <button
                  id="dash-meditate-btn"
                  type="button"
                  onClick={() => handleAction('meditate')}
                  className="p-3 rounded-2xl bg-white/5 hover:bg-emerald-500/15 border border-white/10 text-xs font-semibold text-white/80 hover:text-emerald-300 transition-all flex flex-col items-center gap-1 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>Sync Vigor</span>
                  <span className="text-[9px] text-white/40 font-mono">+Energy</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Col 2: Today's Quests & Growth Stats (5 Cols) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          {/* Card A: Today's Quest Brief (Immersive Theme) */}
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <h3 className="text-xs uppercase tracking-wider text-white font-bold">
                  Daily Roadmap · Day {currentDayIndex}/{goal.targetDays}
                </h3>
              </div>
              <span className="text-xs font-mono text-amber-400">
                {completedTodayCount}/{todayTasks.length} Complete
              </span>
            </div>

            {todayTasks.length === 0 ? (
              <div className="text-center py-6 text-xs text-white/40 space-y-2">
                <p>No quests active for today yet.</p>
                {currentRoadmapDay && onSyncDayToTasks ? (
                  <button
                    type="button"
                    onClick={() => onSyncDayToTasks(currentRoadmapDay)}
                    className="py-2 px-3.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300 font-semibold uppercase tracking-wider text-[11px] inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Load Day {currentDayIndex} Quests Now →</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('roadmap')}
                    className="text-amber-400 hover:text-amber-300 font-semibold uppercase tracking-wider text-[11px] inline-flex items-center gap-1 cursor-pointer"
                  >
                    Load Day {currentDayIndex} Quests from Roadmap →
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {todayTasks.slice(0, 4).map((task, idx) => (
                  <div
                    key={task.id}
                    id={`task-item-${task.id}`}
                    onClick={() => onToggleTask?.(task.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onToggleTask?.(task.id);
                      }
                    }}
                    title={task.completed ? 'Click to mark uncompleted' : 'Click to complete quest (+XP)'}
                    className={`group border rounded-2xl p-3 flex items-center gap-3 transition-all cursor-pointer select-none ${
                      task.completed
                        ? 'bg-white/[0.02] border-white/5 opacity-60'
                        : 'bg-white/5 hover:bg-amber-500/10 border-white/10 hover:border-amber-400/40 active:scale-[0.99]'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono transition-all shrink-0 pointer-events-none ${
                        task.completed
                          ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                          : 'bg-white/5 border border-white/20 group-hover:border-amber-400 text-white/70 group-hover:text-amber-300'
                      }`}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        String(idx + 1).padStart(2, '0')
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm font-medium truncate transition-colors ${
                          task.completed ? 'line-through text-white/30' : 'text-white group-hover:text-amber-100'
                        }`}
                      >
                        {task.title}
                      </div>
                      <div className="text-[11px] text-white/40 flex items-center gap-2 mt-0.5">
                        <span className="truncate">{task.category || 'Core Focus'}</span>
                        <span>·</span>
                        <span>{task.estimatedMinutes}m</span>
                        <span className="text-amber-400/90 font-mono text-[10px]">+XP</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                          task.completed
                            ? 'bg-amber-500 border-amber-500 text-black'
                            : 'border-white/30 group-hover:border-amber-400'
                        }`}
                      >
                        {task.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => onNavigateTab('tasks')}
              className="w-full py-2.5 text-xs text-center text-amber-400 hover:text-amber-300 font-semibold uppercase tracking-wider cursor-pointer border-t border-white/5 pt-3 block transition-colors"
            >
              Open Full Quest Board & Focus Timer →
            </button>
          </div>

          {/* Card B: Quick Digital Feeling / Mood Check-In */}
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Smile className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs uppercase tracking-wider text-white font-bold">
                  Digital Reflection Check-In
                </h3>
              </div>
              <span className="text-[10px] uppercase text-white/40 font-mono">Quick Log</span>
            </div>

            <p className="text-xs text-white/50 leading-relaxed">
              Capture your current state of mind to receive Gemini's guidance & creature insights:
            </p>

            <div className="grid grid-cols-4 gap-2">
              {MOOD_DEFINITIONS.slice(0, 4).map((m) => (
                <button
                  key={m.type}
                  id={`quick-mood-${m.type}`}
                  type="button"
                  onClick={() => onQuickMoodSelect(m.type as MoodType)}
                  className="p-2.5 rounded-2xl bg-white/5 hover:bg-amber-500/15 border border-white/5 hover:border-amber-500/30 text-center transition-all cursor-pointer group"
                >
                  <span className="text-lg block group-hover:scale-110 transition-transform">{m.emoji}</span>
                  <span className="text-[9px] text-white/60 block truncate mt-1 uppercase tracking-wider">{m.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => onNavigateTab('journal')}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Open Complete Journal</span>
            </button>
          </div>

          {/* Card C: Summary Growth Metrics (Immersive Theme) */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
              <div className="text-[9px] uppercase tracking-wider opacity-40 mb-1">Aura XP</div>
              <div className="text-sm font-bold text-amber-400 font-mono">{creature.xp}</div>
            </div>

            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
              <div className="text-[9px] uppercase tracking-wider opacity-40 mb-1">Journal</div>
              <div className="text-sm font-bold text-amber-400 font-mono">{journalEntries.length}</div>
            </div>

            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
              <div className="text-[9px] uppercase tracking-wider opacity-40 mb-1">Vigor Streak</div>
              <div className="text-sm font-bold text-amber-400 font-mono">{streak.current}d</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
