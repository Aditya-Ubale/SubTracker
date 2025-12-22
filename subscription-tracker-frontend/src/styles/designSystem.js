/**
 * Design System - Premium Fintech Theme
 * 
 * Inspired by: Linear, Vercel, Notion, Stripe
 * 
 * This file contains all design tokens and reusable styles
 * for a consistent, premium look across the application.
 */

// ==============================================
// COLOR PALETTE
// ==============================================

export const colors = {
    // Primary accent - Sophisticated blue-violet
    primary: {
        50: '#eef2ff',
        100: '#e0e7ff',
        200: '#c7d2fe',
        300: '#a5b4fc',
        400: '#818cf8',
        500: '#6366f1', // Main accent
        600: '#4f46e5',
        700: '#4338ca',
        800: '#3730a3',
        900: '#312e81',
    },

    // Neutral grays - Soft, not harsh
    gray: {
        50: '#fafafa',
        100: '#f4f4f5',
        200: '#e4e4e7',
        300: '#d4d4d8',
        400: '#a1a1aa',
        500: '#71717a',
        600: '#52525b',
        700: '#3f3f46',
        800: '#27272a',
        850: '#1f1f23', // Custom for backgrounds
        900: '#18181b',
        950: '#09090b',
    },

    // Semantic colors
    success: { light: '#dcfce7', main: '#22c55e', dark: '#15803d' },
    warning: { light: '#fef3c7', main: '#f59e0b', dark: '#b45309' },
    error: { light: '#fee2e2', main: '#ef4444', dark: '#b91c1c' },
    info: { light: '#dbeafe', main: '#3b82f6', dark: '#1d4ed8' },

    // Background colors
    background: {
        primary: '#0f0f12',      // Main background
        secondary: '#16161a',    // Card background
        tertiary: '#1c1c21',     // Elevated elements
        hover: '#222228',        // Hover states
        active: '#2a2a32',       // Active states
    },

    // Text colors
    text: {
        primary: '#fafafa',      // Main text
        secondary: '#a1a1aa',    // Secondary text
        muted: '#71717a',        // Muted text
        disabled: '#52525b',     // Disabled text
    },

    // Border colors
    border: {
        subtle: 'rgba(255, 255, 255, 0.06)',
        default: 'rgba(255, 255, 255, 0.08)',
        hover: 'rgba(255, 255, 255, 0.12)',
        focus: 'rgba(99, 102, 241, 0.5)',
    },
};

// ==============================================
// TYPOGRAPHY
// ==============================================

export const typography = {
    fontFamily: {
        sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        mono: '"JetBrains Mono", "Fira Code", monospace',
    },

    fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },

    fontSize: {
        xs: '0.75rem',     // 12px
        sm: '0.8125rem',   // 13px
        base: '0.875rem',  // 14px
        md: '0.9375rem',   // 15px
        lg: '1rem',        // 16px
        xl: '1.125rem',    // 18px
        '2xl': '1.5rem',   // 24px
        '3xl': '1.875rem', // 30px
        '4xl': '2.25rem',  // 36px
    },

    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.625,
    },

    letterSpacing: {
        tight: '-0.02em',
        normal: '0',
        wide: '0.05em',
    },
};

// ==============================================
// SPACING
// ==============================================

export const spacing = {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
};

// ==============================================
// SHADOWS & ELEVATION
// ==============================================

export const shadows = {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
    glow: '0 0 20px rgba(99, 102, 241, 0.15)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
};

// ==============================================
// BORDERS & RADIUS
// ==============================================

export const radius = {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
};

// ==============================================
// TRANSITIONS
// ==============================================

export const transitions = {
    fast: 'all 0.1s ease',
    base: 'all 0.15s ease',
    normal: 'all 0.2s ease',
    slow: 'all 0.3s ease',
    bounce: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
};

// ==============================================
// COMPONENT STYLES (MUI SX PRESETS)
// ==============================================

export const componentStyles = {
    // Card styles
    card: {
        base: {
            bgcolor: colors.background.secondary,
            borderRadius: radius.xl,
            border: `1px solid ${colors.border.subtle}`,
            transition: transitions.base,
        },
        hover: {
            bgcolor: colors.background.tertiary,
            borderColor: colors.border.hover,
            boxShadow: shadows.md,
        },
        elevated: {
            bgcolor: colors.background.tertiary,
            boxShadow: shadows.lg,
        },
    },

    // Button styles
    button: {
        primary: {
            bgcolor: colors.primary[500],
            color: '#fff',
            fontWeight: typography.fontWeight.medium,
            borderRadius: radius.md,
            transition: transitions.base,
            '&:hover': {
                bgcolor: colors.primary[600],
                transform: 'translateY(-1px)',
            },
            '&:active': {
                transform: 'scale(0.98)',
            },
        },
        secondary: {
            bgcolor: 'transparent',
            color: colors.text.secondary,
            border: `1px solid ${colors.border.default}`,
            borderRadius: radius.md,
            transition: transitions.base,
            '&:hover': {
                bgcolor: colors.background.hover,
                borderColor: colors.border.hover,
                color: colors.text.primary,
            },
        },
        ghost: {
            bgcolor: 'transparent',
            color: colors.text.secondary,
            transition: transitions.base,
            '&:hover': {
                bgcolor: colors.background.hover,
                color: colors.text.primary,
            },
        },
    },

    // Input styles
    input: {
        bgcolor: colors.background.tertiary,
        border: `1px solid ${colors.border.default}`,
        borderRadius: radius.md,
        color: colors.text.primary,
        transition: transitions.base,
        '&:hover': {
            borderColor: colors.border.hover,
        },
        '&:focus': {
            borderColor: colors.border.focus,
            boxShadow: `0 0 0 3px ${colors.primary[500]}20`,
        },
    },

    // Badge/Chip styles
    badge: {
        success: {
            bgcolor: `${colors.success.main}15`,
            color: colors.success.main,
            borderRadius: radius.full,
        },
        warning: {
            bgcolor: `${colors.warning.main}15`,
            color: colors.warning.main,
            borderRadius: radius.full,
        },
        error: {
            bgcolor: `${colors.error.main}15`,
            color: colors.error.main,
            borderRadius: radius.full,
        },
        info: {
            bgcolor: `${colors.primary[500]}15`,
            color: colors.primary[400],
            borderRadius: radius.full,
        },
    },
};

// ==============================================
// LAYOUT CONSTANTS
// ==============================================

export const layout = {
    sidebarWidth: {
        collapsed: 72,
        expanded: 240,
    },
    headerHeight: 64,
    maxContentWidth: 1200,
    containerPadding: {
        mobile: 16,
        tablet: 24,
        desktop: 32,
    },
};

// Default export
const designSystem = {
    colors,
    typography,
    spacing,
    shadows,
    radius,
    transitions,
    componentStyles,
    layout,
};

export default designSystem;
