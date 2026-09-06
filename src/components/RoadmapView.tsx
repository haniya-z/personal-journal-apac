import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Compass, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Wand2, 
  ChevronRight, 
  Flag, 
  Plus, 
  ArrowRight,
  RefreshCw,
  Loader2,
  Lightbulb
} from 'lucide-react';
import { UserProfile, RoadmapDay, DailyTask } from '../types';
import { soundFx } from '../utils/audio';

interface RoadmapViewProps {
  profile: UserProfile;
  onSyncDayToTasks: (day: RoadmapDay) => void;
  onSetCurrentDay: (dayNumber: number) => void;
  onUpdateRoadmap: (newRoadmap: any) => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  profile,
  onSyncDayToTasks,
  onSetCurrentDay,
  onUpdateRoadmap,
}) => {
  const { roadmap, goal, currentDayIndex, creature } = profile;
  const [selectedPhase, setSelectedPhase] = useState<number>(1);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(currentDayIndex || 1);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustPrompt, setAdjustPrompt] = useState('');
  const [isAiRecalibrating, setIsAiRecalibrating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  if (!roadmap || !roadmap.days || roadmap.days.length === 0) {
    return (
      <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4">
        <Compass className="w-12 h-12 text-amber-400 mx-auto animate-spin" />
        <h2 className="text-2xl font-serif italic text-white">Roadmap In Formation</h2>
        <p className="text-xs text-white/50">Gemini is preparing your day-by-day progression plan.</p>
      </div>
    );
  }

  const selectedDay = roadmap.days.find((d) => d.dayNumber === selectedDayNumber) || roadmap.days[0];
  const phases = roadmap.phases || [
    { phaseNumber: 1, title: 'Phase 1: Foundation', description: 'Core basics', dayRange: 'Days 1-7' },
  ];

  const handleDaySelect = (dayNum: number) => {
    soundFx.playClick();
    setSelectedDayNumber(dayNum);
  };

  const handleSyncToTasks = (day: RoadmapDay) => {
    soundFx.playTaskComplete();
    onSyncDayToTasks(day);
    setFeedbackMsg(`Synced Day ${day.dayNumber} tasks to your active quest log! ✨`);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const handleMakeActiveDay = (dayNum: number) => {
    soundFx.playClick();
    onSetCurrentDay(dayNum);
    setFeedbackMsg(`Set Day ${dayNum} as your active progress horizon! 🌟`);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  // AI Recalibration / Adjustment with Gemini
  const handleRecalibrateRoadmap = async () => {
    if (!adjustPrompt.trim() || isAiRecalibrating) return;
    soundFx.playClick();
    setIsAiRecalibrating(true);

    try {
      const res = await fetch('/api/ai/generate-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalTitle: goal.title,
          goalDescription: `${goal.description}. User Adjustment Request: "${adjustPrompt}"`,
          targetDays: goal.targetDays,
          dailyMinutes: goal.dailyMinutes,
          creatureType: creature.type,
        }),
      });

      if (!res.ok) throw new Error('Recalibration failed');
      const updatedRoadmap = await res.json();
      onUpdateRoadmap(updatedRoadmap);
      soundFx.playLevelUp();
      setIsAdjusting(false);
      setAdjustPrompt('');
      setFeedbackMsg('Roadmap successfully re-architected by Gemini! 🚀');
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err: any) {
      setFeedbackMsg('Could not reach Gemini. Kept current roadmap.');
      setTimeout(() => setFeedbackMsg(''), 3000);
    } finally {
      setIsAiRecalibrating(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Header Card */}
      <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] pointer-events-none" />

        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-xs uppercase tracking-[0.25em] text-amber-500 font-bold">
              Gemini Masterplan
            </span>
            <span className="text-[11px] text-white/40 font-mono ml-2">
              {roadmap.days.length} Total Days · {goal.dailyMinutes}m/day
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-serif italic text-white tracking-tight">
            {roadmap.roadmapTitle || `${goal.title} Roadmap`}
          </div>
          <p className="text-sm text-white/50 max-w-2xl">
            {roadmap.summary || 'A structured step-by-step masterplan calibrated to your daily time limit.'}
          </p>
        </div>

        <button
          id="recalibrate-roadmap-modal-btn"
          type="button"
          onClick={() => setIsAdjusting(!isAdjusting)}
          className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-amber-500/15 border border-white/10 text-white font-medium text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto relative z-10"
        >
          <Wand2 className="w-4 h-4 text-amber-400" />
          <span>Adjust with Gemini</span>
        </button>
      </div>

      {feedbackMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 bg-white/5 border border-amber-500/30 rounded-2xl text-amber-300 text-xs font-semibold flex items-center gap-2 shadow-lg"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{feedbackMsg}</span>
        </motion.div>
      )}

      {/* Recalibration Box Drawer */}
      {isAdjusting && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-[#09090f]/95 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4 backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-serif italic text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Recalibrate Roadmap with Gemini AI
            </h3>
            <button
              onClick={() => setIsAdjusting(false)}
              className="text-xs text-white/50 hover:text-white"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-white/50">
            Tell Gemini how to adjust your roadmap (e.g. "Add more real-world building milestones", "Make days 1-5 more beginner friendly", "Focus strictly on practical coding exercises").
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="adjust-prompt-input"
              type="text"
              value={adjustPrompt}
              onChange={(e) => setAdjustPrompt(e.target.value)}
              placeholder="Enter your custom adjustment instructions for Gemini..."
              className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-white/30 outline-none focus:border-amber-400"
            />
            <button
              id="submit-recalibration-btn"
              type="button"
              onClick={handleRecalibrateRoadmap}
              disabled={isAiRecalibrating || !adjustPrompt.trim()}
              className="px-6 py-2.5 bg-white hover:bg-amber-400 disabled:opacity-40 text-black font-bold uppercase tracking-wider rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              {isAiRecalibrating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>{isAiRecalibrating ? 'Re-Architecting...' : 'Regenerate'}</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Roadmap Split View: Left Day Timeline Grid / Right Day Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Phases & Interactive Day Timeline (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Phase Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {phases.map((phase) => (
              <button
                key={phase.phaseNumber}
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setSelectedPhase(phase.phaseNumber);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                  selectedPhase === phase.phaseNumber
                    ? 'bg-white text-black font-bold uppercase tracking-wider shadow-md'
                    : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <span>Phase {phase.phaseNumber}</span>
                <span className="ml-1.5 opacity-60 text-[10px] font-mono">({phase.dayRange})</span>
              </button>
            ))}
          </div>

          {/* Day Cards List */}
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-4 max-h-[600px] overflow-y-auto space-y-2.5">
            {roadmap.days
              .filter((d) => !selectedPhase || d.phaseNumber === selectedPhase)
              .map((day) => {
                const isSelected = selectedDayNumber === day.dayNumber;
                const isCurrentActive = currentDayIndex === day.dayNumber;

                return (
                  <div
                    key={day.dayNumber}
                    id={`roadmap-day-item-${day.dayNumber}`}
                    onClick={() => handleDaySelect(day.dayNumber)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-white/10 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/40'
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                          isCurrentActive
                            ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                            : 'bg-white/5 text-white/80 border border-white/15'
                        }`}
                      >
                        {day.dayNumber}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-white truncate max-w-[150px] sm:max-w-[180px]">
                            {day.title}
                          </span>
                          {day.isMilestone && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5 shrink-0 font-mono">
                              <Flag className="w-2.5 h-2.5" />
                              Milestone
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/40 truncate max-w-[180px]">
                          {day.theme}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-white/40 shrink-0 text-xs font-mono">
                      <span>{day.tasks?.length || 0} quests</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right Column: Detailed Selected Day Inspection & Action Panel (7 Cols) */}
        <div className="lg:col-span-7">
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-6">
            {/* Header: Day Number & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-amber-400 font-mono uppercase">
                    Day {selectedDay.dayNumber}
                  </span>
                  <span className="text-xs text-white/40 font-mono">
                    Phase {selectedDay.phaseNumber} · {goal.dailyMinutes}m planned
                  </span>
                </div>
                <div className="text-xl font-serif italic text-white mt-1">
                  {selectedDay.title}
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  Core Theme: <span className="text-amber-400 font-medium">{selectedDay.theme}</span>
                </p>
              </div>

              {/* Active Day State */}
              <div className="flex items-center gap-2">
                {currentDayIndex === selectedDay.dayNumber ? (
                  <span className="text-xs px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-amber-400 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                    Current Active Day
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleMakeActiveDay(selectedDay.dayNumber)}
                    className="text-xs px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer font-medium"
                  >
                    Set as Active Day
                  </button>
                )}
              </div>
            </div>

            {/* Milestone Banner (if applicable) */}
            {selectedDay.isMilestone && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                  <Flag className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Milestone Checkpoint: {selectedDay.milestoneTitle || 'Phase Mastery'}
                  </h4>
                  <p className="text-xs text-white/70 mt-0.5">
                    Completing this milestone awards +100 bonus Evolution XP and +50 Astral Stardust!
                  </p>
                </div>
              </div>
            )}

            {/* Actionable Micro-Tasks for this Day */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-wider text-white/60 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Day {selectedDay.dayNumber} Micro-Tasks
                </h3>
                <span className="text-xs text-white/40 font-mono">
                  {selectedDay.tasks?.length || 0} Quests
                </span>
              </div>

              <div className="space-y-2.5">
                {selectedDay.tasks?.map((task, idx) => (
                  <div
                    key={task.id || idx}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-white/5 text-white/70 flex items-center justify-center text-[10px] font-mono shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <span className="font-medium text-white block truncate">{task.title}</span>
                        {task.category && (
                          <span className="text-[10px] text-white/40">{task.category}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-mono uppercase ${
                          task.priority === 'high'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : task.priority === 'medium'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-white/5 text-white/40'
                        }`}
                      >
                        {task.priority || 'Normal'}
                      </span>
                      <span className="text-[11px] text-white/40 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {task.estimatedMinutes}m
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Tip from Gemini */}
            {selectedDay.dailyTip && (
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-amber-400 block mb-0.5 uppercase tracking-wider text-[10px]">Gemini Daily Insight:</span>
                  <p className="text-white/70 leading-relaxed italic">{selectedDay.dailyTip}</p>
                </div>
              </div>
            )}

            {/* Sync to Quests Action Button */}
            <div className="pt-2">
              <button
                id="sync-day-to-tasks-btn"
                type="button"
                onClick={() => handleSyncToTasks(selectedDay)}
                className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest shadow-lg active:scale-[0.98] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Sync Day {selectedDay.dayNumber} Quests to Today's Tasks</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
