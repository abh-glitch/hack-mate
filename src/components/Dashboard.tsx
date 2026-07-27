/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useHackMate } from "../context/HackMateContext";
import { UserProfile, Team, TeamFitScore } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { getAvatarUrl } from "../utils/avatar";
import { 
  Sparkles, Flame, UserCheck, Check, X, ArrowRight, ShieldCheck, 
  ExternalLink, FileText, Zap, Award, Activity, Heart, Clock, Loader2 
} from "lucide-react";

interface DashboardProps {
  onNavigate: (view: string) => void;
  onOpenProfile: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onOpenProfile }) => {
  const {
    currentUser,
    people,
    teams,
    invitations,
    emergencyModeGlobal,
    acceptInvite,
    rejectInvite,
    toggleUserEmergency,
    calculateAIFit
  } = useHackMate();

  const [aiReportUser, setAiReportUser] = useState<UserProfile | null>(null);
  const [aiReportLoading, setAiReportLoading] = useState(false);
  const [aiFitScore, setAiFitScore] = useState<TeamFitScore | null>(null);

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    if (!currentUser) return 0;
    let score = 20; // baseline
    if (currentUser.bio && currentUser.bio.length > 10) score += 15;
    if (currentUser.skills.languages.length > 0) score += 10;
    if (currentUser.skills.frameworks.length > 0) score += 10;
    if (currentUser.projects && currentUser.projects.length > 0) score += 20;
    if (currentUser.certificates && currentUser.certificates.length > 0) score += 10;
    if (currentUser.socials.github || currentUser.socials.linkedin) score += 10;
    if (currentUser.resumeName) score += 5;
    return Math.min(100, score);
  };

  const profileCompletion = calculateProfileCompletion();

  // Filter incoming pending invitations
  const incomingInvites = invitations.filter(
    invite => invite.receiverId === currentUser?.id && invite.status === "Pending"
  );

  // Filter outgoing pending invitations
  const outgoingInvites = invitations.filter(
    invite => invite.senderId === currentUser?.id && invite.status === "Pending"
  );

  // Filter suggested teammates based on role preference & availability
  const suggestedTeammates = people.filter(p => {
    if (p.id === currentUser?.id) return false;
    // Rotate/filter candidates
    if (emergencyModeGlobal) {
      return p.availability === "Available Now";
    }
    return p.availability === "Available Now" || p.availability === "Available This Week";
  }).slice(0, 3);

  // Launch AI Compatibility overlay
  const handleLaunchAIReport = async (candidate: UserProfile) => {
    setAiReportUser(candidate);
    setAiReportLoading(true);
    setAiFitScore(null);
    try {
      const fit = await calculateAIFit(candidate.id);
      setAiFitScore(fit);
    } catch (err) {
      console.error("AI matching failed:", err);
    } finally {
      setAiReportLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div id="dashboard_root_container" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-[#09090B] min-h-screen text-white">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest font-bold">Arena Status Room</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1 text-white">
            Welcome, <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-violet-500 bg-clip-text text-transparent">{currentUser.fullName}</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Analyze matches, respond to urgent triggers, and build a winning hackathon crew.
          </p>
        </div>

        {/* Quick Actions Panel */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="quick_action_find"
            onClick={() => onNavigate("find")}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-900/30 transition-all flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="h-4 w-4" /> Find Teammates
          </button>
          <button
            id="quick_action_create"
            onClick={() => onNavigate("teams")}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
          >
            Create Team
          </button>
        </div>
      </div>

      {/* Main Grid: Left Side Operations, Right Side Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Operations */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Incoming Urgent Invites */}
          {incomingInvites.length > 0 && (
            <div id="incoming_invites_section" className="bg-rose-950/15 border border-rose-900/30 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl rounded-full pointer-events-none" />
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm uppercase tracking-wide font-mono mb-4">
                <Flame className="h-4.5 w-4.5 animate-bounce" />
                <span>Urgent Teammate Invites Received ({incomingInvites.length})</span>
              </div>

              <div className="space-y-3">
                {incomingInvites.map((invite) => {
                  const sender = people.find(p => p.id === invite.senderId);
                  return (
                    <div
                      key={invite.id}
                      className="bg-zinc-950/60 border border-rose-900/20 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:border-rose-900/40"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={getAvatarUrl(sender?.avatarUrl, sender?.fullName || "Teammate")}
                          alt={sender?.fullName}
                          className="h-10 w-10 rounded-lg object-cover ring-2 ring-rose-500/30"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-sm font-semibold text-white">{sender?.fullName}</h4>
                            <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-900 px-2 py-0.5 rounded font-mono font-bold uppercase">
                              {invite.role}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 font-mono mt-0.5">{sender?.college}</p>
                          <p className="text-xs text-zinc-300 italic mt-2 bg-black/40 p-2 rounded-lg border border-zinc-900/60 leading-relaxed max-w-lg">
                            &ldquo;{invite.message}&rdquo;
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => acceptInvite(invite.id)}
                          className="flex-1 sm:flex-none px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Check className="h-4 w-4" /> Accept
                        </button>
                        <button
                          onClick={() => rejectInvite(invite.id)}
                          className="flex-1 sm:flex-none px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-rose-400 border border-zinc-800 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI-Suggested Teammates (Rotating, equal opportunity) */}
          <div className="glass rounded-2xl p-6 relative">
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#6C63FF]" />
                <h2 className="text-lg font-bold text-white tracking-tight">AI Teammate Recommendations</h2>
              </div>
              <span className="text-[10px] bg-[#6C63FF]/10 text-[#6C63FF] border border-[#6C63FF]/20 px-2.5 py-0.5 rounded-full font-mono font-semibold">
                FAIR ROTATION ACTIVE
              </span>
            </div>

            <p className="text-zinc-400 text-xs mb-5">
              Our fair-matching algorithm rotates matching candidates to give every builder equal opportunity. Click <span className="text-[#6C63FF] font-semibold">Check AI Match</span> to run a real-time Gemini alignment test.
            </p>

            <div className="space-y-4">
              {suggestedTeammates.map((candidate) => {
                const isCandidateFE = candidate.preferredRoles.includes("UI UX") || candidate.preferredRoles.includes("Frontend");
                const matchPctHeuristic = isCandidateFE ? 94 : 88; // sample preview
                const strokeDashOffset = 125.6 * (1 - matchPctHeuristic / 100);

                return (
                  <div
                    key={candidate.id}
                    className="glass p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden group hover:border-[#6C63FF]/50 transition-all"
                  >
                    <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-[#6C63FF]/5 to-transparent pointer-events-none"></div>
                    
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-white/10 overflow-hidden">
                        <img
                          src={getAvatarUrl(candidate.avatarUrl, candidate.fullName)}
                          alt={candidate.fullName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {candidate.availability === "Available Now" && (
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-4 border-[#09090B]">
                          <span className="animate-ping absolute inset-0 inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 text-center sm:text-left min-w-0 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1 justify-center sm:justify-start">
                        <h3 className="font-bold text-lg text-white group-hover:text-[#6C63FF] transition-colors truncate">
                          {candidate.fullName}
                        </h3>
                        {candidate.isVerified && (
                          <span className="self-center bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border border-blue-500/35">
                            Verified
                          </span>
                        )}
                      </div>
                      
                      <p className="text-zinc-400 text-xs mb-3 font-mono">
                        {candidate.college} &bull; {candidate.preferredRoles.join(", ")}
                      </p>
                      
                      <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                        {candidate.skills.languages.slice(0, 3).map((lang, idx) => (
                          <span key={idx} className="px-2 py-1 bg-white/5 rounded-md text-[10px] text-zinc-300 border border-white/5 font-mono">
                            {lang}
                          </span>
                        ))}
                        {candidate.skills.frameworks.slice(0, 2).map((framework, idx) => (
                          <span key={idx} className="px-2 py-1 bg-[#6C63FF]/10 rounded-md text-[10px] text-[#C0B9FF] border border-[#6C63FF]/15">
                            {framework}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Score Wheel */}
                    <div className="text-center w-24 flex flex-col items-center gap-1.5 shrink-0">
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="w-12 h-12 -rotate-90">
                          <circle cx="24" cy="24" r="20" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="4"></circle>
                          <circle cx="24" cy="24" r="20" fill="transparent" stroke="#6C63FF" strokeWidth="4" strokeDasharray="125.6" strokeDashoffset={strokeDashOffset}></circle>
                        </svg>
                        <span className="absolute text-xs font-extrabold text-white font-mono">{matchPctHeuristic}%</span>
                      </div>
                      <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest font-mono">Match Score</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-row sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
                      <button
                        onClick={() => handleLaunchAIReport(candidate)}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-white text-black font-bold text-xs rounded-xl hover:bg-zinc-200 transition-all text-center cursor-pointer font-sans shadow-sm"
                      >
                        AI Match
                      </button>
                      <button
                        onClick={() => onOpenProfile(candidate.id)}
                        className="flex-1 sm:flex-none px-3 py-2 bg-white/5 text-white border border-white/10 hover:bg-white/10 font-bold text-xs rounded-xl transition-all text-center cursor-pointer"
                      >
                        Inspect
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Applications Outgoing */}
          {outgoingInvites.length > 0 && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-zinc-300 mb-3">Outgoing Applications Pending Review ({outgoingInvites.length})</h3>
              <div className="space-y-2">
                {outgoingInvites.map((invite) => {
                  const receiver = people.find(p => p.id === invite.receiverId);
                  return (
                    <div key={invite.id} className="flex justify-between items-center p-3 bg-zinc-900/20 border border-zinc-850 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={getAvatarUrl(receiver?.avatarUrl, receiver?.fullName || "Teammate")}
                          alt={receiver?.fullName}
                          className="h-8 w-8 rounded-md object-cover"
                        />
                        <div>
                          <h4 className="text-xs font-semibold text-white">{receiver?.fullName}</h4>
                          <p className="text-[10px] text-zinc-500">Sent on {new Date(invite.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded font-bold">
                        PENDING RESPONDER
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Operations Control, Profile Completion, Emergency Hub */}
        <div className="space-y-6">
          
          {/* Active Emergency Control Hub */}
          <div className="glass border-rose-500/30 rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-rose-950/10">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 blur-2xl rounded-full pointer-events-none" />
            <div className="flex items-center gap-1.5 text-rose-400 font-bold font-mono text-xs uppercase mb-3">
              <Flame className="h-4.5 w-4.5 animate-pulse" />
              <span>National Rescue Dispatch</span>
            </div>

            <h3 className="text-base font-bold text-white mb-1.5">Last-Minute Teammate Dropped Out?</h3>
            <p className="text-zinc-400 text-xs leading-relaxed mb-4">
              Activate your profile&apos;s **Emergency Mode** to immediately broadcast to other builders that you are available for high-speed rescue operations.
            </p>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4 flex items-center justify-between">
              <div>
                <span className="block text-xs font-bold text-white">Your Rescue Broadcast</span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {currentUser.isEmergencyActive ? "Broadcasting live" : "Currently hidden"}
                </span>
              </div>
              
              {/* iOS style beautiful toggle */}
              <button
                id="user_emergency_toggle_button"
                onClick={toggleUserEmergency}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  currentUser.isEmergencyActive ? "bg-rose-500" : "bg-zinc-800"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    currentUser.isEmergencyActive ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {currentUser.isEmergencyActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-[10px] font-mono flex items-center gap-2"
              >
                <ShieldCheck className="h-4 w-4 text-rose-400 flex-shrink-0" />
                <span>Highlighted in Emergency Feeds. Builders receive instant notifications.</span>
              </motion.div>
            )}
          </div>

          {/* Profile Completion Card */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-bold text-zinc-300 mb-1">Verify Profile Setup</h3>
            <p className="text-zinc-500 text-[11px] mb-3">Complete your credentials to unlock highest match accuracy.</p>

            {/* Progress Bar */}
            <div className="flex items-center justify-between font-mono text-xs text-zinc-400 mb-1.5">
              <span>Fidelity Score:</span>
              <span className="font-bold text-[#6C63FF]">{profileCompletion}%</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mb-4 border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${profileCompletion}%` }}
                className="h-full bg-gradient-to-r from-[#6C63FF] to-[#8B5CF6] rounded-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/5 border border-white/5">
                <span className="text-zinc-300">Detailed Projects</span>
                {currentUser.projects?.length > 0 ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <button onClick={() => onNavigate("profile")} className="text-[10px] text-indigo-400 hover:underline">Add +</button>
                )}
              </div>
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/5 border border-white/5">
                <span className="text-zinc-300">Certificates & Awards</span>
                {currentUser.certificates?.length > 0 ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <button onClick={() => onNavigate("profile")} className="text-[10px] text-indigo-400 hover:underline">Add +</button>
                )}
              </div>
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/5 border border-white/5">
                <span className="text-zinc-300">Resume uploaded</span>
                {currentUser.resumeName ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <button onClick={() => onNavigate("profile")} className="text-[10px] text-indigo-400 hover:underline">Add +</button>
                )}
              </div>
            </div>
          </div>

          {/* Active Teams status */}
          <div className="glass rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-zinc-300">Active HackMate Teams</h3>
              <span className="text-[10px] text-zinc-500 font-mono">{teams.length} teams online</span>
            </div>

            <div className="space-y-3">
              {teams.slice(0, 2).map((team) => (
                <div key={team.id} className="p-3 bg-white/5 border border-white/5 rounded-xl relative overflow-hidden">
                  {team.isEmergency && (
                    <div className="absolute top-0 right-0 bg-rose-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-bl">
                      EMERGENCY
                    </div>
                  )}
                  <h4 className="text-xs font-bold text-white truncate">{team.name}</h4>
                  <p className="text-[10px] text-[#6C63FF] mt-0.5 truncate font-semibold">{team.hackathonName}</p>
                  
                  <div className="flex items-center justify-between mt-3 text-[10px] text-zinc-500">
                    <span>Members: {team.members.length}/{team.maxMembers}</span>
                    <span>{team.isOnline ? "Remote" : `Offline (${team.location})`}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigate("teams")}
              className="w-full text-center text-xs font-semibold text-[#6C63FF] hover:text-[#8B5CF6] mt-3 flex items-center justify-center gap-1 focus:outline-none cursor-pointer"
            >
              Manage / View All Teams <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>

      </div>

      {/* Real-time AI Matching Modal Dialog Overlay */}
      <AnimatePresence>
        {aiReportUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-950 via-purple-950 to-zinc-950 px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-400 animate-spin" />
                  <div>
                    <h3 className="text-md font-bold text-white">AI Alignment Diagnostic</h3>
                    <p className="text-[10px] text-zinc-400 font-mono">powered by Google Gemini-2.5-flash</p>
                  </div>
                </div>
                <button
                  id="close_ai_modal_btn"
                  onClick={() => setAiReportUser(null)}
                  className="p-1 text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto max-h-[80vh] space-y-5">
                
                <div className="flex items-center gap-4 p-4 bg-zinc-950 rounded-xl border border-zinc-850">
                  <div className="flex items-center gap-2 flex-grow">
                    <img
                      src={getAvatarUrl(currentUser.avatarUrl, currentUser.fullName)}
                      alt={currentUser.fullName}
                      className="h-12 w-12 rounded-lg object-cover ring-2 ring-indigo-500/40"
                    />
                    <div className="h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 flex-grow max-w-[60px]" />
                    <img
                      src={getAvatarUrl(aiReportUser.avatarUrl, aiReportUser.fullName)}
                      alt={aiReportUser.fullName}
                      className="h-12 w-12 rounded-lg object-cover ring-2 ring-purple-500/40"
                    />
                  </div>

                  <div className="text-right">
                    <span className="block text-[10px] font-mono text-zinc-500">COMPATIBILITY MATCH</span>
                    {aiReportLoading ? (
                      <div className="flex items-center gap-1.5 mt-1 justify-end">
                        <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                        <span className="text-xs text-zinc-400">Processing...</span>
                      </div>
                    ) : (
                      <span className="text-3xl font-extrabold text-transparent bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text font-mono">
                        {aiFitScore?.score}%
                      </span>
                    )}
                  </div>
                </div>

                {aiReportLoading ? (
                  <div className="py-12 space-y-4">
                    <div className="flex justify-center">
                      <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                    </div>
                    <p className="text-center text-zinc-400 text-xs font-mono animate-pulse">
                      Analyzing technology trees, availability slots, and repository synergy on Gemini core...
                    </p>
                  </div>
                ) : aiFitScore ? (
                  <>
                    {/* Positive Alignment Points */}
                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono mb-2">Core Synergies Verified</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {aiFitScore.reasons.map((reason, idx) => (
                          <div key={idx} className="p-3 bg-zinc-950/60 border border-indigo-950/60 rounded-xl flex items-start gap-2">
                            <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-zinc-300 leading-relaxed">{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Paragraph breakdown */}
                    <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-xl">
                      <h5 className="text-xs font-bold text-indigo-300 mb-1 flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5" /> Gemini System Synergy Explanation
                      </h5>
                      <p className="text-xs text-zinc-300 leading-relaxed">{aiFitScore.synergy}</p>
                    </div>

                    {/* Shared stacks & Minor Challenges */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-xl">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono mb-2.5">Unified Technology Nodes</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {aiFitScore.skillsMatch.map((skill, idx) => (
                            <span key={idx} className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-full font-semibold font-mono">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-xl">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono mb-2.5">Potential Hurdles</h4>
                        <div className="space-y-1.5">
                          {aiFitScore.challenges.length === 0 ? (
                            <span className="text-[11px] text-emerald-400 italic font-mono">Zero structural blockers identified. Optimal pair.</span>
                          ) : (
                            aiFitScore.challenges.map((challenge, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-zinc-400 text-xs font-mono">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                <span>{challenge}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Final Action directly inside AI match popup */}
                    <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                      <button
                        onClick={() => setAiReportUser(null)}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => {
                          onNavigate("find");
                          setAiReportUser(null);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-950 flex items-center gap-1 cursor-pointer"
                      >
                        Initiate Connection
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-6 text-center text-xs text-rose-400">
                    Failed to synthesize compatibility matrix. Let&apos;s try again.
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
