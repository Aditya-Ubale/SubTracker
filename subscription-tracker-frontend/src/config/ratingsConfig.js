/**
 * Rating System Configuration
 * 
 * This file contains configuration for the rating system including:
 * - Mock/Real mode toggle
 * - Mock data settings
 * - Rating configuration options
 * 
 * HOW TO SWITCH FROM MOCK TO REAL MODE:
 * 1. Set USE_MOCK_RATINGS to false
 * 2. Implement the fetchRatings() and submitRating() functions in ratingsService.js
 * 3. Connect to your backend API
 */

// ============================================
// RATING MODE CONFIGURATION
// ============================================

/**
 * Toggle between mock and real rating data
 * Set to false when you have a real backend API ready
 */
export const USE_MOCK_RATINGS = true;

// ============================================
// MOCK DATA CONFIGURATION
// ============================================

/**
 * Configurable mock rating data
 * Adjust these values to change the demo/showcase ratings
 */
export const MOCK_RATINGS_CONFIG = {
    // Average rating (1.0 - 5.0)
    averageRating: 4.8,

    // Total number of ratings
    totalRatings: 2847,

    // Distribution of ratings (for breakdown display)
    ratingDistribution: {
        5: 2150,  // Number of 5-star ratings
        4: 450,   // Number of 4-star ratings
        3: 150,   // Number of 3-star ratings
        2: 67,    // Number of 2-star ratings
        1: 30,    // Number of 1-star ratings
    },

    // Sample reviews for showcase (optional)
    sampleReviews: [
        {
            id: 1,
            userId: 'user_001',
            userName: 'Priya Sharma',
            rating: 5,
            comment: 'SubTracker helped me discover ₹4,200 in forgotten subscriptions!',
            createdAt: new Date('2026-01-10'),
        },
        {
            id: 2,
            userId: 'user_002',
            userName: 'Rahul Mehta',
            rating: 5,
            comment: 'Finally, I have clarity on where my money goes each month.',
            createdAt: new Date('2026-01-08'),
        },
        {
            id: 3,
            userId: 'user_003',
            userName: 'Anita Desai',
            rating: 4,
            comment: 'Great app! Saved our team thousands on unused SaaS tools.',
            createdAt: new Date('2026-01-05'),
        },
    ],
};

// ============================================
// RATING COMPONENT CONFIGURATION
// ============================================

export const RATING_CONFIG = {
    // Maximum number of stars
    maxStars: 5,

    // Minimum rating allowed
    minRating: 1,

    // Allow half-star ratings
    allowHalfStars: true,

    // Star icon size (in pixels)
    starSize: {
        small: 16,
        medium: 24,
        large: 32,
    },

    // Colors
    colors: {
        filled: '#fbbf24',      // Golden yellow for filled stars
        empty: '#374151',       // Gray for empty stars
        hover: '#fcd34d',       // Lighter yellow for hover state
        disabled: '#6b7280',    // Dimmed color for disabled state
    },

    // Animation duration (in milliseconds)
    animationDuration: 200,
};

// ============================================
// API CONFIGURATION (for future use)
// ============================================

export const API_CONFIG = {
    // Base URL for ratings API
    baseUrl: '/api/ratings',

    // Endpoints
    endpoints: {
        getRatings: '/summary',
        submitRating: '/submit',
        getUserRating: '/user',
        getReviews: '/reviews',
    },

    // Request timeout (in milliseconds)
    timeout: 5000,
};
