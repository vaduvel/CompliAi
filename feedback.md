Use the attached JSON file as the single source of truth for the CompliScan design system.

Requirements:
- implement dark premium enterprise UI
- use semantic tokens in components, not raw hex values
- build reusable primitives for button, card, input, badge, table, nav, tabs, modal, upload
- keep emerald as the primary accent only for CTA, selected states, focus, active navigation, and important charts
- use layered charcoal surfaces with subtle borders and restrained motion
- apply this theme consistently across dashboard, scans, documents, alerts, checklists, reports, systems, and settings

Output:
1. CSS variables
2. theme adapter for TS/JS
3. reusable UI components
4. page-level styling integration






import json, os

theme = {
  "meta": {
    "name": "CompliScan Design System",
    "version": "1.0.0",
    "theme": "dark",
    "style": [
      "premium",
      "enterprise",
      "legal-tech",
      "calm",
      "dark-first"
    ],
    "brandKeywords": [
      "trustworthy",
      "precise",
      "premium",
      "modern",
      "low-noise"
    ]
  },
  "rules": {
    "colorUsage": {
      "primaryAccentUsage": [
        "cta",
        "selected-state",
        "focus-ring",
        "active-nav",
        "important-chart-series",
        "connected-state"
      ],
      "avoid": [
        "full-green-surfaces",
        "green-body-text",
        "green-everywhere-icons",
        "heavy-glow-effects",
        "random-hardcoded-hex-values-in-components"
      ]
    },
    "implementation": {
      "consumeSemanticTokensInComponents": True,
      "preferCssVariables": True,
      "roundedCornersRangePx": [12, 20],
      "surfaceStyle": "layered-dark-panels-with-subtle-borders",
      "motionStyle": "subtle-and-fast"
    }
  },
  "primitives": {
    "color": {
      "emerald": {
        "50": "#effff8",
        "100": "#d7feef",
        "200": "#b0f8dc",
        "300": "#7deec4",
        "400": "#49deaa",
        "500": "#22c792",
        "600": "#17a67a",
        "700": "#118363",
        "800": "#0d664d",
        "900": "#0a4d3b",
        "950": "#062f24"
      },
      "carbon": {
        "50": "#f4f7f6",
        "100": "#e7ece9",
        "200": "#cfd8d3",
        "300": "#adb9b2",
        "400": "#87958d",
        "500": "#66736d",
        "600": "#4b5651",
        "700": "#343d39",
        "800": "#212825",
        "850": "#1a201d",
        "900": "#131816",
        "925": "#0f1312",
        "950": "#0a0d0c"
      },
      "slate": {
        "50": "#f2f7f8",
        "100": "#dde8eb",
        "200": "#bfd2d8",
        "300": "#97b4bd",
        "400": "#6f959f",
        "500": "#557983",
        "600": "#425f67",
        "700": "#334950",
        "800": "#23343a",
        "900": "#172328",
        "950": "#0d1518"
      },
      "cyan": {
        "50": "#ecfcff",
        "100": "#d4f6fb",
        "200": "#aaeaf5",
        "300": "#74d8ea",
        "400": "#4cc7de",
        "500": "#2eb2ca",
        "600": "#238fa5",
        "700": "#1d7181",
        "800": "#195a66",
        "900": "#154b54",
        "950": "#0b2d33"
      },
      "success": {
        "50": "#eefdf4",
        "100": "#d7f9e4",
        "200": "#b0f1c9",
        "300": "#7ee3a7",
        "400": "#4dcf84",
        "500": "#2fb46a",
        "600": "#218f52",
        "700": "#1c7143",
        "800": "#195a37",
        "900": "#164c30"
      },
      "warning": {
        "50": "#fff9eb",
        "100": "#fff1c8",
        "200": "#ffe28f",
        "300": "#ffd05c",
        "400": "#f6bf39",
        "500": "#e6a91f",
        "600": "#ba8515",
        "700": "#8e6513",
        "800": "#705113",
        "900": "#5c4313"
      },
      "danger": {
        "50": "#fff1f1",
        "100": "#ffd9d9",
        "200": "#ffb0b0",
        "300": "#ff8585",
        "400": "#f96868",
        "500": "#e34d4d",
        "600": "#be3838",
        "700": "#962f2f",
        "800": "#782a2a",
        "900": "#642626"
      }
    }
  },
  "semantic": {
    "bg": {
      "canvas": "{primitives.color.carbon.950}",
      "subtle": "{primitives.color.carbon.925}",
      "elevated": "{primitives.color.carbon.900}",
      "panel": "{primitives.color.carbon.850}",
      "panel2": "#1d2421",
      "panel3": "#232b28",
      "inset": "#0c1110",
      "hover": "rgba(255,255,255,0.03)",
      "active": "rgba(255,255,255,0.05)",
      "selected": "rgba(34,199,146,0.14)"
    },
    "text": {
      "primary": "#eef5f1",
      "secondary": "#c2cec8",
      "tertiary": "#8d9b94",
      "muted": "#6d7a74",
      "disabled": "#56625d",
      "onPrimary": "#04110c",
      "onDark": "#eef5f1",
      "link": "{primitives.color.cyan.300}"
    },
    "border": {
      "subtle": "#232d29",
      "default": "#2d3934",
      "strong": "#394740",
      "emerald": "rgba(73,222,170,0.45)",
      "warning": "rgba(246,191,57,0.45)",
      "danger": "rgba(249,104,104,0.45)"
    },
    "icon": {
      "primary": "#e7f0eb",
      "secondary": "#aab8b1",
      "muted": "#74817b",
      "accent": "{primitives.color.emerald.400}"
    },
    "action": {
      "primary": {
        "bg": "{primitives.color.emerald.500}",
        "bgHover": "{primitives.color.emerald.400}",
        "bgActive": "{primitives.color.emerald.600}",
        "border": "transparent",
        "text": "{semantic.text.onPrimary}"
      },
      "secondary": {
        "bg": "#18211e",
        "bgHover": "#1d2824",
        "bgActive": "#23302b",
        "border": "#2e3a35",
        "text": "{semantic.text.primary}"
      },
      "outline": {
        "bg": "transparent",
        "bgHover": "rgba(255,255,255,0.03)",
        "bgActive": "rgba(255,255,255,0.05)",
        "border": "#34423c",
        "text": "#dce7e1"
      },
      "ghost": {
        "bg": "transparent",
        "bgHover": "rgba(255,255,255,0.04)",
        "bgActive": "rgba(255,255,255,0.06)",
        "text": "#c7d2cd"
      },
      "danger": {
        "bg": "{primitives.color.danger.500}",
        "bgHover": "{primitives.color.danger.400}",
        "bgActive": "{primitives.color.danger.600}",
        "border": "transparent",
        "text": "#ffffff"
      }
    },
    "focus": {
      "ring": "rgba(73,222,170,0.36)",
      "ringOuter": "rgba(73,222,170,0.18)"
    },
    "status": {
      "success": {
        "bgSoft": "rgba(47,180,106,0.12)",
        "border": "rgba(77,207,132,0.34)",
        "text": "#81dfa9"
      },
      "warning": {
        "bgSoft": "rgba(230,169,31,0.12)",
        "border": "rgba(246,191,57,0.34)",
        "text": "#ffd77a"
      },
      "danger": {
        "bgSoft": "rgba(227,77,77,0.12)",
        "border": "rgba(249,104,104,0.34)",
        "text": "#ff9d9d"
      },
      "info": {
        "bgSoft": "rgba(46,178,202,0.12)",
        "border": "rgba(76,199,222,0.34)",
        "text": "#94e9f6"
      }
    },
    "chart": {
      "series1": "{primitives.color.emerald.400}",
      "series2": "{primitives.color.cyan.400}",
      "series3": "{primitives.color.warning.400}",
      "series4": "#8d9b94",
      "grid": "rgba(255,255,255,0.08)",
      "axis": "#6d7a74",
      "tooltipBg": "#111715",
      "tooltipBorder": "#2d3934",
      "tooltipText": "#eef5f1"
    }
  },
  "typography": {
    "fontFamily": {
      "sans": "\"Inter\", ui-sans-serif, system-ui, sans-serif",
      "display": "\"Manrope\", \"Inter\", ui-sans-serif, system-ui, sans-serif",
      "mono": "\"JetBrains Mono\", ui-monospace, SFMono-Regular, monospace"
    },
    "fontSize": {
      "xs": "12px",
      "sm": "13px",
      "md": "14px",
      "lg": "16px",
      "xl": "18px",
      "2xl": "20px",
      "3xl": "24px",
      "4xl": "30px",
      "5xl": "36px"
    },
    "lineHeight": {
      "xs": "16px",
      "sm": "18px",
      "md": "20px",
      "lg": "24px",
      "xl": "26px",
      "2xl": "28px",
      "3xl": "32px",
      "4xl": "38px",
      "5xl": "44px"
    },
    "fontWeight": {
      "regular": 400,
      "medium": 500,
      "semibold": 600,
      "bold": 700
    },
    "letterSpacing": {
      "tight": "-0.03em",
      "normal": "-0.01em",
      "wide": "0"
    },
    "usage": {
      "pageTitle": {
        "fontFamily": "{typography.fontFamily.display}",
        "fontSize": "{typography.fontSize.4xl}",
        "lineHeight": "{typography.lineHeight.4xl}",
        "fontWeight": "{typography.fontWeight.bold}",
        "letterSpacing": "{typography.letterSpacing.tight}"
      },
      "sectionTitle": {
        "fontFamily": "{typography.fontFamily.display}",
        "fontSize": "{typography.fontSize.2xl}",
        "lineHeight": "{typography.lineHeight.2xl}",
        "fontWeight": "{typography.fontWeight.bold}",
        "letterSpacing": "{typography.letterSpacing.normal}"
      },
      "cardTitle": {
        "fontFamily": "{typography.fontFamily.sans}",
        "fontSize": "{typography.fontSize.lg}",
        "lineHeight": "{typography.lineHeight.lg}",
        "fontWeight": "{typography.fontWeight.semibold}"
      },
      "body": {
        "fontFamily": "{typography.fontFamily.sans}",
        "fontSize": "{typography.fontSize.md}",
        "lineHeight": "{typography.lineHeight.md}",
        "fontWeight": "{typography.fontWeight.regular}"
      },
      "label": {
        "fontFamily": "{typography.fontFamily.sans}",
        "fontSize": "{typography.fontSize.sm}",
        "lineHeight": "{typography.lineHeight.sm}",
        "fontWeight": "{typography.fontWeight.medium}"
      },
      "caption": {
        "fontFamily": "{typography.fontFamily.sans}",
        "fontSize": "{typography.fontSize.xs}",
        "lineHeight": "{typography.lineHeight.xs}",
        "fontWeight": "{typography.fontWeight.medium}"
      }
    }
  },
  "spacing": {
    "0": "0",
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "5": "20px",
    "6": "24px",
    "7": "28px",
    "8": "32px",
    "10": "40px",
    "12": "48px",
    "16": "64px"
  },
  "radius": {
    "xs": "8px",
    "sm": "10px",
    "md": "12px",
    "lg": "16px",
    "xl": "20px",
    "2xl": "24px",
    "pill": "999px"
  },
  "borderWidth": {
    "thin": "1px",
    "strong": "1.5px"
  },
  "shadow": {
    "sm": "0 1px 2px rgba(0,0,0,0.22)",
    "md": "0 8px 24px rgba(0,0,0,0.24)",
    "lg": "0 16px 40px rgba(0,0,0,0.32)",
    "xl": "0 24px 56px rgba(0,0,0,0.4)",
    "emeraldGlowSm": "0 0 0 1px rgba(73,222,170,0.16), 0 8px 24px rgba(16,131,99,0.12)",
    "emeraldGlowMd": "0 0 0 1px rgba(73,222,170,0.20), 0 12px 28px rgba(16,131,99,0.16)"
  },
  "motion": {
    "durationFast": "120ms",
    "durationNormal": "180ms",
    "durationSlow": "260ms",
    "easeStandard": "cubic-bezier(0.2, 0, 0, 1)",
    "easeEmphasized": "cubic-bezier(0.2, 0, 0, 1.1)"
  },
  "components": {
    "button": {
      "height": {
        "sm": "32px",
        "md": "40px",
        "lg": "48px"
      },
      "radius": {
        "sm": "10px",
        "md": "12px",
        "lg": "14px"
      },
      "fontWeight": 600,
      "letterSpacing": "-0.01em",
      "variants": {
        "primary": {
          "bg": "{semantic.action.primary.bg}",
          "bgHover": "{semantic.action.primary.bgHover}",
          "bgActive": "{semantic.action.primary.bgActive}",
          "text": "{semantic.action.primary.text}",
          "border": "{semantic.action.primary.border}",
          "shadow": "{shadow.emeraldGlowSm}"
        },
        "secondary": {
          "bg": "{semantic.action.secondary.bg}",
          "bgHover": "{semantic.action.secondary.bgHover}",
          "bgActive": "{semantic.action.secondary.bgActive}",
          "text": "{semantic.action.secondary.text}",
          "border": "{semantic.action.secondary.border}",
          "shadow": "{shadow.sm}"
        },
        "outline": {
          "bg": "{semantic.action.outline.bg}",
          "bgHover": "{semantic.action.outline.bgHover}",
          "bgActive": "{semantic.action.outline.bgActive}",
          "text": "{semantic.action.outline.text}",
          "border": "{semantic.action.outline.border}",
          "shadow": "none"
        },
        "ghost": {
          "bg": "{semantic.action.ghost.bg}",
          "bgHover": "{semantic.action.ghost.bgHover}",
          "bgActive": "{semantic.action.ghost.bgActive}",
          "text": "{semantic.action.ghost.text}",
          "border": "transparent",
          "shadow": "none"
        },
        "danger": {
          "bg": "{semantic.action.danger.bg}",
          "bgHover": "{semantic.action.danger.bgHover}",
          "bgActive": "{semantic.action.danger.bgActive}",
          "text": "{semantic.action.danger.text}",
          "border": "{semantic.action.danger.border}",
          "shadow": "{shadow.sm}"
        }
      }
    },
    "card": {
      "default": {
        "bg": "{semantic.bg.panel}",
        "bgHover": "#1d2522",
        "border": "{semantic.border.default}",
        "borderHover": "#415047",
        "radius": "18px",
        "padding": "{spacing.5}",
        "shadow": "{shadow.sm}"
      }
    },
    "panel": {
      "default": {
        "bg": "{semantic.bg.elevated}",
        "border": "{semantic.border.subtle}",
        "radius": "{radius.xl}"
      }
    },
    "input": {
      "default": {
        "bg": "#111715",
        "bgHover": "#141c19",
        "bgFocus": "#151f1b",
        "border": "#2b3732",
        "borderHover": "#38453f",
        "borderFocus": "rgba(73,222,170,0.45)",
        "text": "{semantic.text.primary}",
        "placeholder": "{semantic.text.muted}",
        "label": "{semantic.text.secondary}",
        "help": "{semantic.text.tertiary}",
        "radius": "{radius.md}",
        "height": "44px"
      }
    },
    "textarea": {
      "default": {
        "bg": "#111715",
        "border": "#2b3732",
        "borderFocus": "rgba(73,222,170,0.45)",
        "text": "{semantic.text.primary}",
        "placeholder": "{semantic.text.muted}",
        "radius": "{radius.md}",
        "minHeight": "120px"
      }
    },
    "select": {
      "default": {
        "bg": "#111715",
        "border": "#2b3732",
        "text": "{semantic.text.primary}",
        "placeholder": "{semantic.text.muted}",
        "radius": "{radius.md}",
        "height": "44px"
      }
    },
    "badge": {
      "radius": "{radius.pill}",
      "fontSize": "{typography.fontSize.xs}",
      "fontWeight": "{typography.fontWeight.semibold}",
      "variants": {
        "neutral": {
          "bg": "rgba(255,255,255,0.04)",
          "border": "rgba(255,255,255,0.08)",
          "text": "#d6dfda"
        },
        "brand": {
          "bg": "rgba(34,199,146,0.14)",
          "border": "rgba(73,222,170,0.34)",
          "text": "#9ceccf"
        },
        "success": {
          "bg": "rgba(47,180,106,0.14)",
          "border": "rgba(77,207,132,0.34)",
          "text": "#8ae1ae"
        },
        "warning": {
          "bg": "rgba(230,169,31,0.14)",
          "border": "rgba(246,191,57,0.34)",
          "text": "#ffd77a"
        },
        "danger": {
          "bg": "rgba(227,77,77,0.14)",
          "border": "rgba(249,104,104,0.34)",
          "text": "#ff9d9d"
        }
      }
    },
    "table": {
      "default": {
        "bg": "transparent",
        "border": "{semantic.border.subtle}",
        "headerText": "{semantic.text.tertiary}",
        "cellText": "{semantic.text.secondary}",
        "rowHover": "rgba(255,255,255,0.02)",
        "rowSelected": "rgba(34,199,146,0.08)"
      }
    },
    "nav": {
      "sidebar": {
        "bg": "#0d1110",
        "border": "#1d2421"
      },
      "item": {
        "text": "#a7b4ad",
        "textHover": "#e6efea",
        "bgHover": "rgba(255,255,255,0.04)",
        "bgActive": "rgba(34,199,146,0.14)",
        "borderActive": "rgba(73,222,170,0.28)",
        "iconActive": "{primitives.color.emerald.400}"
      }
    },
    "tabs": {
      "listBg": "rgba(255,255,255,0.03)",
      "triggerText": "{semantic.text.secondary}",
      "triggerTextActive": "{semantic.text.primary}",
      "triggerBgActive": "rgba(34,199,146,0.12)",
      "triggerBorderActive": "rgba(73,222,170,0.28)",
      "radius": "{radius.md}"
    },
    "modal": {
      "overlay": "rgba(4,8,7,0.72)",
      "bg": "{semantic.bg.panel}",
      "border": "{semantic.border.default}",
      "radius": "{radius.xl}",
      "shadow": "{shadow.xl}"
    },
    "upload": {
      "bg": "rgba(255,255,255,0.015)",
      "border": "#34423c",
      "borderHover": "rgba(73,222,170,0.45)",
      "borderActive": "rgba(73,222,170,0.60)",
      "text": "{semantic.text.secondary}",
      "icon": "{primitives.color.emerald.400}",
      "radius": "{radius.lg}"
    },
    "alert": {
      "info": {
        "bg": "{semantic.status.info.bgSoft}",
        "border": "{semantic.status.info.border}",
        "text": "{semantic.status.info.text}"
      },
      "success": {
        "bg": "{semantic.status.success.bgSoft}",
        "border": "{semantic.status.success.border}",
        "text": "{semantic.status.success.text}"
      },
      "warning": {
        "bg": "{semantic.status.warning.bgSoft}",
        "border": "{semantic.status.warning.border}",
        "text": "{semantic.status.warning.text}"
      },
      "danger": {
        "bg": "{semantic.status.danger.bgSoft}",
        "border": "{semantic.status.danger.border}",
        "text": "{semantic.status.danger.text}"
      }
    }
  },
  "aliases": {
    "tailwindSemantic": {
      "canvas": "var(--bg-canvas)",
      "panel": "var(--bg-panel)",
      "panel2": "var(--bg-panel-2)",
      "textPrimary": "var(--text-primary)",
      "textSecondary": "var(--text-secondary)",
      "textMuted": "var(--text-muted)",
      "borderDefault": "var(--border-default)",
      "borderStrong": "var(--border-strong)",
      "primary": "var(--action-primary-bg)",
      "primaryHover": "var(--action-primary-bg-hover)",
      "primaryText": "var(--action-primary-text)",
      "successSoft": "var(--status-success-bg-soft)",
      "warningSoft": "var(--status-warning-bg-soft)",
      "dangerSoft": "var(--status-danger-bg-soft)"
    }
  }
}

path = "/mnt/data/compliscan-design-system.json"
with open(path, "w", encoding="utf-8") as f:
    json.dump(theme, f, ensure_ascii=False, indent=2)

print(path)


import json

theme = {
  "meta": {
    "name": "CompliScan Design System",
    "version": "1.0.0",
    "theme": "dark",
    "style": ["premium", "enterprise", "legal-tech", "calm", "dark-first"],
    "brandKeywords": ["trustworthy", "precise", "premium", "modern", "low-noise"]
  },
  "rules": {
    "colorUsage": {
      "primaryAccentUsage": [
        "cta",
        "selected-state",
        "focus-ring",
        "active-nav",
        "important-chart-series",
        "connected-state"
      ],
      "avoid": [
        "full-green-surfaces",
        "green-body-text",
        "green-everywhere-icons",
        "heavy-glow-effects",
        "random-hardcoded-hex-values-in-components"
      ]
    },
    "implementation": {
      "consumeSemanticTokensInComponents": True,
      "preferCssVariables": True,
      "roundedCornersRangePx": [12, 20],
      "surfaceStyle": "layered-dark-panels-with-subtle-borders",
      "motionStyle": "subtle-and-fast"
    }
  },
  "primitives": {
    "color": {
      "emerald": {
        "50": "#effff8", "100": "#d7feef", "200": "#b0f8dc", "300": "#7deec4",
        "400": "#49deaa", "500": "#22c792", "600": "#17a67a", "700": "#118363",
        "800": "#0d664d", "900": "#0a4d3b", "950": "#062f24"
      },
      "carbon": {
        "50": "#f4f7f6", "100": "#e7ece9", "200": "#cfd8d3", "300": "#adb9b2",
        "400": "#87958d", "500": "#66736d", "600": "#4b5651", "700": "#343d39",
        "800": "#212825", "850": "#1a201d", "900": "#131816", "925": "#0f1312", "950": "#0a0d0c"
      },
      "slate": {
        "50": "#f2f7f8", "100": "#dde8eb", "200": "#bfd2d8", "300": "#97b4bd",
        "400": "#6f959f", "500": "#557983", "600": "#425f67", "700": "#334950",
        "800": "#23343a", "900": "#172328", "950": "#0d1518"
      },
      "cyan": {
        "50": "#ecfcff", "100": "#d4f6fb", "200": "#aaeaf5", "300": "#74d8ea",
        "400": "#4cc7de", "500": "#2eb2ca", "600": "#238fa5", "700": "#1d7181",
        "800": "#195a66", "900": "#154b54", "950": "#0b2d33"
      },
      "success": {
        "50": "#eefdf4", "100": "#d7f9e4", "200": "#b0f1c9", "300": "#7ee3a7",
        "400": "#4dcf84", "500": "#2fb46a", "600": "#218f52", "700": "#1c7143",
        "800": "#195a37", "900": "#164c30"
      },
      "warning": {
        "50": "#fff9eb", "100": "#fff1c8", "200": "#ffe28f", "300": "#ffd05c",
        "400": "#f6bf39", "500": "#e6a91f", "600": "#ba8515", "700": "#8e6513",
        "800": "#705113", "900": "#5c4313"
      },
      "danger": {
        "50": "#fff1f1", "100": "#ffd9d9", "200": "#ffb0b0", "300": "#ff8585",
        "400": "#f96868", "500": "#e34d4d", "600": "#be3838", "700": "#962f2f",
        "800": "#782a2a", "900": "#642626"
      }
    }
  },
  "semantic": {
    "bg": {
      "canvas": "{primitives.color.carbon.950}",
      "subtle": "{primitives.color.carbon.925}",
      "elevated": "{primitives.color.carbon.900}",
      "panel": "{primitives.color.carbon.850}",
      "panel2": "#1d2421",
      "panel3": "#232b28",
      "inset": "#0c1110",
      "hover": "rgba(255,255,255,0.03)",
      "active": "rgba(255,255,255,0.05)",
      "selected": "rgba(34,199,146,0.14)"
    },
    "text": {
      "primary": "#eef5f1",
      "secondary": "#c2cec8",
      "tertiary": "#8d9b94",
      "muted": "#6d7a74",
      "disabled": "#56625d",
      "onPrimary": "#04110c",
      "onDark": "#eef5f1",
      "link": "{primitives.color.cyan.300}"
    },
    "border": {
      "subtle": "#232d29",
      "default": "#2d3934",
      "strong": "#394740",
      "emerald": "rgba(73,222,170,0.45)",
      "warning": "rgba(246,191,57,0.45)",
      "danger": "rgba(249,104,104,0.45)"
    },
    "icon": {
      "primary": "#e7f0eb",
      "secondary": "#aab8b1",
      "muted": "#74817b",
      "accent": "{primitives.color.emerald.400}"
    },
    "action": {
      "primary": {
        "bg": "{primitives.color.emerald.500}",
        "bgHover": "{primitives.color.emerald.400}",
        "bgActive": "{primitives.color.emerald.600}",
        "border": "transparent",
        "text": "{semantic.text.onPrimary}"
      },
      "secondary": {
        "bg": "#18211e",
        "bgHover": "#1d2824",
        "bgActive": "#23302b",
        "border": "#2e3a35",
        "text": "{semantic.text.primary}"
      },
      "outline": {
        "bg": "transparent",
        "bgHover": "rgba(255,255,255,0.03)",
        "bgActive": "rgba(255,255,255,0.05)",
        "border": "#34423c",
        "text": "#dce7e1"
      },
      "ghost": {
        "bg": "transparent",
        "bgHover": "rgba(255,255,255,0.04)",
        "bgActive": "rgba(255,255,255,0.06)",
        "text": "#c7d2cd"
      },
      "danger": {
        "bg": "{primitives.color.danger.500}",
        "bgHover": "{primitives.color.danger.400}",
        "bgActive": "{primitives.color.danger.600}",
        "border": "transparent",
        "text": "#ffffff"
      }
    },
    "focus": {
      "ring": "rgba(73,222,170,0.36)",
      "ringOuter": "rgba(73,222,170,0.18)"
    },
    "status": {
      "success": {
        "bgSoft": "rgba(47,180,106,0.12)",
        "border": "rgba(77,207,132,0.34)",
        "text": "#81dfa9"
      },
      "warning": {
        "bgSoft": "rgba(230,169,31,0.12)",
        "border": "rgba(246,191,57,0.34)",
        "text": "#ffd77a"
      },
      "danger": {
        "bgSoft": "rgba(227,77,77,0.12)",
        "border": "rgba(249,104,104,0.34)",
        "text": "#ff9d9d"
      },
      "info": {
        "bgSoft": "rgba(46,178,202,0.12)",
        "border": "rgba(76,199,222,0.34)",
        "text": "#94e9f6"
      }
    },
    "chart": {
      "series1": "{primitives.color.emerald.400}",
      "series2": "{primitives.color.cyan.400}",
      "series3": "{primitives.color.warning.400}",
      "series4": "#8d9b94",
      "grid": "rgba(255,255,255,0.08)",
      "axis": "#6d7a74",
      "tooltipBg": "#111715",
      "tooltipBorder": "#2d3934",
      "tooltipText": "#eef5f1"
    }
  },
  "typography": {
    "fontFamily": {
      "sans": "\"Inter\", ui-sans-serif, system-ui, sans-serif",
      "display": "\"Manrope\", \"Inter\", ui-sans-serif, system-ui, sans-serif",
      "mono": "\"JetBrains Mono\", ui-monospace, SFMono-Regular, monospace"
    },
    "fontSize": {
      "xs": "12px", "sm": "13px", "md": "14px", "lg": "16px", "xl": "18px",
      "2xl": "20px", "3xl": "24px", "4xl": "30px", "5xl": "36px"
    },
    "lineHeight": {
      "xs": "16px", "sm": "18px", "md": "20px", "lg": "24px", "xl": "26px",
      "2xl": "28px", "3xl": "32px", "4xl": "38px", "5xl": "44px"
    },
    "fontWeight": {
      "regular": 400, "medium": 500, "semibold": 600, "bold": 700
    },
    "letterSpacing": {
      "tight": "-0.03em", "normal": "-0.01em", "wide": "0"
    }
  },
  "spacing": {
    "0": "0", "1": "4px", "2": "8px", "3": "12px", "4": "16px", "5": "20px",
    "6": "24px", "7": "28px", "8": "32px", "10": "40px", "12": "48px", "16": "64px"
  },
  "radius": {
    "xs": "8px", "sm": "10px", "md": "12px", "lg": "16px", "xl": "20px", "2xl": "24px", "pill": "999px"
  },
  "borderWidth": {
    "thin": "1px", "strong": "1.5px"
  },
  "shadow": {
    "sm": "0 1px 2px rgba(0,0,0,0.22)",
    "md": "0 8px 24px rgba(0,0,0,0.24)",
    "lg": "0 16px 40px rgba(0,0,0,0.32)",
    "xl": "0 24px 56px rgba(0,0,0,0.4)",
    "emeraldGlowSm": "0 0 0 1px rgba(73,222,170,0.16), 0 8px 24px rgba(16,131,99,0.12)",
    "emeraldGlowMd": "0 0 0 1px rgba(73,222,170,0.20), 0 12px 28px rgba(16,131,99,0.16)"
  },
  "motion": {
    "durationFast": "120ms",
    "durationNormal": "180ms",
    "durationSlow": "260ms",
    "easeStandard": "cubic-bezier(0.2, 0, 0, 1)",
    "easeEmphasized": "cubic-bezier(0.2, 0, 0, 1.1)"
  },
  "components": {
    "button": {
      "height": {"sm": "32px", "md": "40px", "lg": "48px"},
      "radius": {"sm": "10px", "md": "12px", "lg": "14px"},
      "fontWeight": 600,
      "letterSpacing": "-0.01em",
      "variants": {
        "primary": {
          "bg": "{semantic.action.primary.bg}",
          "bgHover": "{semantic.action.primary.bgHover}",
          "bgActive": "{semantic.action.primary.bgActive}",
          "text": "{semantic.action.primary.text}",
          "border": "{semantic.action.primary.border}",
          "shadow": "{shadow.emeraldGlowSm}"
        },
        "secondary": {
          "bg": "{semantic.action.secondary.bg}",
          "bgHover": "{semantic.action.secondary.bgHover}",
          "bgActive": "{semantic.action.secondary.bgActive}",
          "text": "{semantic.action.secondary.text}",
          "border": "{semantic.action.secondary.border}",
          "shadow": "{shadow.sm}"
        },
        "outline": {
          "bg": "{semantic.action.outline.bg}",
          "bgHover": "{semantic.action.outline.bgHover}",
          "bgActive": "{semantic.action.outline.bgActive}",
          "text": "{semantic.action.outline.text}",
          "border": "{semantic.action.outline.border}",
          "shadow": "none"
        },
        "ghost": {
          "bg": "{semantic.action.ghost.bg}",
          "bgHover": "{semantic.action.ghost.bgHover}",
          "bgActive": "{semantic.action.ghost.bgActive}",
          "text": "{semantic.action.ghost.text}",
          "border": "transparent",
          "shadow": "none"
        },
        "danger": {
          "bg": "{semantic.action.danger.bg}",
          "bgHover": "{semantic.action.danger.bgHover}",
          "bgActive": "{semantic.action.danger.bgActive}",
          "text": "{semantic.action.danger.text}",
          "border": "{semantic.action.danger.border}",
          "shadow": "{shadow.sm}"
        }
      }
    },
    "card": {
      "default": {
        "bg": "{semantic.bg.panel}",
        "bgHover": "#1d2522",
        "border": "{semantic.border.default}",
        "borderHover": "#415047",
        "radius": "18px",
        "padding": "{spacing.5}",
        "shadow": "{shadow.sm}"
      }
    },
    "panel": {
      "default": {
        "bg": "{semantic.bg.elevated}",
        "border": "{semantic.border.subtle}",
        "radius": "{radius.xl}"
      }
    },
    "input": {
      "default": {
        "bg": "#111715",
        "bgHover": "#141c19",
        "bgFocus": "#151f1b",
        "border": "#2b3732",
        "borderHover": "#38453f",
        "borderFocus": "rgba(73,222,170,0.45)",
        "text": "{semantic.text.primary}",
        "placeholder": "{semantic.text.muted}",
        "label": "{semantic.text.secondary}",
        "help": "{semantic.text.tertiary}",
        "radius": "{radius.md}",
        "height": "44px"
      }
    },
    "badge": {
      "radius": "{radius.pill}",
      "fontSize": "{typography.fontSize.xs}",
      "fontWeight": 600,
      "variants": {
        "neutral": {
          "bg": "rgba(255,255,255,0.04)",
          "border": "rgba(255,255,255,0.08)",
          "text": "#d6dfda"
        },
        "brand": {
          "bg": "rgba(34,199,146,0.14)",
          "border": "rgba(73,222,170,0.34)",
          "text": "#9ceccf"
        },
        "success": {
          "bg": "rgba(47,180,106,0.14)",
          "border": "rgba(77,207,132,0.34)",
          "text": "#8ae1ae"
        },
        "warning": {
          "bg": "rgba(230,169,31,0.14)",
          "border": "rgba(246,191,57,0.34)",
          "text": "#ffd77a"
        },
        "danger": {
          "bg": "rgba(227,77,77,0.14)",
          "border": "rgba(249,104,104,0.34)",
          "text": "#ff9d9d"
        }
      }
    },
    "table": {
      "default": {
        "bg": "transparent",
        "border": "{semantic.border.subtle}",
        "headerText": "{semantic.text.tertiary}",
        "cellText": "{semantic.text.secondary}",
        "rowHover": "rgba(255,255,255,0.02)",
        "rowSelected": "rgba(34,199,146,0.08)"
      }
    },
    "nav": {
      "sidebar": {"bg": "#0d1110", "border": "#1d2421"},
      "item": {
        "text": "#a7b4ad",
        "textHover": "#e6efea",
        "bgHover": "rgba(255,255,255,0.04)",
        "bgActive": "rgba(34,199,146,0.14)",
        "borderActive": "rgba(73,222,170,0.28)",
        "iconActive": "{primitives.color.emerald.400}"
      }
    },
    "tabs": {
      "listBg": "rgba(255,255,255,0.03)",
      "triggerText": "{semantic.text.secondary}",
      "triggerTextActive": "{semantic.text.primary}",
      "triggerBgActive": "rgba(34,199,146,0.12)",
      "triggerBorderActive": "rgba(73,222,170,0.28)",
      "radius": "{radius.md}"
    },
    "modal": {
      "overlay": "rgba(4,8,7,0.72)",
      "bg": "{semantic.bg.panel}",
      "border": "{semantic.border.default}",
      "radius": "{radius.xl}",
      "shadow": "{shadow.xl}"
    },
    "upload": {
      "bg": "rgba(255,255,255,0.015)",
      "border": "#34423c",
      "borderHover": "rgba(73,222,170,0.45)",
      "borderActive": "rgba(73,222,170,0.60)",
      "text": "{semantic.text.secondary}",
      "icon": "{primitives.color.emerald.400}",
      "radius": "{radius.lg}"
    }
  },
  "aliases": {
    "tailwindSemantic": {
      "canvas": "var(--bg-canvas)",
      "panel": "var(--bg-panel)",
      "panel2": "var(--bg-panel-2)",
      "textPrimary": "var(--text-primary)",
      "textSecondary": "var(--text-secondary)",
      "textMuted": "var(--text-muted)",
      "borderDefault": "var(--border-default)",
      "borderStrong": "var(--border-strong)",
      "primary": "var(--action-primary-bg)",
      "primaryHover": "var(--action-primary-bg-hover)",
      "primaryText": "var(--action-primary-text)",
      "successSoft": "var(--status-success-bg-soft)",
      "warningSoft": "var(--status-warning-bg-soft)",
      "dangerSoft": "var(--status-danger-bg-soft)"
    }
  }
}

path = "/mnt/data/compliscan-design-system.json"
with open(path, "w", encoding="utf-8") as f:
    json.dump(theme, f, ensure_ascii=False, indent=2)

print(f"Saved to {path}")



