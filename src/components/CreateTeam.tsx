/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useHackMate } from "../context/HackMateContext";
import { Team } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { getAvatarUrl } from "../utils/avatar";
import { 
  Users, Plus, Landmark, MapPin, Globe, Sparkles, Check, 
  Trash2, Send, ShieldCheck, Heart, Info, X, Users2, Flame 
} from "lucide-react";

interface CreateTeamProps {
  onOpenProfile: (id: string) => void;
}

export const CreateTeam: React.FC<CreateTeamProps> = ({ onOpenProfile }) => {
  const {
    currentUser,
    teams,
    people,
    invitations,
    sendInvite,
    acceptInvite,
    createTeam,
    emergencyModeGlobal
  } = useHackMate();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [requestedTeams, setRequestedTeams] = useState<string[]>([]);

  // Form Fields
  const [teamName, setTeamName] = useState("");
  const [hackName, setHackName] = useState("");
  const [desc, setDesc] = useState("");
  const [location, setLocation] = useState("New Delhi");
  const [isOnline, setIsOnline] = useState(true);
  const [maxMembers, setMaxMembers] = useState(4);
  const [rolesNeededInput, setRolesNeededInput] = useState("Backend");
  const [skillsNeededInput, setSkillsNeededInput] = useState("");
  const [visibility, setVisibility] = useState<'Public' | 'Private'>("Public");

  // Error handling
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!teamName || !hackName || !desc) {
      setError("Please fill in team name, hackathon event name, and details.");
      return;
    }

    const processedRoles = [rolesNeededInput];
    const processedSkills = skillsNeededInput
      ? skillsNeededInput.split(",").map(s => s.trim()).filter(s => s.length > 0)
      : ["React", "TypeScript"];

    createTeam({
      name: teamName,
      hackathonName: hackName,
      description: desc,
      location: isOnline ? "Remote" : location,
      isOnline,
      requiredRoles: processedRoles,
      maxMembers: Number(maxMembers),
      skillsNeeded: processedSkills,
      visibility
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setShowCreateForm(false);
      // Reset form
      setTeamName("");
      setHackName("");
      setDesc("");
      setSkillsNeededInput("");
    }, 1500);
  };

  return (
    <div id="create_team_root" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-[#09090B] min-h-screen text-white">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6 mb-8">
        <div>
          <span className="text-xs font-mono text-purple-400 uppercase tracking-widest font-bold font-semibold">Active Squad Board</span>
          <h1 className="text-3xl font-extrabold text-white mt-1">Hackathon Teams & Squads</h1>
          <p className="text-zinc-400 text-xs mt-1">Generate dynamic squads, request specific skills, and view teammate fill statuses.</p>
        </div>

        <button
          id="toggle_create_team_form_btn"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-900/30 hover:shadow-indigo-500/20"
        >
          {showCreateForm ? <X className="h-4 w-4" /> : <Plus className="h-4.5 w-4.5" />}
          <span>{showCreateForm ? "Close Form" : "Create New Team"}</span>
        </button>
      </div>

      {/* Main Container Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Create Team Form (Pops out or sits as left column) */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="lg:col-span-1 glass rounded-2xl p-5 sm:p-6 h-fit"
            >
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-1.5">
                <Plus className="h-5 w-5 text-[#6C63FF]" /> Establish Squad
              </h2>

              {success ? (
                <div className="py-8 text-center space-y-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-2">
                    <Check className="h-6 w-6 animate-bounce" />
                  </div>
                  <h4 className="text-md font-bold text-white">Squad Activated!</h4>
                  <p className="text-zinc-400 text-xs">Your hackathon team profile has been listed on the open board.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-mono">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-mono">Team Name</label>
                    <input
                      id="team_name_input"
                      type="text"
                      placeholder="e.g. ByteBenders"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF]/30 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-mono">Hackathon Event Name</label>
                    <input
                      id="hackathon_name_input"
                      type="text"
                      placeholder="e.g. Smart India Hackathon 2026"
                      value={hackName}
                      onChange={(e) => setHackName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF]/30 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-mono">Roster Description / Goal</label>
                    <textarea
                      rows={3}
                      placeholder="Detail your project concept or team objectives. Mention specific needs."
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF]/30 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-mono">Participation Mode</label>
                      <select
                        value={isOnline ? "Online" : "Offline"}
                        onChange={(e) => setIsOnline(e.target.value === "Online")}
                        className="w-full bg-[#09090B] border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#6C63FF] transition-all cursor-pointer"
                      >
                        <option value="Online">Online / Remote</option>
                        <option value="Offline">Offline / Venue</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-mono">Max Crew Limit</label>
                      <input
                        type="number"
                        min={2}
                        max={6}
                        value={maxMembers}
                        onChange={(e) => setMaxMembers(Number(e.target.value))}
                        className="w-full bg-[#09090B] border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#6C63FF] transition-all"
                      />
                    </div>
                  </div>

                  {!isOnline && (
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-mono">Venue Location / City</label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF]/30 transition-all"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-mono">Needed Role Node</label>
                      <select
                        value={rolesNeededInput}
                        onChange={(e) => setRolesNeededInput(e.target.value)}
                        className="w-full bg-[#09090B] border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#6C63FF] transition-all cursor-pointer"
                      >
                        <option value="Frontend">Frontend</option>
                        <option value="Backend">Backend</option>
                        <option value="AI/ML">AI/ML</option>
                        <option value="UI UX">UI UX</option>
                        <option value="Flutter">Flutter</option>
                        <option value="Cloud">Cloud</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-mono">Board Visibility</label>
                      <select
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value as any)}
                        className="w-full bg-[#09090B] border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#6C63FF] transition-all cursor-pointer"
                      >
                        <option value="Public">Public Board</option>
                        <option value="Private">Private / Direct Only</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-mono">Technology Tags Needed</label>
                    <input
                      type="text"
                      placeholder="e.g. Node.js, PyTorch, Docker, React"
                      value={skillsNeededInput}
                      onChange={(e) => setSkillsNeededInput(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF]/30 transition-all"
                    />
                  </div>

                  <button
                    id="submit_team_generation_btn"
                    type="submit"
                    className="w-full py-2.5 bg-white text-black hover:bg-zinc-200 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                  >
                    <Users className="h-4 w-4" />
                    <span>Initialize Squad & Roster</span>
                  </button>

                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Teams List (Spans remaining columns) */}
        <div className={`space-y-6 ${showCreateForm ? "lg:col-span-2" : "lg:col-span-3"}`}>
          
          <div className="glass rounded-2xl p-5">
            <h2 className="text-md font-bold text-white mb-4 flex items-center gap-2">
              <Users2 className="h-5 w-5 text-[#6C63FF]" /> Active HackMate Teams Board
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {teams.map((team) => {
                const creator = people.find(p => p.id === team.createdBy) || (team.createdBy === currentUser?.id ? currentUser : null);
                const isUserMember = team.members.includes(currentUser?.id || "");
                
                const existingInvite = invitations.find(i => i.teamId === team.id && (i.senderId === currentUser?.id || i.receiverId === currentUser?.id));
                const hasRequested = existingInvite && existingInvite.senderId === currentUser?.id && existingInvite.status === "Pending";
                const hasReceivedInvite = existingInvite && existingInvite.receiverId === currentUser?.id && existingInvite.status === "Pending";

                return (
                  <div
                    key={team.id}
                    className={`bg-white/5 hover:bg-white/[0.08] border border-white/5 hover:border-[#6C63FF]/30 rounded-2xl p-5 flex flex-col justify-between transition-all relative ${
                      isUserMember ? "ring-1 ring-[#6C63FF]/25" : ""
                    }`}
                  >
                    {/* Floating emergency badge */}
                    {team.isEmergency && (
                      <span className="absolute top-0 right-0 bg-rose-500 text-white text-[8px] font-bold px-2.5 py-1 rounded-tr-2xl rounded-bl font-mono tracking-widest uppercase animate-pulse">
                        EMERGENCY MATCH
                      </span>
                    )}

                    <div>
                      <div className="mb-3">
                        <span className="text-[10px] bg-[#6C63FF]/15 text-[#C0B9FF] font-bold px-2.5 py-1 rounded-full font-mono border border-[#6C63FF]/20 uppercase">
                          {team.hackathonName}
                        </span>
                        <h3 className="text-base font-bold text-white mt-2 truncate">{team.name}</h3>
                        
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>{team.isOnline ? "Remote format" : `Offline Venue (${team.location})`}</span>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3 mb-4">
                        {team.description}
                      </p>

                      {/* Required roles */}
                      <div className="mb-4">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Targeting Role Categories</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {team.requiredRoles.map((role, idx) => (
                            <span key={idx} className="text-[9px] bg-rose-500/10 border border-rose-500/20 text-rose-300 px-2 py-0.5 rounded-md font-mono font-bold uppercase">
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Skills needed */}
                      <div className="mb-4">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Technology Alignment Needed</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {team.skillsNeeded.map((skill, idx) => (
                            <span key={idx} className="text-[10px] bg-[#6C63FF]/10 text-[#C0B9FF] px-2 py-0.5 rounded-md border border-[#6C63FF]/15">
                              #{skill.toLowerCase()}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Current Members roster */}
                      <div className="border-t border-white/5 pt-3 mt-4">
                        <span className="block text-[9px] font-mono text-zinc-500 uppercase mb-2"> Roster Status ({team.members.length}/{team.maxMembers})</span>
                        <div className="flex items-center gap-2">
                          {team.members.map((memberId) => {
                            const person = people.find(p => p.id === memberId) || (memberId === currentUser?.id ? currentUser : null);
                            if (!person) return null;
                            return (
                              <button
                                key={memberId}
                                onClick={() => onOpenProfile(person.id)}
                                className="focus:outline-none relative group cursor-pointer"
                                title={person.fullName}
                              >
                                <img
                                  src={getAvatarUrl(person.avatarUrl, person.fullName)}
                                  alt={person.fullName}
                                  className="h-8 w-8 rounded-lg object-cover ring-2 ring-white/10 hover:ring-[#6C63FF] transition-all"
                                />
                                <div className="absolute bottom-full mb-1.5 hidden group-hover:block bg-black text-white text-[9px] px-2 py-0.5 rounded whitespace-nowrap z-10">
                                  {person.fullName}
                                </div>
                              </button>
                            );
                          })}
                          
                          {/* Display remaining empty slots */}
                          {Array.from({ length: Math.max(0, team.maxMembers - team.members.length) }).map((_, idx) => (
                            <div
                              key={idx}
                              className="h-8 w-8 rounded-lg border border-dashed border-white/10 bg-white/5 flex items-center justify-center text-xs text-zinc-600 font-mono"
                              title="Empty Slot Open"
                            >
                              ?
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Team action cards */}
                    <div className="mt-5 pt-3 border-t border-white/5">
                      {isUserMember ? (
                        <div className="text-center py-1.5 bg-[#6C63FF]/10 border border-[#6C63FF]/20 rounded-xl text-xs text-[#C0B9FF] font-semibold font-mono">
                          ✓ ACTIVE SQUAD LEADER / MEMBER
                        </div>
                      ) : hasReceivedInvite ? (
                        <button
                          onClick={() => acceptInvite(existingInvite.id)}
                          className="w-full py-1.5 bg-[#6C63FF] hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-1 font-mono uppercase"
                        >
                          <Check className="h-4 w-4" /> Accept Invitation
                        </button>
                      ) : hasRequested ? (
                        <div className="text-center py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-semibold font-mono flex items-center justify-center gap-1.5">
                          <Check className="h-4 w-4" /> REQUEST TRANSMITTED
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            sendInvite(
                              team.createdBy,
                              team.requiredRoles[0] || "Frontend",
                              "I'd like to join your roster on HackMate!",
                              team.id
                            );
                          }}
                          className="w-full py-1.5 bg-white text-black hover:bg-zinc-200 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-1"
                        >
                          Request to Join Team
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* Useful national statistics cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-4 flex items-center gap-3.5">
              <div className="p-2.5 bg-[#6C63FF]/10 border border-[#6C63FF]/20 rounded-xl text-[#C0B9FF]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-300">National Sandbox Compliant</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">All database schemas are compliant with hackathon integrity rules.</p>
              </div>
            </div>

            <div className="glass rounded-2xl p-4 flex items-center gap-3.5">
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-300">Fast Response Times</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">Emergency Mode broadcasts reach recipients in under 240 milliseconds.</p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
