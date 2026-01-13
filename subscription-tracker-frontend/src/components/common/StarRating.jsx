/**
 * StarRating Component (Improved)
 * 
 * A production-ready, accessible star rating component with:
 * - Interactive mode (hover, click, submit)
 * - Read-only mode (for display/showcase)
 * - Half-star support
 * - Customizable size and colors
 * - Smooth animations
 * - Proper ARIA labels for accessibility
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { Star, StarBorder, StarHalf } from '@mui/icons-material';
import { RATING_CONFIG } from '../../config/ratingsConfig';

// ============================================
// STAR ICON COMPONENT
// ============================================

const StarIcon = ({ filled, half, size, color, hoverColor, isHovered, disabled }) => {
    const iconSize = RATING_CONFIG.starSize[size] || RATING_CONFIG.starSize.medium;
    const fillColor = disabled
        ? RATING_CONFIG.colors.disabled
        : isHovered
            ? (hoverColor || RATING_CONFIG.colors.hover)
            : (color || RATING_CONFIG.colors.filled);
    const emptyColor = RATING_CONFIG.colors.empty;

    const iconSx = {
        fontSize: iconSize,
        transition: `all ${RATING_CONFIG.animationDuration}ms ease`,
        cursor: disabled ? 'default' : 'pointer',
    };

    if (filled) {
        return <Star sx={{ ...iconSx, color: fillColor }} />;
    }
    if (half) {
        return <StarHalf sx={{ ...iconSx, color: fillColor }} />;
    }
    return <StarBorder sx={{ ...iconSx, color: emptyColor }} />;
};

// ============================================
// MAIN STAR RATING COMPONENT
// ============================================

const StarRating = ({
    value = 0,
    onChange = null,
    size = 'medium',
    readOnly = false,
    showValue = true,
    showCount = false,
    totalRatings = 0,
    showLabel = false,
    color = null,
    hoverColor = null,
    gap = 0.5,
    onHover = null,
    onSubmit = null,
    ariaLabel = 'Rating',
}) => {
    const [hoverValue, setHoverValue] = useState(0);
    const [selectedValue, setSelectedValue] = useState(value);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const displayValue = hoverValue > 0 ? hoverValue : (selectedValue || value);
    const isInteractive = !readOnly && onChange;
    const maxStars = RATING_CONFIG.maxStars;

    const stars = useMemo(() => {
        const result = [];
        for (let i = 1; i <= maxStars; i++) {
            const filled = displayValue >= i;
            const half = !filled && displayValue >= i - 0.5 && RATING_CONFIG.allowHalfStars;
            result.push({ index: i, filled, half });
        }
        return result;
    }, [displayValue, maxStars]);

    const handleMouseEnter = useCallback((starIndex) => {
        if (!isInteractive) return;
        setHoverValue(starIndex);
        onHover?.(starIndex);
    }, [isInteractive, onHover]);

    const handleMouseLeave = useCallback(() => {
        if (!isInteractive) return;
        setHoverValue(0);
        onHover?.(0);
    }, [isInteractive, onHover]);

    const handleClick = useCallback(async (starIndex) => {
        if (!isInteractive || isSubmitting) return;
        setSelectedValue(starIndex);
        onChange?.(starIndex);

        if (onSubmit) {
            setIsSubmitting(true);
            try {
                await onSubmit(starIndex);
            } finally {
                setIsSubmitting(false);
            }
        }
    }, [isInteractive, isSubmitting, onChange, onSubmit]);

    return (
        <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            role="img"
            aria-label={`${ariaLabel}: ${displayValue.toFixed(1)} out of ${maxStars} stars`}
        >
            <Stack
                direction="row"
                spacing={gap}
                onMouseLeave={handleMouseLeave}
                sx={{
                    opacity: isSubmitting ? 0.5 : 1,
                    transition: 'opacity 0.2s ease',
                }}
                role="group"
                aria-label="Star rating"
            >
                {stars.map(({ index, filled, half }) => (
                    <Box
                        key={index}
                        onMouseEnter={() => handleMouseEnter(index)}
                        onClick={() => handleClick(index)}
                        role="button"
                        aria-label={`Rate ${index} star${index > 1 ? 's' : ''}`}
                        tabIndex={isInteractive ? 0 : -1}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: isInteractive ? 'pointer' : 'default',
                            transform: hoverValue === index ? 'scale(1.15)' : 'scale(1)',
                            transition: `transform ${RATING_CONFIG.animationDuration}ms ease`,
                            '&:focus': isInteractive ? {
                                outline: '2px solid #fbbf24',
                                outlineOffset: 2,
                                borderRadius: 1,
                            } : {},
                        }}
                    >
                        <StarIcon
                            filled={filled}
                            half={half}
                            size={size}
                            color={color}
                            hoverColor={hoverColor}
                            isHovered={hoverValue >= index}
                            disabled={!isInteractive}
                        />
                    </Box>
                ))}
            </Stack>

            {showValue && (
                <Typography
                    component="span"
                    sx={{
                        fontWeight: 700,
                        fontSize: size === 'large' ? '1.5rem' : size === 'small' ? '0.875rem' : '1rem',
                        color: '#fbbf24',
                        ml: 0.5,
                    }}
                >
                    {displayValue.toFixed(1)}
                </Typography>
            )}

            {showLabel && (
                <Typography
                    component="span"
                    sx={{
                        fontSize: size === 'large' ? '1rem' : size === 'small' ? '0.625rem' : '0.75rem',
                        color: 'rgba(255, 255, 255, 0.5)',
                    }}
                >
                    / {maxStars}
                </Typography>
            )}

            {showCount && totalRatings > 0 && (
                <>
                    <Box
                        sx={{
                            width: 1,
                            height: size === 'large' ? 20 : size === 'small' ? 12 : 16,
                            bgcolor: 'rgba(255, 255, 255, 0.15)',
                            mx: 1,
                        }}
                    />
                    <Typography
                        component="span"
                        sx={{
                            fontSize: size === 'large' ? '0.9375rem' : size === 'small' ? '0.6875rem' : '0.8125rem',
                            color: 'rgba(255, 255, 255, 0.6)',
                        }}
                    >
                        {totalRatings.toLocaleString()} reviews
                    </Typography>
                </>
            )}
        </Stack>
    );
};

// ============================================
// RATING DISPLAY CARD COMPONENT (Production-Ready)
// ============================================

export const RatingDisplayCard = ({
    averageRating = 0,
    totalRatings = 0,
    distribution = {},
    showDistribution = true,
    onRateClick = null,
}) => {
    const maxStars = RATING_CONFIG.maxStars;

    const getPercentage = (count) => {
        if (totalRatings === 0) return 0;
        return Math.round((count / totalRatings) * 100);
    };

    return (
        <Box
            sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 4,
                background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(10px)',
            }}
            role="region"
            aria-label="Rating summary"
        >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 3, sm: 5 }} alignItems={{ xs: 'center', sm: 'flex-start' }}>
                {/* Left: Average rating - Primary visual anchor */}
                <Box sx={{ textAlign: 'center', minWidth: 140 }}>
                    <Typography
                        variant="h2"
                        sx={{
                            fontSize: { xs: '3.5rem', md: '4rem' },
                            fontWeight: 800,
                            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            lineHeight: 1,
                            mb: 1.5,
                        }}
                        aria-label={`Average rating: ${averageRating.toFixed(1)} out of 5`}
                    >
                        {averageRating.toFixed(1)}
                    </Typography>
                    <StarRating
                        value={averageRating}
                        readOnly
                        size="small"
                        showValue={false}
                    />
                    <Typography
                        sx={{
                            mt: 1.5,
                            fontSize: '0.875rem',
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontWeight: 500,
                        }}
                    >
                        Based on {totalRatings.toLocaleString()} reviews
                    </Typography>
                </Box>

                {/* Right: Distribution breakdown */}
                {showDistribution && (
                    <Box sx={{ flex: 1, width: '100%' }}>
                        {[5, 4, 3, 2, 1].map((star) => (
                            <Stack
                                key={star}
                                direction="row"
                                alignItems="center"
                                spacing={2}
                                sx={{ mb: 1 }}
                                role="progressbar"
                                aria-valuenow={getPercentage(distribution[star] || 0)}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`${star} stars: ${getPercentage(distribution[star] || 0)}%`}
                            >
                                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 28 }}>
                                    <Typography
                                        sx={{
                                            fontSize: '0.8125rem',
                                            color: 'rgba(255, 255, 255, 0.8)',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {star}
                                    </Typography>
                                    <Star sx={{ fontSize: 14, color: '#fbbf24' }} />
                                </Stack>
                                <Box
                                    sx={{
                                        flex: 1,
                                        height: 10,
                                        borderRadius: 5,
                                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: `${getPercentage(distribution[star] || 0)}%`,
                                            height: '100%',
                                            background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)',
                                            borderRadius: 5,
                                            transition: 'width 0.6s ease-out',
                                        }}
                                    />
                                </Box>
                                <Typography
                                    sx={{
                                        fontSize: '0.8125rem',
                                        color: 'rgba(255, 255, 255, 0.6)',
                                        minWidth: 40,
                                        textAlign: 'right',
                                        fontWeight: 500,
                                    }}
                                >
                                    {getPercentage(distribution[star] || 0)}%
                                </Typography>
                            </Stack>
                        ))}
                    </Box>
                )}
            </Stack>

            {/* Rate button */}
            {onRateClick && (
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Box
                        onClick={onRateClick}
                        role="button"
                        tabIndex={0}
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 3,
                            py: 1.25,
                            borderRadius: 2,
                            bgcolor: 'rgba(251, 191, 36, 0.1)',
                            border: '1px solid rgba(251, 191, 36, 0.3)',
                            color: '#fbbf24',
                            fontSize: '0.9375rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                bgcolor: 'rgba(251, 191, 36, 0.15)',
                                borderColor: 'rgba(251, 191, 36, 0.5)',
                                transform: 'translateY(-2px)',
                            },
                            '&:focus': {
                                outline: '2px solid #fbbf24',
                                outlineOffset: 2,
                            },
                        }}
                    >
                        Write a review
                    </Box>
                </Box>
            )}
        </Box>
    );
};

// ============================================
// INTERACTIVE RATING FORM COMPONENT
// ============================================

export const RatingForm = ({
    initialValue = 0,
    onSubmit,
    onCancel,
    isLoading = false,
    showComment = false,
}) => {
    const [rating, setRating] = useState(initialValue);
    const [comment, setComment] = useState('');
    const [hoverValue, setHoverValue] = useState(0);

    const handleSubmit = async () => {
        if (rating === 0) return;
        await onSubmit?.(rating, comment);
    };

    const displayValue = hoverValue || rating;

    const ratingLabels = {
        1: 'Poor',
        2: 'Fair',
        3: 'Good',
        4: 'Very Good',
        5: 'Excellent',
    };

    return (
        <Box
            sx={{
                p: 4,
                borderRadius: 4,
                background: 'linear-gradient(145deg, rgba(17,17,17,0.98) 0%, rgba(10,10,10,0.98) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                textAlign: 'center',
                backdropFilter: 'blur(20px)',
            }}
            role="form"
            aria-label="Rating submission form"
        >
            <Typography
                sx={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    mb: 3,
                    color: 'rgba(255, 255, 255, 0.95)',
                }}
            >
                How would you rate SubTracker?
            </Typography>

            <Box sx={{ mb: 2 }}>
                <StarRating
                    value={rating}
                    onChange={setRating}
                    onHover={setHoverValue}
                    size="large"
                    showValue={false}
                    readOnly={isLoading}
                />
            </Box>

            <Typography
                sx={{
                    fontSize: '1rem',
                    color: displayValue > 0 ? '#fbbf24' : 'transparent',
                    mb: 3,
                    minHeight: 28,
                    fontWeight: 600,
                    transition: 'color 0.2s ease',
                }}
            >
                {ratingLabels[displayValue] || ''}
            </Typography>

            {showComment && rating > 0 && (
                <Box sx={{ mb: 3 }}>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your experience (optional)"
                        aria-label="Review comment"
                        style={{
                            width: '100%',
                            minHeight: 100,
                            padding: '14px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                            color: 'white',
                            fontSize: '0.9375rem',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                        }}
                    />
                </Box>
            )}

            <Stack direction="row" spacing={2} justifyContent="center">
                {onCancel && (
                    <Box
                        onClick={onCancel}
                        role="button"
                        tabIndex={0}
                        sx={{
                            py: 1.25,
                            px: 3,
                            borderRadius: 2,
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontSize: '0.9375rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': { color: 'rgba(255, 255, 255, 0.9)' },
                        }}
                    >
                        Cancel
                    </Box>
                )}
                <Box
                    onClick={handleSubmit}
                    role="button"
                    tabIndex={rating > 0 ? 0 : -1}
                    sx={{
                        py: 1.25,
                        px: 4,
                        borderRadius: 2,
                        bgcolor: rating > 0 ? '#fbbf24' : 'rgba(255, 255, 255, 0.1)',
                        color: rating > 0 ? '#000' : 'rgba(255, 255, 255, 0.3)',
                        fontSize: '0.9375rem',
                        fontWeight: 600,
                        cursor: rating > 0 ? 'pointer' : 'default',
                        opacity: isLoading ? 0.5 : 1,
                        transition: 'all 0.2s ease',
                        '&:hover': rating > 0 ? {
                            bgcolor: '#fcd34d',
                            transform: 'translateY(-2px)',
                        } : {},
                    }}
                >
                    {isLoading ? 'Submitting...' : 'Submit Review'}
                </Box>
            </Stack>
        </Box>
    );
};

export default StarRating;
