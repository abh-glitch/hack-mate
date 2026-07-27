/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { HackMateProvider, useHackMate } from "./context/HackMateContext";
import { Navbar } from "./components/Navbar";
import { AuthView } from "./components/AuthView";
import { ProfileCompletionView } from "./components/ProfileCompletionView";
import { Dashboard } from "./components/Dashboard";
import { FindTeammates } from "./components/FindTeammates";
import { CreateTeam } from "./components/CreateTeam";
import { ChatRoom } from "./components/ChatRoom";
import { ProfileView } from "./components/ProfileView";
import { AICopilot } from "./components/AICopilot";
import { motion, AnimatePresence } from "motion/react";
import { Flame, ShieldAlert, Sparkles, Bot, X } from "lucide-react";

function AppContent() {
  const { currentUser } = useHackMate();
  const [view, setView] = useState<string>("auth");
  const [selectedProfileId, setSelectedProfileId] = useState<string | undefined>(undefined);
  const [previousView, setPreviousView] = useState<string>("dashboard");
  const [isCopilotModalOpen, setIsCopilotModalOpen] = useState(false);

  // Keep view aligned with authentication session
  useEffect(() => {
    if (!currentUser) {
      setView("auth");
    } else if (view === "auth") {
      setView("dashboard");
    }
  }, [currentUser]);

  const handleOpenProfile = (id: string) => {
    setSelectedProfileId(id);
    setPreviousView(view);
    setView("profile");
  };

  const handleCloseProfile = () => {
    setSelectedProfileId(undefined);
    setView(previousView);
  };

  const renderActiveView = () => {
    if (currentUser && currentUser.isProfileComplete === false) {
      return <ProfileCompletionView />;
    }
    switch (view) {
      case "auth":
        return <AuthView onAuthSuccess={() => setView("dashboard")} />;
      case "dashboard":
        return <Dashboard onNavigate={setView} onOpenProfile={handleOpenProfile} />;
      case "find":
        return <FindTeammates onOpenProfile={handleOpenProfile} />;
      case "teams":
        return <CreateTeam onOpenProfile={handleOpenProfile} />;
      case "chats":
        return <ChatRoom />;
      case "ai_advisor":
        return (
          <div className="max-w-5xl mx-auto px-4 py-8">
            <AICopilot />
          </div>
        );
      case "profile":
        return (
          <ProfileView
            userId={selectedProfileId}
            onClose={selectedProfileId ? handleCloseProfile : undefined}
          />
        );
      default:
        return <Dashboard onNavigate={setView} onOpenProfile={handleOpenProfile} />;
    }
  };

  return (
    <div id="hackmate_main_canvas" className="min-h-screen bg-[#09090B] font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* Navbar display only if logged in and profile is complete */}
      {view !== "auth" && currentUser && currentUser.isProfileComplete !== false && (
        <Navbar
          currentView={view}
          onNavigate={(newView) => {
            setSelectedProfileId(undefined); // reset inspectors
            setView(newView);
          }}
          onOpenProfile={handleOpenProfile}
        />
      )}

      {/* Main View Container with smooth Framer Motion transitions */}
      <main className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {renderActiveView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating AI Copilot Toggle Button & Modal (visible when logged in) */}
      {view !== "auth" && currentUser && currentUser.isProfileComplete !== false && (
        <>
          <div className="fixed bottom-6 right-6 z-40">
            <button
              id="floating_ai_copilot_trigger"
              onClick={() => setIsCopilotModalOpen(!isCopilotModalOpen)}
              className="group flex items-center gap-2.5 px-4 py-3 bg-[#6C63FF] hover:bg-indigo-600 text-white font-bold rounded-2xl shadow-2xl border border-indigo-400/40 transition-all transform hover:scale-105 active:scale-95 primary-glow cursor-pointer"
            >
              <div className="relative">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <span className="text-sm font-sans tracking-tight">AI Advisor</span>
            </button>
          </div>

          <AnimatePresence>
            {isCopilotModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ duration: 0.2 }}
                  className="w-full max-w-4xl max-h-[90vh]"
                >
                  <AICopilot onClose={() => setIsCopilotModalOpen(false)} />
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Aesthetic Footer */}
      <footer id="app_footer" className="py-8 border-t border-zinc-900 bg-zinc-950/40 text-center text-zinc-500 text-[10px] font-mono">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-zinc-400">
            <Flame className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
            <span className="font-bold">HackMate System Node v2.5.4</span>
            <span>• Verified Secure Sandbox Operations</span>
          </div>
          <p>
            An intelligent last-minute hackathon team builder, optimized for peak development velocity.
          </p>
          <p className="text-zinc-600">
            &copy; {new Date().getFullYear()} HackMate Labs. Designed for elite hackathon performance.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <HackMateProvider>
      <AppContent />
    </HackMateProvider>
  );
}
