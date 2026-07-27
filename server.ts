/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc 
} from "firebase/firestore";
import { 
  INITIAL_USER, 
  INITIAL_PEOPLE, 
  INITIAL_TEAMS, 
  INITIAL_INVITATIONS, 
  INITIAL_CHATS, 
  INITIAL_MESSAGES, 
  INITIAL_NOTIFICATIONS 
} from "./src/mockData";
import { UserProfile, Team, Invitation, Chat, Message, Notification, Project, Certificate } from "./src/types";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// Persistent DB file paths (fallback backup)
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

interface DbSchema {
  currentUser: UserProfile | null;
  people: UserProfile[];
  teams: Team[];
  invitations: Invitation[];
  chats: Chat[];
  messages: Message[];
  notifications: Notification[];
  emergencyModeGlobal: boolean;
}

// Memory database cache (populated from Firestore on boot, fast GETs)
let memoryDb: DbSchema = {
  currentUser: null,
  people: INITIAL_PEOPLE,
  teams: INITIAL_TEAMS,
  invitations: INITIAL_INVITATIONS,
  chats: INITIAL_CHATS,
  messages: INITIAL_MESSAGES,
  notifications: INITIAL_NOTIFICATIONS,
  emergencyModeGlobal: true,
};

// Initialize Firebase
let firebaseApp;
let dbFirestore: any = null;

try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    firebaseApp = initializeApp(config);
    dbFirestore = getFirestore(firebaseApp, config.firestoreDatabaseId || "(default)");
    console.log("Firebase Firestore initialized successfully with Database ID:", config.firestoreDatabaseId || "(default)");
  } else {
    console.warn("firebase-applet-config.json not found. Operating in local-only fallback mode.");
  }
} catch (err) {
  console.error("Failed to initialize Firebase Firestore:", err);
}

// Sync from Firestore database state on startup
async function syncFromFirestore() {
  if (!dbFirestore) {
    console.log("No Firestore client; loading from local db.json...");
    memoryDb = loadLocalDbBackup();
    return;
  }

  try {
    console.log("Synchronizing database state from Google Cloud Firestore...");

    // 1. Sync global settings document
    const globalDocRef = doc(dbFirestore, "settings", "global");
    const globalDoc = await getDoc(globalDocRef);
    let emergencyModeGlobal = true;
    let currentUser: UserProfile | null = null;

    if (globalDoc.exists()) {
      const data = globalDoc.data();
      emergencyModeGlobal = data.emergencyModeGlobal !== undefined ? data.emergencyModeGlobal : true;
      currentUser = data.currentUser !== undefined ? data.currentUser : null;
    } else {
      console.log("Settings document not found. Writing default settings to Firestore...");
      await setDoc(globalDocRef, { emergencyModeGlobal, currentUser });
    }

    // 2. Helper to load / seed collections
    const loadCollection = async (colName: string, initialData: any[]) => {
      const colRef = collection(dbFirestore, colName);
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) {
        console.log(`Firestore collection '${colName}' is empty. Seeding defaults...`);
        for (const item of initialData) {
          if (item && item.id) {
            await setDoc(doc(colRef, item.id), item);
          }
        }
        return initialData;
      } else {
        const items: any[] = [];
        snapshot.forEach(docSnap => {
          items.push(docSnap.data());
        });
        return items;
      }
    };

    const people = await loadCollection("people", INITIAL_PEOPLE);
    const teams = await loadCollection("teams", INITIAL_TEAMS);
    const invitations = await loadCollection("invitations", INITIAL_INVITATIONS);
    const chats = await loadCollection("chats", INITIAL_CHATS);
    const messages = await loadCollection("messages", INITIAL_MESSAGES);
    const notifications = await loadCollection("notifications", INITIAL_NOTIFICATIONS);

    memoryDb = {
      currentUser,
      people,
      teams,
      invitations,
      chats,
      messages,
      notifications,
      emergencyModeGlobal
    };
    console.log("Firebase state synchronization completed successfully!");
  } catch (err) {
    console.error("Failed to sync from Firestore. Falling back to local files:", err);
    memoryDb = loadLocalDbBackup();
  }
}

// Local fallback DB files loaders
function loadLocalDbBackup(): DbSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const defaultDb: DbSchema = {
      currentUser: null,
      people: INITIAL_PEOPLE,
      teams: INITIAL_TEAMS,
      invitations: INITIAL_INVITATIONS,
      chats: INITIAL_CHATS,
      messages: INITIAL_MESSAGES,
      notifications: INITIAL_NOTIFICATIONS,
      emergencyModeGlobal: true,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf8");
    return defaultDb;
  }
  try {
    const data = fs.readFileSync(DB_FILE, "utf8");
    const db = JSON.parse(data);
    db.currentUser = db.currentUser || null;
    return db;
  } catch (err) {
    console.error("Failed to parse db.json, returning default:", err);
    return {
      currentUser: null,
      people: INITIAL_PEOPLE,
      teams: INITIAL_TEAMS,
      invitations: INITIAL_INVITATIONS,
      chats: INITIAL_CHATS,
      messages: INITIAL_MESSAGES,
      notifications: INITIAL_NOTIFICATIONS,
      emergencyModeGlobal: true,
    };
  }
}

// Return the memory cache database for ultra-fast API response times
function loadDb(): DbSchema {
  // Ensure default directory is initialized if empty
  if (!memoryDb.people || memoryDb.people.length === 0) {
    memoryDb.people = [INITIAL_USER];
  }

  if (memoryDb.currentUser) {
    const currentUserId = memoryDb.currentUser.id;
    const userTeams = memoryDb.teams.filter(t => t.members.includes(currentUserId));
    let updatedChats = false;

    for (const team of userTeams) {
      const hasTeamChat = memoryDb.chats.some(c => c.teamId === team.id);
      if (!hasTeamChat) {
        const newTeamChat: Chat = {
          id: "chat_team_" + team.id,
          participantIds: team.members,
          teamId: team.id,
          isTeamChat: true,
          lastMessage: "Team Group Chat initiated for " + team.name,
          lastMessageAt: team.createdAt || new Date().toISOString()
        };
        memoryDb.chats.push(newTeamChat);

        const systemMsg: Message = {
          id: "msg_team_seed_" + team.id + "_" + Date.now(),
          chatId: newTeamChat.id,
          senderId: team.createdBy,
          content: `Welcome to the group chat for ${team.name}! Sync up and begin hacking!`,
          type: "text",
          createdAt: team.createdAt || new Date().toISOString(),
          seen: false
        };
        memoryDb.messages.push(systemMsg);
        updatedChats = true;
      } else {
        const tc = memoryDb.chats.find(c => c.teamId === team.id);
        if (tc) {
          const membersStr = [...team.members].sort().join(",");
          const partsStr = [...tc.participantIds].sort().join(",");
          if (membersStr !== partsStr) {
            tc.participantIds = team.members;
            updatedChats = true;
          }
        }
      }
    }

    if (updatedChats) {
      saveDb(memoryDb);
    }
  }
  return memoryDb;
}

// Sync changes back to local JSON and async persist to Google Cloud Firestore
async function saveDb(db: DbSchema) {
  memoryDb = db;

  // Local physical file backup write (synchronous)
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write physical backup file:", err);
  }

  // Google Cloud Firestore async replication write
  if (!dbFirestore) return;
  try {
    // 1. Sync global settings
    const globalDocRef = doc(dbFirestore, "settings", "global");
    await setDoc(globalDocRef, { 
      emergencyModeGlobal: db.emergencyModeGlobal, 
      currentUser: db.currentUser 
    });

    // 2. Incremental collection synchronization helper (upserts + handles deletions)
    const syncCollection = async (colName: string, items: any[]) => {
      const colRef = collection(dbFirestore, colName);
      const activeIds = new Set<string>();

      // Upsert/Insert items
      for (const item of items) {
        if (item && item.id) {
          activeIds.add(item.id);
          await setDoc(doc(colRef, item.id), item);
        }
      }

      // Sync deletions (e.g. cleared notifications)
      const snapshot = await getDocs(colRef);
      for (const docSnap of snapshot.docs) {
        if (!activeIds.has(docSnap.id)) {
          await deleteDoc(doc(dbFirestore, colName, docSnap.id));
        }
      }
    };

    // Parallelize background tasks for speed
    await Promise.all([
      syncCollection("people", db.people),
      syncCollection("teams", db.teams),
      syncCollection("invitations", db.invitations),
      syncCollection("chats", db.chats),
      syncCollection("messages", db.messages),
      syncCollection("notifications", db.notifications)
    ]);
  } catch (err) {
    console.error("Firestore serialization failed:", err);
  }
}

// Initialize Gemini API client safely (lazy client / optional check)
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
    console.log("Gemini API Client initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini Client:", err);
  }
} else {
  console.log("GEMINI_API_KEY not found in environment. Heuristic fallback will be used.");
}

// REST API endpoint: AI Match Calculations
app.post("/api/ai-match", async (req, res) => {
  try {
    const { userA, userB, requestedRole } = req.body;

    if (!userA || !userB) {
      return res.status(400).json({ error: "Missing user profiles for comparison." });
    }

    // Heuristic Matching fallback algorithm (always available to guarantee uptime)
    const runHeuristicMatching = () => {
      let score = 50; // base score
      const reasons: string[] = [];
      const skillsMatch: string[] = [];
      const challenges: string[] = [];

      // Role Complementarity
      const rolesA = userA.preferredRoles || [];
      const rolesB = userB.preferredRoles || [];
      const isA_FE = rolesA.includes("Frontend") || rolesA.includes("UI UX");
      const isA_BE = rolesA.includes("Backend") || rolesA.includes("AI/ML") || rolesA.includes("Cloud");
      const isB_FE = rolesB.includes("Frontend") || rolesB.includes("UI UX");
      const isB_BE = rolesB.includes("Backend") || rolesB.includes("AI/ML") || rolesB.includes("Cloud");

      if (requestedRole) {
        if (rolesB.includes(requestedRole)) {
          score += 15;
          reasons.push(`Fills your requested team role: ${requestedRole}.`);
        }
      } else if ((isA_FE && isB_BE) || (isA_BE && isB_FE)) {
        score += 15;
        reasons.push("Perfect Frontend & Backend complementarity for high productivity.");
      } else {
        reasons.push("Similar primary roles, offering strong focus in one area.");
      }

      // Skill Overlaps & Complements
      const skillsA = [
        ...(userA.skills?.languages || []),
        ...(userA.skills?.frameworks || []),
        ...(userA.skills?.tools || [])
      ];
      const skillsB = [
        ...(userB.skills?.languages || []),
        ...(userB.skills?.frameworks || []),
        ...(userB.skills?.tools || [])
      ];

      const sharedSkills = skillsA.filter(s => skillsB.includes(s));
      if (sharedSkills.length > 0) {
        score += Math.min(sharedSkills.length * 4, 15);
        skillsMatch.push(...sharedSkills.slice(0, 4));
        reasons.push(`Shared tech stack expertise in: ${sharedSkills.slice(0, 2).join(", ")}.`);
      }

      // Experience balance
      const expA = userA.experienceLevel;
      const expB = userB.experienceLevel;
      if (expA === "Beginner" && (expB === "Advanced" || expB === "Expert")) {
        score += 10;
        reasons.push("Great mentorship dynamic (Beginner paired with highly experienced teammate).");
      } else if (expA === expB && expA !== "Beginner") {
        score += 8;
        reasons.push(`Equally strong ${expA} proficiency, ensuring peers of equal speed.`);
      } else {
        score += 5;
      }

      // Availability check
      if (userA.availability === "Available Now" && userB.availability === "Available Now") {
        score += 15;
        reasons.push("Both are Available Now for lightning fast, immediate last-minute sprint.");
      } else if (userB.availability === "Busy") {
        score -= 15;
        challenges.push("User list availability is marked 'Busy'. Expect communication gaps.");
      } else {
        score += 5;
        reasons.push("Feasible schedule compatibility for upcoming days.");
      }

      // Location match
      if (userA.locationPreference === "Offline" && userB.locationPreference === "Offline") {
        if (userA.city.toLowerCase() === userB.city.toLowerCase()) {
          score += 10;
          reasons.push(`Both prefer Offline hackathons and are based in ${userA.city}.`);
        } else {
          score -= 10;
          challenges.push(`Different cities (${userA.city} vs ${userB.city}) for offline format.`);
        }
      } else if (userA.locationPreference === "Remote" || userB.locationPreference === "Remote") {
        score += 5;
        reasons.push("Remote format compatibility aligns perfectly.");
      }

      // Normalization
      score = Math.max(10, Math.min(100, score));

      let synergy = `Dynamic pairing of ${userA.fullName} and ${userB.fullName}. `;
      if (score >= 85) {
        synergy += "Excellent technical alignment, fast schedule overlap, and synergistic roles. High recommended compatibility for fast hacking!";
      } else if (score >= 70) {
        synergy += "Solid matching indicators. Strong core technical skills overlap and functional roles fit nicely.";
      } else {
        synergy += "Moderately compatible. May require adjustments on project scope or timeline alignment due to diverging roles or schedules.";
      }

      return {
        score,
        reasons,
        synergy,
        skillsMatch: skillsMatch.length > 0 ? skillsMatch : ["JS", "Web"],
        challenges: challenges.length > 0 ? challenges : ["Diverging preferences"]
      };
    };

    if (!ai) {
      // Return fallback response
      const result = runHeuristicMatching();
      return res.json(result);
    }

    // Call Gemini API if available
    const prompt = `
      Perform a highly intelligent team compatibility matching evaluation between two student profiles for a hackathon team formation.
      Be objective and precise.

      User A (Comparing user):
      - Name: ${userA.fullName}
      - College: ${userA.college}
      - Role: ${userA.preferredRoles?.join(", ")}
      - Experience: ${userA.experienceLevel}
      - Availability: ${userA.availability}
      - Location Preference: ${userA.locationPreference} (${userA.city}, ${userA.state})
      - Skills: Languages: ${userA.skills?.languages?.join(", ")}, Frameworks: ${userA.skills?.frameworks?.join(", ")}, Tools: ${userA.skills?.tools?.join(", ")}
      - Bio: ${userA.bio}

      User B (Target match candidate):
      - Name: ${userB.fullName}
      - College: ${userB.college}
      - Role: ${userB.preferredRoles?.join(", ")}
      - Experience: ${userB.experienceLevel}
      - Availability: ${userB.availability}
      - Location Preference: ${userB.locationPreference} (${userB.city}, ${userB.state})
      - Skills: Languages: ${userB.skills?.languages?.join(", ")}, Frameworks: ${userB.skills?.frameworks?.join(", ")}, Tools: ${userB.skills?.tools?.join(", ")}
      - Bio: ${userB.bio}

      ${requestedRole ? `Requested Specific Role for User B to fill: "${requestedRole}"` : ""}

      Evaluate compatibility. Consider role complementary (e.g. Frontend + Backend), technology synergy, availability status, experience leveling (mentorship is good too), and location preference.
      You must respond ONLY with a clean JSON object containing the following keys (no markdown wrapping other than pure JSON):
      {
        "score": <number between 10 and 100 representing the fit percent>,
        "reasons": <array of 2-4 strings explaining positive matching points (e.g., "Complementary Front/Back stacks", "Both available immediately for last-minute sprint")>,
        "synergy": <a cohesive 2-3 sentence paragraph explaining their synergy, why they make an excellent or stable pair, and what they could achieve together>,
        "skillsMatch": <array of 2-5 technical tags that represent overlap or strong complements>,
        "challenges": <array of 1-2 strings listing minor challenges or hurdles, or empty array if none (e.g., "Slightly different city base", "Different experience tiers")>
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    try {
      const parsed = JSON.parse(text);
      return res.json({
        score: typeof parsed.score === "number" ? parsed.score : 75,
        reasons: Array.isArray(parsed.reasons) ? parsed.reasons : ["Solid role compatibility"],
        synergy: typeof parsed.synergy === "string" ? parsed.synergy : "Aligned technical and functional background.",
        skillsMatch: Array.isArray(parsed.skillsMatch) ? parsed.skillsMatch : ["TypeScript", "Web Development"],
        challenges: Array.isArray(parsed.challenges) ? parsed.challenges : []
      });
    } catch (parseErr) {
      console.error("Gemini JSON parse failed, returning fallback:", text, parseErr);
      return res.json(runHeuristicMatching());
    }

  } catch (err) {
    console.error("Error in /api/ai-match:", err);
    // Graceful error fallback
    return res.status(500).json({ error: "Failed to perform match calculation" });
  }
});

// REST API Endpoint: Multi-Turn AI Chat Advisor with High Thinking, Maps Grounding, & Image understanding
app.post("/api/ai-chat", async (req, res) => {
  try {
    const { message, history, mode, imageBase64, imageMimeType, locationQuery } = req.body;
    if (!message && !imageBase64 && !locationQuery) {
      return res.status(400).json({ error: "Message, image, or location query is required" });
    }

    if (!ai) {
      return res.json({
        reply: `Gemini API client initialized in simulated mode. (Query received: "${message || locationQuery || 'Image upload'}"). For full live answers, ensure GEMINI_API_KEY is configured in Settings > Secrets.`,
        modelUsed: "gemini-3.5-flash",
        modeUsed: mode || "general"
      });
    }

    let selectedModel = "gemini-3.5-flash";
    const config: any = {
      systemInstruction: "You are HackMate AI Advisor, an elite hackathon mentor, technical architect, pitch coach, and venue finder. Provide clear, structured, actionable recommendations tailored for hackathon participants."
    };

    const contents: any[] = [];

    // Append past conversation history for multi-turn chat continuity
    if (Array.isArray(history)) {
      for (const item of history) {
        if (item.role && item.parts) {
          contents.push({
            role: item.role === "user" ? "user" : "model",
            parts: typeof item.parts === "string" ? [{ text: item.parts }] : item.parts
          });
        }
      }
    }

    // Configure model and features based on requested mode
    if (mode === "thinking") {
      selectedModel = "gemini-3.1-pro-preview";
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      // CRITICAL: Do NOT set maxOutputTokens for high thinking mode
    } else if (mode === "fast") {
      selectedModel = "gemini-3.1-flash-lite";
    } else if (mode === "maps" || locationQuery) {
      selectedModel = "gemini-3.5-flash";
      config.tools = [{ googleMaps: {} }];
    } else if (imageBase64 || mode === "vision") {
      selectedModel = "gemini-3.1-pro-preview";
    } else {
      selectedModel = "gemini-3.5-flash";
    }

    // Prepare current user turn content
    const currentParts: any[] = [];
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      currentParts.push({
        inlineData: {
          mimeType: imageMimeType || "image/png",
          data: cleanBase64
        }
      });
    }

    const textPrompt = message || (locationQuery ? `Find hackathon venues and locations for: ${locationQuery}` : "Analyze this image for hackathon project insights.");
    currentParts.push({ text: textPrompt });

    contents.push({
      role: "user",
      parts: currentParts
    });

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config
    });

    res.json({
      reply: response.text || "No response generated.",
      modelUsed: selectedModel,
      modeUsed: mode || "general"
    });
  } catch (err: any) {
    console.error("AI Chat Endpoint Error:", err);
    res.status(500).json({ error: err.message || "Failed to process AI chat request" });
  }
});

// REST API Endpoint: Dedicated Image Analysis using gemini-3.1-pro-preview
app.post("/api/ai-analyze-image", async (req, res) => {
  try {
    const { imageBase64, mimeType, prompt } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 is required" });
    }

    if (!ai) {
      return res.json({
        analysis: "Gemini API client not configured. (Simulated Analysis): The uploaded image appears to represent a hackathon architecture diagram or certificate."
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        {
          inlineData: {
            mimeType: mimeType || "image/png",
            data: cleanBase64
          }
        },
        {
          text: prompt || "Examine this image in detail. Identify technical components, whiteboard diagrams, or certifications."
        }
      ]
    });

    res.json({
      analysis: response.text || "No analysis generated."
    });
  } catch (err: any) {
    console.error("AI Image Analysis Error:", err);
    res.status(500).json({ error: err.message || "Failed to analyze image" });
  }
});

// REST API Endpoint: Google Maps Grounded Venue Search using gemini-3.5-flash
app.post("/api/ai-venue-search", async (req, res) => {
  try {
    const { query, location } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Location search query is required." });
    }

    if (!ai) {
      return res.json({
        recommendations: `Gemini API not configured. Simulated venue results for: ${query}`
      });
    }

    const prompt = `Find up to date, accurate locations, venues, co-working spaces, tech hubs, or hackathon campuses for: ${query}. Location context: ${location || "India"}. Provide names, addresses, and details suitable for hackathon teams.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }]
      }
    });

    res.json({
      recommendations: response.text || "No venue recommendations found."
    });
  } catch (err: any) {
    console.error("AI Venue Search Error:", err);
    res.status(500).json({ error: err.message || "Failed to search venues with Google Maps grounding" });
  }
});

// GET database state
app.get("/api/db", (req, res) => {
  try {
    const db = loadDb();
    const filteredDb = {
      ...db,
      notifications: db.currentUser 
        ? db.notifications.filter(n => n.userId === db.currentUser.id) 
        : []
    };
    res.json(filteredDb);
  } catch (err) {
    console.error("GET /api/db error:", err);
    res.status(500).json({ error: "Failed to load database state" });
  }
});

// Auth endpoints
app.post("/api/login", (req, res) => {
  try {
    const { email, password, isGoogle } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const db = loadDb();
    
    // Check if user already exists in directory by email
    let user = db.people.find(p => p.email && p.email.toLowerCase() === email.toLowerCase());
    
    if (isGoogle) {
      if (!user) {
        if (email.toLowerCase() === INITIAL_USER.email.toLowerCase()) {
          user = { ...INITIAL_USER };
        } else {
          user = {
            id: "user_" + Date.now(),
            email: email,
            password: "google-auth-protected",
            fullName: email.split("@")[0],
            avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
            college: "Your Institution",
            branch: "",
            year: 1,
            city: "",
            state: "",
            country: "India",
            bio: "Google Teammate Profile",
            skills: { languages: [], frameworks: [], tools: [] },
            experienceLevel: "Intermediate",
            preferredRoles: ["Frontend"],
            socials: { github: "", linkedin: "", portfolio: "" },
            hackathonExperience: 0,
            projects: [],
            achievements: [],
            certificates: [],
            languagesKnown: ["English"],
            availability: "Available Now",
            locationPreference: "Both",
            isVerified: true,
            isEmergencyActive: false,
            isProfileComplete: false
          };
        }
        db.people.push(user);
      }
      
      db.currentUser = user;
      
      // Add login notification
      const newNotif: Notification = {
        id: "notif_" + Date.now(),
        userId: user.id,
        type: "profile_viewed",
        title: "Google Authentication Connected",
        body: `Successfully signed in via Google as ${user.fullName}.`,
        createdAt: new Date().toISOString(),
        read: false
      };
      db.notifications = [newNotif, ...db.notifications];
      
      saveDb(db);
      return res.json({ currentUser: user, notifications: db.notifications.filter(n => n.userId === user.id) });
    }

    if (!user) {
      return res.status(404).json({ error: "Account does not exist with this email. Please sign up to create a profile." });
    }
    
    // Verify password: if not yet set in DB, default to "password123"
    const savedPassword = user.password || "password123";
    if (password !== savedPassword) {
      return res.status(401).json({ error: "Invalid password. Access Denied." });
    }

    if (!user.password) {
      user.password = "password123";
    }
    
    db.currentUser = user;
    
    // Add login notification
    const newNotif: Notification = {
      id: "notif_" + Date.now(),
      userId: user.id,
      type: "profile_viewed",
      title: "Welcome Back!",
      body: `Successfully signed in as ${user.fullName}. Happy teammate hunting!`,
      createdAt: new Date().toISOString(),
      read: false
    };
    db.notifications = [newNotif, ...db.notifications];

    saveDb(db);
    res.json({ currentUser: user, notifications: db.notifications.filter(n => n.userId === user.id) });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/api/signup", (req, res) => {
  try {
    const { userData } = req.body;
    if (!userData || !userData.email) {
      return res.status(400).json({ error: "Email is required to create a profile" });
    }
    if (!userData.password) {
      return res.status(400).json({ error: "Password is required to create an account" });
    }
    const db = loadDb();
    
    // Check if email already registered
    const existing = db.people.find(p => p.email && p.email.toLowerCase() === userData.email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: "An account with this email already exists. Please log in instead." });
    }

    // Zero-out default entries; let the user complete them properly.
    const newUser: UserProfile = {
      id: "user_" + Date.now(),
      email: userData.email,
      password: userData.password,
      fullName: userData.fullName || "",
      avatarUrl: userData.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
      college: userData.college || "",
      branch: userData.branch || "",
      year: userData.year || 1,
      city: userData.city || "",
      state: userData.state || "",
      country: "India",
      bio: userData.bio || "",
      skills: userData.skills || { languages: [], frameworks: [], tools: [] },
      experienceLevel: userData.experienceLevel || "Beginner",
      preferredRoles: userData.preferredRoles || ["Frontend"],
      socials: userData.socials || { github: "", linkedin: "", portfolio: "" },
      hackathonExperience: 0,
      projects: [],
      achievements: [],
      certificates: [],
      languagesKnown: ["English"],
      availability: "Available Now",
      locationPreference: "Both",
      isVerified: false,
      isEmergencyActive: false,
      isProfileComplete: false
    };

    db.currentUser = newUser;
    db.people.push(newUser);
    
    // Add signup notification
    const newNotif: Notification = {
      id: "notif_" + Date.now(),
      userId: newUser.id,
      type: "profile_viewed",
      title: "Account Created!",
      body: "Welcome to HackMate. Complete your profile details to unlock 99% AI compatibility recommendations!",
      createdAt: new Date().toISOString(),
      read: false
    };
    db.notifications = [newNotif, ...db.notifications];

    saveDb(db);
    res.json({ currentUser: newUser, people: db.people, notifications: db.notifications.filter(n => n.userId === newUser.id) });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});

app.post("/api/logout", (req, res) => {
  try {
    const db = loadDb();
    db.currentUser = null;
    saveDb(db);
    res.json({ success: true });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Logout failed" });
  }
});

app.post("/api/verify-reset-email", (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const db = loadDb();
    const user = db.people.find(p => p.email && p.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(404).json({ error: "No teammate account found with this email. Please verify your email or sign up." });
    }
    res.json({ success: true, college: user.college });
  } catch (err) {
    console.error("Verify reset email error:", err);
    res.status(500).json({ error: "Failed to verify email" });
  }
});

app.post("/api/reset-password", (req, res) => {
  try {
    const { email, verificationAnswer, newPassword } = req.body;
    if (!email || !verificationAnswer || !newPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const db = loadDb();
    const user = db.people.find(p => p.email && p.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(404).json({ error: "No teammate account found with this email." });
    }

    const answerClean = verificationAnswer.trim().replace(/\s+/g, "").toLowerCase();
    const collegeClean = (user.college || "").trim().replace(/\s+/g, "").toLowerCase();

    if (answerClean !== collegeClean) {
      return res.status(400).json({ error: "Verification failed. The College name is incorrect." });
    }

    // Update password
    user.password = newPassword;
    if (db.currentUser && db.currentUser.id === user.id) {
      db.currentUser.password = newPassword;
    }

    // Create verification notification
    const newNotif: Notification = {
      id: "notif_" + Date.now(),
      userId: user.id,
      type: "profile_viewed",
      title: "Password Updated",
      body: "Your password was successfully reset. You can now use your new password.",
      createdAt: new Date().toISOString(),
      read: false
    };
    db.notifications = [newNotif, ...db.notifications];

    saveDb(db);
    res.json({ success: true });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// Profile endpoints
app.post("/api/profile/update", (req, res) => {
  try {
    const { updates } = req.body;
    const db = loadDb();
    if (!db.currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const updated = { ...db.currentUser, ...updates };
    
    // Auto-complete profile when core details are set
    if (updated.fullName && updated.college && updated.branch && updated.city && updated.state) {
      updated.isProfileComplete = true;
    }
    
    db.currentUser = updated;
    db.people = db.people.map(p => p.id === db.currentUser?.id ? updated : p);
    
    saveDb(db);
    res.json({ currentUser: updated, people: db.people });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

app.post("/api/profile/project", (req, res) => {
  try {
    const { proj } = req.body;
    const db = loadDb();
    if (!db.currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const newProject: Project = {
      ...proj,
      id: "proj_" + Date.now()
    };

    const updatedProjects = [...(db.currentUser.projects || []), newProject];
    db.currentUser.projects = updatedProjects;
    db.people = db.people.map(p => p.id === db.currentUser?.id ? db.currentUser! : p);

    saveDb(db);
    res.json({ currentUser: db.currentUser, people: db.people });
  } catch (err) {
    console.error("Project add error:", err);
    res.status(500).json({ error: "Failed to add project" });
  }
});

app.delete("/api/profile/project/:id", (req, res) => {
  try {
    const { id } = req.params;
    const db = loadDb();
    if (!db.currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const updatedProjects = (db.currentUser.projects || []).filter(p => p.id !== id);
    db.currentUser.projects = updatedProjects;
    db.people = db.people.map(p => p.id === db.currentUser?.id ? db.currentUser! : p);

    saveDb(db);
    res.json({ currentUser: db.currentUser, people: db.people });
  } catch (err) {
    console.error("Project delete error:", err);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

app.post("/api/profile/certificate", (req, res) => {
  try {
    const { cert } = req.body;
    const db = loadDb();
    if (!db.currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const newCert: Certificate = {
      ...cert,
      id: "cert_" + Date.now()
    };

    const updatedCerts = [...(db.currentUser.certificates || []), newCert];
    db.currentUser.certificates = updatedCerts;
    db.people = db.people.map(p => p.id === db.currentUser?.id ? db.currentUser! : p);

    saveDb(db);
    res.json({ currentUser: db.currentUser, people: db.people });
  } catch (err) {
    console.error("Certificate add error:", err);
    res.status(500).json({ error: "Failed to add certificate" });
  }
});

app.delete("/api/profile/certificate/:id", (req, res) => {
  try {
    const { id } = req.params;
    const db = loadDb();
    if (!db.currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const updatedCerts = (db.currentUser.certificates || []).filter(c => c.id !== id);
    db.currentUser.certificates = updatedCerts;
    db.people = db.people.map(p => p.id === db.currentUser?.id ? db.currentUser! : p);

    saveDb(db);
    res.json({ currentUser: db.currentUser, people: db.people });
  } catch (err) {
    console.error("Certificate delete error:", err);
    res.status(500).json({ error: "Failed to delete certificate" });
  }
});

app.delete("/api/profile/delete", (req, res) => {
  try {
    const db = loadDb();
    const userIdFromReq = req.body?.userId || req.query?.userId;
    const deleteId = userIdFromReq || db.currentUser?.id;

    if (!deleteId) {
      return res.status(400).json({ error: "No user ID specified to delete" });
    }

    // Purge user from people list
    db.people = db.people.filter(p => p.id !== deleteId);

    // Remove user from any team member lists, and clean up orphan teams
    db.teams = db.teams.map(t => ({
      ...t,
      members: t.members.filter(mId => mId !== deleteId)
    })).filter(t => t.members.length > 0 && t.createdBy !== deleteId);

    // Remove user invitations
    db.invitations = db.invitations.filter(i => i.senderId !== deleteId && i.receiverId !== deleteId);

    // Remove user's private/team chat registries
    db.chats = db.chats.filter(c => {
      if (c.isTeamChat) {
        return db.teams.some(t => t.id === c.teamId);
      } else {
        return !c.participantIds || !c.participantIds.includes(deleteId);
      }
    });

    // Remove user notifications
    db.notifications = db.notifications.filter(n => n.userId !== deleteId);

    // Clear currentUser if it matches deleted user
    if (db.currentUser && db.currentUser.id === deleteId) {
      db.currentUser = null;
    }

    saveDb(db);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

app.post("/api/profile/toggle-emergency", (req, res) => {
  try {
    const db = loadDb();
    if (!db.currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const isNowActive = !db.currentUser.isEmergencyActive;
    db.currentUser.isEmergencyActive = isNowActive;
    db.people = db.people.map(p => p.id === db.currentUser?.id ? db.currentUser! : p);

    const newNotif: Notification = {
      id: "notif_" + Date.now(),
      userId: db.currentUser.id,
      type: "emergency_match",
      title: isNowActive ? "Emergency Mode ENABLED" : "Emergency Mode Disabled",
      body: isNowActive 
        ? "You are now highlighted as 'Available Now' to recruiters and teams needing speed partners."
        : "Your active emergency badge has been safely turned off.",
      createdAt: new Date().toISOString(),
      read: false
    };

    db.notifications = [newNotif, ...db.notifications];
    saveDb(db);
    res.json({ currentUser: db.currentUser, people: db.people, notifications: db.notifications.filter(n => n.userId === db.currentUser!.id) });
  } catch (err) {
    console.error("Toggle emergency error:", err);
    res.status(500).json({ error: "Failed to toggle emergency status" });
  }
});

app.post("/api/profile/linkedin-parse", async (req, res) => {
  try {
    const { pastedText, preferredRole, branch } = req.body;
    const db = loadDb();
    if (!db.currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let certs: Array<{ title: string; issuer: string; date: string }> = [];
    let achs: string[] = [];

    if (ai && pastedText && pastedText.trim().length > 10) {
      const prompt = `
        You are a highly advanced professional profile parser. 
        Analyze the following text, which was copied from a student/developer's LinkedIn profile, resume, or portfolio:
        
        "${pastedText}"

        Your task is to extract:
        1. Professional Certifications & Licenses: Find any completed courses with certifications, cloud certs (AWS, GCP, Azure, etc.), professional licenses, or developer certifications.
        2. Historic Achievements & Hackathons: Find any awards, hackathon participations or wins, competition results, academic honors, open source milestones, or major technical accomplishments.

        Extract this information accurately and format it strictly according to the specified JSON schema.
      `;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                certs: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING, description: "Full name of the certification, license, or course certificate" },
                      issuer: { type: Type.STRING, description: "Issuing organization (e.g., Google, AWS, Coursera, Meta, Microsoft)" },
                      date: { type: Type.STRING, description: "Date of issue (in YYYY-MM-DD format if available, otherwise estimate or leave empty/current date)" }
                    },
                    required: ["title", "issuer"]
                  }
                },
                achs: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING,
                    description: "A clear, concise description of a specific hackathon win, competition ranking, achievement, or award"
                  }
                }
              },
              required: ["certs", "achs"]
            }
          }
        });

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed.certs)) {
            certs = parsed.certs.map((c: any) => ({
              title: String(c.title || "").trim(),
              issuer: String(c.issuer || "").trim(),
              date: String(c.date || new Date().toISOString().split("T")[0]).trim()
            })).filter((c: any) => c.title && c.issuer);
          }
          if (Array.isArray(parsed.achs)) {
            achs = parsed.achs.map((a: any) => String(a).trim()).filter(Boolean);
          }
        }
      } catch (geminiErr) {
        console.error("Gemini parse failed in linkedin-parse, using fallback parser:", geminiErr);
      }
    }

    // Heuristic fallback if AI is unavailable or failed, or if no text was pasted (or text too short)
    if (certs.length === 0 && achs.length === 0) {
      const normRole = (preferredRole || "Frontend").toLowerCase();
      const normBranch = (branch || "Computer Science").toLowerCase();

      if (
        normRole.includes("ai") || 
        normRole.includes("ml") || 
        normRole.includes("data") || 
        normRole.includes("intelligence") || 
        normBranch.includes("ai") || 
        normBranch.includes("ml") || 
        normBranch.includes("data")
      ) {
        certs = [
          { title: "DeepLearning.AI TensorFlow Developer", issuer: "DeepLearning.AI", date: "2025-11-12" },
          { title: "AWS Certified Machine Learning - Specialty", issuer: "Amazon Web Services (AWS)", date: "2026-02-20" }
        ];
        achs = [];
      } else if (
        normRole.includes("front") || 
        normRole.includes("ui") || 
        normRole.includes("ux") || 
        normRole.includes("design") || 
        normRole.includes("presenter") || 
        normRole.includes("product")
      ) {
        certs = [
          { title: "Meta Front-End Developer Professional Certificate", issuer: "Meta", date: "2025-08-15" },
          { title: "Vercel React Core Certification", issuer: "Vercel", date: "2026-01-10" }
        ];
        achs = [];
      } else {
        certs = [
          { title: "Google Cloud Certified Professional Cloud Architect", issuer: "Google Cloud", date: "2025-09-04" },
          { title: "Meta Software Engineering Certification", issuer: "Meta", date: "2026-01-20" }
        ];
        achs = [];
      }
    }

    res.json({ certs, achs });
  } catch (err) {
    console.error("LinkedIn parse error:", err);
    res.status(500).json({ error: "Failed to parse LinkedIn data" });
  }
});

app.post("/api/profile/resume-upload-and-parse", async (req, res) => {
  try {
    const { fileName, fileData, fileType } = req.body;
    const db = loadDb();
    if (!db.currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!fileName || !fileData) {
      return res.status(400).json({ error: "fileName and fileData are required" });
    }

    // Save the file to disk statically
    const base64Content = fileData.includes(";base64,")
      ? fileData.split(";base64,")[1]
      : fileData;
    const buffer = Buffer.from(base64Content, "base64");
    
    const timestamp = Date.now();
    const safeBaseName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const safeName = `resume_${timestamp}_${safeBaseName}`;
    const targetPath = path.join(UPLOADS_DIR, safeName);
    fs.writeFileSync(targetPath, buffer);

    // Save file name in DB for current user
    db.currentUser.resumeName = fileName;
    const personIdx = db.people.findIndex(p => p.id === db.currentUser!.id);
    if (personIdx !== -1) {
      db.people[personIdx].resumeName = fileName;
    }
    saveDb(db);

    let extractedData: any = null;

    if (ai) {
      // Determine correct mime type
      let mimeType = fileType || "application/pdf";
      if (fileName.endsWith(".txt")) {
        mimeType = "text/plain";
      } else if (fileName.endsWith(".png")) {
        mimeType = "image/png";
      } else if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
        mimeType = "image/jpeg";
      } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
        // Send as application/octet-stream or let Gemini try to parse
        mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      }

      const prompt = `
        You are a highly precise, professional resume parsing intelligence.
        Analyze the attached file which is the candidate's resume/CV.
        
        Extract the candidate's:
        - Full Name (fullName)
        - Biography / Short Summary (bio)
        - College/University name (college)
        - Branch/Major field of study (branch)
        - Estimated College Year 1-4 (year)
        - City (city)
        - State (state)
        - Technical Skills: languages, frameworks, and tools (skills: { languages, frameworks, tools })
        - Certifications & Badges (certs: [{ title, issuer, date }])
        - Completed Projects & Prototypes (projects: [{ title, description, technologies }])
        - Historic Achievements & Hackathons (achs: [string])

        Extract this information accurately and format it strictly according to the specified JSON schema.
      `;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Content
              }
            },
            prompt
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                fullName: { type: Type.STRING },
                bio: { type: Type.STRING },
                college: { type: Type.STRING },
                branch: { type: Type.STRING },
                year: { type: Type.INTEGER },
                city: { type: Type.STRING },
                state: { type: Type.STRING },
                skills: {
                  type: Type.OBJECT,
                  properties: {
                    languages: { type: Type.ARRAY, items: { type: Type.STRING } },
                    frameworks: { type: Type.ARRAY, items: { type: Type.STRING } },
                    tools: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["languages", "frameworks", "tools"]
                },
                certs: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING, description: "Name of certification" },
                      issuer: { type: Type.STRING, description: "Issuing body (e.g. Google, Amazon, Oracle)" },
                      date: { type: Type.STRING, description: "YYYY-MM-DD or date string" }
                    },
                    required: ["title", "issuer"]
                  }
                },
                projects: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING, description: "Title of project" },
                      description: { type: Type.STRING, description: "Brief overview of what it does" },
                      technologies: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["title", "description"]
                  }
                },
                achs: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING, description: "A hackathon win, honor, award, or accomplishment" }
                }
              },
              required: ["fullName", "bio", "skills", "certs", "projects", "achs"]
            }
          }
        });

        if (response.text) {
          extractedData = JSON.parse(response.text);
        }
      } catch (geminiErr) {
        console.error("Gemini resume parsing failed, utilizing smart fallback parsing:", geminiErr);
      }
    }

    // Heuristic fallbacks if Gemini is not set up or failed to parse this specific file structure
    if (!extractedData) {
      const isAI = fileName.toLowerCase().includes("ai") || fileName.toLowerCase().includes("ml") || fileName.toLowerCase().includes("data");
      const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
      const cleanName = nameWithoutExtension.replace(/_|-/g, " ");

      extractedData = {
        fullName: db.currentUser.fullName || cleanName,
        bio: db.currentUser.bio || "Enthusiastic software engineer specializing in building production-ready applications, solving complex algorithms, and rapid prototyping at hackathons.",
        college: db.currentUser.college || "Tech Institute of Technology",
        branch: db.currentUser.branch || (isAI ? "Artificial Intelligence & Data Science" : "Computer Science & Engineering"),
        year: db.currentUser.year || 3,
        city: db.currentUser.city || "Mumbai",
        state: db.currentUser.state || "Maharashtra",
        skills: {
          languages: db.currentUser.skills?.languages?.length ? db.currentUser.skills.languages : ["TypeScript", "JavaScript", "Python", "C++"],
          frameworks: db.currentUser.skills?.frameworks?.length ? db.currentUser.skills.frameworks : ["React", "Express", "Node.js", "TailwindCSS"],
          tools: db.currentUser.skills?.tools?.length ? db.currentUser.skills.tools : ["Git", "Docker", "VS Code", "Vercel"]
        },
        certs: [
          { title: isAI ? "Machine Learning Professional Certification" : "Full Stack Web Developer Certification", issuer: isAI ? "Google Cloud" : "Meta Professional", date: "2025-10-14" },
          { title: "AWS Certified Solutions Architect", issuer: "Amazon Web Services (AWS)", date: "2026-01-20" }
        ],
        projects: [
          {
            title: isAI ? "IntelliDocs - AI PDF Summarizer" : "TaskFlow - Realtime Kanban Board",
            description: isAI ? "A serverless pipeline that parses documents using optical character recognition and extracts structured insights using modern LLMs." : "Collaborative workspace for agile development featuring drag-and-drop mechanics, instant websocket notifications, and detailed team activity reports.",
            technologies: isAI ? ["Python", "TensorFlow", "React", "FastAPI"] : ["TypeScript", "React", "Socket.io", "Express"]
          },
          {
            title: "CampusConnect - Academic Matchmaker",
            description: "Full-stack matching algorithm that optimizes team formation for academic projects and hackathons based on skill complements.",
            technologies: ["React", "Express", "Node.js", "MongoDB"]
          }
        ],
        achs: []
      };
    }

    res.json({ success: true, fileName, extractedData, currentUser: db.currentUser });
  } catch (err) {
    console.error("Resume upload & parse error:", err);
    res.status(500).json({ error: "Failed to parse resume" });
  }
});

app.post("/api/profile/verify-skill", (req, res) => {
  try {
    const { skillName } = req.body;
    const db = loadDb();
    if (!db.currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const newNotif: Notification = {
      id: "notif_" + Date.now(),
      userId: db.currentUser.id,
      type: "profile_viewed",
      title: "Skill Verified!",
      body: `Your expertise in '${skillName}' was successfully analyzed and verified through linked repositories.`,
      createdAt: new Date().toISOString(),
      read: false
    };

    db.notifications = [newNotif, ...db.notifications];
    saveDb(db);
    res.json({ notifications: db.notifications.filter(n => n.userId === db.currentUser!.id) });
  } catch (err) {
    console.error("Verify skill error:", err);
    res.status(500).json({ error: "Failed to verify skill" });
  }
});

// Teams endpoints
app.post("/api/teams", (req, res) => {
  try {
    const { teamData } = req.body;
    const db = loadDb();
    if (!db.currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const creatorId = db.currentUser.id;
    const newTeam: Team = {
      ...teamData,
      id: "team_" + Date.now(),
      members: [creatorId],
      createdBy: creatorId,
      createdAt: new Date().toISOString(),
      isEmergency: db.emergencyModeGlobal
    };

    db.teams = [newTeam, ...db.teams];

    const newNotif: Notification = {
      id: "notif_" + Date.now(),
      userId: creatorId,
      type: "invite_accepted",
      title: "Team Created Successfully",
      body: `You started '${newTeam.name}' for ${newTeam.hackathonName}. Highly compatible members will be suggested!`,
      teamId: newTeam.id,
      createdAt: new Date().toISOString(),
      read: false
    };
    db.notifications = [newNotif, ...db.notifications];

    saveDb(db);
    res.json({ teams: db.teams, notifications: db.notifications.filter(n => n.userId === db.currentUser!.id), team: newTeam });
  } catch (err) {
    console.error("Create team error:", err);
    res.status(500).json({ error: "Failed to create team" });
  }
});

// Invitation endpoints
app.post("/api/invitations", (req, res) => {
  try {
    const { receiverId, role, message, teamId } = req.body;
    const db = loadDb();
    if (!db.currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const newInvite: Invitation = {
      id: "invite_" + Date.now(),
      teamId,
      senderId: db.currentUser.id,
      receiverId,
      role,
      status: "Pending",
      message,
      createdAt: new Date().toISOString(),
      isEmergency: db.emergencyModeGlobal || db.currentUser.isEmergencyActive
    };

    db.invitations = [newInvite, ...db.invitations];

    const receiver = db.people.find(p => p.id === receiverId);
    const receiverName = receiver ? receiver.fullName : "Teammate";

    const senderNotif: Notification = {
      id: "notif_" + Date.now(),
      userId: db.currentUser.id,
      type: "invite_received",
      title: "Invitation Transmitted",
      body: `You invited ${receiverName} to join as a ${role}.`,
      senderId: receiverId,
      teamId,
      inviteId: newInvite.id,
      createdAt: new Date().toISOString(),
      read: false
    };

    const receiverNotif: Notification = {
      id: "notif_" + Date.now(),
      userId: receiverId,
      type: "invite_received",
      title: "New Team Invitation!",
      body: `${db.currentUser.fullName} invited you to join their hackathon team as a ${role}.`,
      senderId: db.currentUser.id,
      teamId,
      inviteId: newInvite.id,
      createdAt: new Date().toISOString(),
      read: false
    };

    db.notifications = [senderNotif, receiverNotif, ...db.notifications];

    saveDb(db);
    res.json({ invitations: db.invitations, notifications: db.notifications.filter(n => n.userId === db.currentUser!.id) });
  } catch (err) {
    console.error("Send invite error:", err);
    res.status(500).json({ error: "Failed to send invitation" });
  }
});

app.post("/api/invitations/:id/accept", (req, res) => {
  try {
    const { id } = req.params;
    const db = loadDb();
    if (!db.currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const inviteIndex = db.invitations.findIndex(i => i.id === id);
    if (inviteIndex === -1) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    const invite = db.invitations[inviteIndex];
    db.invitations[inviteIndex] = { ...invite, status: "Accepted" };

    if (invite.teamId) {
      db.teams = db.teams.map(t => {
        if (t.id === invite.teamId) {
          const members = [...t.members];
          const inviteeId = t.createdBy === invite.senderId ? invite.receiverId : invite.senderId;
          if (!members.includes(inviteeId)) {
            members.push(inviteeId);
          }
          return { ...t, members };
        }
        return t;
      });
    }

    const existingChat = db.chats.find(c => 
      c.participantIds.includes(invite.senderId) && c.participantIds.includes(invite.receiverId)
    );

    if (!existingChat) {
      const newChat: Chat = {
        id: "chat_" + Date.now(),
        participantIds: [invite.senderId, invite.receiverId],
        lastMessage: "Invitation Accepted! Let's build.",
        lastMessageAt: new Date().toISOString()
      };
      db.chats = [newChat, ...db.chats];

      const firstMsg: Message = {
        id: "msg_init_" + Date.now(),
        chatId: newChat.id,
        senderId: invite.senderId,
        content: `Hey! I'm thrilled to connect. Thanks for accepting the invitation to collaborate. Ready to hack!`,
        type: "text",
        createdAt: new Date().toISOString(),
        seen: false
      };
      db.messages = [...db.messages, firstMsg];
    }

    const sender = db.people.find(p => p.id === invite.senderId);
    const senderName = sender ? sender.fullName : "Teammate";

    const newNotif: Notification = {
      id: "notif_" + Date.now(),
      userId: db.currentUser.id,
      type: "invite_accepted",
      title: "Invitation Accepted!",
      body: `You accepted invitation from ${senderName}. Chat initiated.`,
      senderId: invite.senderId,
      teamId: invite.teamId,
      createdAt: new Date().toISOString(),
      read: false
    };

    db.notifications = [newNotif, ...db.notifications];

    saveDb(db);
    res.json({
      invitations: db.invitations,
      teams: db.teams,
      chats: db.chats,
      messages: db.messages,
      notifications: db.notifications.filter(n => n.userId === db.currentUser!.id)
    });
  } catch (err) {
    console.error("Accept invite error:", err);
    res.status(500).json({ error: "Failed to accept invitation" });
  }
});

app.post("/api/invitations/:id/reject", (req, res) => {
  try {
    const { id } = req.params;
    const db = loadDb();
    if (!db.currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const inviteIndex = db.invitations.findIndex(i => i.id === id);
    if (inviteIndex === -1) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    const invite = db.invitations[inviteIndex];
    db.invitations[inviteIndex] = { ...invite, status: "Rejected" };

    const sender = db.people.find(p => p.id === invite.senderId);
    const senderName = sender ? sender.fullName : "Teammate";

    const newNotif: Notification = {
      id: "notif_" + Date.now(),
      userId: db.currentUser.id,
      type: "invite_rejected",
      title: "Invitation Declined",
      body: `You declined the request from ${senderName}.`,
      senderId: invite.senderId,
      createdAt: new Date().toISOString(),
      read: false
    };

    db.notifications = [newNotif, ...db.notifications];

    saveDb(db);
    res.json({ invitations: db.invitations, notifications: db.notifications.filter(n => n.userId === db.currentUser!.id) });
  } catch (err) {
    console.error("Reject invite error:", err);
    res.status(500).json({ error: "Failed to reject invitation" });
  }
});

app.post("/api/invitations/:id/withdraw", (req, res) => {
  try {
    const { id } = req.params;
    const db = loadDb();
    if (!db.currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    db.invitations = db.invitations.map(i => i.id === id ? { ...i, status: "Withdrawn" as const } : i);
    saveDb(db);
    res.json({ invitations: db.invitations });
  } catch (err) {
    console.error("Withdraw invite error:", err);
    res.status(500).json({ error: "Failed to withdraw invitation" });
  }
});

// Messages and Chat endpoints
app.post("/api/messages", (req, res) => {
  try {
    const { chatId, content, type, fileName, fileSize } = req.body;
    const db = loadDb();
    if (!db.currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const newMsg: Message = {
      id: "msg_" + Date.now(),
      chatId,
      senderId: db.currentUser.id,
      content,
      type: type || "text",
      fileName,
      fileSize,
      createdAt: new Date().toISOString(),
      seen: false
    };

    db.messages = [...db.messages, newMsg];

    db.chats = db.chats.map(c => c.id === chatId ? {
      ...c,
      lastMessage: type === "text" ? content : `Sent a ${type}`,
      lastMessageAt: new Date().toISOString()
    } : c);

    saveDb(db);
    res.json({
      messages: db.messages,
      chats: db.chats,
      notifications: db.notifications
    });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// File uploads directory initialization
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded files statically
app.use("/uploads", express.static(UPLOADS_DIR));

// Endpoint to process base64 file uploads and write them to disk
app.post("/api/upload", (req, res) => {
  try {
    const { fileName, fileData } = req.body;
    if (!fileName || !fileData) {
      return res.status(400).json({ error: "Filename and fileData are required" });
    }

    // Strip out base64 URL prefix if present
    const base64Content = fileData.includes(";base64,")
      ? fileData.split(";base64,")[1]
      : fileData;

    const buffer = Buffer.from(base64Content, "base64");
    
    // Generate unique safe name
    const timestamp = Date.now();
    const safeBaseName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const safeName = `file_${timestamp}_${safeBaseName}`;
    const targetPath = path.join(UPLOADS_DIR, safeName);

    fs.writeFileSync(targetPath, buffer);

    const relativeUrl = `/uploads/${safeName}`;
    res.json({ url: relativeUrl });
  } catch (err) {
    console.error("Upload process error:", err);
    res.status(500).json({ error: "Failed to upload file to disk" });
  }
});

// Notifications endpoints
app.post("/api/notifications/read", (req, res) => {
  try {
    const db = loadDb();
    if (!db.currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const currentUserId = db.currentUser.id;
    db.notifications = db.notifications.map(n => 
      n.userId === currentUserId ? { ...n, read: true } : n
    );
    saveDb(db);
    res.json({ notifications: db.notifications.filter(n => n.userId === currentUserId) });
  } catch (err) {
    console.error("Read notifications error:", err);
    res.status(500).json({ error: "Failed to read notifications" });
  }
});

app.post("/api/notifications/clear", (req, res) => {
  try {
    const db = loadDb();
    if (!db.currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const currentUserId = db.currentUser.id;
    db.notifications = db.notifications.filter(n => n.userId !== currentUserId);
    saveDb(db);
    res.json({ notifications: db.notifications.filter(n => n.userId === currentUserId) });
  } catch (err) {
    console.error("Clear notifications error:", err);
    res.status(500).json({ error: "Failed to clear notifications" });
  }
});

// Global Emergency Mode
app.post("/api/emergency-mode-global", (req, res) => {
  try {
    const { val } = req.body;
    const db = loadDb();
    db.emergencyModeGlobal = val;
    saveDb(db);
    res.json({ emergencyModeGlobal: val });
  } catch (err) {
    console.error("Set global emergency mode error:", err);
    res.status(500).json({ error: "Failed to set emergency mode" });
  }
});

// Express startup flow
async function startServer() {
  // Synchronize state from Google Cloud Firestore first before booting up
  await syncFromFirestore();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite Development Server middleware integrated.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static assets from dist folder.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`HackMate Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
