// Evidence OS Design Tokens
// Professional, trustworthy color palette for high-density interfaces.

export const colors = {
  // Primary action color - Strong Blue
  primary: {
    DEFAULT: "hsl(210, 100%, 50%)",
    hover: "hsl(210, 100%, 45%)",
    focus: "hsl(210, 100%, 60%)",
    foreground: "hsl(0, 0%, 100%)",
  },
  // Secondary elements - Dark Grays
  secondary: {
    DEFAULT: "hsl(215, 15%, 25%)",
    hover: "hsl(215, 15%, 30%)",
    foreground: "hsl(215, 10%, 80%)",
  },
  // Backgrounds - Deep Dark Theme
  background: {
    DEFAULT: "hsl(220, 15%, 8%)",   // Main app background
    panel: "hsl(220, 15%, 12%)",    // Sidebar / Panels
    inset: "hsl(220, 15%, 15%)",    // Inputs / Code blocks
  },
  // Surfaces - Cards & Modals
  surface: {
    DEFAULT: "hsl(220, 13%, 18%)",
    variant: "hsl(220, 13%, 22%)",
  },
  // Typography
  text: {
    DEFAULT: "hsl(210, 10%, 95%)", // Primary text
    muted: "hsl(215, 10%, 65%)",   // Secondary text
    link: "hsl(210, 100%, 70%)",   // Interactive text
  },
  // Borders
  border: {
    DEFAULT: "hsl(215, 10%, 30%)",
    strong: "hsl(215, 10%, 40%)",
  },
  // Status Indicators
  status: {
    success: {
      DEFAULT: "hsl(140, 70%, 40%)",
      muted: "hsla(140, 70%, 40%, 0.15)",
      text: "hsl(140, 80%, 85%)",
    },
    warning: {
      DEFAULT: "hsl(45, 100%, 50%)",
      muted: "hsla(45, 100%, 50%, 0.15)",
      text: "hsl(45, 100%, 85%)",
    },
    error: {
      DEFAULT: "hsl(0, 80%, 60%)",
      muted: "hsla(0, 80%, 60%, 0.15)",
      text: "hsl(0, 85%, 85%)",
    },
    info: {
      DEFAULT: "hsl(190, 80%, 55%)",
      muted: "hsla(190, 80%, 55%, 0.15)",
      text: "hsl(190, 80%, 85%)",
    },
  },
};

export const radii = {
  sm: "0.375rem", // 6px
  md: "0.5rem",   // 8px
  lg: "0.75rem",  // 12px
  xl: "1.25rem",  // 20px
  full: "9999px",
};