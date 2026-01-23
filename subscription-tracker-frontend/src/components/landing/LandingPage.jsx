/**
 * LandingPage - World-Class Premium Landing Page
 * 
 * Design Philosophy:
 * - High-conversion, powerful first impression
 * - Clear value proposition within 5 seconds
 * - Modern, premium visual design
 * - Mobile-first, fully responsive
 * - Smooth animations and micro-interactions
 * - Trust-building social proof
 * 
 * Structure:
 * 1. Hero Section with animated background
 * 2. Trust Bar (company logos)
 * 3. Features Grid
 * 4. How It Works (3 steps)
 * 5. Benefits Section
 * 6. Testimonials
 * 7. Stats Section
 * 8. Final CTA
 * 9. Professional Footer
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Button,
    Stack,
    AppBar,
    Toolbar,
    IconButton,
    Link,
    Avatar,
    Drawer,
    List,
    ListItem,
    ListItemText,
} from '@mui/material';
import {
    TrendingUp,
    Notifications,
    CompareArrows,
    Savings,
    CreditCard,
    Dashboard,
    ArrowForward,
    CheckCircle,
    Menu as MenuIcon,
    Close as CloseIcon,
    Email,
    LinkedIn,
    Twitter,
    GitHub,
    Bolt,
    PersonAdd,
    AttachMoney,
    Compare,
    AccountBalanceWallet,
    KeyboardArrowRight,
    Payment,
    ShoppingCart,
} from '@mui/icons-material';

// ============================================
// DESIGN TOKENS
// ============================================
const COLORS = {
    // Primary palette
    primary: '#E50914',
    primaryLight: '#ff3d47',
    primaryDark: '#b8070f',

    // Accent colors
    accent: '#6366f1',
    accentLight: '#818cf8',
    success: '#10b981',
    warning: '#f59e0b',

    // Neutral palette
    white: '#ffffff',
    black: '#000000',

    // Dark theme backgrounds
    bgPrimary: '#0a0a0a',
    bgSecondary: '#111111',
    bgTertiary: '#1a1a1a',
    bgCard: 'rgba(255, 255, 255, 0.03)',
    bgCardHover: 'rgba(255, 255, 255, 0.06)',

    // Text colors
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textMuted: 'rgba(255, 255, 255, 0.5)',
    textDim: 'rgba(255, 255, 255, 0.3)',

    // Borders
    border: 'rgba(255, 255, 255, 0.08)',
    borderHover: 'rgba(255, 255, 255, 0.15)',
    borderAccent: 'rgba(229, 9, 20, 0.3)',

    // Gradients
    gradientPrimary: 'linear-gradient(135deg, #E50914 0%, #ff6b6b 100%)',
    gradientDark: 'linear-gradient(180deg, #0a0a0a 0%, #111111 100%)',
    gradientGlow: 'radial-gradient(ellipse at center, rgba(229, 9, 20, 0.15) 0%, transparent 70%)',
};

// Typography scale
const TYPOGRAPHY = {
    hero: { xs: '2.5rem', sm: '3.5rem', md: '4rem', lg: '4.5rem' },
    h1: { xs: '2rem', sm: '2.5rem', md: '3rem' },
    h2: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
    h3: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
    body: { xs: '1rem', md: '1.125rem' },
    small: '0.875rem',
};

// ============================================
// DATA
// ============================================

// Note: Trust logos removed - no real endorsements exist

// Features data - 6 CORE VERIFIED FEATURES (consolidated)
const FEATURES = [
    {
        icon: <Dashboard />,
        title: 'Subscription Dashboard',
        description: 'View all subscriptions in one place. See monthly totals, renewal dates, and export reports.',
        color: '#6366f1',
        mockup: {
            type: 'dashboard',
            stats: [
                { label: 'Monthly', value: '₹4,299', color: '#E50914' },
                { label: 'Active', value: '12', color: '#6366f1' },
            ],
        },
    },
    {
        icon: <Notifications />,
        title: 'Renewal Alerts',
        description: 'Manually set reminders before subscriptions renew. You control when to be notified.',
        color: '#10b981',
        mockup: {
            type: 'notification',
            alerts: ['Netflix renews in 3 days', 'Spotify renews tomorrow'],
        },
    },
    {
        icon: <CompareArrows />,
        title: 'Compare & View Prices',
        description: 'Browse up-to-date prices and compare up to 4 plans side-by-side.',
        color: '#ec4899',
        mockup: {
            type: 'comparison',
            plans: ['Basic ₹199', 'Pro ₹499'],
        },
    },
    {
        icon: <Savings />,
        title: 'Budget Tracker',
        description: 'Set a monthly budget and track your subscription spending against it.',
        color: '#14b8a6',
        mockup: {
            type: 'budget',
            spent: '₹2,450',
            limit: '₹5,000',
        },
    },
    {
        icon: <TrendingUp />,
        title: 'Wishlist',
        description: 'Save subscriptions you\'re considering to review and compare before committing.',
        color: '#f59e0b',
        mockup: {
            type: 'wishlist',
            count: '5 saved',
        },
    },
    {
        icon: <Payment />,
        title: 'Direct Purchase',
        description: 'Buy subscriptions directly from the platform using our secure payment gateway.',
        color: '#22c55e',
        mockup: {
            type: 'payment',
            label: 'Pay Securely',
        },
    },
];

// How it works steps - UPDATED FLOW with purchase capability
const STEPS = [
    {
        number: '01',
        title: 'Create an account',
        description: 'Sign up with your email and verify to get started.',
        icon: <PersonAdd sx={{ fontSize: 32, color: '#E50914' }} />,
    },
    {
        number: '02',
        title: 'View & compare prices',
        description: 'Browse plans with current pricing and compare up to 4 options.',
        icon: <Compare sx={{ fontSize: 32, color: '#E50914' }} />,
    },
    {
        number: '03',
        title: 'Purchase securely',
        description: 'Buy your selected subscription through our integrated payment gateway.',
        icon: <Payment sx={{ fontSize: 32, color: '#E50914' }} />,
    },
    {
        number: '04',
        title: 'Track & manage',
        description: 'Monitor spending, set reminders, and manage your subscriptions.',
        icon: <AccountBalanceWallet sx={{ fontSize: 32, color: '#E50914' }} />,
    },
];

// Benefits - UPDATED with purchase capability
const BENEFITS = [
    {
        title: 'Set your own renewal reminders',
        description: 'Manually add renewal dates for your subscriptions. You set when to be reminded.',
        stat: 'Manual',
        label: 'You control reminder dates',
    },
    {
        title: 'Compare up to 4 plans',
        description: 'Select and compare pricing and features across up to 4 subscription plans at a time.',
        stat: 'Four',
        label: 'Plans compared at once',
    },
    {
        title: 'Track your budget',
        description: 'Set a monthly budget and see how your subscription spending compares.',
        stat: 'Budget',
        label: 'Spending visibility',
    },
    {
        title: 'Buy subscriptions directly',
        description: 'Purchase subscriptions without leaving the platform via our secure payment gateway.',
        stat: 'Secure',
        label: 'Integrated payments',
    },
];

// Note: Testimonials and stats removed - not backed by real data

// What You Get - ALL FEATURES SUMMARY
const WHAT_YOU_GET = [
    { value: 'Up-To-Date', label: 'Information Of Subscriptions' },
    { value: 'Free', label: 'To Get Started' },
    { value: 'Honest', label: 'No Hidden Fees' },
];

// Footer links - only real pages
const FOOTER_SECTIONS = [
    {
        title: 'Product',
        links: ['Features', 'How It Works'],
    },
    {
        title: 'Account',
        links: ['Sign Up', 'Log In'],
    },
    {
        title: 'Support',
        links: ['Help Center'],
    },
    {
        title: 'Legal',
        links: ['Privacy', 'Terms'],
    },
];

// ============================================
// ANIMATED COMPONENTS
// ============================================

// Floating animation keyframes (CSS-in-JS)
const floatingAnimation = `
@keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
}
@keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
}
@keyframes slideUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
`;

// ============================================
// MAIN COMPONENT
// ============================================

const LandingPage = () => {
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Scroll handler for navbar
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Inject animations
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = floatingAnimation;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    // Navigation links - only real sections
    const navLinks = [
        { label: 'Features', href: '#features' },
        { label: 'How It Works', href: '#how-it-works' },
        { label: 'Benefits', href: '#benefits' },
        { label: 'What You Get', href: '#what-you-get' },
    ];

    return (
        <Box sx={{ bgcolor: COLORS.bgPrimary, minHeight: '100vh', color: COLORS.textPrimary, overflow: 'hidden' }}>

            {/* ============================================
                NAVIGATION
            ============================================ */}
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    bgcolor: isScrolled ? 'rgba(10, 10, 10, 0.95)' : 'transparent',
                    borderBottom: isScrolled ? `1px solid ${COLORS.border}` : 'none',
                    backdropFilter: isScrolled ? 'blur(20px)' : 'none',
                    transition: 'all 0.3s ease',
                }}
            >
                <Container maxWidth="xl">
                    <Toolbar sx={{ justifyContent: 'space-between', py: 1.5, px: { xs: 0, md: 2 } }}>
                        {/* Logo */}
                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 2,
                                    background: COLORS.gradientPrimary,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                    fontSize: '1.25rem',
                                    boxShadow: '0 4px 20px rgba(229, 9, 20, 0.3)',
                                }}
                            >
                                S
                            </Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em', display: { xs: 'none', sm: 'block' } }}>
                                SubTracker
                            </Typography>
                        </Stack>

                        {/* Desktop Navigation */}
                        <Stack direction="row" spacing={4} sx={{ display: { xs: 'none', md: 'flex' } }}>
                            {navLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    underline="none"
                                    sx={{
                                        color: COLORS.textSecondary,
                                        fontSize: '0.9375rem',
                                        fontWeight: 500,
                                        transition: 'color 0.2s',
                                        '&:hover': { color: COLORS.white },
                                    }}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </Stack>

                        {/* CTA Buttons */}
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Button
                                onClick={() => navigate('/login')}
                                sx={{
                                    color: COLORS.textSecondary,
                                    fontWeight: 500,
                                    fontSize: '0.9375rem',
                                    textTransform: 'none',
                                    display: { xs: 'none', sm: 'flex' },
                                    '&:hover': { color: COLORS.white, bgcolor: 'transparent' },
                                }}
                            >
                                Log in
                            </Button>
                            <Button
                                onClick={() => navigate('/signup')}
                                sx={{
                                    background: COLORS.gradientPrimary,
                                    color: COLORS.white,
                                    fontWeight: 600,
                                    fontSize: '0.9375rem',
                                    textTransform: 'none',
                                    px: 3,
                                    py: 1,
                                    borderRadius: 2,
                                    boxShadow: '0 4px 15px rgba(229, 9, 20, 0.3)',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 6px 25px rgba(229, 9, 20, 0.4)',
                                    },
                                }}
                            >
                                Start Free
                            </Button>

                            {/* Mobile menu button */}
                            <IconButton
                                onClick={() => setMobileMenuOpen(true)}
                                sx={{ display: { md: 'none' }, color: COLORS.white }}
                            >
                                <MenuIcon />
                            </IconButton>
                        </Stack>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Mobile Menu Drawer */}
            <Drawer
                anchor="right"
                open={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                PaperProps={{
                    sx: { bgcolor: COLORS.bgSecondary, width: 280, p: 3 },
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                    <IconButton onClick={() => setMobileMenuOpen(false)} sx={{ color: COLORS.white }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                <List>
                    {navLinks.map((link) => (
                        <ListItem key={link.label} sx={{ py: 2 }}>
                            <Link href={link.href} underline="none" onClick={() => setMobileMenuOpen(false)}>
                                <ListItemText primary={link.label} sx={{ color: COLORS.textPrimary }} />
                            </Link>
                        </ListItem>
                    ))}
                    <ListItem sx={{ pt: 4, flexDirection: 'column', gap: 2 }}>
                        <Button fullWidth variant="outlined" onClick={() => { setMobileMenuOpen(false); navigate('/login'); }} sx={{ borderColor: COLORS.border, color: COLORS.white }}>
                            Log in
                        </Button>
                        <Button fullWidth onClick={() => { setMobileMenuOpen(false); navigate('/signup'); }} sx={{ background: COLORS.gradientPrimary, color: COLORS.white }}>
                            Start Free
                        </Button>
                    </ListItem>
                </List>
            </Drawer>

            {/* ============================================
                HERO SECTION
            ============================================ */}
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative',
                    pt: { xs: 14, md: 10 },
                    pb: { xs: 8, md: 10 },
                    overflow: 'hidden',
                }}
            >
                {/* Subtle background glow - no animations */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: '20%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '120%',
                        height: '60%',
                        background: COLORS.gradientGlow,
                        pointerEvents: 'none',
                        opacity: 0.4,
                    }}
                />

                <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', lg: 'row' },
                            alignItems: 'center',
                            gap: { xs: 6, lg: 8 },
                        }}
                    >
                        {/* Left Column - Text Content */}
                        <Box sx={{ flex: 1, maxWidth: { lg: 560 } }}>
                            {/* Badge */}
                            <Box
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    px: 2,
                                    py: 0.75,
                                    mb: 3,
                                    borderRadius: 10,
                                    bgcolor: 'rgba(229, 9, 20, 0.1)',
                                    border: `1px solid ${COLORS.borderAccent}`,
                                }}
                            >
                                <Bolt sx={{ fontSize: 16, color: COLORS.primary }} />
                                <Typography sx={{ fontSize: '0.8125rem', color: COLORS.primary, fontWeight: 600 }}>
                                    Free Subscription Manager
                                </Typography>
                            </Box>

                            {/* Main Headline */}
                            <Typography
                                variant="h1"
                                sx={{
                                    fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem', lg: '3.75rem' },
                                    fontWeight: 800,
                                    lineHeight: 1.1,
                                    letterSpacing: '-0.03em',
                                    mb: 3,
                                    background: 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.85) 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                Take Control of{' '}
                                <Box component="span" sx={{
                                    background: COLORS.gradientPrimary,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}>
                                    Every Subscription
                                </Box>
                            </Typography>

                            {/* Subheadline */}
                            <Typography
                                sx={{
                                    fontSize: { xs: '1rem', md: '1.125rem' },
                                    color: COLORS.textSecondary,
                                    mb: 4,
                                    lineHeight: 1.7,
                                    maxWidth: 480,
                                }}
                            >
                                Keep track of your recurring subscriptions in one dashboard. See what you're paying,
                                when renewals are due, and compare plans across services.
                            </Typography>

                            {/* Single Primary CTA Button */}
                            <Box sx={{ mb: 4 }}>
                                <Button
                                    size="large"
                                    onClick={() => navigate('/signup')}
                                    endIcon={<ArrowForward />}
                                    sx={{
                                        background: COLORS.gradientPrimary,
                                        color: COLORS.white,
                                        py: 1.75,
                                        px: 4.5,
                                        fontSize: '1.0625rem',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        borderRadius: 2,
                                        boxShadow: '0 8px 30px rgba(229, 9, 20, 0.35)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-3px)',
                                            boxShadow: '0 12px 40px rgba(229, 9, 20, 0.45)',
                                        },
                                    }}
                                >
                                    Get Started Free
                                </Button>
                            </Box>

                            {/* Trust indicators */}
                            <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap" sx={{ gap: 1.5 }}>
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <CheckCircle sx={{ fontSize: 18, color: COLORS.success }} />
                                    <Typography sx={{ fontSize: '0.875rem', color: COLORS.textMuted }}>No credit card required</Typography>
                                </Stack>
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <CheckCircle sx={{ fontSize: 18, color: COLORS.success }} />
                                    <Typography sx={{ fontSize: '0.875rem', color: COLORS.textMuted }}>Setup in 5 minutes</Typography>
                                </Stack>
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <CheckCircle sx={{ fontSize: 18, color: COLORS.success }} />
                                    <Typography sx={{ fontSize: '0.875rem', color: COLORS.textMuted }}>Cancel anytime</Typography>
                                </Stack>
                            </Stack>
                        </Box>

                        {/* Right Column - Product Screenshots */}
                        <Box
                            sx={{
                                flex: 1.1,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                position: 'relative',
                                minHeight: { xs: 320, md: 480 },
                            }}
                        >
                            {/* Desktop Dashboard Screenshot */}
                            <Box
                                sx={{
                                    position: 'relative',
                                    width: '100%',
                                    maxWidth: { xs: 340, sm: 420, md: 520 },
                                }}
                            >
                                {/* Main Dashboard Card */}
                                <Box
                                    component="img"
                                    src="/dashboard-preview.png"
                                    alt="SubTracker Dashboard - Track all your subscriptions in one place"
                                    loading="lazy"
                                    onError={(e) => {
                                        // Fallback to placeholder if image doesn't exist
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                    sx={{
                                        width: '100%',
                                        height: 'auto',
                                        borderRadius: 3,
                                        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5), 0 10px 30px rgba(0, 0, 0, 0.3)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                    }}
                                />

                                {/* Fallback Dashboard Preview - shown if image fails */}
                                <Box
                                    sx={{
                                        display: 'none', // Hidden by default, shown on image error
                                        flexDirection: 'column',
                                        width: '100%',
                                        aspectRatio: '16/10',
                                        borderRadius: 3,
                                        bgcolor: 'rgba(17, 17, 17, 0.95)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5), 0 10px 30px rgba(0, 0, 0, 0.3)',
                                        overflow: 'hidden',
                                        backdropFilter: 'blur(20px)',
                                    }}
                                >
                                    {/* Mock Browser Header */}
                                    <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ff5f56' }} />
                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ffbd2e' }} />
                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#27ca3f' }} />
                                        <Box sx={{ flex: 1, mx: 2, py: 0.5, px: 2, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)' }}>app.subtracker.io/dashboard</Typography>
                                        </Box>
                                    </Box>

                                    {/* Mock Dashboard Content */}
                                    <Box sx={{ flex: 1, p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {/* Stats Row */}
                                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                                            {[
                                                { label: 'Monthly Spend', value: '₹4,299', color: COLORS.primary },
                                                { label: 'Active Subs', value: '12', color: COLORS.accent },
                                                { label: 'Saved', value: '₹1,850', color: COLORS.success },
                                            ].map((stat, i) => (
                                                <Box key={i} sx={{ flex: 1, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                    <Typography sx={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)', mb: 0.5 }}>{stat.label}</Typography>
                                                    <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: stat.color }}>{stat.value}</Typography>
                                                </Box>
                                            ))}
                                        </Box>

                                        {/* Subscription List Preview */}
                                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {['Netflix', 'Spotify', 'ChatGPT'].map((name, i) => (
                                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                                    <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: i === 0 ? '#E50914' : i === 1 ? '#1DB954' : '#10a37f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>{name[0]}</Typography>
                                                    </Box>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{name}</Typography>
                                                        <Typography sx={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)' }}>Next: {15 + i * 5} Jan</Typography>
                                                    </Box>
                                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>₹{199 + i * 50}/mo</Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Mobile App Preview - Floating Card */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        bottom: { xs: -20, md: -30 },
                                        right: { xs: -10, md: -40 },
                                        width: { xs: 100, sm: 120, md: 140 },
                                        borderRadius: 2.5,
                                        bgcolor: 'rgba(17, 17, 17, 0.95)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
                                        overflow: 'hidden',
                                        backdropFilter: 'blur(20px)',
                                    }}
                                >
                                    {/* Mobile Header */}
                                    <Box sx={{ p: 1, borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                                        <Typography sx={{ fontSize: '0.5rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>SubTracker</Typography>
                                    </Box>

                                    {/* Mobile Content */}
                                    <Box sx={{ p: 1.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography sx={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.4)' }}>This Month</Typography>
                                        </Box>
                                        <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: COLORS.primary, mb: 1 }}>₹4,299</Typography>

                                        {/* Mini Chart */}
                                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.3, height: 30, mb: 1 }}>
                                            {[40, 65, 45, 80, 55, 70].map((h, i) => (
                                                <Box
                                                    key={i}
                                                    sx={{
                                                        flex: 1,
                                                        height: `${h}%`,
                                                        borderRadius: 0.5,
                                                        bgcolor: i === 5 ? COLORS.primary : 'rgba(255,255,255,0.1)',
                                                    }}
                                                />
                                            ))}
                                        </Box>

                                        {/* Alert Badge */}
                                        <Box sx={{ p: 0.75, borderRadius: 1, bgcolor: 'rgba(229, 9, 20, 0.15)', border: '1px solid rgba(229, 9, 20, 0.3)' }}>
                                            <Typography sx={{ fontSize: '0.5rem', color: COLORS.primary, fontWeight: 600 }}>2 renewals soon</Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Notification Badge - Floating */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: { xs: 20, md: 30 },
                                        left: { xs: -15, md: -25 },
                                        px: 1.5,
                                        py: 1,
                                        borderRadius: 2,
                                        bgcolor: 'rgba(17, 17, 17, 0.95)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.3)',
                                        backdropFilter: 'blur(20px)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                    }}
                                >
                                    <Box sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: COLORS.success, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CheckCircle sx={{ fontSize: 14, color: '#fff' }} />
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>Alerts Active</Typography>
                                        <Typography sx={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.4)' }}>3 renewals tracked</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Container>
            </Box>


            {/* ============================================
                FEATURES SECTION (Enhanced with Product Mockups)
            ============================================ */}
            <Box id="features" sx={{ py: { xs: 10, md: 16 }, position: 'relative' }}>
                <Container maxWidth="lg">
                    {/* Section header */}
                    <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 }, maxWidth: 600, mx: 'auto' }}>
                        <Typography
                            sx={{
                                fontSize: '0.75rem',
                                color: COLORS.primary,
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                fontWeight: 600,
                                mb: 2,
                            }}
                        >
                            Features
                        </Typography>
                        <Typography
                            variant="h2"
                            sx={{
                                fontSize: TYPOGRAPHY.h1,
                                fontWeight: 800,
                                letterSpacing: '-0.02em',
                                mb: 2,
                            }}
                        >
                            What SubTracker does
                        </Typography>
                        <Typography sx={{ color: COLORS.textSecondary, fontSize: TYPOGRAPHY.body, lineHeight: 1.7 }}>
                            Simple tools to track and manage your recurring subscriptions.
                        </Typography>
                    </Box>

                    {/* Features grid */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                            gap: { xs: 2.5, md: 3 },
                        }}
                    >
                        {FEATURES.map((feature, index) => (
                            <Box
                                key={index}
                                sx={{
                                    p: { xs: 3, md: 4 },
                                    borderRadius: 4,
                                    background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                                    border: '1px solid rgba(255, 255, 255, 0.06)',
                                    transition: 'all 0.35s ease',
                                    cursor: 'default',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    '&:hover': {
                                        background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                        borderColor: 'rgba(255, 255, 255, 0.12)',
                                        transform: 'translateY(-6px)',
                                        boxShadow: `0 25px 50px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)`,
                                        '& .feature-mockup': {
                                            opacity: 1,
                                            transform: 'translateY(0)',
                                        },
                                        '& .feature-glow': {
                                            opacity: 0.15,
                                        },
                                    },
                                }}
                            >
                                {/* Background glow on hover */}
                                <Box
                                    className="feature-glow"
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: '100%',
                                        background: `radial-gradient(ellipse at top, ${feature.color}30 0%, transparent 60%)`,
                                        opacity: 0,
                                        transition: 'opacity 0.35s ease',
                                        pointerEvents: 'none',
                                    }}
                                />

                                {/* Icon + Title Row */}
                                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2, position: 'relative' }}>
                                    <Box
                                        sx={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 2.5,
                                            background: `linear-gradient(135deg, ${feature.color}20 0%, ${feature.color}10 100%)`,
                                            border: `1px solid ${feature.color}30`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            '& svg': { fontSize: 22, color: feature.color },
                                        }}
                                    >
                                        {feature.icon}
                                    </Box>
                                    <Typography sx={{ fontWeight: 700, fontSize: '1.125rem', color: 'rgba(255,255,255,0.95)' }}>
                                        {feature.title}
                                    </Typography>
                                </Stack>

                                {/* Description */}
                                <Typography sx={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, fontSize: '0.9375rem', mb: 3, position: 'relative' }}>
                                    {feature.description}
                                </Typography>

                                {/* Mini Product Mockup */}
                                <Box
                                    className="feature-mockup"
                                    sx={{
                                        mt: 'auto',
                                        p: 2,
                                        borderRadius: 2.5,
                                        bgcolor: 'rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        opacity: 0.85,
                                        transform: 'translateY(4px)',
                                        transition: 'all 0.35s ease',
                                        position: 'relative',
                                    }}
                                >
                                    {/* Dashboard Mockup */}
                                    {feature.mockup?.type === 'dashboard' && (
                                        <Stack direction="row" spacing={1.5}>
                                            {feature.mockup.stats.map((stat, i) => (
                                                <Box key={i} sx={{ flex: 1, p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <Typography sx={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)', mb: 0.5 }}>{stat.label}</Typography>
                                                    <Typography sx={{ fontSize: '0.9375rem', fontWeight: 700, color: stat.color }}>{stat.value}</Typography>
                                                </Box>
                                            ))}
                                        </Stack>
                                    )}

                                    {/* Notification Mockup */}
                                    {feature.mockup?.type === 'notification' && (
                                        <Stack spacing={1}>
                                            {feature.mockup.alerts.map((alert, i) => (
                                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 1.5, bgcolor: i === 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)', border: `1px solid ${i === 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'}` }}>
                                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: i === 0 ? '#f59e0b' : '#10b981' }} />
                                                    <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.7)' }}>{alert}</Typography>
                                                </Box>
                                            ))}
                                        </Stack>
                                    )}

                                    {/* Comparison Mockup */}
                                    {feature.mockup?.type === 'comparison' && (
                                        <Stack direction="row" spacing={1}>
                                            {feature.mockup.plans.map((plan, i) => (
                                                <Box key={i} sx={{ flex: 1, p: 1.5, borderRadius: 1.5, bgcolor: i === 1 ? 'rgba(236, 72, 153, 0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${i === 1 ? 'rgba(236, 72, 153, 0.3)' : 'rgba(255,255,255,0.05)'}`, textAlign: 'center' }}>
                                                    <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: i === 1 ? '#ec4899' : 'rgba(255,255,255,0.6)' }}>{plan}</Typography>
                                                </Box>
                                            ))}
                                        </Stack>
                                    )}

                                    {/* Export Mockup */}
                                    {feature.mockup?.type === 'export' && (
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 1,
                                            p: 1.5,
                                            borderRadius: 1.5,
                                            bgcolor: 'rgba(139, 92, 246, 0.1)',
                                            border: '1px solid rgba(139, 92, 246, 0.2)',
                                        }}>
                                            <CreditCard sx={{ fontSize: 14, color: '#8b5cf6' }} />
                                            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: '#8b5cf6' }}>
                                                {feature.mockup.label}
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* Prices Mockup */}
                                    {feature.mockup?.type === 'prices' && (
                                        <Stack spacing={1}>
                                            {feature.mockup.items.map((item, i) => (
                                                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderRadius: 1.5, bgcolor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                                    <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.7)' }}>{item.name}</Typography>
                                                    <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: '#3b82f6' }}>{item.price}</Typography>
                                                </Box>
                                            ))}
                                        </Stack>
                                    )}

                                    {/* Budget Mockup */}
                                    {feature.mockup?.type === 'budget' && (
                                        <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography sx={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.5)' }}>Spent</Typography>
                                                <Typography sx={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.5)' }}>Budget</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981' }}>{feature.mockup.spent}</Typography>
                                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{feature.mockup.limit}</Typography>
                                            </Box>
                                            <Box sx={{ mt: 1, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.1)' }}>
                                                <Box sx={{ width: '49%', height: '100%', borderRadius: 2, bgcolor: '#10b981' }} />
                                            </Box>
                                        </Box>
                                    )}

                                    {/* Wishlist Mockup */}
                                    {feature.mockup?.type === 'wishlist' && (
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 1,
                                            p: 1.5,
                                            borderRadius: 1.5,
                                            bgcolor: 'rgba(245, 158, 11, 0.1)',
                                            border: '1px solid rgba(245, 158, 11, 0.2)',
                                        }}>
                                            <TrendingUp sx={{ fontSize: 14, color: '#f59e0b' }} />
                                            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: '#f59e0b' }}>
                                                {feature.mockup.count}
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* Payment Mockup */}
                                    {feature.mockup?.type === 'payment' && (
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 1,
                                            p: 1.5,
                                            borderRadius: 1.5,
                                            bgcolor: 'rgba(34, 197, 94, 0.1)',
                                            border: '1px solid rgba(34, 197, 94, 0.2)',
                                        }}>
                                            <Payment sx={{ fontSize: 14, color: '#22c55e' }} />
                                            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: '#22c55e' }}>
                                                {feature.mockup.label}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* ============================================
                HOW IT WORKS
            ============================================ */}
            <Box id="how-it-works" sx={{ py: { xs: 10, md: 16 }, bgcolor: COLORS.bgSecondary }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 8, maxWidth: 600, mx: 'auto' }}>
                        <Typography
                            sx={{
                                fontSize: '0.75rem',
                                color: COLORS.primary,
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase',
                                fontWeight: 600,
                                mb: 2,
                            }}
                        >
                            How It Works
                        </Typography>
                        <Typography variant="h2" sx={{ fontSize: TYPOGRAPHY.h1, fontWeight: 700, letterSpacing: '-0.02em', mb: 2 }}>
                            Get started in minutes
                        </Typography>
                        <Typography sx={{ color: COLORS.textSecondary, fontSize: TYPOGRAPHY.body }}>
                            Four steps to browse prices, compare plans, and track your spending.
                        </Typography>
                    </Box>

                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
                        {STEPS.map((step, index) => (
                            <Box key={index} sx={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                                {/* Connector Arrow */}
                                {index < STEPS.length - 1 && (
                                    <Box
                                        sx={{
                                            display: { xs: 'none', md: 'flex' },
                                            position: 'absolute',
                                            top: 28,
                                            right: -24,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <KeyboardArrowRight
                                            sx={{
                                                fontSize: 40,
                                                color: COLORS.primary,
                                                opacity: 0.7,
                                            }}
                                        />
                                    </Box>
                                )}
                                <Box
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: '50%',
                                        bgcolor: 'rgba(229, 9, 20, 0.1)',
                                        border: `2px solid ${COLORS.borderAccent}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '2rem',
                                        mx: 'auto',
                                        mb: 3,
                                    }}
                                >
                                    {step.icon}
                                </Box>
                                <Typography sx={{ color: COLORS.primary, fontWeight: 700, fontSize: '0.875rem', mb: 1 }}>
                                    Step {step.number}
                                </Typography>
                                <Typography sx={{ fontWeight: 600, fontSize: '1.25rem', mb: 1.5 }}>
                                    {step.title}
                                </Typography>
                                <Typography sx={{ color: COLORS.textSecondary, lineHeight: 1.6 }}>
                                    {step.description}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                </Container>
            </Box>

            {/* ============================================
                BENEFITS / OUTCOMES
            ============================================ */}
            <Box id="benefits" sx={{ py: { xs: 10, md: 16 } }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 8, maxWidth: 600, mx: 'auto' }}>
                        <Typography
                            sx={{
                                fontSize: '0.75rem',
                                color: COLORS.primary,
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase',
                                fontWeight: 600,
                                mb: 2,
                            }}
                        >
                            Benefits
                        </Typography>
                        <Typography variant="h2" sx={{ fontSize: TYPOGRAPHY.h1, fontWeight: 700, letterSpacing: '-0.02em', mb: 2 }}>
                            Real Results, Real Savings
                        </Typography>
                    </Box>

                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                        {BENEFITS.map((benefit, index) => (
                            <Box
                                key={index}
                                sx={{
                                    flex: 1,
                                    p: 4,
                                    borderRadius: 3,
                                    bgcolor: COLORS.bgCard,
                                    border: `1px solid ${COLORS.border}`,
                                    textAlign: 'center',
                                }}
                            >
                                <Typography sx={{ fontSize: '2.5rem', fontWeight: 800, color: COLORS.primary, mb: 1 }}>
                                    {benefit.stat}
                                </Typography>
                                <Typography sx={{ fontSize: '0.8125rem', color: COLORS.textMuted, mb: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {benefit.label}
                                </Typography>
                                <Typography sx={{ fontWeight: 600, fontSize: '1.125rem', mb: 1.5 }}>
                                    {benefit.title}
                                </Typography>
                                <Typography sx={{ color: COLORS.textSecondary, lineHeight: 1.6 }}>
                                    {benefit.description}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                </Container>
            </Box>


            {/* ============================================
                KEY INFO SECTION (No fake stats)
            ============================================ */}
            <Box id="what-you-get" sx={{ py: { xs: 8, md: 12 }, bgcolor: COLORS.bgSecondary }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 6 }}>
                        <Typography
                            sx={{
                                fontSize: '0.75rem',
                                color: COLORS.primary,
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                fontWeight: 600,
                                mb: 2,
                            }}
                        >
                            What You Get
                        </Typography>
                        <Typography
                            variant="h2"
                            sx={{
                                fontSize: TYPOGRAPHY.h1,
                                fontWeight: 800,
                                letterSpacing: '-0.02em',
                                mb: 2,
                            }}
                        >
                            Simple Subscription Tracking
                        </Typography>
                        <Typography sx={{ color: COLORS.textSecondary, fontSize: TYPOGRAPHY.body, maxWidth: 500, mx: 'auto' }}>
                            A straightforward tool to help you keep track of your recurring payments
                        </Typography>
                    </Box>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 4, md: 8 }} justifyContent="center" alignItems="center">
                        {WHAT_YOU_GET.map((item, index) => (
                            <Box key={index} sx={{ textAlign: 'center', minWidth: 150 }}>
                                <Typography sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, fontWeight: 800, color: COLORS.primary, mb: 0.5 }}>
                                    {item.value}
                                </Typography>
                                <Typography sx={{ color: COLORS.textMuted, fontSize: '0.875rem' }}>
                                    {item.label}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                </Container>
            </Box>

            {/* ============================================
                FINAL CTA
            ============================================ */}
            <Box
                id="pricing"
                sx={{
                    py: { xs: 12, md: 20 },
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Background glow */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '100%',
                        height: '100%',
                        background: COLORS.gradientGlow,
                        opacity: 0.4,
                    }}
                />

                <Container maxWidth="md" sx={{ position: 'relative', textAlign: 'center' }}>
                    <Typography variant="h2" sx={{ fontSize: TYPOGRAPHY.h1, fontWeight: 700, letterSpacing: '-0.02em', mb: 2 }}>
                        Ready to get started?
                    </Typography>
                    <Typography sx={{ color: COLORS.textSecondary, fontSize: TYPOGRAPHY.body, mb: 5, maxWidth: 500, mx: 'auto' }}>
                        Start tracking your subscriptions today. Free to use, no credit card required.
                    </Typography>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mb: 4 }}>
                        <Button
                            size="large"
                            onClick={() => navigate('/signup')}
                            endIcon={<ArrowForward />}
                            sx={{
                                background: COLORS.gradientPrimary,
                                color: COLORS.white,
                                py: 2,
                                px: 5,
                                fontSize: '1.125rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                borderRadius: 2,
                                boxShadow: '0 8px 30px rgba(229, 9, 20, 0.35)',
                                '&:hover': {
                                    transform: 'translateY(-3px)',
                                    boxShadow: '0 12px 40px rgba(229, 9, 20, 0.45)',
                                },
                            }}
                        >
                            Create Free Account
                        </Button>
                    </Stack>

                    <Typography sx={{ color: COLORS.textDim, fontSize: '0.875rem' }}>
                        Start Tracking Your Subscriptions NOW!!!
                    </Typography>
                </Container>
            </Box>

            {/* ============================================
                FOOTER
            ============================================ */}
            <Box component="footer" sx={{ py: 8, bgcolor: COLORS.bgSecondary, borderTop: `1px solid ${COLORS.border}` }}>
                <Container maxWidth="lg">
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 4, mb: 8 }}>
                        {/* Brand column */}
                        <Box sx={{ gridColumn: { xs: '1 / -1', md: 'auto' }, mb: { xs: 4, md: 0 } }}>
                            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                                <Box
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 2,
                                        background: COLORS.gradientPrimary,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 800,
                                    }}
                                >
                                    S
                                </Box>
                                <Typography sx={{ fontWeight: 700, fontSize: '1.125rem' }}>SubTracker</Typography>
                            </Stack>
                            <Typography sx={{ color: COLORS.textMuted, fontSize: '0.875rem', lineHeight: 1.6, mb: 3, maxWidth: 220 }}>
                                Take control of your subscriptions and save money every month.
                            </Typography>
                            <Stack direction="row" spacing={1}>
                                <IconButton size="small" sx={{ color: COLORS.textMuted, '&:hover': { color: COLORS.white } }}>
                                    <Twitter fontSize="small" />
                                </IconButton>
                                <IconButton size="small" sx={{ color: COLORS.textMuted, '&:hover': { color: COLORS.white } }}>
                                    <LinkedIn fontSize="small" />
                                </IconButton>
                                <IconButton size="small" sx={{ color: COLORS.textMuted, '&:hover': { color: COLORS.white } }}>
                                    <GitHub fontSize="small" />
                                </IconButton>
                            </Stack>
                        </Box>

                        {/* Link columns */}
                        {FOOTER_SECTIONS.map((section, index) => (
                            <Box key={index}>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 2, color: COLORS.textPrimary }}>
                                    {section.title}
                                </Typography>
                                <Stack spacing={1.5}>
                                    {section.links.map((link, linkIndex) => (
                                        <Link
                                            key={linkIndex}
                                            href="#"
                                            underline="none"
                                            sx={{
                                                color: COLORS.textMuted,
                                                fontSize: '0.875rem',
                                                transition: 'color 0.2s',
                                                '&:hover': { color: COLORS.white },
                                            }}
                                        >
                                            {link}
                                        </Link>
                                    ))}
                                </Stack>
                            </Box>
                        ))}
                    </Box>

                    {/* Bottom bar */}
                    <Box sx={{ pt: 4, borderTop: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                        <Typography sx={{ color: COLORS.textDim, fontSize: '0.8125rem' }}>
                            © 2026 SubTracker. All rights reserved.
                        </Typography>
                        <Stack direction="row" spacing={3}>
                            <Link href="#" underline="none" sx={{ color: COLORS.textMuted, fontSize: '0.8125rem', '&:hover': { color: COLORS.white } }}>
                                Privacy Policy
                            </Link>
                            <Link href="#" underline="none" sx={{ color: COLORS.textMuted, fontSize: '0.8125rem', '&:hover': { color: COLORS.white } }}>
                                Terms of Service
                            </Link>
                        </Stack>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};

export default LandingPage;
