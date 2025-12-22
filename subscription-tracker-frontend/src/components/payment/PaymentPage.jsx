import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    Avatar,
    Chip,
    CircularProgress,
    Divider,
    Alert,
} from '@mui/material';
import {
    CreditCard,
    Smartphone,
    CheckCircle,
    Cancel,
    ArrowBack,
    Lock,
    Payment as PaymentIcon,
    AccountBalance,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { stripeAPI, paymentAPI, subscriptionAPI } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';

const PaymentPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const subscriptionId = searchParams.get('subscriptionId');
    const planId = searchParams.get('planId');
    const subscriptionType = searchParams.get('type') || 'MONTHLY';
    const priceParam = searchParams.get('price');

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [subscription, setSubscription] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [transactionId, setTransactionId] = useState(null);

    const price = priceParam ? parseFloat(priceParam) : 0;

    useEffect(() => {
        if (!subscriptionId) {
            toast.error('Invalid payment request');
            navigate('/wishlist');
            return;
        }

        // If price is 0, directly add subscription
        if (price === 0) {
            handleFreeSubscription();
            return;
        }

        fetchSubscriptionDetails();
    }, [subscriptionId]);

    const fetchSubscriptionDetails = async () => {
        try {
            setLoading(true);
            const response = await subscriptionAPI.getById(subscriptionId);
            setSubscription(response.data.data);
        } catch (error) {
            console.error('Error fetching subscription:', error);
            toast.error('Failed to load subscription details');
            navigate('/wishlist');
        } finally {
            setLoading(false);
        }
    };

    const handleFreeSubscription = async () => {
        try {
            setProcessing(true);
            await paymentAPI.addFreeSubscription({
                subscriptionId: parseInt(subscriptionId),
                planId: planId ? parseInt(planId) : null,
                subscriptionType,
            });
            setPaymentStatus('success');
            toast.success('Subscription added successfully!');
            setTimeout(() => navigate('/subscriptions'), 2000);
        } catch (error) {
            console.error('Error adding free subscription:', error);
            toast.error(error.response?.data?.message || 'Failed to add subscription');
            setPaymentStatus('failed');
        } finally {
            setProcessing(false);
            setLoading(false);
        }
    };

    const handleStripePayment = async () => {
        try {
            setProcessing(true);

            // Create Stripe Checkout Session
            const sessionResponse = await stripeAPI.createCheckoutSession({
                subscriptionId: parseInt(subscriptionId),
                planId: planId ? parseInt(planId) : null,
                subscriptionType,
            });

            if (!sessionResponse.data.success) {
                throw new Error(sessionResponse.data.message);
            }

            const sessionData = sessionResponse.data.data;

            // Redirect to Stripe Checkout
            window.location.href = sessionData.url;

        } catch (error) {
            console.error('Stripe payment error:', error);
            setProcessing(false);
            toast.error(error.response?.data?.message || error.message || 'Failed to initiate payment');
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress sx={{ color: '#E50914' }} />
            </Box>
        );
    }

    // Success/Failed Status
    if (paymentStatus) {
        return (
            <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
                <Card sx={{ borderRadius: 3, textAlign: 'center', py: 6 }}>
                    <CardContent>
                        {paymentStatus === 'success' ? (
                            <>
                                <CheckCircle sx={{ fontSize: 80, color: '#4CAF50', mb: 2 }} />
                                <Typography variant="h4" fontWeight={700} color="#4CAF50" gutterBottom>
                                    Payment Successful!
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                    Your subscription has been activated
                                </Typography>
                                {transactionId && (
                                    <Typography variant="caption" color="text.secondary">
                                        Transaction ID: {transactionId}
                                    </Typography>
                                )}
                                <Box sx={{ mt: 4 }}>
                                    <Button
                                        variant="contained"
                                        onClick={() => navigate('/subscriptions')}
                                        sx={{ bgcolor: '#E50914', '&:hover': { bgcolor: '#B81D24' } }}
                                    >
                                        View My Subscriptions
                                    </Button>
                                </Box>
                            </>
                        ) : (
                            <>
                                <Cancel sx={{ fontSize: 80, color: '#f44336', mb: 2 }} />
                                <Typography variant="h4" fontWeight={700} color="#f44336" gutterBottom>
                                    Payment Failed
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                    Your payment could not be processed
                                </Typography>
                                <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
                                    <Button variant="outlined" onClick={() => navigate('/wishlist')}>
                                        Back to Wishlist
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={() => setPaymentStatus(null)}
                                        sx={{ bgcolor: '#E50914', '&:hover': { bgcolor: '#B81D24' } }}
                                    >
                                        Try Again
                                    </Button>
                                </Box>
                            </>
                        )}
                    </CardContent>
                </Card>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', mt: 2 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/wishlist')}
                    sx={{ mr: 2 }}
                >
                    Back
                </Button>
                <Typography variant="h4" fontWeight={700}>
                    Complete Payment
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Payment Options */}
                <Grid item xs={12} md={7}>
                    <Card sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                            {/* Stripe Payment Info */}
                            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                                Secure Payment via Stripe
                            </Typography>

                            {/* Info for small amounts - they'll be adjusted */}
                            {price < 50 && (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    <strong>Note:</strong> Stripe requires a minimum of ₹50.
                                    Your amount (₹{price.toFixed(2)}) will be adjusted to ₹50.
                                </Alert>
                            )}

                            <Alert severity="info" sx={{ mb: 3 }}>
                                <strong>Test Mode Active</strong><br />
                                Use these test credentials on Stripe checkout:<br /><br />
                                <strong>Test Card:</strong><br />
                                • <strong>Card:</strong> 4242 4242 4242 4242<br />
                                • <strong>Expiry:</strong> Any future date (e.g., 12/34)<br />
                                • <strong>CVC:</strong> Any 3 digits (e.g., 123)<br /><br />
                                <strong>Test UPI:</strong><br />
                                • <strong>UPI ID:</strong> success@stripeupi
                            </Alert>

                            {/* Payment Methods */}
                            <Box sx={{ textAlign: 'center', py: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                                    Supported Payment Methods
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 4 }}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <CreditCard sx={{ fontSize: 44, color: '#635BFF' }} />
                                        <Typography variant="caption" display="block" fontWeight={500}>Cards</Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Smartphone sx={{ fontSize: 44, color: '#00D924' }} />
                                        <Typography variant="caption" display="block" fontWeight={500}>UPI</Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <AccountBalance sx={{ fontSize: 44, color: '#1976D2' }} />
                                        <Typography variant="caption" display="block" fontWeight={500}>NetBanking</Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <PaymentIcon sx={{ fontSize: 44, color: '#FF9800' }} />
                                        <Typography variant="caption" display="block" fontWeight={500}>Wallets</Typography>
                                    </Box>
                                </Box>

                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={handleStripePayment}
                                    disabled={processing}
                                    startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <Lock />}
                                    sx={{
                                        py: 2,
                                        px: 6,
                                        bgcolor: '#635BFF',
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        '&:hover': { bgcolor: '#4B45C6' },
                                    }}
                                >
                                    {processing ? 'Processing...' : `Pay ${formatCurrency(price < 50 ? 50 : price)}`}
                                </Button>

                                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 2 }}>
                                    <Lock sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
                                    Secured by Stripe
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Order Summary */}
                <Grid item xs={12} md={5}>
                    <Card sx={{ borderRadius: 3, position: 'sticky', top: 20 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                                Order Summary
                            </Typography>

                            {subscription && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                    <Avatar
                                        src={subscription.logoUrl}
                                        sx={{ width: 60, height: 60, mr: 2 }}
                                    />
                                    <Box>
                                        <Typography variant="h6" fontWeight={600}>
                                            {subscription.name}
                                        </Typography>
                                        <Chip label={subscription.category} size="small" />
                                    </Box>
                                </Box>
                            )}

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography color="text.secondary">Plan Type</Typography>
                                <Typography fontWeight={600}>{subscriptionType}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography color="text.secondary">Price</Typography>
                                <Typography fontWeight={600}>{formatCurrency(price)}</Typography>
                            </Box>
                            {price < 50 && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography color="text.secondary">Adjusted (Min ₹50)</Typography>
                                    <Typography fontWeight={600} color="warning.main">{formatCurrency(50)}</Typography>
                                </Box>
                            )}

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                <Typography variant="h6" fontWeight={700}>Total</Typography>
                                <Typography variant="h6" fontWeight={700} color="primary">
                                    {formatCurrency(price < 50 ? 50 : price)}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PaymentPage;
