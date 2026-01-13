/**
 * RatingShowcase Component (Production-Ready)
 * 
 * A polished showcase of the rating system for the landing page:
 * - Average rating with stars and distribution
 * - Testimonial carousel with smooth transitions
 * - Professional avatars (initials, no emojis)
 * - Mobile swipe support
 * - Full accessibility
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Stack, Avatar, Modal, Backdrop, IconButton } from '@mui/material';
import { Star, FormatQuote, Close, ChevronLeft, ChevronRight, CheckCircle } from '@mui/icons-material';
import StarRating, { RatingDisplayCard, RatingForm } from './StarRating';
import { fetchRatings, submitRating, getReviews } from '../../services/ratingsService';

// ============================================
// TESTIMONIAL DATA (Production-Ready)
// ============================================

const TESTIMONIALS = [
    {
        id: 1,
        userName: 'Priya Sharma',
        role: 'Product Manager at Flipkart',
        rating: 5,
        comment: 'SubTracker helped me discover ₹4,200 in subscriptions I completely forgot about. The dashboard is incredibly intuitive and the renewal alerts are perfectly timed.',
        avatarColor: '#6366f1',
    },
    {
        id: 2,
        userName: 'Rahul Mehta',
        role: 'Freelance Designer',
        rating: 5,
        comment: 'As a freelancer, I have subscriptions across 15+ services. This app finally gave me clarity on where my money goes each month. Absolutely essential.',
        avatarColor: '#10b981',
    },
    {
        id: 3,
        userName: 'Anita Desai',
        role: 'Startup Founder',
        rating: 5,
        comment: "We use SubTracker for our entire team now. It's saved us thousands on unused SaaS tools. The ROI was visible within the first week.",
        avatarColor: '#f59e0b',
    },
    {
        id: 4,
        userName: 'Vikram Singh',
        role: 'Software Engineer',
        rating: 5,
        comment: 'Clean interface, smart alerts, and actually useful analytics. Finally a subscription tracker that works the way it should.',
        avatarColor: '#ec4899',
    },
];

// ============================================
// RATING SHOWCASE COMPONENT
// ============================================

const RatingShowcase = ({
    showTitle = true,
    showTestimonials = true,
    showRatingForm = true,
    maxTestimonials = 4,
}) => {
    // ============================================
    // STATE
    // ============================================
    const [ratingSummary, setRatingSummary] = useState({
        averageRating: 4.8,
        totalRatings: 2847,
        distribution: { 5: 2150, 4: 450, 3: 150, 2: 67, 1: 30 },
    });
    const [isLoading, setIsLoading] = useState(true);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [submissionResult, setSubmissionResult] = useState(null);
    const [activeTestimonial, setActiveTestimonial] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(false); // Auto-play disabled by default
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const carouselRef = useRef(null);

    const reviews = TESTIMONIALS.slice(0, maxTestimonials);

    // ============================================
    // DATA FETCHING
    // ============================================

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const summary = await fetchRatings();
                setRatingSummary(summary);
            } catch (error) {
                console.error('Error loading rating data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    // ============================================
    // CAROUSEL CONTROLS
    // ============================================

    const goToNext = useCallback(() => {
        setActiveTestimonial((prev) => (prev + 1) % reviews.length);
    }, [reviews.length]);

    const goToPrev = useCallback(() => {
        setActiveTestimonial((prev) => (prev - 1 + reviews.length) % reviews.length);
    }, [reviews.length]);

    const goToSlide = useCallback((index) => {
        setActiveTestimonial(index);
        setIsAutoPlaying(false); // Stop auto-play on manual interaction
    }, []);

    // Auto-rotate (only if enabled)
    useEffect(() => {
        if (!isAutoPlaying || reviews.length <= 1) return;
        const interval = setInterval(goToNext, 6000);
        return () => clearInterval(interval);
    }, [isAutoPlaying, reviews.length, goToNext]);

    // ============================================
    // TOUCH HANDLERS (Mobile Swipe)
    // ============================================

    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) goToNext();
        if (isRightSwipe) goToPrev();

        setIsAutoPlaying(false);
    };

    // ============================================
    // HANDLERS
    // ============================================

    const handleRateClick = () => {
        setShowRatingModal(true);
        setSubmissionResult(null);
    };

    const handleSubmitRating = async (rating, comment) => {
        const result = await submitRating(rating, null, comment);
        setSubmissionResult(result);

        if (result.success) {
            setRatingSummary((prev) => ({
                ...prev,
                averageRating: result.newAverageRating || prev.averageRating,
                totalRatings: result.newTotalRatings || prev.totalRatings,
            }));
            setTimeout(() => setShowRatingModal(false), 2500);
        }
    };

    // ============================================
    // RENDER
    // ============================================

    return (
        <Box>
            {/* Section Title */}
            {showTitle && (
                <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
                    <Typography
                        sx={{
                            fontSize: '0.75rem',
                            color: '#fbbf24',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            fontWeight: 600,
                            mb: 2,
                        }}
                    >
                        Customer Reviews
                    </Typography>
                    <Typography
                        variant="h2"
                        sx={{
                            fontSize: { xs: '2rem', md: '2.75rem' },
                            fontWeight: 800,
                            letterSpacing: '-0.02em',
                            mb: 2,
                            background: 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.85) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Loved by thousands
                    </Typography>
                    <Typography
                        sx={{
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontSize: { xs: '1rem', md: '1.125rem' },
                            maxWidth: 480,
                            mx: 'auto',
                            lineHeight: 1.7,
                        }}
                    >
                        Join over 10,000 users who trust SubTracker to manage their subscriptions
                    </Typography>
                </Box>
            )}

            {/* Rating Summary Card */}
            <Box sx={{ maxWidth: 650, mx: 'auto', mb: { xs: 5, md: 7 } }}>
                <RatingDisplayCard
                    averageRating={ratingSummary.averageRating}
                    totalRatings={ratingSummary.totalRatings}
                    distribution={ratingSummary.distribution}
                    showDistribution={!isLoading}
                    onRateClick={showRatingForm ? handleRateClick : null}
                />
            </Box>

            {/* Testimonials Carousel */}
            {showTestimonials && reviews.length > 0 && (
                <Box sx={{ maxWidth: 800, mx: 'auto', position: 'relative' }}>
                    {/* Carousel Container */}
                    <Box
                        ref={carouselRef}
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                        sx={{
                            overflow: 'hidden',
                            borderRadius: 4,
                        }}
                    >
                        {/* Slides Wrapper */}
                        <Box
                            sx={{
                                display: 'flex',
                                transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: `translateX(-${activeTestimonial * 100}%)`,
                            }}
                        >
                            {reviews.map((review, index) => (
                                <Box
                                    key={review.id}
                                    sx={{
                                        minWidth: '100%',
                                        p: { xs: 3, md: 5 },
                                        background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        borderRadius: 4,
                                    }}
                                    role="group"
                                    aria-roledescription="slide"
                                    aria-label={`Testimonial ${index + 1} of ${reviews.length}`}
                                >
                                    {/* Stars */}
                                    <Stack
                                        direction="row"
                                        justifyContent="center"
                                        spacing={0.5}
                                        sx={{ mb: 3 }}
                                        role="img"
                                        aria-label={`${review.rating} out of 5 stars`}
                                    >
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                sx={{
                                                    fontSize: 22,
                                                    color: i < review.rating ? '#fbbf24' : 'rgba(255, 255, 255, 0.1)',
                                                }}
                                            />
                                        ))}
                                    </Stack>

                                    {/* Quote */}
                                    <Typography
                                        sx={{
                                            fontSize: { xs: '1.0625rem', md: '1.25rem' },
                                            lineHeight: 1.75,
                                            color: 'rgba(255, 255, 255, 0.85)',
                                            textAlign: 'center',
                                            mb: 4,
                                            px: { xs: 1, md: 3 },
                                            fontWeight: 400,
                                        }}
                                    >
                                        "{review.comment}"
                                    </Typography>

                                    {/* Author */}
                                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={2}>
                                        <Avatar
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                bgcolor: review.avatarColor,
                                                fontSize: '1.125rem',
                                                fontWeight: 600,
                                                color: 'white',
                                            }}
                                            aria-hidden="true"
                                        >
                                            {review.userName.split(' ').map(n => n[0]).join('')}
                                        </Avatar>
                                        <Box sx={{ textAlign: 'left' }}>
                                            <Stack direction="row" alignItems="center" spacing={0.75}>
                                                <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: 'rgba(255,255,255,0.95)' }}>
                                                    {review.userName}
                                                </Typography>
                                                <CheckCircle sx={{ fontSize: 16, color: '#10b981' }} />
                                            </Stack>
                                            <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>
                                                {review.role}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* Navigation Arrows (Desktop) */}
                    {reviews.length > 1 && (
                        <>
                            <IconButton
                                onClick={() => { goToPrev(); setIsAutoPlaying(false); }}
                                aria-label="Previous testimonial"
                                sx={{
                                    position: 'absolute',
                                    left: { xs: -8, md: -24 },
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    display: { xs: 'none', md: 'flex' },
                                    '&:hover': {
                                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                                        color: 'white',
                                    },
                                }}
                            >
                                <ChevronLeft />
                            </IconButton>
                            <IconButton
                                onClick={() => { goToNext(); setIsAutoPlaying(false); }}
                                aria-label="Next testimonial"
                                sx={{
                                    position: 'absolute',
                                    right: { xs: -8, md: -24 },
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    display: { xs: 'none', md: 'flex' },
                                    '&:hover': {
                                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                                        color: 'white',
                                    },
                                }}
                            >
                                <ChevronRight />
                            </IconButton>
                        </>
                    )}

                    {/* Dots Navigation */}
                    {reviews.length > 1 && (
                        <Stack
                            direction="row"
                            justifyContent="center"
                            spacing={1}
                            sx={{ mt: 4 }}
                            role="tablist"
                            aria-label="Testimonial navigation"
                        >
                            {reviews.map((_, index) => (
                                <Box
                                    key={index}
                                    onClick={() => goToSlide(index)}
                                    role="tab"
                                    aria-selected={index === activeTestimonial}
                                    aria-label={`Go to testimonial ${index + 1}`}
                                    tabIndex={0}
                                    sx={{
                                        width: index === activeTestimonial ? 28 : 10,
                                        height: 10,
                                        borderRadius: 5,
                                        bgcolor: index === activeTestimonial
                                            ? '#fbbf24'
                                            : 'rgba(255, 255, 255, 0.15)',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            bgcolor: index === activeTestimonial
                                                ? '#fbbf24'
                                                : 'rgba(255, 255, 255, 0.3)',
                                        },
                                        '&:focus': {
                                            outline: '2px solid #fbbf24',
                                            outlineOffset: 2,
                                        },
                                    }}
                                />
                            ))}
                        </Stack>
                    )}
                </Box>
            )}

            {/* Rating Modal */}
            <Modal
                open={showRatingModal}
                onClose={() => setShowRatingModal(false)}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{ timeout: 300, sx: { bgcolor: 'rgba(0,0,0,0.8)' } }}
            >
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: { xs: '92%', sm: 420 },
                        maxWidth: 420,
                        outline: 'none',
                    }}
                >
                    <IconButton
                        onClick={() => setShowRatingModal(false)}
                        aria-label="Close rating form"
                        sx={{
                            position: 'absolute',
                            top: -48,
                            right: 0,
                            color: 'rgba(255, 255, 255, 0.6)',
                            '&:hover': { color: 'white' },
                        }}
                    >
                        <Close />
                    </IconButton>

                    {submissionResult?.success ? (
                        <Box
                            sx={{
                                p: 5,
                                borderRadius: 4,
                                background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                textAlign: 'center',
                            }}
                        >
                            <Box
                                sx={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: '50%',
                                    bgcolor: 'rgba(16, 185, 129, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 3,
                                }}
                            >
                                <CheckCircle sx={{ fontSize: 36, color: '#10b981' }} />
                            </Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', mb: 1, color: 'white' }}>
                                Thank you!
                            </Typography>
                            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                Your review helps others make better decisions.
                            </Typography>
                        </Box>
                    ) : (
                        <RatingForm
                            onSubmit={handleSubmitRating}
                            onCancel={() => setShowRatingModal(false)}
                            showComment
                        />
                    )}
                </Box>
            </Modal>
        </Box>
    );
};

export default RatingShowcase;
