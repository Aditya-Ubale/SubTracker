/**
 * Comparison - Premium Plan Comparison Tool
 * 
 * Design: Stripe/Linear inspired
 * - Simplified chart visuals
 * - Clean feature table with subtle dividers
 * - Muted colors for secondary data
 * - Better spacing and alignment
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
} from '@mui/material';
import {
  CompareArrows,
  Check,
  ExpandMore,
  ExpandLess,
  Close,
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

// Category icon mapping
const CATEGORY_ICONS = {
  'AI': '🤖',
  'Streaming': '🎬',
  'Music': '🎵',
  'Productivity': '💼',
  'Storage': '☁️',
  'Gaming': '🎮',
};

// Feature keys by category
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
    yearly: Math.round((plan.priceYearly || 0) / 12),
  }));

  // Custom tooltip
  const ChartTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
      <Box sx={{
        bgcolor: '#1a1a1a',
        p: 1.5,
        borderRadius: 1.5,
        border: '1px solid rgba(255,255,255,0.08)',
        minWidth: 120,
      }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff', mb: 0.5 }}>
          {data.service}
        </Typography>
        <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', mb: 1 }}>
          {data.name}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography sx={{ fontSize: '0.7rem', color: 'rgba(99, 102, 241, 0.9)' }}>
            Monthly: {formatCurrency(data.monthly)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography sx={{ fontSize: '0.7rem', color: 'rgba(99, 102, 241, 0.5)' }}>
            Yearly/mo: {formatCurrency(data.yearly)}
          </Typography>
        </Box>
      </Box>
    );
  };

  const featureKeys = CATEGORY_FEATURES[selectedCategory] || CATEGORY_FEATURES.default;

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={32} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={300} height={20} sx={{ mb: 3 }} />
        <Grid container spacing={1.5}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Grid item xs={4} sm={2} key={i}>
              <Skeleton variant="rounded" height={72} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>
          Compare
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8125rem' }}>
          Select up to 4 plans to compare features and pricing
        </Typography>
      </Box>

      {/* Category Selection */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', display: 'block', mb: 1.5 }}>
          CATEGORIES
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {categories.map(cat => {
            const isSelected = selectedCategory === cat;
            const count = availableSubscriptions.filter(s => s.category === cat).length;
            return (
              <Box
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  bgcolor: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isSelected ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  transition: 'all 0.15s ease',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                }}
              >
                <Typography sx={{ fontSize: '1rem' }}>{CATEGORY_ICONS[cat] || '📦'}</Typography>
                <Box>
                  <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#fff' }}>{cat}</Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>{count}</Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Selected Plans Bar */}
      {selectedPlans.length > 0 && (
        <Box sx={{
          mb: 3,
          p: 1.5,
          borderRadius: 2,
          bgcolor: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}>
          <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
            Selected ({selectedPlans.length}/4):
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flex: 1, flexWrap: 'wrap' }}>
            {selectedPlans.map(plan => (
              <Box
                key={plan.id}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: 'rgba(229, 9, 20, 0.1)',
                  border: '1px solid rgba(229, 9, 20, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Typography sx={{ fontSize: '0.75rem', color: '#fff' }}>
                  {plan.subscriptionName} · {plan.planName}
                </Typography>
                <Close
                  onClick={() => removePlan(plan.id)}
                  sx={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', '&:hover': { color: '#fff' } }}
                />
              </Box>
            ))}
          </Box>
          <Button
            size="small"
            onClick={() => setSelectedPlans([])}
            sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}
          >
            Clear
          </Button>
        </Box>
      )}

      {/* Services & Plans */}
      {selectedCategory && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', display: 'block', mb: 1.5 }}>
            SERVICES
          </Typography>

          {filteredSubscriptions.map(sub => {
            const isExpanded = expandedSubscriptions[sub.id];
            const plans = subscriptionPlans[sub.id] || [];
            const isLoadingPlans = loadingPlans[sub.id];

            return (
              <Box key={sub.id} sx={{ mb: 1 }}>
                <Box
                  onClick={() => handleSubscriptionClick(sub)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    bgcolor: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent',
                    border: `1px solid ${isExpanded ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
                    transition: 'all 0.1s ease',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                  }}
                >
                  <Avatar src={sub.logoUrl} sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.05)' }}>
                    {getCategoryIcon(sub.category)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#fff' }}>{sub.name}</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                      From {formatCurrency(sub.priceMonthly)}/mo
                    </Typography>
                  </Box>
                  <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.3)' }}>
                    {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                  </IconButton>
                </Box>

                <Collapse in={isExpanded}>
                  <Box sx={{ pl: 6, py: 1.5 }}>
                    {isLoadingPlans ? (
                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                        {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" width={140} height={80} sx={{ borderRadius: 1.5 }} />)}
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        {plans.map(plan => {
                          const isSelected = selectedPlans.find(p => p.id === plan.id);
                          return (
                            <Box
                              key={plan.id}
                              onClick={(e) => { e.stopPropagation(); handlePlanSelect(plan, sub); }}
                              sx={{
                                p: 1.5,
                                borderRadius: 1.5,
                                cursor: 'pointer',
                                minWidth: 140,
                                bgcolor: isSelected ? 'rgba(229,9,20,0.08)' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${isSelected ? 'rgba(229,9,20,0.25)' : 'rgba(255,255,255,0.05)'}`,
                                position: 'relative',
                                transition: 'all 0.1s ease',
                                '&:hover': {
                                  bgcolor: isSelected ? 'rgba(229,9,20,0.1)' : 'rgba(255,255,255,0.04)',
                                },
                              }}
                            >
                              {isSelected && (
                                <Box sx={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  width: 16,
                                  height: 16,
                                  borderRadius: '50%',
                                  bgcolor: '#E50914',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}>
                                  <Check sx={{ fontSize: 10, color: '#fff' }} />
                                </Box>
                              )}
                              <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', mb: 0.5 }}>
                                {plan.planName}
                              </Typography>
                              <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>
                                {formatCurrency(plan.priceMonthly)}
                                <Typography component="span" sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', ml: 0.25 }}>
                                  /mo
                                </Typography>
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Comparison Results */}
      {selectedPlans.length >= 2 ? (
        <Box>
          {/* Price Chart - Simplified */}
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', mb: 2 }}>
              PRICE COMPARISON
            </Typography>
            <Box sx={{
              p: 2.5,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}>
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={v => `₹${v}`}
                      width={50}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Bar dataKey="monthly" name="Monthly" fill="rgba(99, 102, 241, 0.8)" radius={[3, 3, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="yearly" name="Yearly/mo" fill="rgba(99, 102, 241, 0.35)" radius={[3, 3, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: 'rgba(99, 102, 241, 0.8)' }} />
                  <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Monthly</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: 'rgba(99, 102, 241, 0.35)' }} />
                  <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Yearly (per month)</Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Feature Table - Clean */}
          <Box>
            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', mb: 2 }}>
              FEATURES
            </Typography>
            <TableContainer sx={{
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      py: 1.5,
                      width: 100,
                    }}>
                      Plan
                    </TableCell>
                    {selectedPlans.map(plan => (
                      <TableCell
                        key={plan.id}
                        align="center"
                        sx={{
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          py: 1.5,
                        }}
                      >
                        <Avatar src={plan.subscriptionLogo} sx={{ width: 24, height: 24, mx: 'auto', mb: 0.5 }} />
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>
                          {plan.subscriptionName}
                        </Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
                          {plan.planName}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Price Row */}
                  <TableRow>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem', py: 1.5 }}>
                      Price
                    </TableCell>
                    {selectedPlans.map(plan => (
                      <TableCell key={plan.id} align="center" sx={{ borderBottom: '1px solid rgba(255,255,255,0.04)', py: 1.5 }}>
                        <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600, color: '#fff' }}>
                          {formatCurrency(plan.priceMonthly)}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Feature Rows */}
                  {featureKeys.map((key, idx) => (
                    <TableRow key={key}>
                      <TableCell sx={{
                        borderBottom: idx === featureKeys.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '0.8125rem',
                        py: 1.5,
                      }}>
                        {FEATURE_LABELS[key] || key}
                      </TableCell>
                      {selectedPlans.map(plan => (
                        <TableCell
                          key={plan.id}
                          align="center"
                          sx={{
                            borderBottom: idx === featureKeys.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                            py: 1.5,
                          }}
                        >
                          <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.8)' }}>
                            {getFeatureValue(plan, key)}
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      ) : (
        /* Empty State */
        <Box sx={{
          py: 8,
          textAlign: 'center',
          borderRadius: 2,
          bgcolor: 'rgba(255,255,255,0.01)',
          border: '1px solid rgba(255,255,255,0.04)',
        }}>
          <CompareArrows sx={{ fontSize: 32, color: 'rgba(255,255,255,0.15)', mb: 2 }} />
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)', mb: 0.5 }}>
            Select at least 2 plans
          </Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.35)' }}>
            {!selectedCategory ? 'Choose a category to get started' : 'Expand services and select plans'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Comparison;