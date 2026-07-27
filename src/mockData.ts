/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile, Team, Invitation, Chat, Message, Notification } from "./types";

export const INITIAL_USER: UserProfile = {
  id: "current_user_arnav",
  email: "arnavsao123@gmail.com",
  fullName: "Arnav Sao",
  avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
  college: "Delhi Technological University (DTU)",
  branch: "Computer Science & Engineering",
  year: 3,
  city: "New Delhi",
  state: "Delhi",
  country: "India",
  bio: "Full Stack Developer passionate about solving real-world problems. Love hacking at speed, writing clean TypeScript code, and playing with AI models. Looking for an AI/ML developer or a UI/UX designer for an upcoming 36-hour national sprint!",
  skills: {
    languages: ["TypeScript", "JavaScript", "Python", "Go"],
    frameworks: ["React", "Next.js", "Express", "Node.js", "TailwindCSS"],
    tools: ["Git", "Docker", "Firebase", "PostgreSQL", "Vite"]
  },
  experienceLevel: "Intermediate",
  preferredRoles: ["Frontend", "Backend", "Cloud"],
  socials: {
    github: "https://github.com/arnavsao",
    linkedin: "https://linkedin.com/in/arnavsao",
    portfolio: "https://arnav.dev"
  },
  resumeName: "Arnav_Sao_CV.pdf",
  hackathonExperience: 4,
  projects: [
    {
      id: "p1",
      title: "TaskFlow Planner",
      description: "A collaborative Kanban board featuring real-time state synchronization and localized service workers.",
      technologies: ["React", "TypeScript", "TailwindCSS", "Express"]
    },
    {
      id: "p2",
      title: "Submitty API",
      description: "High-performance microservice architecture supporting batch assignments submission with auto-grading pipelines.",
      technologies: ["Go", "Docker", "PostgreSQL"]
    }
  ],
  achievements: [],
  certificates: [
    {
      id: "c1",
      title: "AWS Certified Developer",
      issuer: "Amazon Web Services",
      date: "2025-11-12"
    }
  ],
  languagesKnown: ["English", "Hindi"],
  availability: "Available Now",
  locationPreference: "Both",
  isVerified: true,
  isEmergencyActive: false
};

export const INITIAL_PEOPLE: UserProfile[] = [
  {
    id: "user_tanya",
    email: "tanya@bits.edu",
    fullName: "Tanya Sharma",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    college: "BITS Pilani",
    branch: "Design & Computing",
    year: 4,
    city: "Jaipur",
    state: "Rajasthan",
    country: "India",
    bio: "Product designer & React enthusiast. I design sleek, high-fidelity interfaces in Figma and build them in React using TailwindCSS & Motion. Obsessed with beautiful typography, spacing, micro-interactions, and visual harmony.",
    skills: {
      languages: ["HTML", "CSS", "JavaScript", "TypeScript"],
      frameworks: ["React", "Next.js", "TailwindCSS", "Framer Motion"],
      tools: ["Figma", "Adobe XD", "Git", "Framer"]
    },
    experienceLevel: "Advanced",
    preferredRoles: ["UI UX", "Frontend"],
    socials: {
      github: "https://github.com/tanyadesigns",
      linkedin: "https://linkedin.com/in/tanyasharma",
      portfolio: "https://tanya.design"
    },
    resumeName: "Tanya_Sharma_Portfolio.pdf",
    hackathonExperience: 8,
    projects: [
      {
        id: "tp1",
        title: "ZenSpace Mindfulness UI",
        description: "A comprehensive dark mode design system and working web layout centered on micro-sprint tracking.",
        technologies: ["React", "Framer Motion", "Figma"]
      }
    ],
    achievements: [
      "1st Prize - DesignSprint India 2025",
      "Keynote Speaker at BITS Design Meetup"
    ],
    certificates: [
      {
        id: "tc1",
        title: "Advanced UX Design Professional",
        issuer: "Google Career Certificates",
        date: "2025-02-18"
      }
    ],
    languagesKnown: ["English", "Hindi", "Punjabi"],
    availability: "Available Now",
    locationPreference: "Both",
    isVerified: true,
    isEmergencyActive: true
  },
  {
    id: "user_rajesh",
    email: "rajesh@iitb.ac.in",
    fullName: "Rajesh Kumar",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    college: "IIT Bombay",
    branch: "Electrical Engineering",
    year: 4,
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    bio: "Deep Learning researcher and developer. Building custom model workflows, LLM agents, and high-performance inference pipelines. Experienced in hosting weights on HuggingFace and optimization.",
    skills: {
      languages: ["Python", "C++", "SQL", "Bash"],
      frameworks: ["PyTorch", "HuggingFace", "FastAPI", "NumPy", "Pandas"],
      tools: ["Git", "Docker", "AWS", "Weights & Biases", "CUDA"]
    },
    experienceLevel: "Expert",
    preferredRoles: ["AI/ML", "Backend"],
    socials: {
      github: "https://github.com/rajesh_ml",
      linkedin: "https://linkedin.com/in/rajesh-kumar-iit",
      portfolio: "https://rajeshml.dev"
    },
    resumeName: "Rajesh_ML_Resume.pdf",
    hackathonExperience: 6,
    projects: [
      {
        id: "rp1",
        title: "FastEmbed LLM",
        description: "A lightweight C++ execution engine that runs compressed language models locally at 80 tok/s on mobile devices.",
        technologies: ["C++", "Python", "ONNX Runtime"]
      }
    ],
    achievements: [
      "Winner - Inter-IIT Tech Meet AI Track",
      "Contributor to major open source LLM libraries"
    ],
    certificates: [
      {
        id: "rc1",
        title: "Deep Learning Specialization",
        issuer: "DeepLearning.AI",
        date: "2024-08-01"
      }
    ],
    languagesKnown: ["English", "Hindi", "Marathi"],
    availability: "Available Now",
    locationPreference: "Both",
    isVerified: true,
    isEmergencyActive: true
  },
  {
    id: "user_abhinav",
    email: "abhinav@dtu.ac.in",
    fullName: "Abhinav Mishra",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    college: "Delhi Technological University (DTU)",
    branch: "Information Technology",
    year: 2,
    city: "New Delhi",
    state: "Delhi",
    country: "India",
    bio: "Go backend systems specialist. Loves working on high-throughput REST/gRPC servers, optimizing relational databases, and playing with Redis caches. Looking for a frontend developer to craft beautiful products.",
    skills: {
      languages: ["Go", "SQL", "C", "JavaScript"],
      frameworks: ["Gin", "Fiber", "Node.js", "Express", "DrizzleORM"],
      tools: ["PostgreSQL", "Redis", "Git", "Docker", "Nginx"]
    },
    experienceLevel: "Intermediate",
    preferredRoles: ["Backend", "Cloud"],
    socials: {
      github: "https://github.com/abhinavbackend",
      linkedin: "https://linkedin.com/in/abhinavmishra-dtu",
      portfolio: "https://abhinav.systems"
    },
    resumeName: "Abhinav_CV.pdf",
    hackathonExperience: 2,
    projects: [
      {
        id: "ap1",
        title: "CacheVibe",
        description: "A persistent key-value store optimized for concurrent writes using custom WAL algorithms.",
        technologies: ["Go", "Redis", "Docker"]
      }
    ],
    achievements: [
      "Top 50 - GSoC 2025 contributor",
      "Consistently 5-star on CodeChef"
    ],
    certificates: [],
    languagesKnown: ["Hindi", "English"],
    availability: "Available This Week",
    locationPreference: "Offline",
    isVerified: false,
    isEmergencyActive: false
  },
  {
    id: "user_priyanshu",
    fullName: "Priyanshu Gupta",
    avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200",
    college: "NIT Trichy",
    branch: "Production Engineering",
    year: 3,
    city: "Trichy",
    state: "Tamil Nadu",
    country: "India",
    bio: "Mobile app developer. Specializing in Flutter and native Android development. I build production-grade apps with fluid animations, local SQLite storage, and deep Firebase integration.",
    skills: {
      languages: ["Dart", "Kotlin", "Java", "Swift"],
      frameworks: ["Flutter", "Jetpack Compose", "React Native"],
      tools: ["Android Studio", "Xcode", "Git", "Sentry", "Codemagic"]
    },
    experienceLevel: "Advanced",
    preferredRoles: ["Flutter"],
    socials: {
      github: "https://github.com/priyanshufutter",
      linkedin: "https://linkedin.com/in/priyanshu-gupta",
      portfolio: "https://priyanshu.dev/apps"
    },
    resumeName: "Priyanshu_Flutter_CV.pdf",
    hackathonExperience: 5,
    projects: [
      {
        id: "pgp1",
        title: "SpendSage",
        description: "Beautiful personal finance tracker with localized OCR receipts parsing, reaching 10k+ downloads.",
        technologies: ["Flutter", "Dart", "Firebase", "TensorFlow Lite"]
      }
    ],
    achievements: [
      "Best App - Flutter Global Hackathon 2025",
      "Top Contributor - open-source package 'flutter_awesome_chart'"
    ],
    certificates: [
      {
        id: "pgc1",
        title: "Associate Android Developer",
        issuer: "Google",
        date: "2024-12-10"
      }
    ],
    languagesKnown: ["English", "Hindi", "Tamil"],
    availability: "Available Now",
    locationPreference: "Remote",
    isVerified: true,
    isEmergencyActive: true
  },
  {
    id: "user_sarah",
    fullName: "Sarah D'Souza",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    college: "MIT Manipal",
    branch: "Computer Science (FinTech)",
    year: 4,
    city: "Manipal",
    state: "Karnataka",
    country: "India",
    bio: "Smart contract auditor and Cloud deployment engineer. Enthusiastic about decentralized systems, consensus mechanisms, and high-availability cloud setups. Currently focusing on Ethereum and Solana.",
    skills: {
      languages: ["Solidity", "Rust", "TypeScript", "SQL"],
      frameworks: ["Hardhat", "Anchor", "Next.js", "Express"],
      tools: ["Solana CLI", "Docker", "Kubernetes", "AWS", "Terraform"]
    },
    experienceLevel: "Expert",
    preferredRoles: ["Blockchain", "Cloud"],
    socials: {
      github: "https://github.com/sarahblock",
      linkedin: "https://linkedin.com/in/sarah-dsouza",
      portfolio: "https://sarah.tech"
    },
    resumeName: "Sarah_Blockchain_Cloud.pdf",
    hackathonExperience: 11,
    projects: [
      {
        id: "sp1",
        title: "SettleSafe Escrow",
        description: "A gas-optimized multi-sig decentralized escrow protocol supporting dynamic collateral staking.",
        technologies: ["Solidity", "Hardhat", "Next.js"]
      }
    ],
    achievements: [
      "Winner - EthIndia 2024 (DeFi Category)",
      "AWS Community Builder (Cloud Developer)"
    ],
    certificates: [
      {
        id: "sc1",
        title: "Certified Solidity Auditor",
        issuer: "ConsenSys Academy",
        date: "2025-05-15"
      }
    ],
    languagesKnown: ["English", "Konkani", "Kannada"],
    availability: "Busy",
    locationPreference: "Remote",
    isVerified: true,
    isEmergencyActive: false
  },
  {
    id: "user_kevin",
    fullName: "Kevin Paul",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200",
    college: "VIT Vellore",
    branch: "Computer Science (Cybersecurity)",
    year: 3,
    city: "Vellore",
    state: "Tamil Nadu",
    country: "India",
    bio: "Security pentester and backend learner. Focused on secure software design, API protection, and web application threat mitigation. Passionate about participating in CTFs.",
    skills: {
      languages: ["Python", "C", "Go", "Bash"],
      frameworks: ["Django", "Express", "FastAPI"],
      tools: ["Wireshark", "Burp Suite", "Nmap", "Docker", "Metasploit"]
    },
    experienceLevel: "Intermediate",
    preferredRoles: ["Cybersecurity", "Backend"],
    socials: {
      github: "https://github.com/kevinsec",
      linkedin: "https://linkedin.com/in/kevinpaul-sec",
      portfolio: "https://kevinpaul.github.io"
    },
    resumeName: "Kevin_Paul_InfoSec.pdf",
    hackathonExperience: 3,
    projects: [
      {
        id: "kp1",
        title: "API-Shield Core",
        description: "An automated scanning script to detect broken object-level authorization (BOLA) vulnerabilities in REST APIs.",
        technologies: ["Python", "Docker"]
      }
    ],
    achievements: [
      "1st Rank - VIT CTF 2025",
      "Discovered CVE-2024-XXXX in open source CMS"
    ],
    certificates: [
      {
        id: "kc1",
        title: "Offensive Security Certified Professional (OSCP)",
        issuer: "OffSec",
        date: "2025-09-01"
      }
    ],
    languagesKnown: ["English", "Malayalam"],
    availability: "Available This Week",
    locationPreference: "Offline",
    isVerified: true,
    isEmergencyActive: false
  },
  {
    id: "user_neha",
    fullName: "Neha Deshmukh",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
    college: "COEP Pune",
    branch: "Electronics & Telecommunication",
    year: 2,
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    bio: "IoT engineer and hardware integration enthusiast. I build real-time monitoring devices, sensor nodes, and connect hardware devices to the cloud. Ready to hack for hardware/software integrated projects!",
    skills: {
      languages: ["C++", "C", "Python", "Rust"],
      frameworks: ["Arduino Framework", "ESP-IDF", "Node.js"],
      tools: ["Raspberry Pi", "ESP32", "Git", "KiCad", "AWS IoT"]
    },
    experienceLevel: "Beginner",
    preferredRoles: ["IoT", "Presenter"],
    socials: {
      github: "https://github.com/nehahardware",
      linkedin: "https://linkedin.com/in/nehadeshmukh",
      portfolio: "https://nehaiot.dev"
    },
    resumeName: "Neha_IoT_Profile.pdf",
    hackathonExperience: 1,
    projects: [
      {
        id: "np1",
        title: "SmartAir Probe",
        description: "An ESP32-powered air quality monitor broadcasting particulate readings to AWS IoT using MQTT.",
        technologies: ["C++", "ESP32", "AWS IoT Core"]
      }
    ],
    achievements: [
      "COEP Innovation Award 2025"
    ],
    certificates: [],
    languagesKnown: ["Marathi", "English", "Hindi"],
    availability: "Available Now",
    locationPreference: "Both",
    isVerified: false,
    isEmergencyActive: true
  }
];

export const INITIAL_TEAMS: Team[] = [
  {
    id: "team_alpha",
    name: "DevSlayers",
    hackathonName: "Smart India Hackathon 2026",
    description: "Building an automated dynamic response network for emergency response management. We need an experienced backend engineer who understands container scaling and WebSockets.",
    location: "Mumbai",
    isOnline: false,
    requiredRoles: ["Backend", "Cloud"],
    maxMembers: 4,
    members: ["user_rajesh", "user_neha"],
    skillsNeeded: ["Go", "Docker", "AWS", "WebSockets"],
    visibility: "Public",
    createdBy: "user_rajesh",
    createdAt: "2026-07-01T10:00:00Z",
    isEmergency: true
  },
  {
    id: "team_beta",
    name: "Aether Design Studio",
    hackathonName: "UIUX National Challenge 2026",
    description: "Crafting an ultra-immersive portfolio and workspace launcher for modern startups. We have standard UI layouts, but require an interactive Frontend Wizard specializing in complex SVG physics or canvas frameworks.",
    location: "Remote",
    isOnline: true,
    requiredRoles: ["Frontend"],
    maxMembers: 3,
    members: ["user_tanya"],
    skillsNeeded: ["React", "TypeScript", "TailwindCSS", "Framer Motion", "Three.js"],
    visibility: "Public",
    createdBy: "user_tanya",
    createdAt: "2026-07-02T15:30:00Z",
    isEmergency: true
  },
  {
    id: "team_gamma",
    name: "ChainForge",
    hackathonName: "Web3 Global Hackathon 2026",
    description: "Creating a cross-chain smart liquid staking platform for secondary layer collaterals.",
    location: "Bengaluru",
    isOnline: true,
    requiredRoles: ["Blockchain", "Frontend"],
    maxMembers: 4,
    members: ["user_sarah", "user_kevin"],
    skillsNeeded: ["Solidity", "Rust", "Next.js", "Hardhat"],
    visibility: "Public",
    createdBy: "user_sarah",
    createdAt: "2026-06-28T09:00:00Z",
    isEmergency: false
  }
];

export const INITIAL_INVITATIONS: Invitation[] = [
  {
    id: "invite_1",
    teamId: "team_alpha",
    senderId: "user_rajesh",
    receiverId: "current_user_arnav",
    role: "Backend",
    status: "Pending",
    message: "Hey Arnav! I saw your Go & Docker project, absolutely stellar. We are building a high-throughput emergency routing system and need someone who can spin up high-performance servers fast. Join DevSlayers!",
    createdAt: "2026-07-02T22:15:00Z",
    isEmergency: true
  },
  {
    id: "invite_2",
    senderId: "current_user_arnav",
    receiverId: "user_tanya",
    role: "UI UX",
    status: "Pending",
    message: "Hi Tanya, I loved your ZenSpace mindfulness designs. I have a custom Web concept and I think your interface layout would score us a 1st prize. Let's form a team for the upcoming national sprint!",
    createdAt: "2026-07-03T01:10:00Z",
    isEmergency: false
  }
];

export const INITIAL_CHATS: Chat[] = [
  {
    id: "chat_rajesh",
    participantIds: ["current_user_arnav", "user_rajesh"],
    lastMessage: "Are you ready for the sync tomorrow?",
    lastMessageAt: "2026-07-02T23:00:00Z"
  }
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: "msg_1",
    chatId: "chat_rajesh",
    senderId: "user_rajesh",
    content: "Hey Arnav, hope you're doing great! Saw your DTU profile and was blown away by the Submitty Go API work.",
    type: "text",
    createdAt: "2026-07-02T22:30:00Z",
    seen: true
  },
  {
    id: "msg_2",
    chatId: "chat_rajesh",
    senderId: "current_user_arnav",
    content: "Hey Rajesh! Thanks a lot, appreciate it. Your PyTorch neural rendering engine is literally on another level too.",
    type: "text",
    createdAt: "2026-07-02T22:45:00Z",
    seen: true
  },
  {
    id: "msg_3",
    chatId: "chat_rajesh",
    senderId: "user_rajesh",
    content: "Haha thanks! Here is a small preview of the containerized model server config I'm preparing for the hackathon:",
    type: "text",
    createdAt: "2026-07-02T22:50:00Z",
    seen: true
  },
  {
    id: "msg_4",
    chatId: "chat_rajesh",
    senderId: "user_rajesh",
    content: `FROM pytorch/pytorch:2.1.0-cuda11.8-cudnn8-runtime
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY server.py .
EXPOSE 8000
ENTRYPOINT ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]`,
    type: "code",
    createdAt: "2026-07-02T22:51:00Z",
    seen: true
  },
  {
    id: "msg_5",
    chatId: "chat_rajesh",
    senderId: "current_user_arnav",
    content: "Looks incredibly clean! Fits our standard Docker configurations nicely. Are you ready for the sync tomorrow?",
    type: "text",
    createdAt: "2026-07-02T22:58:00Z",
    seen: true
  },
  {
    id: "msg_6",
    chatId: "chat_rajesh",
    senderId: "user_rajesh",
    content: "Absolutely! Let's conquer the Smart India Hackathon.",
    type: "text",
    createdAt: "2026-07-02T23:00:00Z",
    seen: true
  }
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "notif_1",
    userId: "current_user_arnav",
    type: "invite_received",
    title: "Emergency Invite Received",
    body: "Rajesh Kumar (IIT Bombay) has invited you to join DevSlayers for Smart India Hackathon 2026!",
    senderId: "user_rajesh",
    teamId: "team_alpha",
    createdAt: "2026-07-02T22:15:00Z",
    read: false
  },
  {
    id: "notif_2",
    userId: "current_user_arnav",
    type: "profile_viewed",
    title: "Profile Viewed",
    body: "Tanya Sharma viewed your profile 1 hour ago.",
    createdAt: "2026-07-03T00:45:00Z",
    read: true
  }
];
