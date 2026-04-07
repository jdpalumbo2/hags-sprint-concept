export const AVAILABLE_TOOLS = [
  "Landing page",
  "Instagram account",
  "TikTok account",
  "Google Form",
  "Canva",
  "Mockup or wireframe",
  "Working prototype",
  "Email list",
  "Phone contacts to message",
  "School DM/text group",
] as const;

export type AvailableTool = (typeof AVAILABLE_TOOLS)[number];
