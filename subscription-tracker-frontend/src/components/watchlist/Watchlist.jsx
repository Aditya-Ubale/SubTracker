/**
 * Wishlist - Premium SaaS Wishlist Page
 * 
 * Design Principles (Linear/Stripe/Vercel inspired):
 * - 8px grid system for consistent spacing
 * - Subtle shadows instead of heavy borders
 * - Calm, neutral dark theme
 * - Red accent used sparingly (primary actions only)
 * - Clear visual hierarchy and alignment
 * - No gradients, no glow effects
 * - Compact, elegant card design
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Chip,
  Skeleton,
  FormControlLabel,
  Switch,
  Tooltip,
  Collapse,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Add,
  Delete,
  TrendingDown,
  Notifications,
  ArrowForward,
  ExpandMore,
  ExpandLess,
  Close,
  Check,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { watchlistAPI, subscriptionAPI } from '../../services/api';
import { formatCurrency, getCategoryIcon } from '../../utils/helpers';
import SuccessPopup from '../common/SuccessPopup';

// Minimal category config - muted colors only
const CATEGORY_CONFIG = {
  'AI': { icon: '🤖', color: 'rgba(139, 92, 246, 0.6)' },
  'Streaming': { icon: '🎬', color: 'rgba(239, 68, 68, 0.6)' },
  'Music': { icon: '🎵', color: 'rgba(16, 185, 129, 0.6)' },
  'Productivity': { icon: '💼', color: 'rgba(59, 130, 246, 0.6)' },
  'Storage': { icon: '☁️', color: 'rgba(245, 158, 11, 0.6)' },
  'Gaming': { icon: '🎮', color: 'rgba(34, 197, 94, 0.6)' },
};

const Wishlist = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [availableSubscriptions, setAvailableSubscriptions] = useState([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [targetPrice, setTargetPrice] = useState('');
  const [notifyOnDrop, setNotifyOnDrop] = useState(true);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [addedSubscriptionName, setAddedSubscriptionName] = useState('');
  const [successType, setSuccessType] = useState('add');

  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedSubscriptions, setExpandedSubscriptions] = useState({});
  const [subscriptionPlans, setSubscriptionPlans] = useState({});
  const [loadingPlans, setLoadingPlans] = useState({});

  useEffect(() => {
    fetchWishlist();
    fetchAvailableSubscriptions();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await watchlistAPI.getWatchlist();
      setWishlist(response.data.data || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSubscriptions = async () => {
    try {
      const response = await subscriptionAPI.getAllAvailable();
      setAvailableSubscriptions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
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

  const categories = [...new Set(availableSubscriptions.map((sub) => sub.category))].sort();
  const filteredSubscriptions = selectedCategory
    ? availableSubscriptions.filter((sub) => sub.category === selectedCategory)
    : [];

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

  const handlePlanSelect = (plan, subscription) => {
    setSelectedPlan(plan);
    setSelectedSubscription(subscription);
    setTargetPrice(plan.priceMonthly?.toString() || '');
  };

  const handleAddToWishlist = async () => {
    if (!selectedSubscription) {
      toast.error('Please select a subscription');
      return;
    }

    try {
      await watchlistAPI.addToWatchlist({
        subscriptionId: selectedSubscription.id,
        planId: selectedPlan?.id || null,
        planName: selectedPlan?.planName || null,
        planPrice: selectedPlan?.priceMonthly || null,
        targetPrice: targetPrice ? parseFloat(targetPrice) : null,
        notifyOnPriceDrop: notifyOnDrop,
      });
      setAddedSubscriptionName(selectedSubscription.name + (selectedPlan ? ` (${selectedPlan.planName})` : ''));
      setSuccessType('add');
      setShowSuccessPopup(true);
      setAddDialogOpen(false);
      resetDialogState();
      fetchWishlist();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to wishlist');
    }
  };

  const resetDialogState = () => {
    setSelectedSubscription(null);
    setSelectedPlan(null);
    setTargetPrice('');
    setSelectedCategory('');
    setExpandedSubscriptions({});
  };

  const handleRemoveFromWishlist = async (id) => {
    try {
      await watchlistAPI.removeFromWatchlist(id);
      setAddedSubscriptionName('');
      setSuccessType('remove');
      setShowSuccessPopup(true);
      fetchWishlist();
    } catch (error) {
      toast.error('Failed to remove from wishlist');
    }
  };

  const handleBuyNow = (item) => {
    const price = item.planPrice || item.currentPriceMonthly || 0;
    let url = `/payment?subscriptionId=${item.subscriptionId}&price=${price}&type=MONTHLY`;
    if (item.planId) {
      url += `&planId=${item.planId}`;
    }
    navigate(url);
  };

  if (loading) {
    return (
      <Box>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="text" width={300} height={24} />
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rounded" height={160} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header - Clean, minimal */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                color: '#fff',
                letterSpacing: '-0.02em',
                mb: 0.5,
              }}
            >
              Wishlist
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} • Track prices and get alerts
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={<Add sx={{ fontSize: 18 }} />}
            onClick={() => setAddDialogOpen(true)}
            sx={{
              bgcolor: '#E50914',
              px: 2,
              py: 0.875,
              fontSize: '0.8125rem',
              fontWeight: 500,
              '&:hover': {
                bgcolor: '#C2070F',
              },
              '&:active': {
                transform: 'scale(0.98)',
              },
            }}
          >
            Add Item
          </Button>
        </Box>
      </Box>

      {/* Empty State */}
      {wishlist.length === 0 ? (
        <Card
          sx={{
            textAlign: 'center',
            py: 8,
            px: 4,
            borderRadius: 3,
            bgcolor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 2,
              bgcolor: 'rgba(255, 255, 255, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2.5,
            }}
          >
            <Typography sx={{ fontSize: 28 }}>💫</Typography>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#fff' }}>
            Your wishlist is empty
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 3, maxWidth: 320, mx: 'auto' }}>
            Add subscriptions you're interested in to track prices and get notified of drops.
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<Add sx={{ fontSize: 18 }} />}
            onClick={() => setAddDialogOpen(true)}
            sx={{
              bgcolor: '#E50914',
              px: 2.5,
              py: 1,
              '&:hover': { bgcolor: '#C2070F' },
            }}
          >
            Add Your First Item
          </Button>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {wishlist.map((item) => (
            <Grid item xs={12} sm={6} lg={4} key={item.id}>
              {/* Wishlist Card - Compact, elegant */}
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  bgcolor: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.035)',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  {/* Header Row - Logo left, content right */}
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Avatar
                      src={item.subscriptionLogo}
                      sx={{
                        width: 44,
                        height: 44,
                        bgcolor: 'rgba(255, 255, 255, 0.06)',
                        fontSize: '1.25rem',
                      }}
                    >
                      {getCategoryIcon(item.category)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 600,
                          color: '#fff',
                          lineHeight: 1.3,
                          mb: 0.25,
                        }}
                      >
                        {item.subscriptionName || 'Unknown'}
                      </Typography>
                      {item.planName && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.45)',
                            display: 'block',
                          }}
                        >
                          {item.planName}
                        </Typography>
                      )}
                    </Box>
                    <Tooltip title="Remove">
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveFromWishlist(item.id)}
                        sx={{
                          color: 'rgba(255, 255, 255, 0.35)',
                          width: 32,
                          height: 32,
                          '&:hover': {
                            color: '#ef4444',
                            bgcolor: 'rgba(239, 68, 68, 0.1)',
                          },
                        }}
                      >
                        <Delete sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* Price - Primary focus */}
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: '#fff',
                        letterSpacing: '-0.02em',
                        lineHeight: 1,
                      }}
                    >
                      {formatCurrency(item.planPrice || item.currentPriceMonthly)}
                      <Typography
                        component="span"
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 400,
                          color: 'rgba(255, 255, 255, 0.4)',
                          ml: 0.5,
                        }}
                      >
                        /mo
                      </Typography>
                    </Typography>
                  </Box>

                  {/* Secondary info - Muted */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2.5 }}>
                    {item.targetPrice && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TrendingDown sx={{ color: 'rgba(16, 185, 129, 0.7)', fontSize: 16 }} />
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          Target: {formatCurrency(item.targetPrice)}
                        </Typography>
                      </Box>
                    )}
                    {item.notifyOnPriceDrop && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Notifications sx={{ color: 'rgba(99, 102, 241, 0.7)', fontSize: 16 }} />
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          Alerts on
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Buy Button - Smaller, refined */}
                  <Button
                    fullWidth
                    size="small"
                    endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                    onClick={() => handleBuyNow(item)}
                    sx={{
                      bgcolor: 'rgba(229, 9, 20, 0.9)',
                      color: '#fff',
                      py: 1,
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      '&:hover': {
                        bgcolor: '#E50914',
                      },
                      '&:active': {
                        transform: 'scale(0.98)',
                      },
                    }}
                  >
                    Subscribe
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add to Wishlist Modal - Refined */}
      <Dialog
        open={addDialogOpen}
        onClose={() => { setAddDialogOpen(false); resetDialogState(); }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#141414',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            maxHeight: '85vh',
          },
        }}
      >
        {/* Modal Header */}
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            py: 2,
            px: 3,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Add to Wishlist
          </Typography>
          <IconButton
            size="small"
            onClick={() => { setAddDialogOpen(false); resetDialogState(); }}
            sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
          >
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {/* Step 1: Category Selection */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="overline"
              sx={{
                color: 'rgba(255, 255, 255, 0.4)',
                letterSpacing: '0.1em',
                fontSize: '0.65rem',
              }}
            >
              Step 1
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Choose a category
            </Typography>

            <Grid container spacing={1.5}>
              {categories.map((cat) => {
                const config = CATEGORY_CONFIG[cat] || { icon: '📦', color: 'rgba(156, 163, 175, 0.6)' };
                const isSelected = selectedCategory === cat;
                const count = availableSubscriptions.filter(s => s.category === cat).length;

                return (
                  <Grid item xs={6} sm={4} md={3} key={cat}>
                    <Box
                      onClick={() => {
                        setSelectedCategory(cat);
                        setExpandedSubscriptions({});
                        setSelectedPlan(null);
                        setSelectedSubscription(null);
                      }}
                      sx={{
                        cursor: 'pointer',
                        p: 2,
                        borderRadius: 2,
                        bgcolor: isSelected ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                        border: isSelected
                          ? '1px solid rgba(255, 255, 255, 0.15)'
                          : '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                        },
                      }}
                    >
                      <Typography sx={{ fontSize: 24, mb: 1 }}>{config.icon}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#fff', mb: 0.25 }}>
                        {cat}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                        {count} services
                      </Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Box>

          {/* Step 2: Service & Plan Selection */}
          {selectedCategory && (
            <Box>
              <Divider sx={{ mb: 3, borderColor: 'rgba(255, 255, 255, 0.06)' }} />

              <Typography
                variant="overline"
                sx={{
                  color: 'rgba(255, 255, 255, 0.4)',
                  letterSpacing: '0.1em',
                  fontSize: '0.65rem',
                }}
              >
                Step 2
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Select a service & plan
              </Typography>

              {filteredSubscriptions
                .filter((sub) => !wishlist.find((w) => w.subscriptionId === sub.id))
                .map((sub) => {
                  const isExpanded = expandedSubscriptions[sub.id];
                  const plans = subscriptionPlans[sub.id] || [];
                  const isLoadingPlans = loadingPlans[sub.id];
                  const isServiceSelected = selectedSubscription?.id === sub.id;

                  return (
                    <Box key={sub.id} sx={{ mb: 1.5 }}>
                      {/* Service Row */}
                      <Box
                        onClick={() => handleSubscriptionClick(sub)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: 2,
                          borderRadius: 2,
                          cursor: 'pointer',
                          bgcolor: isServiceSelected
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(255, 255, 255, 0.02)',
                          border: isServiceSelected
                            ? '1px solid rgba(255, 255, 255, 0.12)'
                            : '1px solid rgba(255, 255, 255, 0.05)',
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.04)',
                          },
                        }}
                      >
                        <Avatar
                          src={sub.logoUrl}
                          sx={{ width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.06)' }}
                        >
                          {getCategoryIcon(sub.category)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#fff' }}>
                            {sub.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                            From {formatCurrency(sub.priceMonthly)}/mo
                          </Typography>
                        </Box>
                        <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                          {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Box>

                      {/* Plans Dropdown */}
                      <Collapse in={isExpanded}>
                        <Box sx={{ pl: 2, pt: 1.5, pb: 0.5 }}>
                          {isLoadingPlans ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                              <CircularProgress size={20} sx={{ color: 'rgba(255,255,255,0.3)' }} />
                            </Box>
                          ) : plans.length > 0 ? (
                            <Grid container spacing={1.5}>
                              {plans.map((plan) => {
                                const isPlanSelected = selectedPlan?.id === plan.id;

                                return (
                                  <Grid item xs={6} sm={4} key={plan.id}>
                                    <Box
                                      onClick={(e) => { e.stopPropagation(); handlePlanSelect(plan, sub); }}
                                      sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        cursor: 'pointer',
                                        bgcolor: isPlanSelected
                                          ? 'rgba(229, 9, 20, 0.08)'
                                          : 'rgba(255, 255, 255, 0.02)',
                                        border: isPlanSelected
                                          ? '1px solid rgba(229, 9, 20, 0.3)'
                                          : '1px solid rgba(255, 255, 255, 0.05)',
                                        transition: 'all 0.15s ease',
                                        position: 'relative',
                                        '&:hover': {
                                          bgcolor: isPlanSelected
                                            ? 'rgba(229, 9, 20, 0.1)'
                                            : 'rgba(255, 255, 255, 0.04)',
                                          borderColor: isPlanSelected
                                            ? 'rgba(229, 9, 20, 0.4)'
                                            : 'rgba(255, 255, 255, 0.1)',
                                        },
                                      }}
                                    >
                                      {/* Selected indicator */}
                                      {isPlanSelected && (
                                        <Box
                                          sx={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            width: 18,
                                            height: 18,
                                            borderRadius: '50%',
                                            bgcolor: '#E50914',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                          }}
                                        >
                                          <Check sx={{ fontSize: 12, color: '#fff' }} />
                                        </Box>
                                      )}

                                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 0.5 }}>
                                        {plan.planName}
                                      </Typography>
                                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff', mb: 0.5 }}>
                                        {formatCurrency(plan.priceMonthly)}
                                        <Typography component="span" variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                                          /mo
                                        </Typography>
                                      </Typography>
                                      {plan.videoQuality && (
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block' }}>
                                          {plan.videoQuality}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Grid>
                                );
                              })}
                            </Grid>
                          ) : (
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', py: 1 }}>
                              No plans available. Using base pricing.
                            </Typography>
                          )}
                        </Box>
                      </Collapse>
                    </Box>
                  );
                })}
            </Box>
          )}

          {/* Selected Summary */}
          {selectedSubscription && (
            <>
              <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.06)' }} />

              <Box sx={{ p: 2.5, bgcolor: 'rgba(255, 255, 255, 0.02)', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#fff' }}>
                  {selectedSubscription.name} {selectedPlan ? `• ${selectedPlan.planName}` : ''}
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Target Price (Optional)"
                      type="number"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'rgba(255,255,255,0.02)',
                          '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifyOnDrop}
                          onChange={(e) => setNotifyOnDrop(e.target.checked)}
                          size="small"
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#E50914',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              bgcolor: 'rgba(229, 9, 20, 0.5)',
                            },
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          Notify on price drops
                        </Typography>
                      }
                    />
                  </Grid>
                </Grid>
              </Box>
            </>
          )}
        </DialogContent>

        {/* Modal Footer */}
        <DialogActions
          sx={{
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            px: 3,
            py: 2,
          }}
        >
          <Button
            onClick={() => { setAddDialogOpen(false); resetDialogState(); }}
            sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddToWishlist}
            disabled={!selectedSubscription}
            sx={{
              bgcolor: '#E50914',
              px: 2.5,
              '&:hover': { bgcolor: '#C2070F' },
              '&:disabled': {
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                color: 'rgba(255, 255, 255, 0.3)',
              },
            }}
          >
            Add to Wishlist
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Popup */}
      <SuccessPopup
        open={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title={successType === 'remove' ? 'Removed!' : 'Added!'}
        message={successType === 'remove'
          ? 'Item removed from wishlist.'
          : `${addedSubscriptionName} added to wishlist.`}
        icon={successType === 'remove' ? 'check' : 'heart'}
      />
    </Box>
  );
};

export default Wishlist;