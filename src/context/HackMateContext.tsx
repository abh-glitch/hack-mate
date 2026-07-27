/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, Team, Invitation, Chat, Message, Notification, TeamFitScore, Project, Certificate } from "../types";
import { INITIAL_USER, INITIAL_PEOPLE, INITIAL_TEAMS, INITIAL_INVITATIONS, INITIAL_CHATS, INITIAL_MESSAGES, INITIAL_NOTIFICATIONS } from "../mockData";

interface HackMateContextType {
  currentUser: UserProfile | null;
  people: UserProfile[];
  teams: Team[];
  invitations: Invitation[];
  chats: Chat[];
  messages: Message[];
  notifications: Notification[];
  emergencyModeGlobal: boolean;
  setEmergencyModeGlobal: (val: boolean) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  addProject: (proj: Omit<Project, "id">) => void;
  deleteProject: (id: string) => void;
  addCertificate: (cert: Omit<Certificate, "id">) => void;
  deleteCertificate: (id: string) => void;
  createTeam: (teamData: Omit<Team, "id" | "members" | "createdBy" | "createdAt" | "isEmergency">) => Team;
  sendInvite: (receiverId: string, role: string, message: string, teamId?: string) => void;
  acceptInvite: (inviteId: string) => void;
  rejectInvite: (inviteId: string) => void;
  withdrawInvite: (inviteId: string) => void;
  sendMessage: (chatId: string, content: string, type?: "text" | "code" | "image" | "file", fileName?: string, fileSize?: string) => void;
  markNotificationsAsRead: () => void;
  clearNotifications: () => void;
  verifySkill: (skillName: string) => void;
  calculateAIFit: (candidateId: string, requestedRole?: string) => Promise<TeamFitScore>;
  loginUser: (email: string, password?: string, name?: string, isGoogle?: boolean) => Promise<{ success: boolean; error?: string }>;
  signupUser: (userData: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  logoutUser: () => void;
  toggleUserEmergency: () => void;
  verifyResetEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string, verificationAnswer: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<boolean>;
}

const HackMateContext = createContext<HackMateContextType | undefined>(undefined);

export const HackMateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [people, setPeople] = useState<UserProfile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [emergencyModeGlobal, setEmergencyModeGlobal] = useState<boolean>(true);

  // Sync state with backend on mount
  useEffect(() => {
    const fetchDb = async () => {
      try {
        const response = await fetch("/api/db");
        if (response.ok) {
          const db = await response.json();
          if (db.currentUser) {
            setCurrentUser(db.currentUser);
          } else {
            // Default to null if no session
            setCurrentUser(null);
          }
          setPeople(db.people || INITIAL_PEOPLE);
          setTeams(db.teams || INITIAL_TEAMS);
          setInvitations(db.invitations || INITIAL_INVITATIONS);
          setChats(db.chats || INITIAL_CHATS);
          setMessages(db.messages || INITIAL_MESSAGES);
          setNotifications(db.notifications || INITIAL_NOTIFICATIONS);
          setEmergencyModeGlobal(db.emergencyModeGlobal !== undefined ? db.emergencyModeGlobal : true);
        }
      } catch (err) {
        console.warn("Backend API offline, falling back to LocalStorage:", err);
        const getLocal = <T,>(key: string, fallback: T): T => {
          const stored = localStorage.getItem(key);
          return stored ? JSON.parse(stored) : fallback;
        };
        setCurrentUser(getLocal<UserProfile | null>("hm_current_user", null));
        setPeople(getLocal<UserProfile[]>("hm_people", INITIAL_PEOPLE));
        setTeams(getLocal<Team[]>("hm_teams", INITIAL_TEAMS));
        setInvitations(getLocal<Invitation[]>("hm_invitations", INITIAL_INVITATIONS));
        setChats(getLocal<Chat[]>("hm_chats", INITIAL_CHATS));
        setMessages(getLocal<Message[]>("hm_messages", INITIAL_MESSAGES));
        setNotifications(getLocal<Notification[]>("hm_notifications", INITIAL_NOTIFICATIONS));
        setEmergencyModeGlobal(getLocal<boolean>("hm_emergency_mode_global", true));
      }
    };

    fetchDb();
  }, []);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    // Optimistic UI update
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    setPeople(prev => prev.map(p => p.id === currentUser.id ? updated : p));

    try {
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates })
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.currentUser);
        setPeople(data.people);
      }
    } catch (err) {
      console.error("Profile update sync failed:", err);
    }
  };

  const addProject = async (proj: Omit<Project, "id">) => {
    if (!currentUser) return;
    try {
      const response = await fetch("/api/profile/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proj })
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.currentUser);
        setPeople(data.people);
      }
    } catch (err) {
      console.error("Add project sync failed:", err);
    }
  };

  const deleteProject = async (id: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/profile/project/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.currentUser);
        setPeople(data.people);
      }
    } catch (err) {
      console.error("Delete project sync failed:", err);
    }
  };

  const addCertificate = async (cert: Omit<Certificate, "id">) => {
    if (!currentUser) return;
    try {
      const response = await fetch("/api/profile/certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cert })
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.currentUser);
        setPeople(data.people);
      }
    } catch (err) {
      console.error("Add certificate sync failed:", err);
    }
  };

  const deleteCertificate = async (id: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/profile/certificate/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.currentUser);
        setPeople(data.people);
      }
    } catch (err) {
      console.error("Delete certificate sync failed:", err);
    }
  };

  const createTeam = (teamData: Omit<Team, "id" | "members" | "createdBy" | "createdAt" | "isEmergency">) => {
    const tempId = "team_temp_" + Date.now();
    const creatorId = currentUser?.id || "anonymous";
    const tempTeam: Team = {
      ...teamData,
      id: tempId,
      members: [creatorId],
      createdBy: creatorId,
      createdAt: new Date().toISOString(),
      isEmergency: emergencyModeGlobal
    };

    // Optimistic UI updates
    setTeams(prev => [tempTeam, ...prev]);

    const syncCreateTeam = async () => {
      try {
        const response = await fetch("/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamData })
        });
        if (response.ok) {
          const data = await response.json();
          setTeams(data.teams);
          setNotifications(data.notifications);
        }
      } catch (err) {
        console.error("Create team sync failed:", err);
      }
    };
    syncCreateTeam();

    return tempTeam;
  };

  const sendInvite = async (receiverId: string, role: string, message: string, teamId?: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId, role, message, teamId })
      });
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations);
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Send invite sync failed:", err);
    }
  };

  const acceptInvite = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/invitations/${inviteId}/accept`, {
        method: "POST"
      });
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations);
        setTeams(data.teams);
        setChats(data.chats);
        setMessages(data.messages);
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Accept invite sync failed:", err);
    }
  };

  const rejectInvite = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/invitations/${inviteId}/reject`, {
        method: "POST"
      });
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations);
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Reject invite sync failed:", err);
    }
  };

  const withdrawInvite = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/invitations/${inviteId}/withdraw`, {
        method: "POST"
      });
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations);
      }
    } catch (err) {
      console.error("Withdraw invite sync failed:", err);
    }
  };

  const sendMessage = async (chatId: string, content: string, type: "text" | "code" | "image" | "file" = "text", fileName?: string, fileSize?: string) => {
    if (!currentUser) return;

    // Optimistic message update
    const tempMsg: Message = {
      id: "msg_temp_" + Date.now(),
      chatId,
      senderId: currentUser.id,
      content,
      type,
      fileName,
      fileSize,
      createdAt: new Date().toISOString(),
      seen: false
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, content, type, fileName, fileSize })
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        setChats(data.chats);
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Send message sync failed:", err);
    }
  };

  const markNotificationsAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      const response = await fetch("/api/notifications/read", {
        method: "POST"
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Mark notifications read sync failed:", err);
    }
  };

  const clearNotifications = async () => {
    setNotifications([]);
    try {
      const response = await fetch("/api/notifications/clear", {
        method: "POST"
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Clear notifications sync failed:", err);
    }
  };

  const verifySkill = async (skillName: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch("/api/profile/verify-skill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillName })
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Verify skill sync failed:", err);
    }
  };

  const toggleUserEmergency = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch("/api/profile/toggle-emergency", {
        method: "POST"
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.currentUser);
        setPeople(data.people);
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Toggle user emergency sync failed:", err);
    }
  };

  const calculateAIFit = async (candidateId: string, requestedRole?: string): Promise<TeamFitScore> => {
    if (!currentUser) {
      throw new Error("No authenticated session available");
    }

    const candidate = people.find(p => p.id === candidateId);
    if (!candidate) {
      throw new Error("Candidate profile not found");
    }

    try {
      // Calls our real backend /api/ai-match endpoint
      const response = await fetch("/api/ai-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userA: currentUser,
          userB: candidate,
          requestedRole
        })
      });

      if (!response.ok) {
        throw new Error("Match calculation network failure");
      }

      return await response.json();
    } catch (err) {
      console.warn("API match call failed, calculating with local heuristics:", err);
      // Fallback deterministic match calculations to ensure absolute 100% uptime
      return calculateLocalFitHeuristics(currentUser, candidate, requestedRole);
    }
  };

  const calculateLocalFitHeuristics = (userA: UserProfile, userB: UserProfile, requestedRole?: string): TeamFitScore => {
    let score = 55;
    const reasons: string[] = [];
    const skillsMatch: string[] = [];
    const challenges: string[] = [];

    // Simple robust calculation
    const rolesA = userA.preferredRoles || [];
    const rolesB = userB.preferredRoles || [];
    const isA_FE = rolesA.includes("Frontend") || rolesA.includes("UI UX");
    const isA_BE = rolesA.includes("Backend") || rolesA.includes("AI/ML") || rolesA.includes("Cloud");
    const isB_FE = rolesB.includes("Frontend") || rolesB.includes("UI UX");
    const isB_BE = rolesB.includes("Backend") || rolesB.includes("AI/ML") || rolesB.includes("Cloud");

    if (requestedRole) {
      if (rolesB.includes(requestedRole)) {
        score += 15;
        reasons.push(`Direct matching for requested role: ${requestedRole}`);
      }
    } else if ((isA_FE && isB_BE) || (isA_BE && isB_FE)) {
      score += 20;
      reasons.push("Perfect Frontend & Backend complementarity.");
    } else {
      reasons.push("Complementary full stack engineering coverage.");
    }

    const skillsA = [...(userA.skills?.languages || []), ...(userA.skills?.frameworks || [])];
    const skillsB = [...(userB.skills?.languages || []), ...(userB.skills?.frameworks || [])];
    const common = skillsA.filter(s => skillsB.includes(s));

    if (common.length > 0) {
      score += Math.min(common.length * 5, 20);
      skillsMatch.push(...common.slice(0, 3));
      reasons.push(`Shared expertise in: ${common.slice(0, 2).join(", ")}`);
    } else {
      skillsMatch.push("TypeScript", "React");
    }

    if (userA.availability === "Available Now" && userB.availability === "Available Now") {
      score += 15;
      reasons.push("Both are 'Available Now' for lightning-fast delivery.");
    }

    if (userA.city.toLowerCase() === userB.city.toLowerCase() && userA.locationPreference === "Offline" && userB.locationPreference === "Offline") {
      score += 10;
      reasons.push(`In-person collaboration ready in ${userA.city}`);
    }

    score = Math.max(10, Math.min(100, score));

    return {
      score,
      reasons,
      synergy: `Excellent peer engineering matching between ${userA.fullName} and ${userB.fullName}. Highly integrated work capabilities will facilitate accelerated sprint builds.`,
      skillsMatch,
      challenges: challenges.length > 0 ? challenges : ["Divergent college bases"]
    };
  };

  const loginUser = async (email: string, password?: string, name?: string, isGoogle?: boolean) => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, isGoogle })
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentUser(data.currentUser);
        localStorage.setItem("hm_current_user", JSON.stringify(data.currentUser));
        if (data.notifications) {
          setNotifications(data.notifications);
        }
        return { success: true };
      } else {
        return { success: false, error: data.error || "Login failed" };
      }
    } catch (err) {
      console.error("Login sync failed:", err);
      return { success: false, error: "Network error during login" };
    }
  };

  const signupUser = async (userData: Partial<UserProfile>) => {
    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userData })
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentUser(data.currentUser);
        localStorage.setItem("hm_current_user", JSON.stringify(data.currentUser));
        if (data.people) setPeople(data.people);
        if (data.notifications) setNotifications(data.notifications);
        return { success: true };
      } else {
        return { success: false, error: data.error || "Signup failed" };
      }
    } catch (err) {
      console.error("Signup sync failed:", err);
      return { success: false, error: "Network error during signup" };
    }
  };

  const logoutUser = async () => {
    setCurrentUser(null);
    localStorage.removeItem("hm_current_user");
    try {
      await fetch("/api/logout", {
        method: "POST"
      });
    } catch (err) {
      console.error("Logout sync failed:", err);
    }
  };

  const deleteAccount = async () => {
    if (!currentUser) return false;
    try {
      const response = await fetch("/api/profile/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (response.ok) {
        setCurrentUser(null);
        localStorage.removeItem("hm_current_user");
        return true;
      }
    } catch (err) {
      console.error("Delete account sync failed:", err);
    }
    return false;
  };

  const verifyResetEmail = async (email: string) => {
    try {
      const response = await fetch("/api/verify-reset-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.error || "Email verification failed" };
      }
    } catch (err) {
      console.error("Verify reset email sync failed:", err);
      return { success: false, error: "Network error during email verification" };
    }
  };

  const resetPassword = async (email: string, verificationAnswer: string, newPassword: string) => {
    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, verificationAnswer, newPassword })
      });
      const data = await response.json();
      if (response.ok) {
        // Refetch DB to sync local states
        try {
          const resDb = await fetch("/api/db");
          if (resDb.ok) {
            const db = await resDb.json();
            if (db.currentUser) setCurrentUser(db.currentUser);
            if (db.people) setPeople(db.people);
            if (db.notifications) setNotifications(db.notifications);
          }
        } catch (err) {
          console.error("Failed to sync DB after password reset", err);
        }
        return { success: true };
      } else {
        return { success: false, error: data.error || "Password reset failed" };
      }
    } catch (err) {
      console.error("Reset password sync failed:", err);
      return { success: false, error: "Network error during password reset" };
    }
  };

  const updateEmergencyGlobal = async (val: boolean) => {
    setEmergencyModeGlobal(val);
    try {
      await fetch("/api/emergency-mode-global", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ val })
      });
    } catch (err) {
      console.error("Set global emergency sync failed:", err);
    }
  };

  const getPersonName = (id: string) => {
    if (id === currentUser?.id) return "You";
    const p = people.find(x => x.id === id);
    return p ? p.fullName : "Teammate";
  };

  return (
    <HackMateContext.Provider
      value={{
        currentUser,
        people,
        teams,
        invitations,
        chats,
        messages,
        notifications: currentUser ? notifications.filter(n => n.userId === currentUser.id) : [],
        emergencyModeGlobal,
        setEmergencyModeGlobal: updateEmergencyGlobal,
        updateProfile,
        addProject,
        deleteProject,
        addCertificate,
        deleteCertificate,
        createTeam,
        sendInvite,
        acceptInvite,
        rejectInvite,
        withdrawInvite,
        sendMessage,
        markNotificationsAsRead,
        clearNotifications,
        verifySkill,
        calculateAIFit,
        loginUser,
        signupUser,
        logoutUser,
        toggleUserEmergency,
        verifyResetEmail,
        resetPassword,
        deleteAccount
      }}
    >
      {children}
    </HackMateContext.Provider>
  );
};

export const useHackMate = () => {
  const context = useContext(HackMateContext);
  if (context === undefined) {
    throw new Error("useHackMate must be used within a HackMateProvider");
  }
  return context;
};
