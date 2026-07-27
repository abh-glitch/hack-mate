/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  id: string;
  email?: string;
  password?: string;
  fullName: string;
  avatarUrl: string;
  college: string;
  branch: string;
  year: number; // 1, 2, 3, 4, etc.
  city: string;
  state: string;
  country: string;
  bio: string;
  skills: {
    languages: string[];
    frameworks: string[];
    tools: string[];
  };
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  preferredRoles: string[]; // Frontend, Backend, AI/ML, UI UX, Flutter, Blockchain, Cloud, etc.
  socials: {
    github: string;
    linkedin: string;
    portfolio: string;
  };
  resumeName?: string;
  hackathonExperience: number; // number of hackathons attended
  projects: Project[];
  achievements: string[];
  certificates: Certificate[];
  languagesKnown: string[];
  availability: 'Available Now' | 'Available This Week' | 'Busy' | 'Not Looking';
  locationPreference: 'Remote' | 'Offline' | 'Both';
  isVerified: boolean;
  isEmergencyActive?: boolean;
  isProfileComplete?: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  link?: string;
}

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  date: string;
}

export interface Team {
  id: string;
  name: string;
  hackathonName: string;
  description: string;
  location: string;
  isOnline: boolean;
  requiredRoles: string[];
  maxMembers: number;
  members: string[]; // User IDs
  skillsNeeded: string[];
  visibility: 'Public' | 'Private';
  createdBy: string; // User ID
  createdAt: string;
  isEmergency: boolean;
}

export interface Invitation {
  id: string;
  teamId?: string; // Optional if direct user-to-user invite for team creation
  senderId: string;
  receiverId: string;
  role: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn';
  message: string;
  createdAt: string;
  isEmergency?: boolean;
}

export interface Chat {
  id: string;
  participantIds: string[]; // [userId1, userId2]
  teamId?: string;
  isTeamChat?: boolean;
  lastMessage?: string;
  lastMessageAt?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'code' | 'image' | 'file';
  fileName?: string;
  fileSize?: string;
  createdAt: string;
  seen: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'invite_received' | 'invite_accepted' | 'invite_rejected' | 'emergency_match' | 'profile_viewed';
  title: string;
  body: string;
  senderId?: string;
  teamId?: string;
  inviteId?: string;
  createdAt: string;
  read: boolean;
}

export interface TeamFitScore {
  score: number;
  reasons: string[];
  synergy: string;
  skillsMatch: string[];
  challenges: string[];
}
