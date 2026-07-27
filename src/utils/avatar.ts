/**
 * Generates a beautiful dynamic gradient initials avatar if the avatarUrl
 * is empty, missing, or belongs to the default Unsplash profile picture.
 */
export function getAvatarUrl(avatarUrl: string | undefined, fullName: string): string {
  // Check if it's a default/empty avatar or the default Unsplash PFP
  const isDefault = !avatarUrl || 
                    avatarUrl.includes("1535713875002-d1d0cf377fde") || 
                    avatarUrl === "" || 
                    avatarUrl.includes("photo-1535713875002") ||
                    avatarUrl === "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200";
  
  if (!isDefault) {
    return avatarUrl!;
  }

  // Generate initials (up to 2 characters)
  const names = (fullName || "Anonymous").trim().split(/\s+/);
  const initials = names.length > 1 
    ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
    : names[0].substring(0, 2).toUpperCase();

  // Create a beautiful, stable gradient background based on the user's name
  const colors = [
    ["#4F46E5", "#06B6D4"], // Indigo to Cyan
    ["#EC4899", "#8B5CF6"], // Pink to Purple
    ["#F59E0B", "#EF4444"], // Amber to Red
    ["#10B981", "#3B82F6"], // Emerald to Blue
    ["#8B5CF6", "#EC4899"], // Violet to Pink
  ];
  const charCodeSum = (fullName || "Anonymous").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorPair = colors[charCodeSum % colors.length];

  // Return a beautiful dynamic SVG Data URI
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${colorPair[0]};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${colorPair[1]};stop-opacity:1" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#grad)" />
    <text x="50" y="55" font-family="'Inter', 'Space Grotesk', sans-serif" font-weight="bold" font-size="36" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Ensures any external link has a proper protocol (http or https) to prevent relative route redirection.
 */
export function formatExternalUrl(url: string | undefined, platform?: "github" | "linkedin" | "portfolio"): string {
  if (!url) return "#";
  const trimmed = url.trim();
  if (!trimmed || trimmed === "#") return "#";
  
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // If it's a relative protocol link
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  // Handle case where they entered a domain or path with subdirectories
  if (trimmed.includes(".") || trimmed.includes("/")) {
    return `https://${trimmed}`;
  }

  // It's a raw username/handle (e.g. "arnavsao")
  if (platform === "github") {
    return `https://github.com/${trimmed}`;
  }
  if (platform === "linkedin") {
    return `https://linkedin.com/in/${trimmed}`;
  }

  return `https://${trimmed}`;
}
