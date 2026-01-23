/**
 * SubTracker Global Theme System - Refined
 * 
 * DESIGN PHILOSOPHY:
 * - Professional, restrained SaaS aesthetic
 * - Muted accents, subtle shadows
 * - Controlled contrast - no pure black/white
 * - Minimal border radius - not cartoon/pill shapes
 * - Deliberate typography hierarchy
 */

// ============================================
// COLOR PALETTE (Refined for professionalism)
// ============================================

export const colors = {
    // Primary Brand Colors (muted red, less saturated)
    primary: '#DC2626',           // Toned-down red
    primaryLight: '#EF4444',
    primaryDark: '#B91C1C',
    primaryMuted: 'rgba(220, 38, 38, 0.12)',  // Very subtle

    // Accent Colors (muted, professional)
    accent: {
        indigo: '#6366F1',
        indigoMuted: 'rgba(99, 102, 241, 0.12)',
        green: '#059669',         // Muted emerald
        greenMuted: 'rgba(5, 150, 105, 0.12)',
        orange: '#D97706',        // Muted amber
        orangeMuted: 'rgba(217, 119, 6, 0.12)',
        blue: '#2563EB',
        blueMuted: 'rgba(37, 99, 235, 0.12)',
    },

    // Background Colors (warmer, not pure black)
    bg: {
        primary: '#0F0F12',       // Near-black with slight warmth
        secondary: '#16161A',
        tertiary: '#1C1C21',
        card: '#1A1A1F',
        cardHover: '#222228',
        input: '#26262C',
        overlay: 'rgba(0, 0, 0, 0.6)',
    },

    // Text Colors (softer, not pure white)
    text: {
        primary: '#F4F4F5',       // 96% white
        secondary: '#A1A1AA',     // Zinc-400
        muted: '#71717A',         // Zinc-500
        dim: '#52525B',           // Zinc-600
        disabled: '#3F3F46',      // Zinc-700
    },

    // Border Colors (subtle, low opacity)
    border: {
        default: 'rgba(255, 255, 255, 0.06)',
        hover: 'rgba(255, 255, 255, 0.12)',
        focus: '#DC2626',
        subtle: 'rgba(255, 255, 255, 0.03)',
        divider: 'rgba(255, 255, 255, 0.04)',
    },

    // Status Colors (muted)
    status: {
        success: '#059669',
        successBg: 'rgba(5, 150, 105, 0.08)',
        warning: '#D97706',
        warningBg: 'rgba(217, 119, 6, 0.08)',
        error: '#DC2626',
        errorBg: 'rgba(220, 38, 38, 0.08)',
        info: '#2563EB',
        infoBg: 'rgba(37, 99, 235, 0.08)',
    },

    // Common
    white: '#F4F4F5',
    black: '#0F0F12',
};

// ============================================
// SHADOWS (Subtle, low opacity)
// ============================================

export const shadows = {
    // Card shadows - subtle, not dramatic
    sm: '0 1px 2px rgba(0, 0, 0, 0.15)',
    card: '0 2px 8px rgba(0, 0, 0, 0.2)',
    cardHover: '0 4px 12px rgba(0, 0, 0, 0.25)',

    // No glowing button shadows - flat/subtle only
    button: 'none',
    buttonHover: '0 2px 6px rgba(0, 0, 0, 0.2)',

    // Modal - slight elevation
    modal: '0 8px 24px rgba(0, 0, 0, 0.4)',

    // Input focus
    inputFocus: '0 0 0 2px rgba(220, 38, 38, 0.2)',
};

// ============================================
// TYPOGRAPHY (Clear hierarchy, restrained)
// ============================================

export const typography = {
    fontFamily: {
        primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        mono: '"JetBrains Mono", "Fira Code", monospace',
    },
    fontSize: {
        xs: '0.6875rem',   // 11px
        sm: '0.8125rem',   // 13px
        base: '0.875rem',  // 14px
        lg: '1rem',        // 16px
        xl: '1.125rem',    // 18px
        '2xl': '1.375rem', // 22px
        '3xl': '1.75rem',  // 28px
        '4xl': '2.25rem',  // 36px
    },
    fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },
    lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.625,
    },
};

// ============================================
// SPACING
// ============================================

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
};

// ============================================
// BORDER RADIUS (Restrained, not cartoon)
// ============================================

export const borderRadius = {
    none: '0',
    xs: '2px',
    sm: '4px',
    md: '6px',
    lg: '8px',       // Main card radius - not too round
    xl: '10px',
    full: '9999px',
};

// ============================================
// TRANSITIONS (Subtle, fast)
// ============================================

export const transitions = {
    fast: 'all 0.1s ease-out',
    default: 'all 0.15s ease-out',
    slow: 'all 0.25s ease-out',
};

// ============================================
// Z-INDEX
// ============================================

export const zIndex = {
    dropdown: 100,
    sticky: 200,
    modal: 300,
    tooltip: 400,
    toast: 500,
};

// ============================================
// BREAKPOINTS
// ============================================

export const breakpoints = {
    xs: '0px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
};

// ============================================
// COMPONENT STYLES (Pre-defined SX props)
// ============================================

export const componentStyles = {
    // Card - subtle, restrained
    card: {
        backgroundColor: colors.bg.card,
        border: `1px solid ${colors.border.default}`,
        borderRadius: borderRadius.lg,
        boxShadow: shadows.sm,
        transition: transitions.default,
        '&:hover': {
            backgroundColor: colors.bg.cardHover,
            borderColor: colors.border.hover,
        },
    },

    // Input - professional
    input: {
        '& .MuiOutlinedInput-root': {
            backgroundColor: colors.bg.input,
            borderRadius: borderRadius.md,
            '& fieldset': { borderColor: colors.border.default },
            '&:hover fieldset': { borderColor: colors.border.hover },
            '&.Mui-focused fieldset': {
                borderColor: colors.primary,
                borderWidth: 1,
            },
        },
        '& .MuiInputLabel-root': { color: colors.text.muted },
        '& .MuiInputLabel-root.Mui-focused': { color: colors.text.secondary },
        '& .MuiInputBase-input': { color: colors.text.primary },
    },

    // Button primary - flat, no glow
    buttonPrimary: {
        backgroundColor: colors.primary,
        color: colors.white,
        borderRadius: borderRadius.md,
        fontWeight: 500,
        textTransform: 'none',
        boxShadow: 'none',
        '&:hover': {
            backgroundColor: colors.primaryLight,
            boxShadow: shadows.buttonHover,
        },
        '&:disabled': {
            backgroundColor: colors.text.dim,
            color: colors.text.disabled,
        },
    },

    // Button secondary - subtle
    buttonSecondary: {
        backgroundColor: colors.bg.cardHover,
        color: colors.text.secondary,
        border: `1px solid ${colors.border.default}`,
        borderRadius: borderRadius.md,
        fontWeight: 500,
        textTransform: 'none',
        '&:hover': {
            backgroundColor: colors.bg.tertiary,
            color: colors.text.primary,
            borderColor: colors.border.hover,
        },
    },
};

// ============================================
// DEFAULT EXPORT
// ============================================

const theme = {
    colors,
    shadows,
    typography,
    spacing,
    borderRadius,
    transitions,
    zIndex,
    breakpoints,
    componentStyles,
};

export default theme;
