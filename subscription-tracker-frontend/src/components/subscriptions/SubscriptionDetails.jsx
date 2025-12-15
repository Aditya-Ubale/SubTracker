import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    Avatar,
    Chip,
    Divider,
    Skeleton,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Paper,
} from '@mui/material';
import {
    ArrowBack,
    Edit,
    Delete,
    CalendarToday,
    AttachMoney,
    Autorenew,
    NotificationsActive,
    Category,
    Notes,
    OpenInNew,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { subscriptionAPI } from '../../services/api';
import { formatCurrency, formatDate, getCategoryIcon, getStatusColor } from '../../utils/helpers';
import SuccessPopup from '../common/SuccessPopup';

const SubscriptionDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    useEffect(() => {
        fetchSubscription();
    }, [id]);

    const fetchSubscription = async () => {
        try {
            setLoading(true);
            const response = await subscriptionAPI.getUserSubscriptionById(id);
            setSubscription(response.data.data);
        } catch (error) {
            console.error('Error fetching subscription:', error);
            toast.error('Failed to load subscription details');
            navigate('/subscriptions');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await subscriptionAPI.deleteSubscription(id);
            setDeleteDialogOpen(false);
            setShowSuccessPopup(true);
        } catch (error) {
            console.error('Error deleting subscription:', error);
            toast.error('Failed to delete subscription');
        }
    };

    const handleSuccessClose = () => {
        setShowSuccessPopup(false);
        navigate('/subscriptions');
    };

    const getDaysUntilRenewal = () => {
        if (!subscription?.renewalDate) return null;
        const today = new Date();
        const renewal = new Date(subscription.renewalDate);
        const diffTime = renewal - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const renderDetailItem = (icon, label, value, valueColor = 'text.primary') => (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, py: 2 }}>
            <Box
                sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: 'rgba(229, 9, 20, 0.1)',
                    color: 'primary.main',
                }}
            >
                {icon}
            </Box>
            <Box>
                <Typography variant="body2" color="text.secondary">
                    {label}
                </Typography>
                <Typography variant="body1" fontWeight={600} color={valueColor}>
                    {value}
                </Typography>
            </Box>
        </Box>
    );

    if (loading) {
        return (
            <Box sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <Skeleton variant="rectangular" width={80} height={36} sx={{ mr: 2, borderRadius: 1 }} />
                    <Skeleton variant="text" width={200} height={40} />
                </Box>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent sx={{ p: 4 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                    <Skeleton variant="circular" width={80} height={80} sx={{ mr: 2 }} />
                                    <Box>
                                        <Skeleton variant="text" width={200} height={32} />
                                        <Skeleton variant="text" width={100} height={24} />
                                    </Box>
                                </Box>
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 1 }} />
                                ))}
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3 }} />
                    </Grid>
                </Grid>
            </Box>
        );
    }

    const daysUntilRenewal = getDaysUntilRenewal();
    const price = subscription?.customPrice || subscription?.originalPrice;

    return (
        <Box sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/subscriptions')}
                        sx={{ mr: 2 }}
                    >
                        Back
                    </Button>
                    <Typography variant="h4" fontWeight={700}>
                        Subscription Details
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => navigate(`/subscriptions/${id}/edit`)}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => setDeleteDialogOpen(true)}
                    >
                        Delete
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Main Details Card */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ borderRadius: 3, mb: 3 }}>
                        <CardContent sx={{ p: 4 }}>
                            {/* Subscription Header */}
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                                <Avatar
                                    src={subscription?.logoUrl}
                                    sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.light' }}
                                >
                                    {getCategoryIcon(subscription?.category)}
                                </Avatar>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="h4" fontWeight={700}>
                                        {subscription?.subscriptionName}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                        <Chip label={subscription?.category} size="small" />
                                        <Chip
                                            label={subscription?.status}
                                            size="small"
                                            sx={{
                                                bgcolor: getStatusColor(subscription?.status),
                                                color: '#fff',
                                            }}
                                        />
                                        <Chip
                                            label={subscription?.subscriptionType}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Box>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {subscription?.subscriptionType === 'YEARLY' ? 'Yearly' : 'Monthly'} Price
                                    </Typography>
                                    <Typography variant="h4" fontWeight={700} color="primary.main">
                                        {formatCurrency(price)}
                                    </Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ mb: 3 }} />

                            {/* Subscription Details */}
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    {renderDetailItem(
                                        <CalendarToday />,
                                        'Start Date',
                                        formatDate(subscription?.startDate)
                                    )}
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    {renderDetailItem(
                                        <CalendarToday />,
                                        'Next Renewal',
                                        formatDate(subscription?.renewalDate),
                                        daysUntilRenewal <= 7 ? 'warning.main' : 'text.primary'
                                    )}
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    {renderDetailItem(
                                        <Autorenew />,
                                        'Auto Renew',
                                        subscription?.autoRenew ? 'Enabled' : 'Disabled',
                                        subscription?.autoRenew ? 'success.main' : 'text.secondary'
                                    )}
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    {renderDetailItem(
                                        <NotificationsActive />,
                                        'Reminder',
                                        `${subscription?.reminderDaysBefore || 7} days before renewal`
                                    )}
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    {renderDetailItem(
                                        <Category />,
                                        'Category',
                                        subscription?.category
                                    )}
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    {renderDetailItem(
                                        <AttachMoney />,
                                        'Original Price',
                                        formatCurrency(subscription?.originalPrice)
                                    )}
                                </Grid>
                            </Grid>

                            {subscription?.notes && (
                                <>
                                    <Divider sx={{ my: 3 }} />
                                    {renderDetailItem(
                                        <Notes />,
                                        'Notes',
                                        subscription.notes
                                    )}
                                </>
                            )}

                            {subscription?.websiteUrl && (
                                <Box sx={{ mt: 3 }}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<OpenInNew />}
                                        onClick={() => window.open(subscription.websiteUrl, '_blank')}
                                    >
                                        Visit Website
                                    </Button>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Side Panel */}
                <Grid item xs={12} md={4}>
                    {/* Renewal Status Card */}
                    <Card sx={{ borderRadius: 3, mb: 3 }}>
                        <CardContent sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Next Renewal
                            </Typography>
                            <Box
                                sx={{
                                    py: 3,
                                    px: 2,
                                    borderRadius: 2,
                                    bgcolor:
                                        daysUntilRenewal <= 3
                                            ? 'rgba(229, 9, 20, 0.1)'
                                            : daysUntilRenewal <= 7
                                                ? 'rgba(255, 140, 66, 0.1)'
                                                : 'rgba(76, 175, 80, 0.1)',
                                }}
                            >
                                <Typography
                                    variant="h2"
                                    fontWeight={700}
                                    color={
                                        daysUntilRenewal <= 3
                                            ? 'error.main'
                                            : daysUntilRenewal <= 7
                                                ? 'warning.main'
                                                : 'success.main'
                                    }
                                >
                                    {daysUntilRenewal !== null ? daysUntilRenewal : '--'}
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    days remaining
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                {formatDate(subscription?.renewalDate)}
                            </Typography>
                        </CardContent>
                    </Card>

                    {/* Quick Stats Card */}
                    <Card sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Quick Stats
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Monthly Cost
                                </Typography>
                                <Typography variant="body1" fontWeight={600}>
                                    {formatCurrency(
                                        subscription?.subscriptionType === 'YEARLY'
                                            ? price / 12
                                            : price
                                    )}
                                </Typography>
                            </Box>
                            <Divider />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Yearly Cost
                                </Typography>
                                <Typography variant="body1" fontWeight={600}>
                                    {formatCurrency(
                                        subscription?.subscriptionType === 'MONTHLY'
                                            ? price * 12
                                            : price
                                    )}
                                </Typography>
                            </Box>
                            <Divider />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Subscription Age
                                </Typography>
                                <Typography variant="body1" fontWeight={600}>
                                    {subscription?.startDate
                                        ? `${Math.floor(
                                            (new Date() - new Date(subscription.startDate)) /
                                            (1000 * 60 * 60 * 24)
                                        )} days`
                                        : '--'}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                PaperProps={{
                    sx: {
                        bgcolor: '#221F1F',
                        borderRadius: 2,
                        border: '1px solid #333333',
                    },
                }}
            >
                <DialogTitle>Delete Subscription?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete <strong>{subscription?.subscriptionName}</strong>? This
                        action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleDelete}
                        color="error"
                        variant="contained"
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success Popup */}
            <SuccessPopup
                open={showSuccessPopup}
                onClose={handleSuccessClose}
                title="Subscription Deleted!"
                message={`${subscription?.subscriptionName} has been removed from your subscriptions.`}
                icon="check"
            />
        </Box>
    );
};

export default SubscriptionDetails;
