/**
 * Central place for brand text. Edit this file to rebrand the entire site —
 * nothing below should need touching anywhere else in the codebase.
 */
export const siteConfig = {
  name: "Spade Scientific Lifting",
  shortName: "SSL",
  tagline: "Evidence-based strength coaching, not guesswork.",
  description:
    "Spade Scientific Lifting is a science-based strength coaching platform. Training and nutrition are driven by data — logged lifts, calculated targets, and tracked trends — not gut feel.",
  domain: "spadescientificlifting.com",

  // TODO(coach): replace with real coach name/credentials/photo when available.
  // Nothing in the UI currently claims a specific credential — copy below is
  // intentionally about the *methodology*, not the coach's personal bio.
  coach: {
    name: "Coach bio coming soon",
    bioPlaceholder:
      "This is where the coach's credentials, certifications, and background will go. For now, the methodology page focuses on how the program works rather than who runs it.",
  },

  nav: {
    public: [
      { label: "Methodology", href: "/methodology" },
      { label: "Services & Pricing", href: "/pricing" },
    ],
  },

  contactEmail: "coach@spadescientificlifting.com",
} as const;
