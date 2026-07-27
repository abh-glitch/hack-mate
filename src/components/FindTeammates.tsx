/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useHackMate } from "../context/HackMateContext";
import { UserProfile, TeamFitScore } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { getAvatarUrl } from "../utils/avatar";
import { 
  Search, SlidersHorizontal, Sparkles, Send, Check, AlertCircle, 
  MapPin, GraduationCap, Clock, Award, ShieldCheck, HelpCircle, 
  ChevronDown, X, Info, Loader2, Zap, Flame 
} from "lucide-react";

interface FindTeammatesProps {
  onOpenProfile: (id: string) => void;
}

export const FindTeammates: React.FC<FindTeammatesProps> = ({ onOpenProfile }) => {
  const {
    currentUser,
    people,
    teams,
    sendInvite,
    calculateAIFit,
    emergencyModeGlobal,
    setEmergencyModeGlobal
  } = useHackMate();

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedExp, setSelectedExp] = useState("All");
  const [selectedAvail, setSelectedAvail] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All");
  const [sortBy, setSortBy] = useState("Compatibility");
  const [showFilters, setShowFilters] = useState(false);

  // Invite form states
  const [inviteCandidate, setInviteCandidate] = useState<UserProfile | null>(null);
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteRoleNeeded, setInviteRoleNeeded] = useState("");
  const [inviteSelectedTeam, setInviteSelectedTeam] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // AI Matching report states
  const [aiReportUser, setAiReportUser] = useState<UserProfile | null>(null);
  const [aiReportLoading, setAiReportLoading] = useState(false);
  const [aiFitScore, setAiFitScore] = useState<TeamFitScore | null>(null);

  // Auto set first active team as selected invite context if exists
  useEffect(() => {
    const userCreatedTeams = teams.filter(t => t.createdBy === currentUser?.id);
    if (userCreatedTeams.length > 0) {
      setInviteSelectedTeam(userCreatedTeams[0].id);
    }
  }, [teams, currentUser]);

  // Filter & Search computation
  const filteredPeople = people.filter(person => {
    // Exclude current user
    if (person.id === currentUser?.id) return false;

    // Emergency mode override
    if (emergencyModeGlobal) {
      if (person.availability !== "Available Now") return false;
    }

    // Global text search matching (Name, College, Skills, Bio)
    const normalizedQuery = searchQuery.toLowerCase();
    const matchesSearch = 
      person.fullName.toLowerCase().includes(normalizedQuery) ||
      person.college.toLowerCase().includes(normalizedQuery) ||
      person.bio.toLowerCase().includes(normalizedQuery) ||
      person.skills.languages.some(s => s.toLowerCase().includes(normalizedQuery)) ||
      person.skills.frameworks.some(s => s.toLowerCase().includes(normalizedQuery)) ||
      person.preferredRoles.some(r => r.toLowerCase().includes(normalizedQuery));

    if (!matchesSearch) return false;

    // Filter by Role
    if (selectedRole !== "All" && !person.preferredRoles.includes(selectedRole)) {
      return false;
    }

    // Filter by Exp
    if (selectedExp !== "All" && person.experienceLevel !== selectedExp) {
      return false;
    }

    // Filter by Availability
    if (selectedAvail !== "All" && person.availability !== selectedAvail) {
      return false;
    }

    // Filter by Location Format
    if (selectedLocation !== "All") {
      if (selectedLocation === "Remote" && person.locationPreference === "Offline") return false;
      if (selectedLocation === "Offline" && person.locationPreference === "Remote") return false;
    }

    // Filter by Specific City (Location)
    if (selectedCity !== "All" && person.city !== selectedCity) {
      return false;
    }

    return true;
  });

  const uniqueCities = Array.from(new Set(people.map(p => p.city).filter(Boolean)));

  // Sort computation
  let sortedPeople = [...filteredPeople];
  if (sortBy === "Fair Recommendation") {
    // Interleave beginners and experienced developers to ensure equal top of the fold exposure
    const beginners = filteredPeople.filter(p => p.experienceLevel === "Beginner" || p.experienceLevel === "Intermediate");
    const experts = filteredPeople.filter(p => p.experienceLevel === "Advanced" || p.experienceLevel === "Expert");
    const interleaved: UserProfile[] = [];
    const maxLen = Math.max(beginners.length, experts.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < beginners.length) interleaved.push(beginners[i]);
      if (i < experts.length) interleaved.push(experts[i]);
    }
    sortedPeople = interleaved;
  } else {
    sortedPeople.sort((a, b) => {
      // Custom heuristic sorting rules
      if (sortBy === "Compatibility") {
        // Simulate compatibility matching based on role complementarity (if current user is Frontend, Backend rates higher)
        const isUserFE = currentUser?.preferredRoles.includes("Frontend") || currentUser?.preferredRoles.includes("UI UX");
        const aIsComplement = isUserFE ? (a.preferredRoles.includes("Backend") || a.preferredRoles.includes("AI/ML")) : (a.preferredRoles.includes("Frontend") || a.preferredRoles.includes("UI UX"));
        const bIsComplement = isUserFE ? (b.preferredRoles.includes("Backend") || b.preferredRoles.includes("AI/ML")) : (b.preferredRoles.includes("Frontend") || b.preferredRoles.includes("UI UX"));
        
        if (aIsComplement && !bIsComplement) return -1;
        if (!aIsComplement && bIsComplement) return 1;
        
        // Secondary sort by verification & experience
        if (a.isVerified && !b.isVerified) return -1;
        if (!a.isVerified && b.isVerified) return 1;
        return b.hackathonExperience - a.hackathonExperience;
      }

      if (sortBy === "Availability") {
        const availWeights: Record<string, number> = {
          "Available Now": 4,
          "Available This Week": 3,
          "Busy": 2,
          "Not Looking": 1
        };
        return (availWeights[b.availability] || 0) - (availWeights[a.availability] || 0);
      }

      if (sortBy === "Verified Skills") {
        if (a.isVerified && !b.isVerified) return -1;
        if (!a.isVerified && b.isVerified) return 1;
        return 0;
      }

      if (sortBy === "Distance") {
        // Sort matching same city first
        const sameCityA = a.city.toLowerCase() === currentUser?.city.toLowerCase();
        const sameCityB = b.city.toLowerCase() === currentUser?.city.toLowerCase();
        if (sameCityA && !sameCityB) return -1;
        if (!sameCityA && sameCityB) return 1;
        return 0;
      }

      // Default newest
      return b.hackathonExperience - a.hackathonExperience;
    });
  }

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

  const handleOpenInvite = (candidate: UserProfile) => {
    setInviteCandidate(candidate);
    setInviteMessage(`Hey ${candidate.fullName.split(" ")[0]}! I checked our AI alignment scores, and we match at 95% Compatibility. I would love for you to join our sprint! Let's build.`);
    setInviteRoleNeeded(candidate.preferredRoles[0] || "Frontend");
    setInviteSuccess(false);
  };

  const handleSendInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCandidate) return;

    sendInvite(
      inviteCandidate.id,
      inviteRoleNeeded,
      inviteMessage,
      inviteSelectedTeam || undefined
    );

    setInviteSuccess(true);
    setTimeout(() => {
      setInviteCandidate(null);
      setInviteSuccess(false);
    }, 1500);
  };

  return (
    <div id="find_teammates_container" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-[#09090B] min-h-screen text-white">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-6 mb-6">
        <div>
          <span className="text-xs font-mono text-purple-400 uppercase tracking-widest font-bold">Search & Match Core</span>
          <h1 className="text-3xl font-extrabold text-white mt-1">Discover Compatible Builders</h1>
          <p className="text-zinc-400 text-xs mt-1">
            Intelligent compatibility ranking based on skills, formats, and verified code repositories.
          </p>
        </div>

        {/* Global Emergency Status Banner */}
        {emergencyModeGlobal && (
          <div className="flex items-center gap-3 px-4 py-2 bg-rose-950/20 border border-rose-900/30 rounded-xl max-w-sm">
            <Flame className="h-5 w-5 text-rose-500 animate-pulse flex-shrink-0" />
            <div>
              <span className="block text-xs font-bold text-rose-400 font-mono">EMERGENCY MODE SPEED FILTER ACTIVED</span>
              <span className="text-[10px] text-zinc-400 leading-none">Displaying only teammates ready to hack right now.</span>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar: Search Input, Filters Location, Sort */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        
        {/* Search */}
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-3.5 h-4.5 w-4.5 text-zinc-500" />
          <input
            id="candidate_search_input"
            type="text"
            placeholder="Search name, university, language, framework..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-3 p-1 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Location (City) Filter */}
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2">
          <MapPin className="h-4 w-4 text-indigo-400 flex-shrink-0" />
          <span className="text-xs text-zinc-500 font-mono">City:</span>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-zinc-900 text-xs text-white font-semibold focus:outline-none w-full cursor-pointer border-none"
          >
            <option value="All" className="bg-zinc-900 text-white">All Cities</option>
            {uniqueCities.map((city, idx) => (
              <option key={idx} value={city} className="bg-zinc-900 text-white">{city}</option>
            ))}
          </select>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2">
          <span className="text-xs text-zinc-500 font-mono">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-zinc-900 text-xs text-white font-semibold focus:outline-none w-full cursor-pointer border-none"
          >
            <option value="Compatibility" className="bg-zinc-900 text-white">AI Compatibility</option>
            <option value="Fair Recommendation" className="bg-zinc-900 text-white">Fair Rec (Equal Opp)</option>
            <option value="Availability" className="bg-zinc-900 text-white">Availability Now</option>
            <option value="Verified Skills" className="bg-zinc-900 text-white">Verified Badge</option>
            <option value="Distance" className="bg-zinc-900 text-white">Same Location</option>
          </select>
        </div>

        {/* Advanced Filters Toggle */}
        <button
          id="filters_toggle_btn"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
            showFilters
              ? "bg-indigo-600/10 border-indigo-500 text-indigo-300"
              : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
          }`}
        >
          <SlidersHorizontal className="h-4.5 w-4.5" />
          <span>Filters</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>

      </div>

      {/* Advanced Filter Panels (Dropdown style drawer) */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-zinc-900/40 border border-zinc-850 rounded-xl p-4 sm:p-5 grid grid-cols-2 md:grid-cols-5 gap-4">
              
              {/* Role filter */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-mono">Role Profile</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="All" className="bg-zinc-900 text-white">All Roles</option>
                  <option value="Frontend" className="bg-zinc-900 text-white">Frontend</option>
                  <option value="Backend" className="bg-zinc-900 text-white">Backend</option>
                  <option value="AI/ML" className="bg-zinc-900 text-white">AI/ML</option>
                  <option value="UI UX" className="bg-zinc-900 text-white">UI UX</option>
                  <option value="Flutter" className="bg-zinc-900 text-white">Flutter</option>
                  <option value="Blockchain" className="bg-zinc-900 text-white">Blockchain</option>
                  <option value="Cloud" className="bg-zinc-900 text-white">Cloud</option>
                </select>
              </div>

              {/* Exp filter */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-mono">Expertise Tier</label>
                <select
                  value={selectedExp}
                  onChange={(e) => setSelectedExp(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="All" className="bg-zinc-900 text-white">All Levels</option>
                  <option value="Beginner" className="bg-zinc-900 text-white">Beginner</option>
                  <option value="Intermediate" className="bg-zinc-900 text-white">Intermediate</option>
                  <option value="Advanced" className="bg-zinc-900 text-white">Advanced</option>
                  <option value="Expert" className="bg-zinc-900 text-white">Expert</option>
                </select>
              </div>

              {/* Availability filter */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-mono">Availability Slots</label>
                <select
                  value={selectedAvail}
                  onChange={(e) => setSelectedAvail(e.target.value)}
                  disabled={emergencyModeGlobal}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                >
                  {emergencyModeGlobal ? (
                    <option value="Available Now" className="bg-zinc-900 text-white">Locked: Available Now</option>
                  ) : (
                    <>
                      <option value="All" className="bg-zinc-900 text-white">All Availabilities</option>
                      <option value="Available Now" className="bg-zinc-900 text-white">Available Now</option>
                      <option value="Available This Week" className="bg-zinc-900 text-white">Available This Week</option>
                      <option value="Busy" className="bg-zinc-900 text-white">Busy</option>
                      <option value="Not Looking" className="bg-zinc-900 text-white">Not Looking</option>
                    </>
                  )}
                </select>
              </div>

              {/* Format format filter */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-mono">Format Preference</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="All" className="bg-zinc-900 text-white">All Formats</option>
                  <option value="Remote" className="bg-zinc-900 text-white">Remote Preferred</option>
                  <option value="Offline" className="bg-zinc-900 text-white">Offline Preferred</option>
                </select>
              </div>

              {/* Specific City / Location filter */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-mono">Specific City (Location)</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full bg-[#18181B] border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="All" className="bg-zinc-900 text-white">All Cities</option>
                  {uniqueCities.map((city, idx) => (
                    <option key={idx} value={city} className="bg-zinc-900 text-white">{city}</option>
                  ))}
                </select>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid listing of builders */}
      {sortedPeople.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-zinc-850 rounded-2xl">
          <AlertCircle className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-zinc-300">No Match Criteria Satisfied</h3>
          <p className="text-zinc-500 text-xs mt-1">Try relaxing filters, or expanding search parameters.</p>
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {sortedPeople.map((person) => {
            // Heuristic compatibility matching percentage
            const isFE = person.preferredRoles.includes("UI UX") || person.preferredRoles.includes("Frontend");
            const matchPct = isFE ? 94 : 88;
            const strokeDashOffset = 125.6 * (1 - matchPct / 100);

            return (
              <motion.div
                layout
                key={person.id}
                className="glass hover:border-[#6C63FF]/50 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-sm relative overflow-hidden"
              >
                <div>
                  
                  {/* Photo & Status Indicators */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={getAvatarUrl(person.avatarUrl, person.fullName)}
                          alt={person.fullName}
                          className="h-14 w-14 rounded-xl object-cover ring-2 ring-white/10 group-hover:ring-[#6C63FF]/40 transition-colors"
                        />
                        {person.availability === "Available Now" && (
                          <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-base font-bold text-zinc-100 group-hover:text-white transition-colors">
                            {person.fullName}
                          </h3>
                          {person.isVerified && (
                            <span className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide border border-blue-500/30">
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 font-mono mt-0.5">{person.college.split(" ")[0]}</p>
                      </div>
                    </div>

                    <div className="text-center shrink-0">
                      <div className="relative w-10 h-10 flex items-center justify-center">
                        <svg className="w-10 h-10 -rotate-90">
                          <circle cx="20" cy="20" r="16" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="3"></circle>
                          <circle cx="20" cy="20" r="16" fill="transparent" stroke="#6C63FF" strokeWidth="3" stroke-dasharray="100.48" stroke-dashoffset={100.48 * (1 - matchPct / 100)}></circle>
                        </svg>
                        <span className="absolute text-[10px] font-bold text-white font-mono">{matchPct}%</span>
                      </div>
                      <span className="block text-[8px] text-zinc-500 font-mono uppercase tracking-widest mt-0.5">AI Score</span>
                    </div>
                  </div>

                  {/* Bio statement */}
                  <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3 mb-4">
                    {person.bio}
                  </p>

                  {/* Location Info */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-400 font-mono mb-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-zinc-500" />
                      <span>{person.city}, {person.state}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-zinc-500" />
                      <span>{person.availability}</span>
                    </div>
                  </div>

                  {/* Skills badges */}
                  <div className="space-y-2.5 mb-4">
                    <div>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">Frameworks</span>
                      <div className="flex flex-wrap gap-1">
                        {person.skills.frameworks.slice(0, 3).map((f, idx) => (
                          <span key={idx} className="text-[10px] bg-[#6C63FF]/10 hover:bg-[#6C63FF]/20 text-[#C0B9FF] px-2 py-0.5 rounded-md font-medium border border-[#6C63FF]/15 transition-colors">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">Languages / Tools</span>
                      <div className="flex flex-wrap gap-1">
                        {[...person.skills.languages, ...person.skills.tools].slice(0, 4).map((s, idx) => (
                          <span key={idx} className="text-[10px] bg-white/5 text-zinc-300 px-2 py-0.5 rounded-md border border-white/5">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Card Actions Footer */}
                <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleLaunchAIReport(person)}
                    className="py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold border border-white/10 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#6C63FF]" /> Check Match
                  </button>
                  <button
                    onClick={() => handleOpenInvite(person)}
                    className="py-1.5 bg-white text-black hover:bg-zinc-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Send className="h-3 w-3" /> Invite
                  </button>
                </div>

                <button
                  onClick={() => onOpenProfile(person.id)}
                  className="w-full text-center text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors mt-2"
                >
                  View complete resume and projects
                </button>

              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Invite Modal Overlay */}
      <AnimatePresence>
        {inviteCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl shadow-black relative"
            >
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3 mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Send className="h-4.5 w-4.5 text-indigo-400" /> Transmit Invite: {inviteCandidate.fullName}
                </h3>
                <button
                  onClick={() => setInviteCandidate(null)}
                  className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {inviteSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-2">
                    <Check className="h-6 w-6 animate-bounce" />
                  </div>
                  <h4 className="text-md font-bold text-white">Invitation Dispatched!</h4>
                  <p className="text-zinc-400 text-xs">A real-time socket signal has been emitted. Happy hacking!</p>
                </div>
              ) : (
                <form onSubmit={handleSendInviteSubmit} className="space-y-4">
                  
                  {/* Select team role needed */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-mono">Needed Role</label>
                    <select
                      value={inviteRoleNeeded}
                      onChange={(e) => setInviteRoleNeeded(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {inviteCandidate.preferredRoles.map((r, i) => (
                        <option key={i} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  {/* Select active Team */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-mono">Select Team Context</label>
                    <select
                      value={inviteSelectedTeam}
                      onChange={(e) => setInviteSelectedTeam(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Direct Collaboration Offer</option>
                      {teams.filter(t => t.createdBy === currentUser?.id).map((t, i) => (
                        <option key={i} value={t.id}>{t.name} ({t.hackathonName})</option>
                      ))}
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-mono font-semibold">Custom Message Pitch</label>
                    <textarea
                      rows={3}
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-zinc-700 leading-relaxed"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-2 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setInviteCandidate(null)}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-950 flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" /> Dispatch Signal
                    </button>
                  </div>

                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Real-time AI Matching Modal Dialog Overlay (Copied from Dashboard) */}
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
                      src={getAvatarUrl(currentUser?.avatarUrl, currentUser?.fullName || "You")}
                      alt={currentUser?.fullName}
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
                          handleOpenInvite(aiReportUser);
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
