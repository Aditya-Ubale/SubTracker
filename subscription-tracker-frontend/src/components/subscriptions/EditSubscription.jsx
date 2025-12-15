import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
    Alert,
    Paper,
    Skeleton,
} from '@mui/material';
import {
    ArrowBack,
    Save,
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

const EditSubscription = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [subscription, setSubscription] = useState(null);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [formData, setFormData] = useState({
        subscriptionType: 'MONTHLY',
        customPrice: '',
        startDate: new Date(),
        renewalDate: null,
        autoRenew: true,
        reminderDaysBefore: 7,
        notes: '',
        status: 'ACTIVE',
    });

    useEffect(() => {
        fetchSubscription();
    }, [id]);

    const fetchSubscription = async () => {
        try {
            setLoading(true);
            const response = await subscriptionAPI.getUserSubscriptionById(id);
            const sub = response.data.data;
            setSubscription(sub);
            setFormData({
                subscriptionType: sub.subscriptionType || 'MONTHLY',
                customPrice: sub.customPrice || sub.originalPrice || '',
                startDate: sub.startDate ? new Date(sub.startDate) : new Date(),
                renewalDate: sub.renewalDate ? new Date(sub.renewalDate) : null,
                autoRenew: sub.autoRenew ?? true,
                reminderDaysBefore: sub.reminderDaysBefore || 7,
                notes: sub.notes || '',
                status: sub.status || 'ACTIVE',
            });
        } catch (error) {
            console.error('Error fetching subscription:', error);
            toast.error('Failed to load subscription');
            navigate('/subscriptions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Calculate renewal date when start date or type changes
        if (formData.startDate && !loading) {
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);

            const payload = {
                subscriptionType: formData.subscriptionType,
                customPrice: formData.customPrice ? parseFloat(formData.customPrice) : null,
                startDate: formData.startDate?.toISOString().split('T')[0],
                renewalDate: formData.renewalDate?.toISOString().split('T')[0],
                autoRenew: formData.autoRenew,
                reminderDaysBefore: formData.reminderDaysBefore,
                notes: formData.notes,
                status: formData.status,
            };

            await subscriptionAPI.updateSubscription(id, payload);
            setShowSuccessPopup(true);
        } catch (error) {
            console.error('Error updating subscription:', error);
            toast.error(error.response?.data?.message || 'Failed to update subscription');
        } finally {
            setSaving(false);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccessPopup(false);
        navigate('/subscriptions');
    };

    if (loading) {
        return (
            <Box sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <Skeleton variant="rectangular" width={80} height={36} sx={{ mr: 2, borderRadius: 1 }} />
                    <Skeleton variant="text" width={200} height={40} />
                </Box>
                <Card sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                        <Grid container spacing={3}>
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <Grid item xs={12} sm={6} key={i}>
                                    <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                                </Grid>
                            ))}
                        </Grid>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
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
                        Edit Subscription
                    </Typography>
                </Box>

                {/* Subscription Info Card */}
                <Card sx={{ mb: 3, borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                                src={subscription?.logoUrl}
                                sx={{ width: 60, height: 60, mr: 2, bgcolor: 'primary.light' }}
                            >
                                {getCategoryIcon(subscription?.category)}
                            </Avatar>
                            <Box>
                                <Typography variant="h5" fontWeight={700}>
                                    {subscription?.subscriptionName}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                    <Chip label={subscription?.category} size="small" />
                                    <Chip
                                        label={formData.status}
                                        size="small"
                                        color={formData.status === 'ACTIVE' ? 'success' : 'default'}
                                    />
                                </Box>
                            </Box>
                            <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Current Price
                                </Typography>
                                <Typography variant="h5" fontWeight={700} color="primary.main">
                                    {formatCurrency(formData.customPrice)}
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                {/* Edit Form */}
                <Card sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            Subscription Details
                        </Typography>

                        <form onSubmit={handleSubmit}>
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
                                                }))
                                            }
                                        >
                                            <MenuItem value="MONTHLY">Monthly</MenuItem>
                                            <MenuItem value="YEARLY">Yearly</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            value={formData.status}
                                            label="Status"
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    status: e.target.value,
                                                }))
                                            }
                                        >
                                            <MenuItem value="ACTIVE">Active</MenuItem>
                                            <MenuItem value="PAUSED">Paused</MenuItem>
                                            <MenuItem value="CANCELLED">Cancelled</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Custom Price"
                                        type="number"
                                        value={formData.customPrice}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, customPrice: e.target.value }))
                                        }
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                        }}
                                        helperText="Update the price if needed"
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
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            bgcolor: 'rgba(229, 9, 20, 0.08)',
                                            borderRadius: 2,
                                            border: '1px solid rgba(229, 9, 20, 0.2)',
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
                                                            bgcolor: 'rgba(51, 51, 51, 0.5)',
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

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Notes"
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

                            {/* Action Buttons */}
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, pt: 3, borderTop: 1, borderColor: 'divider', gap: 2 }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate('/subscriptions')}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    startIcon={<Save />}
                                    disabled={saving}
                                    sx={{
                                        backgroundColor: '#E50914',
                                        '&:hover': { backgroundColor: '#B81D24' },
                                    }}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </Box>
                        </form>
                    </CardContent>
                </Card>

                {/* Success Popup */}
                <SuccessPopup
                    open={showSuccessPopup}
                    onClose={handleSuccessClose}
                    title="Subscription Updated!"
                    message={`${subscription?.subscriptionName} has been updated successfully.`}
                    icon="check"
                />
            </Box>
        </LocalizationProvider>
    );
};

export default EditSubscription;
