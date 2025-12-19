import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Skeleton,
  Alert,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  CompareArrows,
  Check,
  FilterList,
  Category,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { subscriptionAPI } from '../../services/api';
import { formatCurrency, getCategoryIcon } from '../../utils/helpers';

// Category-specific feature labels
const CATEGORY_FEATURES = {
  'Streaming': [
    { key: 'maxScreens', label: 'Max Screens' },
    { key: 'videoQuality', label: 'Video Quality' },
    { key: 'hasAds', label: 'Ad-Free' },
  ],
  'Music': [
    { key: 'maxDevices', label: 'Devices Allowed' },
    { key: 'videoQuality', label: 'Audio Quality' },
  ],
  'AI': [
    { key: 'extraFeatures', label: 'AI Capabilities' },
    { key: 'deviceTypes', label: 'Access Type' },
  ],
  'Productivity': [
    { key: 'extraFeatures', label: 'Features' },
    { key: 'maxDevices', label: 'Team Members' },
  ],
  'default': [
    { key: 'features', label: 'Features' },
    { key: 'maxDevices', label: 'Devices' },
  ],
};

// Category config for styling
const CATEGORY_CONFIG = {
  'AI': { displayName: 'AI & Machine Learning', color: '#9C27B0', gradient: 'linear-gradient(135deg, #9C27B0 0%, #673AB7 100%)' },
  'Streaming': { displayName: 'Entertainment & Streaming', color: '#E50914', gradient: 'linear-gradient(135deg, #E50914 0%, #B81D24 100%)' },
  'Music': { displayName: 'Music', color: '#1DB954', gradient: 'linear-gradient(135deg, #1DB954 0%, #1ED760 100%)' },
  'Productivity': { displayName: 'Workspace & Productivity', color: '#4285F4', gradient: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)' },
  'Storage': { displayName: 'Cloud Storage', color: '#FF6B00', gradient: 'linear-gradient(135deg, #FF6B00 0%, #FF9500 100%)' },
  'Gaming': { displayName: 'Gaming', color: '#00D166', gradient: 'linear-gradient(135deg, #00D166 0%, #00B87C 100%)' },
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
      const plans = response.data.data || [];
      setSubscriptionPlans(prev => ({ ...prev, [subscription.id]: plans }));
    } catch (error) {
      console.error('Error fetching plans:', error);
      setSubscriptionPlans(prev => ({ ...prev, [subscription.id]: [] }));
    } finally {
      setLoadingPlans(prev => ({ ...prev, [subscription.id]: false }));
    }
  };

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(availableSubscriptions.map((sub) => sub.category))];
    return cats.sort();
  }, [availableSubscriptions]);

  // Filter subscriptions by selected category
  const filteredSubscriptions = useMemo(() => {
    if (!selectedCategory) return availableSubscriptions;
    return availableSubscriptions.filter((sub) => sub.category === selectedCategory);
  }, [availableSubscriptions, selectedCategory]);

  // Handle category change
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setExpandedSubscriptions({});
    setSelectedPlans([]);
  };

  // Handle subscription expansion
  const handleSubscriptionClick = async (subscription) => {
    const isExpanded = expandedSubscriptions[subscription.id];

    if (!isExpanded) {
      await fetchPlansForSubscription(subscription);
    }

    setExpandedSubscriptions(prev => ({
      ...prev,
      [subscription.id]: !isExpanded,
    }));
  };

  // Handle plan selection
  const handlePlanSelect = (plan, subscription) => {
    setSelectedPlans(prev => {
      const exists = prev.find(p => p.id === plan.id);
      if (exists) {
        return prev.filter(p => p.id !== plan.id);
      }
      if (prev.length >= 6) return prev;
      return [...prev, {
        ...plan,
        subscriptionLogo: subscription.logoUrl,
        category: subscription.category
      }];
    });
  };

  const clearSelection = () => {
    setSelectedPlans([]);
  };

  // Get feature value
  const getFeatureValue = (plan, featureKey) => {
    if (featureKey === 'hasAds') {
      return plan.hasAds ? '📢 With Ads' : '✅ Ad-Free';
    }
    if (featureKey === 'features' && Array.isArray(plan.features)) {
      return plan.features.slice(0, 2).join(', ');
    }
    return plan[featureKey] || 'N/A';
  };

  // Chart data
  const priceChartData = selectedPlans.map((plan) => ({
    name: `${plan.subscriptionName}\n${plan.planName}`,
    'Monthly': plan.priceMonthly || 0,
    'Yearly': plan.priceYearly || 0,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ bgcolor: '#1a1a1a', p: 2, borderRadius: 2, boxShadow: 3, border: '1px solid #333' }}>
          <Typography fontWeight={600} color="#fff">{label}</Typography>
          {payload.map((entry, index) => (
            <Box key={index} sx={{ color: entry.color, mt: 0.5 }}>
              {entry.name}: {formatCurrency(entry.value)}
            </Box>
          ))}
        </Box>
      );
    }
    return null;
  };

  const currentCategory = selectedCategory || 'default';
  const featuresToDisplay = CATEGORY_FEATURES[currentCategory] || CATEGORY_FEATURES['default'];

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.1)' }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={6} sm={3} key={i}>
              <Skeleton variant="rounded" height={100} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ color: '#fff' }}>
            Compare Subscriptions
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Select a category, expand services to see plans, then compare them
          </Typography>
        </Box>
        {selectedPlans.length > 0 && (
          <Button
            variant="outlined"
            onClick={clearSelection}
            sx={{
              borderColor: '#E50914',
              color: '#E50914',
              '&:hover': { borderColor: '#ff4444', bgcolor: 'rgba(229,9,20,0.1)' }
            }}
          >
            Clear ({selectedPlans.length})
          </Button>
        )}
      </Box>

      {/* Step 1: Category Selection */}
      <Card sx={{ mb: 3, borderRadius: 3, bgcolor: '#1a1a1a', border: '1px solid #333' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Category sx={{ color: '#E50914' }} />
            <Typography variant="h6" fontWeight={600} sx={{ color: '#fff' }}>
              Step 1: Select Category
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {categories.map((cat) => {
              const config = CATEGORY_CONFIG[cat] || { displayName: cat, color: '#666' };
              const isSelected = selectedCategory === cat;
              const count = availableSubscriptions.filter(s => s.category === cat).length;

              return (
                <Grid item xs={6} sm={4} md={2} key={cat}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: isSelected ? `3px solid ${config.color}` : '1px solid #444',
                      borderRadius: 2,
                      bgcolor: isSelected ? `${config.color}20` : '#252525',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: config.color,
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 24px ${config.color}40`,
                        bgcolor: '#333',
                      },
                    }}
                    onClick={() => handleCategoryChange(cat)}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 2, px: 1 }}>
                      <Avatar sx={{ width: 44, height: 44, mx: 'auto', mb: 1, bgcolor: `${config.color}30`, color: config.color }}>
                        {getCategoryIcon(cat)}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#fff' }}>{cat}</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>{count} services</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>

      {/* Step 2: Service & Plan Selection */}
      {selectedCategory && (
        <Card sx={{ mb: 4, borderRadius: 3, bgcolor: '#1a1a1a', border: '1px solid #333' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <FilterList sx={{ color: '#E50914' }} />
              <Box>
                <Typography variant="h6" fontWeight={600} sx={{ color: '#fff' }}>
                  Step 2: Expand Services & Select Plans
                </Typography>
                <Chip
                  label={CATEGORY_CONFIG[selectedCategory]?.displayName || selectedCategory}
                  size="small"
                  sx={{
                    mt: 0.5,
                    bgcolor: `${CATEGORY_CONFIG[selectedCategory]?.color}30`,
                    color: CATEGORY_CONFIG[selectedCategory]?.color,
                    fontWeight: 600,
                  }}
                />
              </Box>
            </Box>

            <Alert
              severity="info"
              sx={{
                mb: 2,
                bgcolor: 'rgba(33, 150, 243, 0.1)',
                color: '#90CAF9',
                border: '1px solid rgba(33, 150, 243, 0.3)',
                '& .MuiAlert-icon': { color: '#90CAF9' }
              }}
            >
              💡 Click on a service to see all available plans, then click on plans to select them for comparison
            </Alert>

            {filteredSubscriptions.map((sub) => {
              const isExpanded = expandedSubscriptions[sub.id];
              const plans = subscriptionPlans[sub.id] || [];
              const isLoadingPlans = loadingPlans[sub.id];
              const catConfig = CATEGORY_CONFIG[sub.category] || { color: '#666' };

              return (
                <Box key={sub.id} sx={{ mb: 2 }}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: isExpanded ? `2px solid ${catConfig.color}` : '1px solid #444',
                      borderRadius: 2,
                      bgcolor: isExpanded ? `${catConfig.color}10` : '#252525',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: catConfig.color,
                        bgcolor: '#333',
                        transform: 'translateX(4px)',
                      },
                    }}
                    onClick={() => handleSubscriptionClick(sub)}
                  >
                    <CardContent sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={sub.logoUrl} sx={{ width: 48, height: 48, bgcolor: '#333' }}>
                          {getCategoryIcon(sub.category)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6" fontWeight={700} sx={{ color: '#fff' }}>{sub.name}</Typography>
                            <Chip
                              label={sub.category}
                              size="small"
                              sx={{
                                bgcolor: `${catConfig.color}30`,
                                color: catConfig.color,
                                fontWeight: 600,
                                fontSize: '0.7rem',
                              }}
                            />
                          </Box>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                            From {formatCurrency(sub.priceMonthly)}/mo • {plans.length || '...'} plans available
                          </Typography>
                        </Box>
                        <IconButton size="small" sx={{ color: '#fff' }}>
                          {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>

                  <Collapse in={isExpanded}>
                    <Box sx={{ pl: 4, pt: 1 }}>
                      {isLoadingPlans ? (
                        <Grid container spacing={2} sx={{ p: 2 }}>
                          {[1, 2, 3].map(i => (
                            <Grid item xs={12} sm={4} key={i}>
                              <Skeleton variant="rounded" height={140} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                            </Grid>
                          ))}
                        </Grid>
                      ) : plans.length > 0 ? (
                        <Grid container spacing={2} sx={{ p: 1 }}>
                          {plans.map((plan) => {
                            const isPlanSelected = selectedPlans.find(p => p.id === plan.id);

                            return (
                              <Grid item xs={12} sm={6} md={3} key={plan.id}>
                                <Card
                                  sx={{
                                    cursor: 'pointer',
                                    border: isPlanSelected ? '2px solid #E50914' : '1px solid #444',
                                    borderRadius: 2,
                                    bgcolor: isPlanSelected ? 'rgba(229, 9, 20, 0.15)' : '#2a2a2a',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                      borderColor: '#E50914',
                                      transform: 'translateY(-4px)',
                                      boxShadow: '0 8px 24px rgba(229,9,20,0.3)',
                                      bgcolor: '#333',
                                    },
                                  }}
                                  onClick={(e) => { e.stopPropagation(); handlePlanSelect(plan, sub); }}
                                >
                                  <CardContent sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                      <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#fff' }}>
                                        {plan.planName}
                                      </Typography>
                                      {isPlanSelected && <Check sx={{ color: '#E50914' }} fontSize="small" />}
                                    </Box>
                                    <Typography variant="h5" fontWeight={800} sx={{ color: '#E50914' }}>
                                      {formatCurrency(plan.priceMonthly)}
                                      <Typography component="span" variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>/mo</Typography>
                                    </Typography>
                                    <Box sx={{ mt: 1, fontSize: '0.75rem' }}>
                                      {plan.videoQuality && plan.videoQuality !== 'N/A' && (
                                        <Typography variant="caption" display="block" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                          📺 {plan.videoQuality}
                                        </Typography>
                                      )}
                                      {plan.maxScreens && (
                                        <Typography variant="caption" display="block" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                          📱 {plan.maxScreens} screens
                                        </Typography>
                                      )}
                                      {plan.hasAds !== null && (
                                        <Typography variant="caption" display="block" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                          {plan.hasAds ? '📢 With Ads' : '✅ Ad-free'}
                                        </Typography>
                                      )}
                                    </Box>
                                  </CardContent>
                                </Card>
                              </Grid>
                            );
                          })}
                        </Grid>
                      ) : (
                        <Alert
                          severity="info"
                          sx={{
                            m: 1,
                            bgcolor: 'rgba(33, 150, 243, 0.1)',
                            color: '#90CAF9',
                            border: '1px solid rgba(33, 150, 243, 0.3)',
                          }}
                        >
                          No specific plans found for this service
                        </Alert>
                      )}
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Comparison Results */}
      {selectedPlans.length >= 2 && (
        <>
          <Card sx={{ mb: 4, borderRadius: 3, bgcolor: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: '#fff' }}>
                💰 Price Comparison
              </Typography>
              <Box sx={{ height: 350 }}>
                <ResponsiveContainer>
                  <BarChart data={priceChartData} margin={{ top: 20, right: 30, left: 40, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="name" angle={-20} textAnchor="end" height={80} tick={{ fontSize: 11, fill: '#999' }} />
                    <YAxis tickFormatter={(value) => `₹${value.toLocaleString()}`} tick={{ fill: '#999' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ color: '#fff' }} />
                    <Bar dataKey="Monthly" fill="#E50914" radius={[4, 4, 0, 0]} barSize={40} />
                    <Bar dataKey="Yearly" fill="#B81D24" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, bgcolor: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: '#fff' }}>
                📊 Feature Comparison
              </Typography>
              <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'rgba(229, 9, 20, 0.15)' }}>
                      <TableCell sx={{ fontWeight: 700, width: '15%', color: '#fff', borderColor: '#444' }}>Feature</TableCell>
                      {selectedPlans.map((plan) => (
                        <TableCell key={plan.id} align="center" sx={{ borderColor: '#444' }}>
                          <Avatar src={plan.subscriptionLogo} sx={{ width: 28, height: 28, mx: 'auto', mb: 0.5 }} />
                          <Typography variant="caption" fontWeight={700} display="block" sx={{ color: '#fff' }}>
                            {plan.subscriptionName}
                          </Typography>
                          <Chip
                            label={plan.planName}
                            size="small"
                            sx={{
                              fontSize: '0.65rem',
                              bgcolor: 'rgba(229,9,20,0.3)',
                              color: '#E50914',
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: '#fff', borderColor: '#444' }}>Monthly Price</TableCell>
                      {selectedPlans.map((plan) => (
                        <TableCell key={plan.id} align="center" sx={{ borderColor: '#444' }}>
                          <Typography fontWeight={700} sx={{ color: '#E50914' }}>{formatCurrency(plan.priceMonthly)}</Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: '#fff', borderColor: '#444' }}>Yearly Price</TableCell>
                      {selectedPlans.map((plan) => (
                        <TableCell key={plan.id} align="center" sx={{ borderColor: '#444' }}>
                          <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>{formatCurrency(plan.priceYearly)}</Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                    {featuresToDisplay.map((feature) => (
                      <TableRow key={feature.key}>
                        <TableCell sx={{ fontWeight: 600, color: '#fff', borderColor: '#444' }}>{feature.label}</TableCell>
                        {selectedPlans.map((plan) => (
                          <TableCell key={plan.id} align="center" sx={{ borderColor: '#444' }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                              {getFeatureValue(plan, feature.key)}
                            </Typography>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      {selectedPlans.length < 2 && (
        <Card sx={{ borderRadius: 3, textAlign: 'center', py: 8, bgcolor: '#1a1a1a', border: '1px solid #333' }}>
          <CompareArrows sx={{ fontSize: 64, color: '#666', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)' }} gutterBottom>
            Select at least 2 plans to compare
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            {!selectedCategory
              ? 'Start by selecting a category above'
              : 'Click on services to expand and see their plans, then select plans to compare'}
          </Typography>
        </Card>
      )}
    </Box>
  );
};

export default Comparison;