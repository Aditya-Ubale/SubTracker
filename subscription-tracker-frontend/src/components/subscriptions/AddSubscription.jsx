import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Avatar,
  Chip,
  Switch,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Skeleton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Check,
  NotificationsActive,
  Category,
  Subscriptions,
  PriceCheck,
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { toast } from 'react-toastify';
import { subscriptionAPI } from '../../services/api';
import { formatCurrency, getCategoryIcon } from '../../utils/helpers';
import SuccessPopup from '../common/SuccessPopup';

const MIN_DATE = new Date(2000, 0, 1);
const steps = ['Select Category', 'Choose Service', 'Select Plan', 'Configure & Confirm'];

const CATEGORY_CONFIG = {
  'AI': { displayName: 'AI & Machine Learning', color: '#9C27B0' },
  'Streaming': { displayName: 'Entertainment & Streaming', color: '#E50914' },
  'Music': { displayName: 'Music', color: '#1DB954' },
  'Productivity': { displayName: 'Workspace & Productivity', color: '#4285F4' },
  'Storage': { displayName: 'Cloud Storage', color: '#FF6B00' },
  'Gaming': { displayName: 'Gaming', color: '#00D166' },
};

const AddSubscription = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [availableSubscriptions, setAvailableSubscriptions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Duplicate subscription dialog state
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [existingSubscriptionInfo, setExistingSubscriptionInfo] = useState(null);

  const [formData, setFormData] = useState({
    subscriptionId: null,
    planId: null,
    subscriptionType: 'MONTHLY',
    customPrice: '',
    startDate: new Date(),
    renewalDate: null,
    autoRenew: true,
    reminderDaysBefore: 7,
    notes: '',
  });

  useEffect(() => {
    fetchAvailableSubscriptions();
  }, []);

  useEffect(() => {
    if (formData.startDate) {
      const startDate = new Date(formData.startDate);
      const renewalDate = new Date(startDate);
      if (formData.subscriptionType === 'YEARLY') {
        renewalDate.setFullYear(renewalDate.getFullYear() + 1);
      } else {
        renewalDate.setMonth(renewalDate.getMonth() + 1);
      }
      setFormData((prev) => ({ ...prev, renewalDate }));
    }
  }, [formData.startDate, formData.subscriptionType]);

  const fetchAvailableSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await subscriptionAPI.getAllAvailable();
      setAvailableSubscriptions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to load available subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlansForSubscription = async (subscriptionName) => {
    try {
      setLoadingPlans(true);
      const response = await subscriptionAPI.getPlansForSubscription(subscriptionName);
      const plans = response.data.data || [];
      setSubscriptionPlans(plans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setSubscriptionPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  const categories = useMemo(() => {
    const cats = [...new Set(availableSubscriptions.map((sub) => sub.category))];
    return cats.sort();
  }, [availableSubscriptions]);

  const filteredSubscriptions = useMemo(() => {
    if (!selectedCategory) return [];
    return availableSubscriptions.filter((sub) => sub.category === selectedCategory);
  }, [availableSubscriptions, selectedCategory]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSelectedSubscription(null);
    setSelectedPlan(null);
    setSubscriptionPlans([]);
  };

  const handleSubscriptionSelect = async (subscription) => {
    setSelectedSubscription(subscription);
    setSelectedPlan(null);
    setFormData((prev) => ({
      ...prev,
      subscriptionId: subscription.id,
      customPrice: subscription.priceMonthly,
    }));
    await fetchPlansForSubscription(subscription.name);
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setFormData((prev) => ({
      ...prev,
      planId: plan.id,
      customPrice: plan.priceMonthly,
    }));
  };

  const handleNext = () => {
    if (activeStep === 0 && !selectedCategory) {
      toast.error('Please select a category');
      return;
    }
    if (activeStep === 1 && !selectedSubscription) {
      toast.error('Please select a subscription');
      return;
    }
    if (activeStep === 2 && subscriptionPlans.length > 0 && !selectedPlan) {
      toast.error('Please select a plan');
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async (forceAdd = false, continueFromExisting = false) => {
    try {
      setLoading(true);
      const payload = {
        subscriptionId: formData.subscriptionId,
        planId: selectedPlan?.id || null,
        subscriptionType: formData.subscriptionType,
        customPrice: formData.customPrice ? parseFloat(formData.customPrice) : null,
        startDate: formData.startDate?.toISOString().split('T')[0],
        renewalDate: formData.renewalDate?.toISOString().split('T')[0],
        autoRenew: formData.autoRenew,
        reminderDaysBefore: formData.reminderDaysBefore,
        notes: formData.notes,
        forceAdd: forceAdd,
        continueFromExisting: continueFromExisting,
      };
      await subscriptionAPI.addSubscription(payload);
      setShowDuplicateDialog(false);
      setShowSuccessPopup(true);
    } catch (error) {
      console.error('Error adding subscription:', error);
      const errorMessage = error.response?.data?.message || '';

      // Check if this is a duplicate subscription error
      if (errorMessage.startsWith('DUPLICATE_SUBSCRIPTION:')) {
        const parts = errorMessage.split(':');
        const existingId = parts[1];
        const renewalDate = parts[2];
        const subscriptionType = parts[3];

        setExistingSubscriptionInfo({
          id: existingId,
          renewalDate: renewalDate,
          subscriptionType: subscriptionType,
        });
        setShowDuplicateDialog(true);
      } else {
        toast.error(errorMessage || 'Failed to add subscription');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle duplicate subscription choice
  const handleDuplicateChoice = (choice) => {
    if (choice === 'continue') {
      // Continue from existing subscription's renewal date
      handleSubmit(true, true);
    } else if (choice === 'new') {
      // Add with a new start date (current formData.startDate)
      handleSubmit(true, false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessPopup(false);
    navigate('/subscriptions');
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Category sx={{ fontSize: 32, color: '#E50914' }} />
              <Typography variant="h6" fontWeight={600} sx={{ color: '#fff' }}>Select a Category</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
              Choose the type of subscription service you want to add
            </Typography>
            <Grid container spacing={2}>
              {categories.map((cat) => {
                const config = CATEGORY_CONFIG[cat] || { displayName: cat, color: '#666' };
                const count = availableSubscriptions.filter(s => s.category === cat).length;
                const isSelected = selectedCategory === cat;

                return (
                  <Grid item xs={12} sm={6} md={4} key={cat}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        borderRadius: 3,
                        border: isSelected ? `3px solid ${config.color}` : '1px solid #444',
                        bgcolor: isSelected ? `${config.color}20` : '#252525',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: config.color,
                          transform: 'translateY(-4px)',
                          boxShadow: `0 8px 24px ${config.color}40`,
                          bgcolor: '#333',
                        },
                      }}
                      onClick={() => handleCategorySelect(cat)}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ width: 56, height: 56, bgcolor: `${config.color}30`, color: config.color }}>
                              {getCategoryIcon(cat)}
                            </Avatar>
                            <Box>
                              <Typography variant="h6" fontWeight={700} sx={{ color: '#fff' }}>{config.displayName}</Typography>
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                {count} service{count > 1 ? 's' : ''} available
                              </Typography>
                            </Box>
                          </Box>
                          {isSelected && (
                            <Box sx={{ bgcolor: config.color, borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Check sx={{ color: 'white', fontSize: 20 }} />
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Subscriptions sx={{ fontSize: 32, color: '#E50914' }} />
              <Box>
                <Typography variant="h6" fontWeight={600} sx={{ color: '#fff' }}>Choose a Service</Typography>
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
            <Grid container spacing={2}>
              {filteredSubscriptions.map((sub) => {
                const isSelected = selectedSubscription?.id === sub.id;
                const catConfig = CATEGORY_CONFIG[sub.category] || { color: '#666' };
                return (
                  <Grid item xs={12} sm={6} md={4} key={sub.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        borderRadius: 3,
                        border: isSelected ? '3px solid #E50914' : '1px solid #444',
                        bgcolor: isSelected ? 'rgba(229,9,20,0.15)' : '#252525',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: '#E50914',
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 24px rgba(229, 9, 20, 0.3)',
                          bgcolor: '#333',
                        },
                      }}
                      onClick={() => handleSubscriptionSelect(sub)}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Avatar src={sub.logoUrl} sx={{ width: 56, height: 56, bgcolor: '#333' }}>
                            {getCategoryIcon(sub.category)}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="h6" fontWeight={700} sx={{ color: '#fff' }}>{sub.name}</Typography>
                              {isSelected && <Check sx={{ color: '#E50914', fontSize: 24 }} />}
                            </Box>
                            <Chip
                              label={sub.category}
                              size="small"
                              sx={{
                                mt: 0.5,
                                bgcolor: `${catConfig.color}30`,
                                color: catConfig.color,
                                fontWeight: 600,
                                fontSize: '0.7rem',
                              }}
                            />
                          </Box>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
                          {sub.description?.slice(0, 60)}...
                        </Typography>
                        <Divider sx={{ my: 2, borderColor: '#444' }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Starting from</Typography>
                          <Typography variant="h6" fontWeight={700} sx={{ color: '#E50914' }}>
                            {formatCurrency(sub.priceMonthly)}/mo
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <PriceCheck sx={{ fontSize: 32, color: '#E50914' }} />
              <Box>
                <Typography variant="h6" fontWeight={600} sx={{ color: '#fff' }}>Select a Plan</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Avatar src={selectedSubscription?.logoUrl} sx={{ width: 24, height: 24 }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>{selectedSubscription?.name}</Typography>
                  <Chip
                    label={selectedCategory}
                    size="small"
                    sx={{
                      bgcolor: `${CATEGORY_CONFIG[selectedCategory]?.color}30`,
                      color: CATEGORY_CONFIG[selectedCategory]?.color,
                      fontWeight: 600,
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {loadingPlans ? (
              <Grid container spacing={2}>
                {[1, 2, 3, 4].map((i) => (
                  <Grid item xs={12} sm={6} md={3} key={i}>
                    <Skeleton variant="rounded" height={220} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                  </Grid>
                ))}
              </Grid>
            ) : subscriptionPlans.length > 0 ? (
              <Grid container spacing={2}>
                {subscriptionPlans.map((plan) => {
                  const isSelected = selectedPlan?.id === plan.id;
                  return (
                    <Grid item xs={12} sm={6} md={3} key={plan.id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 3,
                          border: isSelected ? '3px solid #E50914' : '1px solid #444',
                          bgcolor: isSelected ? 'rgba(229,9,20,0.15)' : '#252525',
                          transition: 'all 0.3s ease',
                          height: '100%',
                          '&:hover': {
                            borderColor: '#E50914',
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 24px rgba(229, 9, 20, 0.3)',
                            bgcolor: '#333',
                          },
                        }}
                        onClick={() => handlePlanSelect(plan)}
                      >
                        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Typography variant="h6" fontWeight={700} sx={{ color: '#fff' }}>{plan.planName}</Typography>
                            {isSelected && <Check sx={{ color: '#E50914' }} />}
                          </Box>

                          <Typography variant="h4" fontWeight={800} sx={{ color: '#E50914', mb: 1 }}>
                            {formatCurrency(plan.priceMonthly)}
                            <Typography component="span" variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>/mo</Typography>
                          </Typography>

                          {plan.priceYearly > 0 && (
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
                              {formatCurrency(plan.priceYearly)}/year
                            </Typography>
                          )}

                          <Divider sx={{ my: 2, borderColor: '#444' }} />

                          <Box sx={{ flex: 1 }}>
                            {plan.videoQuality && plan.videoQuality !== 'N/A' && (
                              <Typography variant="body2" sx={{ mb: 1, color: 'rgba(255,255,255,0.8)' }}>📺 {plan.videoQuality}</Typography>
                            )}
                            {plan.maxScreens && (
                              <Typography variant="body2" sx={{ mb: 1, color: 'rgba(255,255,255,0.8)' }}>📱 {plan.maxScreens} screen{plan.maxScreens > 1 ? 's' : ''}</Typography>
                            )}
                            {plan.hasAds !== null && (
                              <Typography variant="body2" sx={{ mb: 1, color: 'rgba(255,255,255,0.8)' }}>
                                {plan.hasAds ? '📢 With Ads' : '✅ Ad-free'}
                              </Typography>
                            )}
                            {plan.deviceTypes && plan.deviceTypes !== 'N/A' && (
                              <Typography variant="body2" sx={{ mb: 1, color: 'rgba(255,255,255,0.8)' }}>💻 {plan.deviceTypes}</Typography>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'rgba(229, 9, 20, 0.1)', borderRadius: 3, border: '1px solid rgba(229,9,20,0.3)' }}>
                <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)' }} gutterBottom>
                  No specific plans found
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  Using default pricing: {formatCurrency(selectedSubscription?.priceMonthly)}/month
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{
                    mt: 2,
                    bgcolor: '#E50914',
                    '&:hover': { bgcolor: '#B81D24' }
                  }}
                >
                  Continue with Default
                </Button>
              </Paper>
            )}
          </Box>
        );

      case 3:
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box>
              <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: '#fff' }}>Configure your subscription</Typography>

              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  bgcolor: 'rgba(229, 9, 20, 0.1)',
                  borderRadius: 3,
                  border: '1px solid rgba(229, 9, 20, 0.3)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar src={selectedSubscription?.logoUrl} sx={{ width: 60, height: 60, bgcolor: '#333' }}>
                    {getCategoryIcon(selectedSubscription?.category)}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ color: '#fff' }}>{selectedSubscription?.name}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      <Chip
                        label={selectedCategory}
                        size="small"
                        sx={{
                          bgcolor: `${CATEGORY_CONFIG[selectedCategory]?.color}30`,
                          color: CATEGORY_CONFIG[selectedCategory]?.color,
                        }}
                      />
                      {selectedPlan && (
                        <Chip
                          label={selectedPlan.planName}
                          size="small"
                          sx={{ bgcolor: 'rgba(229,9,20,0.3)', color: '#E50914' }}
                        />
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                    <Typography variant="h4" fontWeight={800} sx={{ color: '#E50914' }}>
                      {formatCurrency(selectedPlan?.priceMonthly || selectedSubscription?.priceMonthly)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>per month</Typography>
                  </Box>
                </Box>
              </Paper>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Billing Cycle</InputLabel>
                    <Select
                      value={formData.subscriptionType}
                      label="Billing Cycle"
                      onChange={(e) => setFormData((prev) => ({
                        ...prev,
                        subscriptionType: e.target.value,
                        customPrice: e.target.value === 'YEARLY'
                          ? (selectedPlan?.priceYearly || selectedSubscription?.priceYearly)
                          : (selectedPlan?.priceMonthly || selectedSubscription?.priceMonthly),
                      }))}
                      sx={{
                        color: '#fff',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#E50914' },
                      }}
                    >
                      <MenuItem value="MONTHLY">Monthly</MenuItem>
                      <MenuItem value="YEARLY">Yearly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Custom Price (Optional)"
                    type="number"
                    value={formData.customPrice}
                    onChange={(e) => setFormData((prev) => ({ ...prev, customPrice: e.target.value }))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start" sx={{ color: 'rgba(255,255,255,0.7)' }}>₹</InputAdornment>
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        '& fieldset': { borderColor: '#444' },
                        '&:hover fieldset': { borderColor: '#E50914' },
                      },
                      '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Start Date"
                    value={formData.startDate}
                    minDate={MIN_DATE}
                    onChange={(date) => setFormData((prev) => ({ ...prev, startDate: date }))}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            color: '#fff',
                            '& fieldset': { borderColor: '#444' },
                            '&:hover fieldset': { borderColor: '#E50914' },
                          },
                          '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                        }
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Renewal Date"
                    value={formData.renewalDate}
                    minDate={MIN_DATE}
                    onChange={(date) => setFormData((prev) => ({ ...prev, renewalDate: date }))}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            color: '#fff',
                            '& fieldset': { borderColor: '#444' },
                            '&:hover fieldset': { borderColor: '#E50914' },
                          },
                          '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                        }
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: 'rgba(102, 126, 234, 0.1)',
                      borderRadius: 2,
                      border: '1px solid rgba(102, 126, 234, 0.3)'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <NotificationsActive sx={{ color: '#90CAF9', fontSize: 32 }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#90CAF9' }}>
                          Remind me before renewal
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                          Get notified before your renewal date
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          type="number"
                          value={formData.reminderDaysBefore}
                          onChange={(e) => setFormData((prev) => ({ ...prev, reminderDaysBefore: parseInt(e.target.value) || 7 }))}
                          inputProps={{ min: 1, max: 30, style: { textAlign: 'center', color: '#fff' } }}
                          sx={{
                            width: 80,
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': { borderColor: '#444' },
                              '&:hover fieldset': { borderColor: '#90CAF9' },
                            },
                          }}
                          size="small"
                        />
                        <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#fff' }}>days</Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.autoRenew}
                        onChange={(e) => setFormData((prev) => ({ ...prev, autoRenew: e.target.checked }))}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: '#E50914' },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#E50914' },
                        }}
                      />
                    }
                    label={<Typography sx={{ color: '#fff' }}>Auto Renew</Typography>}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes (Optional)"
                    multiline
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional notes..."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        '& fieldset': { borderColor: '#444' },
                        '&:hover fieldset': { borderColor: '#E50914' },
                      },
                      '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </LocalizationProvider>
        );

      default:
        return null;
    }
  };

  if (loading && availableSubscriptions.length === 0) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.1)' }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={150} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/subscriptions')}
          sx={{ mr: 2, color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
        >
          Back
        </Button>
        <Typography variant="h4" fontWeight={700} sx={{ color: '#fff' }}>Add Subscription</Typography>
      </Box>

      <Stepper
        activeStep={activeStep}
        sx={{
          mb: 4,
          '& .MuiStepLabel-label': { color: 'rgba(255,255,255,0.7)' },
          '& .MuiStepLabel-label.Mui-active': { color: '#E50914' },
          '& .MuiStepLabel-label.Mui-completed': { color: '#4caf50' },
          '& .MuiStepIcon-root': { color: '#444' },
          '& .MuiStepIcon-root.Mui-active': { color: '#E50914' },
          '& .MuiStepIcon-root.Mui-completed': { color: '#4caf50' },
        }}
      >
        {steps.map((label) => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>

      <Card sx={{ borderRadius: 3, bgcolor: '#1a1a1a', border: '1px solid #333' }}>
        <CardContent sx={{ p: 4 }}>
          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: '1px solid #444' }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBack />}
              sx={{
                color: '#fff',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                '&.Mui-disabled': { color: '#666' },
              }}
            >
              Back
            </Button>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={() => handleSubmit()}
                disabled={loading}
                sx={{ bgcolor: '#E50914', '&:hover': { bgcolor: '#B81D24' } }}
              >
                {loading ? 'Adding...' : 'Add Subscription'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForward />}
                sx={{ bgcolor: '#E50914', '&:hover': { bgcolor: '#B81D24' } }}
              >
                Next
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      <SuccessPopup
        open={showSuccessPopup}
        onClose={handleSuccessClose}
        title="Subscription Added!"
        message={`${selectedSubscription?.name}${selectedPlan ? ` (${selectedPlan.planName})` : ''} has been added to your subscriptions.`}
        icon="check"
      />

      {/* Duplicate Subscription Dialog */}
      <Dialog
        open={showDuplicateDialog}
        onClose={() => setShowDuplicateDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff', borderBottom: '1px solid #333' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={selectedSubscription?.logoUrl} sx={{ width: 40, height: 40, bgcolor: '#333' }}>
              {getCategoryIcon(selectedSubscription?.category)}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>Subscription Already Exists</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                You already have {selectedSubscription?.name} active
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Typography variant="body1" sx={{ color: '#fff', mb: 3 }}>
            Your current {selectedSubscription?.name} subscription renews on{' '}
            <Chip
              label={existingSubscriptionInfo?.renewalDate}
              size="small"
              sx={{ bgcolor: '#E50914', color: '#fff', fontWeight: 600 }}
            />
          </Typography>

          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
            How would you like to proceed?
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card
                sx={{
                  cursor: 'pointer',
                  bgcolor: 'rgba(76, 175, 80, 0.1)',
                  border: '2px solid rgba(76, 175, 80, 0.5)',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(76, 175, 80, 0.2)',
                    borderColor: '#4CAF50',
                    transform: 'translateY(-2px)',
                  },
                }}
                onClick={() => handleDuplicateChoice('continue')}
              >
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#4CAF50', mb: 1 }}>
                    📅 Continue from Renewal Date
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Start the new subscription from <strong style={{ color: '#fff' }}>{existingSubscriptionInfo?.renewalDate}</strong>.
                    This is recommended for renewals to maintain continuity.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card
                sx={{
                  cursor: 'pointer',
                  bgcolor: 'rgba(33, 150, 243, 0.1)',
                  border: '2px solid rgba(33, 150, 243, 0.5)',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(33, 150, 243, 0.2)',
                    borderColor: '#2196F3',
                    transform: 'translateY(-2px)',
                  },
                }}
                onClick={() => handleDuplicateChoice('new')}
              >
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#2196F3', mb: 1 }}>
                    🆕 Start Fresh with New Date
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Use the date you selected: <strong style={{ color: '#fff' }}>{formData.startDate?.toLocaleDateString()}</strong>.
                    Choose this if you're tracking a different billing cycle.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mt: 2, display: 'block' }}>
            ⚠️ The existing subscription will be marked as inactive and the new one will be added.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #333', p: 2 }}>
          <Button
            onClick={() => setShowDuplicateDialog(false)}
            sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AddSubscription;