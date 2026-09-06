import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  ExternalLink,
  Sparkles,
  RefreshCw,
  Unlink,
  User,
  Layers
} from 'lucide-react';
import { UserProfile } from '../types';
import { apiConnectCalendar, apiDisconnectCalendar } from '../lib/api';
import { requestGoogleCalendarOAuthToken } from '../lib/googleOAuth';
import { soundFx } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  initialTab?: 'integrations' | 'audio' | 'account';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  soundEnabled,
  onToggleSound,
  initialTab = 'integrations',
}) => {
  const [activeTab, setActiveTab] = useState<'integrations' | 'audio' | 'account'>(initialTab);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isConnected = !!profile.calendarConnected;

  const handleConnectGoogleCalendar = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsConnecting(true);
    soundFx.playClick();

    try {
      // 1. Client-side OAuth popup for read-only calendar scope
      const token = await requestGoogleCalendarOAuthToken();

      // 2. Immediately send to server (token is NEVER saved in client storage)
      const res = await apiConnectCalendar(token);

      soundFx.playLevelUp();
      setSuccessMsg('Google Calendar connected successfully! Reality Check is now active.');
      onUpdateProfile({
        calendarConnected: true,
        calendarConnectedAt: res.connectedAt || new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('[Google Calendar Connect Error]', err);
      setErrorMsg(err.message || 'Failed to connect Google Calendar. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectGoogleCalendar = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsDisconnecting(true);
    soundFx.playClick();

    try {
      await apiDisconnectCalendar();
      setSuccessMsg('Google Calendar disconnected.');
      onUpdateProfile({
        calendarConnected: false,
        calendarConnectedAt: undefined,
      });
    } catch (err: any) {
      console.error('[Google Calendar Disconnect Error]', err);
      setErrorMsg(err.message || 'Failed to disconnect calendar.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl bg-[#09090f] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-serif italic text-white">Application Settings</h2>
                <p className="text-xs text-white/50">Manage integrations, preferences, and account configuration</p>
              </div>
            </div>
            <button
              id="close-settings-modal-btn"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sub Navigation / Tabs */}
          <div className="flex border-b border-white/10 px-6 bg-white/[0.01]">
            <button
              id="settings-tab-integrations"
              onClick={() => { setActiveTab('integrations'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`py-3.5 px-4 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'integrations'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-white/50 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Integrations</span>
              {isConnected && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            <button
              id="settings-tab-audio"
              onClick={() => { setActiveTab('audio'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`py-3.5 px-4 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'audio'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-white/50 hover:text-white'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>Audio & Ambiance</span>
            </button>

            <button
              id="settings-tab-account"
              onClick={() => { setActiveTab('account'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`py-3.5 px-4 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'account'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-white/50 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile & Cloud</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Feedback Notifications */}
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* TAB 1: INTEGRATIONS */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Connected Services</h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    Connect external tools to enrich your journaling and companion insights with real-world context.
                  </p>
                </div>

                {/* Google Calendar Integration Card */}
                <div className="p-5 sm:p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-5 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 shadow-inner flex-shrink-0">
                        <Calendar className="w-6 h-6 text-amber-400" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-medium text-white">Google Calendar</h4>
                          {isConnected ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Connected
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 border border-white/10 text-white/50 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              Not Connected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed max-w-md">
                          Synchronize your schedule with digital reflections. Power the Gemini <span className="text-amber-300 font-semibold">“Reality Check”</span> feature to compare your perceived productivity against your actual day's commitments.
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="self-start sm:self-center flex-shrink-0">
                      {isConnected ? (
                        <div className="flex items-center gap-2">
                          <button
                            id="reconnect-calendar-btn"
                            onClick={handleConnectGoogleCalendar}
                            disabled={isConnecting || isDisconnecting}
                            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            title="Re-authenticate or refresh calendar permission"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
                            <span>Re-sync</span>
                          </button>
                          <button
                            id="disconnect-calendar-btn"
                            onClick={handleDisconnectGoogleCalendar}
                            disabled={isConnecting || isDisconnecting}
                            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs text-rose-300 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {isDisconnecting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Unlink className="w-3.5 h-3.5" />
                            )}
                            <span>Disconnect</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          id="connect-google-calendar-btn"
                          onClick={handleConnectGoogleCalendar}
                          disabled={isConnecting}
                          className="px-5 py-2.5 rounded-xl bg-white hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
                        >
                          {isConnecting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Connecting...</span>
                            </>
                          ) : (
                            <>
                              <Calendar className="w-4 h-4 text-black" />
                              <span>Connect Google Calendar</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Privacy & Scope Architecture Guarantee */}
                  <div className="pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-white/60">
                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[10px] uppercase tracking-wider">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Server-Side Security
                      </div>
                      <p className="text-[10px] text-white/50 leading-normal">
                        OAuth tokens are stored strictly server-side and never exposed in the frontend browser bundle.
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[10px] uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Read-Only Scope
                      </div>
                      <p className="text-[10px] text-white/50 leading-normal">
                        Only requests read-only events (<code className="text-white/70">calendar.events.readonly</code>). The app cannot alter or delete your schedule.
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[10px] uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        Minimal Context
                      </div>
                      <p className="text-[10px] text-white/50 leading-normal">
                        Gemini only receives event titles, start times, and end times for the relevant journal day. No descriptions or attendee lists.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: AUDIO */}
            {activeTab === 'audio' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Audio & Ambiance</h3>
                  <p className="text-xs text-white/50 mt-0.5">Configure web audio feedback and sound cues</p>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">Sound Effects & Cues</div>
                    <div className="text-xs text-white/50">Play synthesizer chimes for quest completions and level ups</div>
                  </div>
                  <button
                    onClick={onToggleSound}
                    className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 transition-all cursor-pointer ${
                      soundEnabled
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-white/5 border-white/10 text-white/40'
                    }`}
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    <span>{soundEnabled ? 'Enabled' : 'Muted'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: ACCOUNT & PROFILE */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Identity & Cloud Storage</h3>
                  <p className="text-xs text-white/50 mt-0.5">Your authenticated credentials and data synchronization status</p>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-white/50">Authenticated Email</span>
                    <span className="font-mono text-white/90">{profile.email}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-white/50">Companion Name</span>
                    <span className="text-amber-300">{profile.creature.name} (Lvl {profile.creature.level})</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-white/50">Current Goal</span>
                    <span className="text-white/90">{profile.goal.title}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-white/50">Calendar Integration</span>
                    <span className={`font-semibold ${isConnected ? 'text-emerald-400' : 'text-white/40'}`}>
                      {isConnected ? 'Active (Read-Only)' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10 bg-white/[0.01] flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
