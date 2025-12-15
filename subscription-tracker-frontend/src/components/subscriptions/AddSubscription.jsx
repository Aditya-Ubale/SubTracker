import React, { useState, useEffect } from 'react';
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
  Autocomplete,
  Avatar,
  Chip,
  Switch,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Paper,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Check,
  NotificationsActive,
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { toast } from 'react-toastify';
import { subscriptionAPI } from '../../services/api';
import { formatCurrency, getCategoryIcon } from '../../utils/helpers';
import SuccessPopup from '../common/SuccessPopup';

// Minimum date for calendar (year 2000)
const MIN_DATE = new Date(2000, 0, 1);

const steps = ['Select Subscription', 'Configure Details', 'Review & Confirm'];

const AddSubscription = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [availableSubscriptions, setAvailableSubscriptions] = useState([]);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [formData, setFormData] = useState({
    subscriptionId: null,
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
    // Calculate renewal date when start date or type changes
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
      const response = await subscriptionAPI.getAllAvailable();
      setAvailableSubscriptions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to load available subscriptions');
    }
  };

  const handleSubscriptionSelect = (subscription) => {
    setSelectedSubscription(subscription);
    setFormData((prev) => ({
      ...prev,
      subscriptionId: subscription.id,
      customPrice: subscription.priceMonthly,
    }));
  };

  const handleNext = () => {
    if (activeStep === 0 && !selectedSubscription) {
      toast.error('Please select a subscription');
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const payload = {
        subscriptionId: formData.subscriptionId,
        subscriptionType: formData.subscriptionType,
        customPrice: formData.customPrice ? parseFloat(formData.customPrice) : null,
        startDate: formData.startDate?.toISOString().split('T')[0],
        renewalDate: formData.renewalDate?.toISOString().split('T')[0],
        autoRenew: formData.autoRenew,
        reminderDaysBefore: formData.reminderDaysBefore,
        notes: formData.notes,
      };

      await subscriptionAPI.addSubscription(payload);
      setShowSuccessPopup(true);
    } catch (error) {
      console.error('Error adding subscription:', error);
      toast.error(error.response?.data?.message || 'Failed to add subscription');
    } finally {
      setLoading(false);
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
            <Typography variant="h6" gutterBottom>
              Choose a subscription to track
            </Typography>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              {availableSubscriptions.map((sub) => (
                <Grid item xs={12} sm={6} md={4} key={sub.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 2,
                      border: selectedSubscription?.id === sub.id ? 2 : 1,
                      borderColor: selectedSubscription?.id === sub.id ? 'primary.main' : 'divider',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        transform: 'translateY(-2px)',
                      },
                    }}
                    onClick={() => handleSubscriptionSelect(sub)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          src={sub.logoUrl}
                          sx={{ width: 40, height: 40, mr: 2, bgcolor: 'primary.light' }}
                        >
                          {getCategoryIcon(sub.category)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {sub.name}
                          </Typography>
                          <Chip label={sub.category} size="small" sx={{ height: 20 }} />
                        </Box>
                        {selectedSubscription?.id === sub.id && (
                          <Check color="primary" sx={{ ml: 'auto' }} />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Monthly
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                          {formatCurrency(sub.priceMonthly)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 1:
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Configure your subscription
              </Typography>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Subscription Type</InputLabel>
                    <Select
                      value={formData.subscriptionType}
                      label="Subscription Type"
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          subscriptionType: e.target.value,
                          customPrice:
                            e.target.value === 'YEARLY'
                              ? selectedSubscription?.priceYearly
                              : selectedSubscription?.priceMonthly,
                        }))
                      }
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
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, customPrice: e.target.value }))
                    }
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                    helperText="Leave as default or enter custom amount"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Start Date"
                    value={formData.startDate}
                    minDate={MIN_DATE}
                    onChange={(date) =>
                      setFormData((prev) => ({ ...prev, startDate: date }))
                    }
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Renewal Date"
                    value={formData.renewalDate}
                    minDate={MIN_DATE}
                    onChange={(date) =>
                      setFormData((prev) => ({ ...prev, renewalDate: date }))
                    }
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: 'rgba(102, 126, 234, 0.08)',
                      borderRadius: 2,
                      border: '1px solid rgba(102, 126, 234, 0.2)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <NotificationsActive sx={{ color: 'primary.main', fontSize: 32 }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600} color="primary.main">
                          Remind me in
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Get notified before your renewal date
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          type="number"
                          value={formData.reminderDaysBefore}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              reminderDaysBefore: parseInt(e.target.value) || 7,
                            }))
                          }
                          inputProps={{ min: 1, max: 30, style: { textAlign: 'center' } }}
                          sx={{
                            width: 80,
                            '& .MuiOutlinedInput-root': {
                              bgcolor: 'white',
                            },
                          }}
                          size="small"
                        />
                        <Typography variant="subtitle1" fontWeight={600}>
                          days
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.autoRenew}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, autoRenew: e.target.checked }))
                        }
                      />
                    }
                    label="Auto Renew"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes (Optional)"
                    multiline
                    rows={3}
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Any additional notes about this subscription..."
                  />
                </Grid>
              </Grid>
            </Box>
          </LocalizationProvider>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review your subscription
            </Typography>
            <Card sx={{ borderRadius: 2, mt: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar
                    src={selectedSubscription?.logoUrl}
                    sx={{ width: 60, height: 60, mr: 2, bgcolor: 'primary.light' }}
                  >
                    {getCategoryIcon(selectedSubscription?.category)}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {selectedSubscription?.name}
                    </Typography>
                    <Chip label={selectedSubscription?.category} size="small" />
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Subscription Type
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {formData.subscriptionType}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Price
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color="primary.main">
                      {formatCurrency(formData.customPrice)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Start Date
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {formData.startDate?.toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Renewal Date
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {formData.renewalDate?.toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Auto Renew
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {formData.autoRenew ? 'Yes' : 'No'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Reminder
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {formData.reminderDaysBefore} days before
                    </Typography>
                  </Grid>
                  {formData.notes && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Notes
                      </Typography>
                      <Typography variant="body1">{formData.notes}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            <Alert severity="info" sx={{ mt: 3 }}>
              You will receive email reminders {formData.reminderDaysBefore} days before renewal.
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/subscriptions')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" fontWeight={700}>
          Add Subscription
        </Typography>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step Content */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          {renderStepContent(activeStep)}

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBack />}
            >
              Back
            </Button>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                sx={{
                  backgroundColor: '#E50914',
                  '&:hover': { backgroundColor: '#B81D24' },
                }}
              >
                {loading ? 'Adding...' : 'Add Subscription'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForward />}
              >
                Next
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Success Popup */}
      <SuccessPopup
        open={showSuccessPopup}
        onClose={handleSuccessClose}
        title="Subscription Added!"
        message={`${selectedSubscription?.name} has been added to your subscriptions.`}
        icon="check"
      />
    </Box>
  );
};

export default AddSubscription;