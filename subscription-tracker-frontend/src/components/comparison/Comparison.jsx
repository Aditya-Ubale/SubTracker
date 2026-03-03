/**
 * Comparison - Premium Plan Comparison Tool (Redesigned)
 * 
 * DESIGN: Stripe / Linear / Vercel inspired
 * - Glassmorphism cards with hover animations
 * - Dynamic empty state with floating elements
 * - Premium category chips with glow effects
 * - Modern comparison table with sticky headers
 * - Consistent 8px spacing grid
 * - MUI v7 Grid2 API
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Collapse,
  IconButton,
  Chip,
} from '@mui/material';
import {
  CompareArrows,
  Check,
  ExpandMore,
  ExpandLess,
  Close,
  TrendingDown,
  AutoAwesome,
  SwapHoriz,
  ArrowForward,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { subscriptionAPI } from '../../services/api';
import { formatCurrency, getCategoryIcon } from '../../utils/helpers';
import { colors, shadows, borderRadius, transitions, typography } from '../../styles/theme';

// ============================================
// DESIGN TOKENS
// ============================================
const PAGE_MAX_WIDTH = 1300;
const SECTION_GAP = 4; // 32px
const CARD_PADDING = 3; // 24px
const CARD_RADIUS = borderRadius.xl; // 16px

const glassCard = {
  bgcolor: 'rgba(26, 26, 31, 0.7)',
  backdropFilter: 'blur(12px)',
  borderRadius: CARD_RADIUS,
  border: `1px solid ${colors.border.default}`,
  boxShadow: shadows.elevated,
  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'hidden',
};

// Category icon + color mapping
const CATEGORY_CONFIG = {
  'AI': { icon: '🤖', color: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.2)' },
  'Streaming': { icon: '🎬', color: '#EF4444', glow: 'rgba(239, 68, 68, 0.2)' },
  'Music': { icon: '🎵', color: '#22C55E', glow: 'rgba(34, 197, 94, 0.2)' },
  'Productivity': { icon: '💼', color: '#3B82F6', glow: 'rgba(59, 130, 246, 0.2)' },
  'Storage': { icon: '☁️', color: '#06B6D4', glow: 'rgba(6, 182, 212, 0.2)' },
  'Gaming': { icon: '🎮', color: '#F59E0B', glow: 'rgba(245, 158, 11, 0.2)' },
};

const CATEGORY_FEATURES = {
  'Streaming': ['maxScreens', 'videoQuality', 'hasAds'],
  'Music': ['maxDevices', 'videoQuality'],
  'AI': ['extraFeatures', 'deviceTypes'],
  'Productivity': ['extraFeatures', 'maxDevices'],
  'default': ['features', 'maxDevices'],
};

const FEATURE_LABELS = {
  maxScreens: 'Screens',
  videoQuality: 'Quality',
  hasAds: 'Ads',
  maxDevices: 'Devices',
  extraFeatures: 'Features',
  deviceTypes: 'Access',
  features: 'Features',
};

// ============================================
// FLOATING ELEMENT (for empty state animation)
// ============================================
const FloatingCard = ({ delay, x, y, size, opacity }) => (
  <Box
    sx={{
      position: 'absolute',
      left: x,
      top: y,
      width: size,
      height: size * 0.65,
      borderRadius: borderRadius.lg,
      bgcolor: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.04)',
      animation: `float ${4 + delay}s ease-in-out infinite`,
      animationDelay: `${delay}s`,
      opacity,
      '@keyframes float': {
        '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
        '50%': { transform: 'translateY(-12px) rotate(1deg)' },
      },
    }}
  />
);

// ============================================
// MAIN COMPONENT
// ============================================
const Comparison = () => {
  const [loading, setLoading] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState({});
  const [availableSubscriptions, setAvailableSubscriptions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedSubscriptions, setExpandedSubscriptions] = useState({});
  const [subscriptionPlans, setSubscriptionPlans] = useState({});
  const [selectedPlans, setSelectedPlans] = useState([]);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await subscriptionAPI.getAllAvailable();
      setAvailableSubscriptions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlansForSubscription = async (subscription) => {
    if (subscriptionPlans[subscription.id]) return;
    try {
      setLoadingPlans(prev => ({ ...prev, [subscription.id]: true }));
      const response = await subscriptionAPI.getPlansForSubscription(subscription.name);
      setSubscriptionPlans(prev => ({ ...prev, [subscription.id]: response.data.data || [] }));
    } catch (error) {
      setSubscriptionPlans(prev => ({ ...prev, [subscription.id]: [] }));
    } finally {
      setLoadingPlans(prev => ({ ...prev, [subscription.id]: false }));
    }
  };

  const categories = useMemo(() =>
    [...new Set(availableSubscriptions.map(s => s.category))].sort(),
    [availableSubscriptions]
  );

  const filteredSubscriptions = useMemo(() =>
    selectedCategory
      ? availableSubscriptions.filter(s => s.category === selectedCategory)
      : availableSubscriptions,
    [availableSubscriptions, selectedCategory]
  );

  const handleCategoryChange = (category) => {
    setSelectedCategory(category === selectedCategory ? '' : category);
    setExpandedSubscriptions({});
    setSelectedPlans([]);
  };

  const handleSubscriptionClick = async (subscription) => {
    const isExpanded = expandedSubscriptions[subscription.id];
    if (!isExpanded) await fetchPlansForSubscription(subscription);
    setExpandedSubscriptions(prev => ({ ...prev, [subscription.id]: !isExpanded }));
  };

  const handlePlanSelect = (plan, subscription) => {
    setSelectedPlans(prev => {
      const exists = prev.find(p => p.id === plan.id);
      if (exists) return prev.filter(p => p.id !== plan.id);
      if (prev.length >= 4) return prev;
      return [...prev, { ...plan, subscriptionLogo: subscription.logoUrl, category: subscription.category }];
    });
  };

  const removePlan = (planId) => {
    setSelectedPlans(prev => prev.filter(p => p.id !== planId));
  };

  const getFeatureValue = (plan, key) => {
    if (key === 'hasAds') return plan.hasAds ? 'Yes' : 'No';
    return plan[key] || '—';
  };

  // Chart data
  const chartData = selectedPlans.map(plan => ({
    name: plan.planName,
    service: plan.subscriptionName,
    monthly: plan.priceMonthly || 0,
    yearly: plan.priceYearly || 0,
  }));

  // Find cheapest plan
  const cheapestPlanId = selectedPlans.length >= 2
    ? selectedPlans.reduce((min, p) => (!min || (p.priceMonthly || 0) < (min.priceMonthly || 0) ? p : min), null)?.id
    : null;

  // Custom chart tooltip
  const ChartTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
      <Box sx={{
        ...glassCard,
        p: 2,
        minWidth: 180,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>
        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: colors.text.primary, mb: 0.5 }}>
          {data.service}
        </Typography>
        <Typography sx={{ fontSize: '0.6875rem', color: colors.text.dim, mb: 1.25, pb: 1, borderBottom: `1px solid ${colors.border.default}` }}>
          {data.name}
        </Typography>
        {payload.map((entry, index) => (
          <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 3, py: 0.375 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color }} />
              <Typography sx={{ color: colors.text.muted, fontSize: '0.75rem' }}>{entry.name}</Typography>
            </Box>
            <Typography sx={{ fontWeight: 600, color: colors.text.primary, fontSize: '0.8125rem', fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(entry.value)}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  const featureKeys = CATEGORY_FEATURES[selectedCategory] || CATEGORY_FEATURES.default;

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <Box sx={{ maxWidth: PAGE_MAX_WIDTH, mx: 'auto', px: { xs: 2, md: 3 } }}>
        <Box sx={{ mb: SECTION_GAP }}>
          <Skeleton variant="text" width={200} height={38} sx={{ bgcolor: colors.bg.cardHover, borderRadius: 1 }} />
          <Skeleton variant="text" width={320} height={22} sx={{ bgcolor: colors.bg.tertiary, mt: 0.5, borderRadius: 1 }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: SECTION_GAP, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} variant="rounded" width={140} height={52} sx={{ borderRadius: CARD_RADIUS, bgcolor: colors.bg.cardHover }} />
          ))}
        </Box>
        <Skeleton variant="rounded" height={300} sx={{ borderRadius: CARD_RADIUS, bgcolor: colors.bg.cardHover }} />
      </Box>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <Box sx={{ maxWidth: PAGE_MAX_WIDTH, mx: 'auto', px: { xs: 2, md: 3 } }}>

      {/* ============================================
          HEADER
      ============================================ */}
      <Box sx={{ mb: SECTION_GAP }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: borderRadius.lg,
              bgcolor: `${colors.accent.indigo}12`,
              border: `1px solid ${colors.accent.indigo}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CompareArrows sx={{ fontSize: 22, color: colors.accent.indigo }} />
          </Box>
          <Box>
            <Typography
              sx={{
                fontWeight: 700,
                color: colors.text.primary,
                fontSize: { xs: '1.5rem', md: '1.75rem' },
                letterSpacing: '-0.025em',
                lineHeight: 1.2,
              }}
            >
              Compare Plans
            </Typography>
          </Box>
        </Box>
        <Typography
          sx={{
            color: colors.text.muted,
            fontSize: '0.875rem',
            mt: 0.5,
            ml: 0.25,
          }}
        >
          Select up to 4 plans to compare features, pricing, and value side by side
        </Typography>
      </Box>

      {/* ============================================
          CATEGORY CHIPS (Premium pills)
      ============================================ */}
      <Box sx={{ mb: SECTION_GAP }}>
        <Typography
          sx={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: colors.text.dim,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            mb: 2,
          }}
        >
          Categories
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          {categories.map(cat => {
            const isSelected = selectedCategory === cat;
            const count = availableSubscriptions.filter(s => s.category === cat).length;
            const config = CATEGORY_CONFIG[cat] || { icon: '📦', color: colors.text.muted, glow: 'transparent' };
            return (
              <Box
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                sx={{
                  px: 2.5,
                  py: 1.25,
                  borderRadius: borderRadius.xl,
                  cursor: 'pointer',
                  bgcolor: isSelected ? `${config.color}15` : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${isSelected ? `${config.color}40` : colors.border.default}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? `0 0 20px ${config.glow}` : 'none',
                  '&:hover': {
                    bgcolor: isSelected ? `${config.color}18` : 'rgba(255, 255, 255, 0.04)',
                    borderColor: isSelected ? `${config.color}50` : colors.border.hover,
                    transform: 'translateY(-1px)',
                    boxShadow: isSelected
                      ? `0 4px 24px ${config.glow}`
                      : '0 2px 8px rgba(0,0,0,0.2)',
                    '& .cat-icon': {
                      transform: 'scale(1.15)',
                    },
                  },
                }}
              >
                <Typography
                  className="cat-icon"
                  sx={{
                    fontSize: '1.25rem',
                    transition: 'transform 0.2s ease',
                    lineHeight: 1,
                  }}
                >
                  {config.icon}
                </Typography>
                <Box>
                  <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: isSelected ? colors.text.primary : colors.text.secondary }}>
                    {cat}
                  </Typography>
                  <Typography sx={{ fontSize: '0.625rem', color: colors.text.dim, lineHeight: 1.2 }}>
                    {count} service{count !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* ============================================
          SELECTED PLANS BAR
      ============================================ */}
      {selectedPlans.length > 0 && (
        <Card sx={{ ...glassCard, mb: SECTION_GAP, '&:hover': { transform: 'none' } }}>
          <CardContent sx={{ px: CARD_PADDING, py: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                label={`${selectedPlans.length}/4 selected`}
                size="small"
                sx={{
                  bgcolor: `${colors.primary}18`,
                  color: colors.primary,
                  fontWeight: 600,
                  fontSize: '0.6875rem',
                  border: `1px solid ${colors.primary}30`,
                  height: 28,
                }}
              />
              <Box sx={{ display: 'flex', gap: 1, flex: 1, flexWrap: 'wrap' }}>
                {selectedPlans.map(plan => (
                  <Box
                    key={plan.id}
                    sx={{
                      px: 1.75,
                      py: 0.625,
                      borderRadius: borderRadius.full,
                      bgcolor: `${colors.primary}10`,
                      border: `1px solid ${colors.primary}25`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: `${colors.primary}18`,
                      },
                    }}
                  >
                    <Avatar src={plan.subscriptionLogo} sx={{ width: 18, height: 18, bgcolor: colors.bg.tertiary }} />
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: colors.text.primary }}>
                      {plan.subscriptionName}
                      <Typography component="span" sx={{ color: colors.text.dim, mx: 0.5 }}>·</Typography>
                      {plan.planName}
                    </Typography>
                    <Close
                      onClick={() => removePlan(plan.id)}
                      sx={{
                        fontSize: 14,
                        color: colors.text.dim,
                        cursor: 'pointer',
                        borderRadius: '50%',
                        transition: 'all 0.1s ease',
                        '&:hover': { color: colors.text.primary, bgcolor: 'rgba(255,255,255,0.08)' },
                      }}
                    />
                  </Box>
                ))}
              </Box>
              <Button
                size="small"
                onClick={() => setSelectedPlans([])}
                sx={{
                  fontSize: '0.75rem',
                  color: colors.text.muted,
                  textTransform: 'none',
                  borderRadius: borderRadius.md,
                  '&:hover': { color: colors.text.primary, bgcolor: 'rgba(255,255,255,0.04)' },
                }}
              >
                Clear all
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ============================================
          SERVICES & PLANS LIST
      ============================================ */}
      {selectedCategory && (
        <Box sx={{ mb: SECTION_GAP }}>
          <Typography
            sx={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: colors.text.dim,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              mb: 2,
            }}
          >
            {selectedCategory} Services
          </Typography>

          <Card sx={{ ...glassCard, '&:hover': { transform: 'none' } }}>
            {filteredSubscriptions.map((sub, subIdx) => {
              const isExpanded = expandedSubscriptions[sub.id];
              const plans = subscriptionPlans[sub.id] || [];
              const isLoadingPlan = loadingPlans[sub.id];
              const isLast = subIdx === filteredSubscriptions.length - 1;

              return (
                <Box key={sub.id}>
                  {/* Service row */}
                  <Box
                    onClick={() => handleSubscriptionClick(sub)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      px: CARD_PADDING,
                      py: 2,
                      cursor: 'pointer',
                      bgcolor: isExpanded ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                      borderBottom: !isLast || isExpanded ? `1px solid ${colors.border.divider}` : 'none',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.03)',
                      },
                    }}
                  >
                    <Avatar
                      src={sub.logoUrl}
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: colors.bg.tertiary,
                        border: `1px solid ${colors.border.default}`,
                        fontSize: '0.875rem',
                      }}
                    >
                      {getCategoryIcon(sub.category)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.text.primary }}>
                        {sub.name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: colors.text.dim }}>
                        From {formatCurrency(sub.priceMonthly)}/mo
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: borderRadius.md,
                        bgcolor: 'rgba(255, 255, 255, 0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    >
                      <ExpandMore sx={{ fontSize: 18, color: colors.text.dim }} />
                    </Box>
                  </Box>

                  {/* Plans (expanded) */}
                  <Collapse in={isExpanded}>
                    <Box sx={{
                      px: CARD_PADDING,
                      py: 2,
                      bgcolor: 'rgba(255, 255, 255, 0.01)',
                      borderBottom: !isLast ? `1px solid ${colors.border.divider}` : 'none',
                    }}>
                      {isLoadingPlan ? (
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" width={160} height={90} sx={{ borderRadius: borderRadius.lg, bgcolor: colors.bg.cardHover }} />)}
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                          {plans.map(plan => {
                            const isSelected = selectedPlans.find(p => p.id === plan.id);
                            return (
                              <Box
                                key={plan.id}
                                onClick={(e) => { e.stopPropagation(); handlePlanSelect(plan, sub); }}
                                sx={{
                                  p: 2,
                                  borderRadius: borderRadius.lg,
                                  cursor: 'pointer',
                                  minWidth: 160,
                                  bgcolor: isSelected ? `${colors.primary}10` : 'rgba(255, 255, 255, 0.02)',
                                  border: `1px solid ${isSelected ? `${colors.primary}35` : colors.border.default}`,
                                  position: 'relative',
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    bgcolor: isSelected ? `${colors.primary}15` : 'rgba(255, 255, 255, 0.04)',
                                    borderColor: isSelected ? `${colors.primary}50` : colors.border.hover,
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                                  },
                                }}
                              >
                                {isSelected && (
                                  <Box sx={{
                                    position: 'absolute',
                                    top: 10,
                                    right: 10,
                                    width: 20,
                                    height: 20,
                                    borderRadius: '50%',
                                    bgcolor: colors.primary,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: `0 0 10px ${colors.primary}40`,
                                  }}>
                                    <Check sx={{ fontSize: 12, color: '#fff' }} />
                                  </Box>
                                )}
                                <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted, mb: 0.75, fontWeight: 500 }}>
                                  {plan.planName}
                                </Typography>
                                <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: colors.text.primary, fontVariantNumeric: 'tabular-nums' }}>
                                  {formatCurrency(plan.priceMonthly)}
                                  <Typography component="span" sx={{ fontSize: '0.6875rem', color: colors.text.dim, ml: 0.5, fontWeight: 400 }}>
                                    /mo
                                  </Typography>
                                </Typography>
                                {plan.priceYearly > 0 && (
                                  <Typography sx={{ fontSize: '0.6875rem', color: colors.text.dim, mt: 0.5 }}>
                                    {formatCurrency(plan.priceYearly)}/yr
                                  </Typography>
                                )}
                              </Box>
                            );
                          })}
                          {plans.length === 0 && (
                            <Typography sx={{ fontSize: '0.8125rem', color: colors.text.dim, py: 2 }}>
                              No plans available for this service
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
          </Card>
        </Box>
      )}

      {/* ============================================
          COMPARISON RESULTS
      ============================================ */}
      {selectedPlans.length >= 2 ? (
        <Box sx={{ animation: 'fadeIn 0.4s ease', '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>

          {/* ---- Price Chart ---- */}
          <Box sx={{ mb: SECTION_GAP }}>
            <Typography
              sx={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: colors.text.dim,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                mb: 2,
              }}
            >
              Price Comparison
            </Typography>
            <Card sx={{ ...glassCard, '&:hover': { transform: 'none' } }}>
              <CardContent sx={{ p: CARD_PADDING }}>
                <Box sx={{ height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                      barGap={4}
                      barCategoryGap="25%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: colors.text.muted }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                        tickLine={false}
                        dy={8}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: colors.text.muted }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                        width={50}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                      <Bar dataKey="monthly" name="Monthly" fill={colors.accent.indigo} radius={[4, 4, 0, 0]} maxBarSize={48} />
                      <Bar dataKey="yearly" name="Yearly" fill="#A5B4FC" radius={[4, 4, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
                {/* Legend */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, pt: 2, borderTop: `1px solid ${colors.border.divider}`, mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: colors.accent.indigo }} />
                    <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted }}>Monthly</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#A5B4FC' }} />
                    <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted }}>Yearly</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* ---- Feature Comparison Table ---- */}
          <Box sx={{ mb: SECTION_GAP }}>
            <Typography
              sx={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: colors.text.dim,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                mb: 2,
              }}
            >
              Feature Comparison
            </Typography>
            <Card sx={{ ...glassCard, '&:hover': { transform: 'none' } }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          borderBottom: `1px solid ${colors.border.default}`,
                          color: colors.text.dim,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          py: 2.5,
                          px: CARD_PADDING,
                          width: 120,
                          bgcolor: 'rgba(255,255,255,0.01)',
                          position: 'sticky',
                          top: 0,
                          zIndex: 1,
                        }}
                      >
                        Feature
                      </TableCell>
                      {selectedPlans.map(plan => (
                        <TableCell
                          key={plan.id}
                          align="center"
                          sx={{
                            borderBottom: `1px solid ${colors.border.default}`,
                            py: 2.5,
                            px: 2,
                            bgcolor: plan.id === cheapestPlanId ? `${colors.accent.green}08` : 'rgba(255,255,255,0.01)',
                            position: 'sticky',
                            top: 0,
                            zIndex: 1,
                          }}
                        >
                          <Avatar src={plan.subscriptionLogo} sx={{ width: 28, height: 28, mx: 'auto', mb: 0.75, border: `1px solid ${colors.border.default}` }} />
                          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: colors.text.primary }}>
                            {plan.subscriptionName}
                          </Typography>
                          <Typography sx={{ fontSize: '0.6875rem', color: colors.text.dim }}>
                            {plan.planName}
                          </Typography>
                          {plan.id === cheapestPlanId && (
                            <Chip
                              icon={<TrendingDown sx={{ fontSize: 12 }} />}
                              label="Best Value"
                              size="small"
                              sx={{
                                mt: 0.75,
                                height: 22,
                                fontSize: '0.625rem',
                                fontWeight: 600,
                                color: colors.accent.green,
                                bgcolor: `${colors.accent.green}15`,
                                border: `1px solid ${colors.accent.green}30`,
                                '& .MuiChip-icon': { color: colors.accent.green },
                                '& .MuiChip-label': { px: 0.75 },
                              }}
                            />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Price Row */}
                    <TableRow>
                      <TableCell sx={{
                        borderBottom: `1px solid ${colors.border.divider}`,
                        color: colors.text.secondary,
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        py: 2,
                        px: CARD_PADDING,
                      }}>
                        Monthly Price
                      </TableCell>
                      {selectedPlans.map(plan => (
                        <TableCell
                          key={plan.id}
                          align="center"
                          sx={{
                            borderBottom: `1px solid ${colors.border.divider}`,
                            py: 2,
                            bgcolor: plan.id === cheapestPlanId ? `${colors.accent.green}05` : 'transparent',
                          }}
                        >
                          <Typography sx={{
                            fontSize: '1.125rem',
                            fontWeight: 700,
                            color: plan.id === cheapestPlanId ? colors.accent.green : colors.text.primary,
                            fontVariantNumeric: 'tabular-nums',
                          }}>
                            {formatCurrency(plan.priceMonthly)}
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Feature Rows */}
                    {featureKeys.map((key, idx) => (
                      <TableRow key={key}>
                        <TableCell sx={{
                          borderBottom: idx === featureKeys.length - 1 ? 'none' : `1px solid ${colors.border.divider}`,
                          color: colors.text.secondary,
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          py: 2,
                          px: CARD_PADDING,
                        }}>
                          {FEATURE_LABELS[key] || key}
                        </TableCell>
                        {selectedPlans.map(plan => (
                          <TableCell
                            key={plan.id}
                            align="center"
                            sx={{
                              borderBottom: idx === featureKeys.length - 1 ? 'none' : `1px solid ${colors.border.divider}`,
                              py: 2,
                              bgcolor: plan.id === cheapestPlanId ? `${colors.accent.green}05` : 'transparent',
                            }}
                          >
                            <Typography sx={{
                              fontSize: '0.8125rem',
                              color: colors.text.primary,
                              maxWidth: 200,
                              mx: 'auto',
                              lineHeight: 1.5,
                            }}>
                              {getFeatureValue(plan, key)}
                            </Typography>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Box>
        </Box>
      ) : (
        /* ============================================
           EMPTY STATE (Premium, animated)
        ============================================ */
        <Card
          sx={{
            ...glassCard,
            position: 'relative',
            overflow: 'hidden',
            '&:hover': { transform: 'none' },
          }}
        >
          <CardContent sx={{ py: { xs: 8, md: 10 }, px: CARD_PADDING, textAlign: 'center', position: 'relative', zIndex: 1 }}>
            {/* Floating background elements */}
            <FloatingCard delay={0} x="8%" y="15%" size={100} opacity={0.6} />
            <FloatingCard delay={1.2} x="75%" y="10%" size={80} opacity={0.4} />
            <FloatingCard delay={0.6} x="85%" y="65%" size={60} opacity={0.3} />
            <FloatingCard delay={1.8} x="5%" y="70%" size={70} opacity={0.35} />

            {/* Icon */}
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: borderRadius['2xl'],
                bgcolor: `${colors.accent.indigo}10`,
                border: `1px solid ${colors.accent.indigo}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                animation: 'pulse 3s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { boxShadow: `0 0 0 0 ${colors.accent.indigo}20` },
                  '50%': { boxShadow: `0 0 0 12px ${colors.accent.indigo}00` },
                },
              }}
            >
              <SwapHoriz sx={{ fontSize: 32, color: colors.accent.indigo }} />
            </Box>

            {/* Heading */}
            <Typography
              sx={{
                fontSize: '1.375rem',
                fontWeight: 700,
                color: colors.text.primary,
                mb: 1,
                letterSpacing: '-0.01em',
              }}
            >
              Start comparing smarter
            </Typography>

            {/* Description */}
            <Typography
              sx={{
                fontSize: '0.9375rem',
                color: colors.text.muted,
                maxWidth: 380,
                mx: 'auto',
                mb: 0.75,
                lineHeight: 1.6,
              }}
            >
              {!selectedCategory
                ? 'Choose a category above, then select 2–4 plans to see a detailed feature and pricing comparison'
                : 'Expand a service and pick 2–4 plans to compare them side by side'}
            </Typography>

            {/* Steps indicator */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 4 }}>
              {[
                { step: '1', label: 'Pick a category', done: !!selectedCategory },
                { step: '2', label: 'Select plans', done: selectedPlans.length >= 2 },
                { step: '3', label: 'Compare', done: false },
              ].map((item, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: item.done ? `${colors.accent.green}15` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${item.done ? `${colors.accent.green}40` : colors.border.default}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      color: item.done ? colors.accent.green : colors.text.dim,
                    }}
                  >
                    {item.done ? <Check sx={{ fontSize: 14 }} /> : item.step}
                  </Box>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: item.done ? colors.text.secondary : colors.text.dim }}>
                    {item.label}
                  </Typography>
                  {idx < 2 && (
                    <ArrowForward sx={{ fontSize: 12, color: colors.text.dim, ml: 1 }} />
                  )}
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Comparison;