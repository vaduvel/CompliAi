export const compliScanTheme = {
  meta: {
    name: "CompliScan Design System",
    version: "1.0.0",
    theme: "dark",
  },
  fonts: {
    sans: 'var(--font-sans-custom, "Inter", ui-sans-serif, system-ui, sans-serif)',
    display:
      'var(--font-display-custom, "Space Grotesk", "Inter", ui-sans-serif, system-ui, sans-serif)',
    mono: 'var(--font-mono-custom, "IBM Plex Mono", ui-monospace, monospace)',
  },
  bg: {
    canvas: "var(--eos-surface-base)",
    panel: "var(--eos-surface-primary)",
    panel2: "var(--eos-surface-secondary)",
    panel3: "var(--eos-surface-tertiary)",
    inset: "var(--eos-surface-secondary)",
    hover: "var(--eos-surface-tertiary)",
    active: "var(--eos-surface-tertiary)",
    selected: "var(--eos-surface-elevated)",
  },
  text: {
    primary: "var(--eos-text-primary)",
    secondary: "var(--eos-text-secondary)",
    tertiary: "var(--eos-text-tertiary)",
    muted: "var(--eos-text-secondary)",
    disabled: "var(--eos-text-tertiary)",
    onPrimary: "var(--eos-text-inverse)",
    link: "var(--eos-accent-secondary)",
  },
  border: {
    subtle: "var(--eos-border-subtle)",
    default: "var(--eos-border-default)",
    strong: "var(--eos-border-strong)",
    emerald: "var(--eos-border-default)",
    warning: "var(--eos-status-warning-border)",
    danger: "var(--eos-status-danger-border)",
  },
  action: {
    primary: {
      bg: "var(--eos-accent-primary)",
      hover: "var(--eos-accent-primary-hover)",
      active: "var(--eos-accent-primary-hover)",
      text: "var(--eos-text-inverse)",
    },
    secondary: {
      bg: "var(--eos-surface-secondary)",
      hover: "var(--eos-surface-tertiary)",
      active: "var(--eos-surface-elevated)",
      text: "var(--eos-text-primary)",
    },
    outline: {
      bg: "transparent",
      hover: "var(--eos-surface-secondary)",
      active: "var(--eos-surface-tertiary)",
      text: "var(--eos-text-primary)",
    },
    danger: {
      bg: "var(--eos-status-danger-soft)",
      hover: "var(--eos-status-danger-soft)",
      active: "var(--eos-status-danger-soft)",
      text: "var(--eos-status-danger)",
    },
  },
  status: {
    success: {
      bg: "var(--eos-status-success-soft)",
      border: "var(--eos-border-default)",
      text: "var(--eos-status-success)",
    },
    warning: {
      bg: "var(--eos-status-warning-soft)",
      border: "var(--eos-status-warning-border)",
      text: "var(--eos-status-warning)",
    },
    danger: {
      bg: "var(--eos-status-danger-soft)",
      border: "var(--eos-status-danger-border)",
      text: "var(--eos-status-danger)",
    },
    info: {
      bg: "var(--eos-accent-primary-subtle)",
      border: "var(--eos-border-default)",
      text: "var(--eos-severity-low)",
    },
  },
  chart: {
    series1: "var(--eos-accent-primary)",
    series2: "var(--eos-accent-secondary)",
    series3: "var(--eos-status-success)",
    series4: "var(--eos-status-warning)",
  },
  legacyAliasMap: {
    "--color-bg": "--bg-canvas",
    "--color-surface": "--bg-panel",
    "--color-surface-variant": "--bg-panel-2",
    "--color-surface-elevated": "--bg-panel-3",
    "--color-primary": "--action-primary-bg",
    "--color-primary-hover": "--action-primary-bg-hover",
    "--color-primary-pressed": "--action-primary-bg-active",
    "--color-on-primary": "--action-primary-text",
    "--color-on-surface": "--text-primary",
    "--color-on-surface-muted": "--text-secondary",
    "--color-info": "--chart-series-2",
    "--color-error": "--danger-400",
    "--color-warning": "--warning-400",
    "--color-success": "--success-400",
  },
} as const

export type CompliScanTheme = typeof compliScanTheme
