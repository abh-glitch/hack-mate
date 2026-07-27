/**
 * Generates tailored mock LinkedIn certifications and achievements
 * based on the user's role and branch.
 */
export function generateLinkedInData(role: string = "Frontend", branch: string = "Computer Science") {
  const normRole = role.toLowerCase();
  const normBranch = branch.toLowerCase();
  
  let certs: Array<{ title: string; issuer: string; date: string }> = [];
  let achs: string[] = [];
  
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
      {
        title: "DeepLearning.AI TensorFlow Developer",
        issuer: "DeepLearning.AI",
        date: "2025-11-12"
      },
      {
        title: "AWS Certified Machine Learning - Specialty",
        issuer: "Amazon Web Services (AWS)",
        date: "2026-02-20"
      }
    ];
    achs = [
      "1st Place Winner - GenAI Global Hackathon 2025",
      "Top 5% on Kaggle NLP Sandbox Semantic Challenge",
      "Published open-source RAG middleware framework with 300+ GitHub stars"
    ];
  } else if (
    normRole.includes("front") || 
    normRole.includes("ui") || 
    normRole.includes("ux") || 
    normRole.includes("design") || 
    normRole.includes("presenter") || 
    normRole.includes("product")
  ) {
    certs = [
      {
        title: "Meta Front-End Developer Professional Certificate",
        issuer: "Meta",
        date: "2025-08-15"
      },
      {
        title: "Vercel React Core Certification",
        issuer: "Vercel",
        date: "2026-01-10"
      }
    ];
    achs = [
      "Winner - NextJS Global Speed Run Hackathon",
      "Outstanding UI/UX Design Award at EthIndia 2025",
      "Created React Design System package downloaded 12,000+ times"
    ];
  } else if (
    normRole.includes("back") || 
    normRole.includes("go") || 
    normRole.includes("node") || 
    normRole.includes("java") || 
    normRole.includes("python") || 
    normRole.includes("rust")
  ) {
    certs = [
      {
        title: "Google Cloud Certified Professional Cloud Architect",
        issuer: "Google Cloud",
        date: "2025-09-04"
      },
      {
        title: "MongoDB Certified Developer Associate",
        issuer: "MongoDB",
        date: "2026-03-15"
      }
    ];
    achs = [
      "Designed and deployed a highly-scalable microservice backend handling 10k+ concurrent websocket requests",
      "Winner - Cyber Security Capture The Flag (CTF) national event",
      "Best Database Schema Optimization Award - Smart India Hackathon"
    ];
  } else if (
    normRole.includes("flutter") || 
    normRole.includes("mobile") || 
    normRole.includes("android") || 
    normRole.includes("ios") || 
    normRole.includes("react native")
  ) {
    certs = [
      {
        title: "Google Associate Android Developer",
        issuer: "Google",
        date: "2025-10-22"
      },
      {
        title: "Meta Android Developer Professional Certificate",
        issuer: "Meta",
        date: "2026-02-05"
      }
    ];
    achs = [
      "1st Place - Google Mobile App Innovation Hackathon",
      "Launched personal utility app on Play Store reaching 5,000+ active users",
      "Best Cross-Platform Performance Award - HackOut 2025"
    ];
  } else if (
    normRole.includes("blockchain") || 
    normRole.includes("web3") || 
    normRole.includes("crypto") || 
    normRole.includes("solidity")
  ) {
    certs = [
      {
        title: "Certified Solidity Developer",
        issuer: "Blockchain Council",
        date: "2025-07-30"
      },
      {
        title: "Ethereum Developer Bootcamp Certificate",
        issuer: "ConsenSys Academy",
        date: "2026-01-22"
      }
    ];
    achs = [
      "Grand Prize Winner - EthGlobal Hackathon 2025 (Smart Contract Innovation)",
      "Audited 3 decentralized applications (dApps) securing total value locked (TVL) of $50k+",
      "Top Contributor - Web3 Open Source Tooling"
    ];
  } else if (
    normRole.includes("cloud") || 
    normRole.includes("devops") || 
    normRole.includes("aws") || 
    normRole.includes("docker") || 
    normRole.includes("kubernetes")
  ) {
    certs = [
      {
        title: "AWS Certified Solutions Architect - Professional",
        issuer: "Amazon Web Services (AWS)",
        date: "2025-12-05"
      },
      {
        title: "Certified Kubernetes Administrator (CKA)",
        issuer: "The Linux Foundation",
        date: "2026-04-18"
      }
    ];
    achs = [
      "Engineered automatic blue-green deployment pipelines that cut release cycles by 40%",
      "Runner Up - DevOps & Infrastructure Automation Hackathon",
      "Reduced infrastructure costs by 25% using serverless scaling routines"
    ];
  } else if (
    normRole.includes("cyber") || 
    normRole.includes("security") || 
    normRole.includes("hack") || 
    normRole.includes("penetration")
  ) {
    certs = [
      {
        title: "CompTIA Security+ Certification",
        issuer: "CompTIA",
        date: "2025-06-18"
      },
      {
        title: "Certified Ethical Hacker (CEH)",
        issuer: "EC-Council",
        date: "2026-03-01"
      }
    ];
    achs = [
      "1st Place - National Cyber Defense CTF Competition",
      "Reported 3 critical security vulnerabilities in open-source identity gateways",
      "Developed a lightweight end-to-end zero-trust encryption library"
    ];
  } else {
    // Default fallback
    certs = [
      {
        title: "Google Professional Data Engineer",
        issuer: "Google",
        date: "2025-10-14"
      },
      {
        title: "Meta Software Engineering Certification",
        issuer: "Meta",
        date: "2026-01-20"
      }
    ];
    achs = [
      "Top 3 - HackIndia National Finals 2025",
      "Best Innovative Solution Award - Smart India Hackathon",
      "Led college team to develop campus ERP dashboard used by 2,000+ students"
    ];
  }
  
  return { certs, achs: [] };
}
