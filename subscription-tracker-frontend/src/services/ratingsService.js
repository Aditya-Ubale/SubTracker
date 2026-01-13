/**
 * Rating Service
 * 
 * This service handles all rating-related operations including:
 * - Fetching ratings (mock or real)
 * - Submitting user ratings
 * - Managing rating state
 * 
 * ARCHITECTURE:
 * - Uses configuration to determine mock vs real mode
 * - Provides a consistent interface regardless of data source
 * - Easy to extend with real API integration
 * 
 * TO INTEGRATE WITH REAL BACKEND:
 * 1. Set USE_MOCK_RATINGS to false in ratingsConfig.js
 * 2. Implement the API calls in the "REAL API IMPLEMENTATION" section below
 * 3. Ensure your API returns data in the expected format
 */

import {
    USE_MOCK_RATINGS,
    MOCK_RATINGS_CONFIG,
    API_CONFIG,
} from '../config/ratingsConfig';

// ============================================
// DATA INTERFACES (TypeScript-style documentation)
// ============================================

/**
 * Rating Summary Interface
 * {
 *   averageRating: number,    // 1.0 - 5.0
 *   totalRatings: number,     // Total count
 *   distribution: {           // Rating breakdown
 *     5: number,
 *     4: number,
 *     3: number,
 *     2: number,
 *     1: number,
 *   }
 * }
 */

/**
 * Submit Rating Interface
 * {
 *   success: boolean,
 *   message: string,
 *   newAverageRating?: number,
 *   newTotalRatings?: number,
 * }
 */

// ============================================
// MOCK DATA FUNCTIONS
// ============================================

/**
 * Get mock rating summary
 * Uses configurable mock data from ratingsConfig.js
 */
const getMockRatingSummary = () => {
    // Simulate network delay for realistic behavior
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                averageRating: MOCK_RATINGS_CONFIG.averageRating,
                totalRatings: MOCK_RATINGS_CONFIG.totalRatings,
                distribution: MOCK_RATINGS_CONFIG.ratingDistribution,
            });
        }, 300); // 300ms simulated delay
    });
};

/**
 * Submit mock rating
 * Simulates a successful rating submission
 */
const submitMockRating = (rating, userId = null, comment = '') => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate updating the average (in real app, backend calculates this)
            const newTotal = MOCK_RATINGS_CONFIG.totalRatings + 1;
            const currentSum = MOCK_RATINGS_CONFIG.averageRating * MOCK_RATINGS_CONFIG.totalRatings;
            const newAverage = ((currentSum + rating) / newTotal).toFixed(1);

            resolve({
                success: true,
                message: 'Thank you for your rating!',
                newAverageRating: parseFloat(newAverage),
                newTotalRatings: newTotal,
                submittedRating: rating,
            });
        }, 500); // 500ms simulated delay
    });
};

/**
 * Get mock user rating
 * Returns the current user's rating if they've rated before
 */
const getMockUserRating = (userId) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate: user hasn't rated yet
            resolve({
                hasRated: false,
                userRating: null,
            });
        }, 200);
    });
};

/**
 * Get mock reviews
 * Returns sample reviews from config
 */
const getMockReviews = (page = 1, limit = 10) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                reviews: MOCK_RATINGS_CONFIG.sampleReviews,
                totalReviews: MOCK_RATINGS_CONFIG.sampleReviews.length,
                currentPage: page,
                totalPages: 1,
            });
        }, 300);
    });
};

// ============================================
// REAL API IMPLEMENTATION
// ============================================
// TODO: Implement these functions when backend is ready

/**
 * Fetch real rating summary from API
 * 
 * IMPLEMENTATION GUIDE:
 * 1. Make a GET request to API_CONFIG.baseUrl + API_CONFIG.endpoints.getRatings
 * 2. Handle authentication if required
 * 3. Transform response to match expected format
 * 4. Handle errors appropriately
 */
const fetchRealRatingSummary = async () => {
    // TODO: Implement real API call
    // Example implementation:
    /*
    try {
        const response = await fetch(
            `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.getRatings}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Add auth headers if needed
                },
            }
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch ratings');
        }
        
        const data = await response.json();
        
        return {
            averageRating: data.average,
            totalRatings: data.total,
            distribution: data.distribution,
        };
    } catch (error) {
        console.error('Error fetching ratings:', error);
        throw error;
    }
    */

    // Fallback to mock data if not implemented
    console.warn('Real rating API not implemented. Using mock data.');
    return getMockRatingSummary();
};

/**
 * Submit real rating to API
 * 
 * IMPLEMENTATION GUIDE:
 * 1. Make a POST request to API_CONFIG.baseUrl + API_CONFIG.endpoints.submitRating
 * 2. Include user authentication token
 * 3. Send rating value and optional comment
 * 4. Handle success/error responses
 */
const submitRealRating = async (rating, userId, comment = '') => {
    // TODO: Implement real API call
    // Example implementation:
    /*
    try {
        const response = await fetch(
            `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.submitRating}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`,
                },
                body: JSON.stringify({
                    rating,
                    userId,
                    comment,
                }),
            }
        );
        
        if (!response.ok) {
            throw new Error('Failed to submit rating');
        }
        
        const data = await response.json();
        
        return {
            success: true,
            message: data.message,
            newAverageRating: data.newAverage,
            newTotalRatings: data.newTotal,
        };
    } catch (error) {
        console.error('Error submitting rating:', error);
        return {
            success: false,
            message: 'Failed to submit rating. Please try again.',
        };
    }
    */

    // Fallback to mock if not implemented
    console.warn('Real rating API not implemented. Using mock submission.');
    return submitMockRating(rating, userId, comment);
};

/**
 * Fetch user's existing rating from API
 */
const fetchRealUserRating = async (userId) => {
    // TODO: Implement when backend is ready
    console.warn('Real user rating API not implemented. Using mock data.');
    return getMockUserRating(userId);
};

// ============================================
// PUBLIC API (Use these in components)
// ============================================

/**
 * Fetch rating summary
 * Automatically uses mock or real data based on configuration
 * 
 * @returns {Promise<Object>} Rating summary object
 */
export const fetchRatings = async () => {
    if (USE_MOCK_RATINGS) {
        return getMockRatingSummary();
    }
    return fetchRealRatingSummary();
};

/**
 * Submit a user rating
 * Automatically uses mock or real submission based on configuration
 * 
 * @param {number} rating - Rating value (1-5)
 * @param {string|null} userId - User ID (optional for mock)
 * @param {string} comment - Optional comment
 * @returns {Promise<Object>} Submission result
 */
export const submitRating = async (rating, userId = null, comment = '') => {
    // Validate rating
    if (rating < 1 || rating > 5) {
        return {
            success: false,
            message: 'Rating must be between 1 and 5',
        };
    }

    if (USE_MOCK_RATINGS) {
        return submitMockRating(rating, userId, comment);
    }
    return submitRealRating(rating, userId, comment);
};

/**
 * Get the current user's rating
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User rating info
 */
export const getUserRating = async (userId) => {
    if (USE_MOCK_RATINGS) {
        return getMockUserRating(userId);
    }
    return fetchRealUserRating(userId);
};

/**
 * Get reviews
 * 
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Reviews list
 */
export const getReviews = async (page = 1, limit = 10) => {
    if (USE_MOCK_RATINGS) {
        return getMockReviews(page, limit);
    }
    // TODO: Implement real reviews fetch
    return getMockReviews(page, limit);
};

/**
 * Check if mock mode is enabled
 * Useful for showing "Demo" badges in UI
 */
export const isMockMode = () => USE_MOCK_RATINGS;
