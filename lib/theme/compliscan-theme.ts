export const compliScanTheme = {
  meta: {
    name: "CompliScan Design System",
    version: "1.0.0",
    theme: "dark",
  },
  fonts: {
    sans: 'var(--font-sans-custom, "Inter", ui-sans-serif, system-ui, sans-serif)',
    display:
      'var(--font-display-custom, "Manrope", "Inter", ui-sans-serif, system-ui, sans-serif)',
    mono: 'var(--font-mono-custom, "JetBrains Mono", ui-monospace, monospace)',
  },
  bg: {
    canvas: "var(--bg-canvas)",
    panel: "var(--bg-panel)",
    panel2: "var(--bg-panel-2)",
    panel3: "var(--bg-panel-3)",
    inset: "var(--bg-inset)",
    hover: "var(--bg-hover)",
    active: "var(--bg-active)",
    selected: "var(--bg-selected)",
  },
  text: {
    primary: "var(--text-primary)",
    secondary: "var(--text-secondary)",
    tertiary: "var(--text-tertiary)",
    muted: "var(--text-muted)",
    disabled: "var(--text-disabled)",
    onPrimary: "var(--text-on-primary)",
    link: "var(--text-link)",
  },
  border: {
    subtle: "var(--border-subtle)",
    default: "var(--border-default)",
    strong: "var(--border-strong)",
    emerald: "var(--border-emerald)",
    warning: "var(--border-warning)",
    danger: "var(--border-danger)",
  },
  action: {
    primary: {
      bg: "var(--action-primary-bg)",
      hover: "var(--action-primary-bg-hover)",
      active: "var(--action-primary-bg-active)",
      text: "var(--action-primary-text)",
    },
    secondary: {
      bg: "var(--action-secondary-bg)",
      hover: "var(--action-secondary-bg-hover)",
      active: "var(--action-secondary-bg-active)",
      text: "var(--action-secondary-text)",
    },
    outline: {
      bg: "var(--action-outline-bg)",
      hover: "var(--action-outline-bg-hover)",
      active: "var(--action-outline-bg-active)",
      text: "var(--action-outline-text)",
    },
    danger: {
      bg: "var(--action-danger-bg)",
      hover: "var(--action-danger-bg-hover)",
      active: "var(--action-danger-bg-active)",
      text: "var(--action-danger-text)",
    },
  },
  status: {
    success: {
      bg: "var(--status-success-bg-soft)",
      border: "var(--status-success-border)",
      text: "var(--status-success-text)",
    },
    warning: {
      bg: "var(--status-warning-bg-soft)",
      border: "var(--status-warning-border)",
      text: "var(--status-warning-text)",
    },
    danger: {
      bg: "var(--status-danger-bg-soft)",
      border: "var(--status-danger-border)",
      text: "var(--status-danger-text)",
    },
    info: {
      bg: "var(--status-info-bg-soft)",
      border: "var(--status-info-border)",
      text: "var(--status-info-text)",
    },
  },
  chart: {
    series1: "var(--chart-series-1)",
    series2: "var(--chart-series-2)",
    series3: "var(--chart-series-3)",
    series4: "var(--chart-series-4)",
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
