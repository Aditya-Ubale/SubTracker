/**
 * LandingPage - Netflix-inspired Premium Landing
 * 
 * Design Philosophy:
 * - Netflix dark theme with red accents
 * - Equal-sized cards with proper grid
 * - Typography-first, human-designed
 * - No excessive animations or glow
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Button,
    Card,
    CardContent,
    Avatar,
    Stack,
    AppBar,
    Toolbar,
} from '@mui/material';
import {
    TrendingUp,
    Notifications,
    CompareArrows,
    Savings,
    CreditCard,
    Dashboard,
    ArrowForward,
    Star,
    CheckCircle,
} from '@mui/icons-material';

// Netflix-inspired color palette
const COLORS = {
    primary: '#E50914',
    primaryHover: '#b8070f',
    surface: 'rgba(255, 255, 255, 0.03)',
    border: 'rgba(255, 255, 255, 0.08)',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.65)',
    textMuted: 'rgba(255, 255, 255, 0.4)',
    bg: '#141414',
    bgDark: '#0a0a0a',
};

const FEATURES = [
    {
        icon: <Dashboard />,
        title: 'Unified Dashboard',
        description: 'See all your subscriptions in one clean overview.',
    },
    {
        icon: <TrendingUp />,
        title: 'Spending Insights',
        description: 'Understand where your money goes each month.',
    },
    {
        icon: <Notifications />,
        title: 'Smart Reminders',
        description: 'Get notified before any subscription renews.',
    },
    {
        icon: <CompareArrows />,
        title: 'Plan Comparison',
        description: 'Compare plans to find the best value for you.',
    },
    {
        icon: <Savings />,
        title: 'Budget Tracking',
        description: 'Set limits and track your subscription spending.',
    },
    {
        icon: <CreditCard />,
        title: 'Secure Payments',
        description: 'Pay safely with Stripe. We never store card info.',
    },
];

const TESTIMONIALS = [
    {
        name: 'Priya S.',
        role: 'Designer',
        text: 'Finally, a clean way to track all my subscriptions. Saved me ₹3,000 last month.',
    },
    {
        name: 'Rahul V.',
        role: 'Developer',
        text: 'The renewal reminders are a lifesaver. No more surprise charges on my card.',
    },
    {
        name: 'Ankit P.',
        role: 'Entrepreneur',
        text: 'Simple and intuitive. Exactly what I needed to manage 15+ subscriptions.',
    },
];

const LandingPage = () => {
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Reusable Feature Card
    const FeatureCard = ({ icon, title, description }) => (
        <Box
            sx={{
                bgcolor: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 2,
                p: 3,
                height: 160,
                display: 'flex',
                flexDirection: 'column',
                transition: 'border-color 0.2s ease',
                '&:hover': {
                    borderColor: 'rgba(255,255,255,0.15)',
                },
            }}
        >
            <Box
                sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    bgcolor: 'rgba(229, 9, 20, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    '& svg': { fontSize: 20, color: COLORS.primary },
                }}
            >
                {icon}
            </Box>
            <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', mb: 0.75, color: COLORS.textPrimary }}>
                {title}
            </Typography>
            <Typography sx={{ color: COLORS.textSecondary, fontSize: '0.8125rem', lineHeight: 1.5 }}>
                {description}
            </Typography>
        </Box>
    );

    // Reusable Testimonial Card
    const TestimonialCard = ({ name, role, text }) => (
        <Box
            sx={{
                bgcolor: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 2,
                p: 3,
                height: 180,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* User info at top */}
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                <Avatar
                    sx={{
                        width: 36,
                        height: 36,
                        bgcolor: COLORS.primary,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                    }}
                >
                    {name[0]}
                </Avatar>
                <Box>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: COLORS.textPrimary }}>
                        {name}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: COLORS.textMuted }}>
                        {role}
                    </Typography>
                </Box>
            </Stack>

            {/* Stars */}
            <Stack direction="row" spacing={0.25} sx={{ mb: 1.5 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} sx={{ color: '#fbbf24', fontSize: 14 }} />
                ))}
            </Stack>

            {/* Review text */}
            <Typography sx={{ color: COLORS.textSecondary, fontSize: '0.8125rem', lineHeight: 1.6, flex: 1 }}>
                "{text}"
            </Typography>
        </Box>
    );

    return (
        <Box sx={{ bgcolor: COLORS.bgDark, minHeight: '100vh', color: 'white' }}>
            {/* Navigation */}
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    bgcolor: isScrolled ? 'rgba(10, 10, 10, 0.95)' : 'transparent',
                    borderBottom: isScrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    backdropFilter: isScrolled ? 'blur(12px)' : 'none',
                    transition: 'all 0.2s ease',
                }}
            >
                <Toolbar sx={{ justifyContent: 'space-between', py: 1, px: { xs: 2, md: 6 } }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1,
                                bgcolor: COLORS.primary,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                            }}
                        >
                            S
                        </Box>
                        <Typography
                            sx={{
                                fontWeight: 600,
                                fontSize: '1rem',
                                letterSpacing: '-0.01em',
                                display: { xs: 'none', sm: 'block' },
                            }}
                        >
                            SubTracker
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                        <Button
                            onClick={() => navigate('/login')}
                            sx={{
                                color: COLORS.textSecondary,
                                fontWeight: 500,
                                fontSize: '0.875rem',
                                textTransform: 'none',
                                '&:hover': { color: '#fff', bgcolor: 'transparent' },
                            }}
                        >
                            Sign in
                        </Button>
                        <Button
                            onClick={() => navigate('/signup')}
                            sx={{
                                bgcolor: COLORS.primary,
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                textTransform: 'none',
                                px: 2.5,
                                borderRadius: 1,
                                '&:hover': { bgcolor: COLORS.primaryHover },
                            }}
                        >
                            Get started
                        </Button>
                    </Stack>
                </Toolbar>
            </AppBar>

            {/* Hero Section */}
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative',
                    pt: { xs: 12, md: 0 },
                    pb: { xs: 10, md: 0 },
                }}
            >
                <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative' }}>
                    {/* Badge */}
                    <Box
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 2,
                            py: 0.5,
                            mb: 3,
                            borderRadius: 1,
                            bgcolor: 'rgba(229, 9, 20, 0.1)',
                            border: '1px solid rgba(229, 9, 20, 0.2)',
                        }}
                    >
                        <CheckCircle sx={{ fontSize: 14, color: COLORS.primary }} />
                        <Typography sx={{ fontSize: '0.8125rem', color: COLORS.textSecondary }}>
                            Free to use • No credit card required
                        </Typography>
                    </Box>

                    {/* Headline */}
                    <Typography
                        variant="h1"
                        sx={{
                            fontSize: { xs: '2.25rem', sm: '3rem', md: '3.5rem' },
                            fontWeight: 700,
                            lineHeight: 1.15,
                            letterSpacing: '-0.02em',
                            mb: 2.5,
                            color: COLORS.textPrimary,
                        }}
                    >
                        Track your subscriptions.
                        <Box component="span" sx={{ display: 'block', color: COLORS.textSecondary }}>
                            Stop overspending.
                        </Box>
                    </Typography>

                    {/* Subheadline */}
                    <Typography
                        sx={{
                            fontSize: { xs: '1rem', md: '1.0625rem' },
                            color: COLORS.textSecondary,
                            maxWidth: 460,
                            mx: 'auto',
                            mb: 4,
                            lineHeight: 1.6,
                        }}
                    >
                        One dashboard for all your recurring payments. Get reminders,
                        track spending, and stop paying for things you don't use.
                    </Typography>

                    {/* CTA Buttons */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center" sx={{ mb: 5 }}>
                        <Button
                            size="large"
                            onClick={() => navigate('/signup')}
                            endIcon={<ArrowForward sx={{ fontSize: 18 }} />}
                            sx={{
                                bgcolor: COLORS.primary,
                                color: '#fff',
                                py: 1.25,
                                px: 3.5,
                                fontSize: '0.9375rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                borderRadius: 1,
                                '&:hover': { bgcolor: COLORS.primaryHover },
                            }}
                        >
                            Start for free
                        </Button>
                        <Button
                            size="large"
                            onClick={() => navigate('/login')}
                            sx={{
                                color: COLORS.textSecondary,
                                py: 1.25,
                                px: 3.5,
                                fontSize: '0.9375rem',
                                fontWeight: 500,
                                textTransform: 'none',
                                borderRadius: 1,
                                border: `1px solid ${COLORS.border}`,
                                '&:hover': {
                                    bgcolor: 'rgba(255,255,255,0.03)',
                                    borderColor: 'rgba(255,255,255,0.15)',
                                    color: '#fff',
                                },
                            }}
                        >
                            Sign in
                        </Button>
                    </Stack>

                    {/* Social proof */}
                    <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} sx={{ color: '#fbbf24', fontSize: 14 }} />
                            ))}
                            <Typography sx={{ color: COLORS.textMuted, fontSize: '0.8125rem', ml: 0.5 }}>
                                4.9/5
                            </Typography>
                        </Stack>
                        <Box sx={{ width: 1, height: 12, bgcolor: 'rgba(255,255,255,0.1)' }} />
                        <Typography sx={{ color: COLORS.textMuted, fontSize: '0.8125rem' }}>
                            10,000+ users
                        </Typography>
                    </Stack>
                </Container>
            </Box>

            {/* Features Section */}
            <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: COLORS.bg }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 6, maxWidth: 500, mx: 'auto' }}>
                        <Typography
                            sx={{
                                fontSize: '0.75rem',
                                color: COLORS.primary,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                mb: 1.5,
                                fontWeight: 600,
                            }}
                        >
                            Features
                        </Typography>
                        <Typography
                            variant="h2"
                            sx={{
                                fontSize: { xs: '1.5rem', md: '2rem' },
                                fontWeight: 600,
                                letterSpacing: '-0.01em',
                                mb: 1.5,
                            }}
                        >
                            Everything you need to save money
                        </Typography>
                        <Typography sx={{ color: COLORS.textSecondary, fontSize: '0.9375rem' }}>
                            Simple tools to take control of your subscriptions.
                        </Typography>
                    </Box>

                    {/* Feature Grid - CSS Grid for equal sizing */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                            gap: 2.5,
                        }}
                    >
                        {FEATURES.map((feature) => (
                            <FeatureCard key={feature.title} {...feature} />
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* Testimonials Section */}
            <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: COLORS.bgDark }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 6 }}>
                        <Typography
                            variant="h2"
                            sx={{
                                fontSize: { xs: '1.5rem', md: '2rem' },
                                fontWeight: 600,
                                letterSpacing: '-0.01em',
                                mb: 1.5,
                            }}
                        >
                            Loved by users
                        </Typography>
                        <Typography sx={{ color: COLORS.textSecondary, fontSize: '0.9375rem' }}>
                            See what people are saying about SubTracker.
                        </Typography>
                    </Box>

                    {/* Testimonial Grid - CSS Grid for equal sizing */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                            gap: 2.5,
                            maxWidth: 900,
                            mx: 'auto',
                        }}
                    >
                        {TESTIMONIALS.map((testimonial) => (
                            <TestimonialCard key={testimonial.name} {...testimonial} />
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* CTA Section */}
            <Box
                sx={{
                    py: { xs: 8, md: 10 },
                    bgcolor: COLORS.bg,
                    borderTop: `1px solid ${COLORS.border}`,
                }}
            >
                <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
                    <Typography
                        variant="h2"
                        sx={{
                            fontSize: { xs: '1.5rem', md: '2rem' },
                            fontWeight: 600,
                            letterSpacing: '-0.01em',
                            mb: 1.5,
                        }}
                    >
                        Ready to get started?
                    </Typography>
                    <Typography
                        sx={{
                            color: COLORS.textSecondary,
                            fontSize: '0.9375rem',
                            mb: 3.5,
                            maxWidth: 380,
                            mx: 'auto',
                        }}
                    >
                        Join thousands of users saving money on their subscriptions.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
                        <Button
                            size="large"
                            onClick={() => navigate('/signup')}
                            sx={{
                                bgcolor: COLORS.primary,
                                color: '#fff',
                                py: 1.25,
                                px: 3.5,
                                fontSize: '0.9375rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                borderRadius: 1,
                                '&:hover': { bgcolor: COLORS.primaryHover },
                            }}
                        >
                            Create free account
                        </Button>
                        <Button
                            size="large"
                            onClick={() => navigate('/login')}
                            sx={{
                                color: COLORS.textSecondary,
                                py: 1.25,
                                px: 3.5,
                                fontSize: '0.9375rem',
                                fontWeight: 500,
                                textTransform: 'none',
                                borderRadius: 1,
                                border: `1px solid ${COLORS.border}`,
                                '&:hover': {
                                    bgcolor: 'rgba(255,255,255,0.03)',
                                    borderColor: 'rgba(255,255,255,0.15)',
                                    color: '#fff',
                                },
                            }}
                        >
                            Sign in
                        </Button>
                    </Stack>
                </Container>
            </Box>

            {/* Footer */}
            <Box sx={{ py: 4, bgcolor: COLORS.bgDark, borderTop: `1px solid ${COLORS.border}` }}>
                <Container maxWidth="lg">
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'center', md: 'flex-start' }}
                        spacing={2}
                    >
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Box
                                sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: 0.5,
                                    bgcolor: COLORS.primary,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '0.7rem',
                                }}
                            >
                                S
                            </Box>
                            <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                                SubTracker
                            </Typography>
                        </Stack>
                        <Stack direction="row" spacing={3}>
                            {['Privacy', 'Terms', 'Support'].map((link) => (
                                <Typography
                                    key={link}
                                    sx={{
                                        color: COLORS.textMuted,
                                        fontSize: '0.8125rem',
                                        cursor: 'pointer',
                                        '&:hover': { color: COLORS.textSecondary },
                                    }}
                                >
                                    {link}
                                </Typography>
                            ))}
                        </Stack>
                    </Stack>
                    <Typography
                        sx={{
                            color: COLORS.textMuted,
                            fontSize: '0.75rem',
                            mt: 3,
                            textAlign: { xs: 'center', md: 'left' },
                        }}
                    >
                        © 2024 SubTracker. All rights reserved.
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
};

export default LandingPage;
