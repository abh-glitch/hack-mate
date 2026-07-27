/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useHackMate } from "../context/HackMateContext";
import { Bell, Flame, ShieldAlert, LogOut, User, MessageSquare, Briefcase, Users, Search, Trash2, Check, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getAvatarUrl } from "../utils/avatar";

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenProfile: (id: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenProfile }) => {
  const {
    currentUser,
    notifications,
    emergencyModeGlobal,
    setEmergencyModeGlobal,
    markNotificationsAsRead,
    clearNotifications,
    logoutUser,
    acceptInvite,
    rejectInvite
  } = useHackMate();

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [countdown, setCountdown] = useState({ hours: 14, minutes: 32, seconds: 45 });

  // Custom countdown timer representing SIH Hackathon deadline
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 24, minutes: 0, seconds: 0 }; // reset to simulator loop
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleToggleEmergencyGlobal = () => {
    setEmergencyModeGlobal(!emergencyModeGlobal);
  };

  const padZero = (n: number) => String(n).padStart(2, "0");

  return (
    <header id="app_navbar" className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#09090B] backdrop-blur-md glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and Brand */}
        <div className="flex items-center gap-6">
          <button
            id="nav_logo_btn"
            onClick={() => onNavigate("dashboard")}
            className="flex items-center gap-2.5 text-left focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-[#6C63FF] flex items-center justify-center shrink-0 primary-glow">
              <div className="w-4 h-4 bg-white rounded-sm rotate-45 flex items-center justify-center">
                <Flame className="h-3 w-3 text-[#6C63FF] -rotate-45 animate-pulse" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">
                HackMate
              </span>
              <span className="hidden sm:block text-[9px] text-[#6C63FF] font-mono tracking-widest uppercase font-bold">
                SIH Sprint Active
              </span>
            </div>
          </button>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              id="nav_dashboard"
              onClick={() => onNavigate("dashboard")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all relative ${
                currentView === "dashboard" ? "bg-white/5 text-white border border-white/10" : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Dashboard
            </button>
            <button
              id="nav_find"
              onClick={() => onNavigate("find")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all relative ${
                currentView === "find" ? "bg-white/5 text-white border border-white/10" : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Find Teammates
            </button>
            <button
              id="nav_teams"
              onClick={() => onNavigate("teams")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all relative ${
                currentView === "teams" ? "bg-white/5 text-white border border-white/10" : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              My Teams
            </button>
            <button
              id="nav_chats"
              onClick={() => onNavigate("chats")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all relative ${
                currentView === "chats" ? "bg-white/5 text-white border border-white/10" : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Chats
            </button>
            <button
              id="nav_ai_advisor"
              onClick={() => onNavigate("ai_advisor")}
              className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all relative flex items-center gap-1.5 ${
                currentView === "ai_advisor" 
                  ? "bg-[#6C63FF]/20 text-white border border-[#6C63FF]/50 shadow-md" 
                  : "text-indigo-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              AI Advisor
            </button>
          </nav>
        </div>

        {/* Dynamic Countdown & Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* SIH countdown */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-rose-950/20 border border-rose-900/40 rounded-full font-mono text-xs">
            <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            <span className="text-zinc-400">SIH Sprint Ends:</span>
            <span className="text-rose-400 font-bold">
              {padZero(countdown.hours)}h {padZero(countdown.minutes)}m {padZero(countdown.seconds)}s
            </span>
          </div>

          {/* Flagship Emergency Toggle Switch */}
          <button
            id="global_emergency_toggle"
            onClick={handleToggleEmergencyGlobal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
              emergencyModeGlobal
                ? "bg-rose-500 text-white shadow-rose-900/30 ring-2 ring-rose-500/20"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            <Flame className={`h-4 w-4 ${emergencyModeGlobal ? "text-white animate-bounce" : ""}`} />
            <span className="hidden sm:inline">Emergency Mode</span>
            <span className="font-mono text-[10px] bg-black/30 px-1.5 py-0.5 rounded-full">
              {emergencyModeGlobal ? "ACTIVE" : "OFF"}
            </span>
          </button>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              id="notifications_bell_btn"
              onClick={() => {
                setNotifDropdownOpen(!notifDropdownOpen);
                if (!notifDropdownOpen) markNotificationsAsRead();
              }}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors relative focus:outline-none"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Drawer */}
            <AnimatePresence>
              {notifDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setNotifDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 z-20 origin-top-right rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl shadow-black/80"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                      <h3 className="text-sm font-semibold text-white">Live Operations</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={clearNotifications}
                          className="text-[10px] flex items-center gap-1 text-zinc-500 hover:text-zinc-300"
                        >
                          <Trash2 className="h-3 w-3" /> Clear
                        </button>
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-zinc-500 text-xs">
                          No alerts recorded. Everything is stable.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-2.5 rounded-lg border text-left transition-all ${
                              notif.read ? "bg-zinc-900/40 border-zinc-800/40" : "bg-indigo-950/20 border-indigo-900/40 shadow-sm"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-mono text-indigo-400 uppercase font-semibold">
                                {notif.type.replace("_", " ")}
                              </span>
                              <span className="text-[9px] text-zinc-500">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <h4 className="text-xs font-semibold text-white mt-1">{notif.title}</h4>
                            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{notif.body}</p>

                            {/* Invite Actions Directly inside Notif Dropdown */}
                            {notif.type === "invite_received" && (notif.inviteId || notif.senderId) && (
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => {
                                    acceptInvite(notif.inviteId || "invite_1");
                                    setNotifDropdownOpen(false);
                                  }}
                                  className="flex-1 py-1 text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-center transition-colors flex items-center justify-center gap-1"
                                >
                                  <Check className="h-3 w-3" /> Join
                                </button>
                                <button
                                  onClick={() => {
                                    rejectInvite(notif.inviteId || "invite_1");
                                    setNotifDropdownOpen(false);
                                  }}
                                  className="flex-1 py-1 text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded font-medium text-center transition-colors"
                                >
                                  Dismiss
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* User Section / Action */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
              <button
                id="navbar_profile_shortcut"
                onClick={() => onNavigate("profile")}
                className="flex items-center gap-2 group focus:outline-none"
              >
                <div className="relative">
                  <img
                    src={getAvatarUrl(currentUser.avatarUrl, currentUser.fullName)}
                    alt={currentUser.fullName}
                    className="h-8 w-8 rounded-lg object-cover ring-2 ring-indigo-500/30 group-hover:ring-indigo-500 transition-all"
                  />
                  {currentUser.isEmergencyActive && (
                    <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                    </span>
                  )}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-white group-hover:text-indigo-200 transition-colors">
                    {currentUser.fullName}
                  </p>
                  <p className="text-[9px] font-mono text-zinc-500">
                    {currentUser.college.split(" ")[0]} Year {currentUser.year}
                  </p>
                </div>
              </button>

              <button
                id="logout_btn"
                onClick={() => {
                  logoutUser();
                  onNavigate("auth");
                }}
                className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-950 transition-colors"
                title="Disconnect"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate("auth")}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-all"
            >
              Sign In
            </button>
          )}

        </div>
      </div>

      {/* Mobile Navigation Rail */}
      <div className="md:hidden flex items-center justify-around border-t border-zinc-900 bg-zinc-950/95 py-2">
        <button
          onClick={() => onNavigate("dashboard")}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
            currentView === "dashboard" ? "text-indigo-400" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Users className="h-4.5 w-4.5" />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => onNavigate("find")}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
            currentView === "find" ? "text-indigo-400" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Search className="h-4.5 w-4.5" />
          <span>Teammates</span>
        </button>
        <button
          onClick={() => onNavigate("teams")}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
            currentView === "teams" ? "text-indigo-400" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Briefcase className="h-4.5 w-4.5" />
          <span>Teams</span>
        </button>
        <button
          onClick={() => onNavigate("chats")}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium relative ${
            currentView === "chats" ? "text-indigo-400" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <MessageSquare className="h-4.5 w-4.5" />
          <span>Chat</span>
        </button>
        <button
          onClick={() => onNavigate("profile")}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
            currentView === "profile" ? "text-indigo-400" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <User className="h-4.5 w-4.5" />
          <span>Profile</span>
        </button>
      </div>
    </header>
  );
};
