import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  Clock, 
  Sparkles, 
  Flame, 
  Timer, 
  CheckCircle2, 
  Circle, 
  Filter, 
  ArrowUpRight,
  Layers
} from 'lucide-react';
import { UserProfile, DailyTask } from '../types';
import { soundFx } from '../utils/audio';

interface DailyTasksViewProps {
  profile: UserProfile;
  onToggleTask: (taskId: string) => void;
  onAddTask: (title: string, estimatedMinutes: number, priority: 'high' | 'medium' | 'low', category: string) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenFocusTimer: (initialMinutes?: number, taskTitle?: string) => void;
  onSyncDayToTasks?: (day: any) => void;
}

export const DailyTasksView: React.FC<DailyTasksViewProps> = ({
  profile,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onOpenFocusTimer,
  onSyncDayToTasks,
}) => {
  const { tasks, currentDayIndex, creature, stardust, roadmap } = profile;

  // New task form state
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMinutes, setNewMinutes] = useState(25);
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newCategory, setNewCategory] = useState('Core Focus');

  // Filter state
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    soundFx.playClick();
    onAddTask(newTitle.trim(), newMinutes, newPriority, newCategory);
    setNewTitle('');
    setIsAdding(false);
  };

  const handleTaskToggle = (task: DailyTask) => {
    if (!task.completed) {
      soundFx.playTaskComplete();
      // Confetti burst if all completed
      if (completedCount + 1 === totalCount && totalCount > 1) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#fbbf24'],
        });
      }
    } else {
      soundFx.playClick();
    }
    onToggleTask(task.id);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Banner: Quest Progress & Quick Add */}
      <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] pointer-events-none" />

        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-xs uppercase tracking-[0.25em] text-amber-500 font-bold">
              Day {currentDayIndex} Quest Board
            </span>
            <span className="text-[11px] text-white/40 font-mono ml-2">
              +25 XP · +10 Stardust / task
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-serif italic text-white tracking-tight">
            Daily Productivity Quests
          </div>
          <p className="text-sm text-white/50 max-w-xl">
            Nurture {creature.name} by executing your daily actions. Every checkmark fuels its celestial growth!
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 flex-shrink-0">
          <button
            id="start-focus-timer-top-btn"
            type="button"
            onClick={() => onOpenFocusTimer(25)}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-amber-500/15 border border-white/10 text-white font-medium text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
          >
            <Timer className="w-4 h-4 text-amber-400" />
            <span>Focus Timer</span>
          </button>

          <button
            id="add-custom-quest-btn"
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest transition-colors shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Quest</span>
          </button>
        </div>
      </div>

      {/* Progress Bar & Filter Bar */}
      <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 backdrop-blur-md shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <span className="text-white/80 font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            Today's Completion: {completedCount} of {totalCount} ({completionPercentage}%)
          </span>
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => { soundFx.playClick(); setFilter('all'); }}
              className={`px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer ${filter === 'all' ? 'bg-white text-black font-bold uppercase tracking-wider' : 'text-white/60 hover:text-white'}`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => { soundFx.playClick(); setFilter('pending'); }}
              className={`px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer ${filter === 'pending' ? 'bg-white text-black font-bold uppercase tracking-wider' : 'text-white/60 hover:text-white'}`}
            >
              Pending ({totalCount - completedCount})
            </button>
            <button
              onClick={() => { soundFx.playClick(); setFilter('completed'); }}
              className={`px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer ${filter === 'completed' ? 'bg-white text-black font-bold uppercase tracking-wider' : 'text-white/60 hover:text-white'}`}
            >
              Done ({completedCount})
            </button>
          </div>
        </div>

        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Add Custom Task Form Drawer */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreateTask}
            className="bg-[#09090f]/95 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4 backdrop-blur-md"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-serif italic text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                Forge New Daily Quest
              </h3>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs text-white/50 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Quest Title:</label>
                <input
                  id="new-task-title-input"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Complete chapter 4 summary notes..."
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-white/30 outline-none focus:border-amber-400"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Estimated Minutes:</label>
                <input
                  type="number"
                  min="5"
                  max="240"
                  step="5"
                  value={newMinutes}
                  onChange={(e) => setNewMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Priority:</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-[#09090f] border border-white/10 rounded-xl text-xs sm:text-sm text-white outline-none focus:border-amber-400"
                >
                  <option value="high">🔥 High Priority</option>
                  <option value="medium">⚡ Medium Priority</option>
                  <option value="low">🌱 Low Priority</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-white hover:bg-amber-400 text-black font-bold uppercase tracking-wider rounded-xl text-xs transition-colors cursor-pointer shadow-md"
              >
                Add to Quest Board
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-10 text-center space-y-4">
            <CheckSquare className="w-10 h-10 text-white/20 mx-auto" />
            <p className="text-sm text-white/40">
              {filter === 'completed'
                ? 'No completed quests yet today.'
                : 'No active quests found. Add a custom quest or import from your AI Roadmap!'}
            </p>
            {roadmap?.days?.find((d) => d.dayNumber === currentDayIndex) && onSyncDayToTasks && (
              <button
                type="button"
                onClick={() => {
                  const day = roadmap.days.find((d) => d.dayNumber === currentDayIndex);
                  if (day) onSyncDayToTasks(day);
                }}
                className="py-2.5 px-5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer transition-all shadow-lg active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-black" />
                <span>Import Day {currentDayIndex} Quests from Roadmap</span>
              </button>
            )}
          </div>
        ) : (
          filteredTasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3.5 ${
                task.completed
                  ? 'bg-white/[0.01] border-white/5 text-white/40'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 hover:border-amber-500/30'
              }`}
            >
              {/* Left Checkbox & Title - Fully clickable */}
              <div
                id={`daily-task-item-${task.id}`}
                onClick={() => handleTaskToggle(task)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTaskToggle(task);
                  }
                }}
                title={task.completed ? 'Click to uncheck quest' : 'Click to complete quest (+XP)'}
                className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer select-none group/item"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 pointer-events-none ${
                    task.completed
                      ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                      : 'border-2 border-white/30 group-hover/item:border-amber-400 text-transparent group-hover/item:scale-105'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium truncate transition-colors ${
                        task.completed ? 'line-through text-white/30' : 'text-white group-hover/item:text-amber-200'
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.roadmapDayNumber && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-amber-400 border border-white/10 font-mono shrink-0">
                        Day {task.roadmapDayNumber}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-white/40 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      {task.estimatedMinutes} mins
                    </span>
                    {task.category && <span>· {task.category}</span>}
                    <span className="text-amber-400/90 font-mono text-[10px]">+XP</span>
                  </div>
                </div>
              </div>

              {/* Right Priority & Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-[9px] px-2.5 py-1 rounded-full font-mono uppercase ${
                    task.priority === 'high'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : task.priority === 'medium'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-white/5 text-white/40 border border-white/10'
                  }`}
                >
                  {task.priority}
                </span>

                {!task.completed && (
                  <button
                    type="button"
                    onClick={() => onOpenFocusTimer(task.estimatedMinutes, task.title)}
                    title="Start Focus Timer for this quest"
                    className="p-2 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 text-white/70 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    <Timer className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onDeleteTask(task.id)}
                  title="Remove Quest"
                  className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 text-white/40 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
