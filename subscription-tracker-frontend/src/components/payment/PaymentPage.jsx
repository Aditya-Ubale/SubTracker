import React, { useState, useEffect, useRef } from 'react';
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
    LinearProgress,
    TextField,
    InputAdornment,
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
    Verified,
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

    // Simulation state
    const [simMode, setSimMode] = useState(false);
    const [simSessionId, setSimSessionId] = useState(null);
    const [simStep, setSimStep] = useState(null); // 'checkout', 'processing', 'verifying'
    const [simProgress, setSimProgress] = useState(0);
    const [selectedMethod, setSelectedMethod] = useState('card');
    const simTimerRef = useRef(null);

    const price = priceParam ? parseFloat(priceParam) : 0;

    useEffect(() => {
        if (!subscriptionId) {
            toast.error('Invalid payment request');
            navigate('/wishlist');
            return;
        }

        if (price === 0) {
            handleFreeSubscription();
            return;
        }

        fetchSubscriptionDetails();

        return () => {
            if (simTimerRef.current) clearInterval(simTimerRef.current);
        };
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

            const sessionResponse = await stripeAPI.createCheckoutSession({
                subscriptionId: parseInt(subscriptionId),
                planId: planId ? parseInt(planId) : null,
                subscriptionType,
            });

            if (!sessionResponse.data.success) {
                throw new Error(sessionResponse.data.message);
            }

            const sessionData = sessionResponse.data.data;

            // Check if backend returned simulation mode
            if (sessionData.simulated) {
                setSimMode(true);
                setSimSessionId(sessionData.sessionId);
                setSimStep('checkout');
                setProcessing(false);
                return;
            }

            // Real Stripe — redirect
            window.location.href = sessionData.url;

        } catch (error) {
            console.error('Payment error:', error);
            setProcessing(false);
            toast.error(error.response?.data?.message || error.message || 'Failed to initiate payment');
        }
    };

    const handleSimulatedPayment = () => {
        setSimStep('processing');
        setSimProgress(0);

        let progress = 0;
        simTimerRef.current = setInterval(() => {
            progress += Math.random() * 15 + 5;
            if (progress >= 100) {
                progress = 100;
                clearInterval(simTimerRef.current);
                setSimProgress(100);

                setTimeout(() => {
                    // Navigate to success page with simulated session_id
                    navigate(`/payment/success?session_id=${simSessionId}`);
                }, 600);
            }
            setSimProgress(Math.min(progress, 100));
        }, 300);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress sx={{ color: '#E50914' }} />
            </Box>
        );
    }

    // Success/Failed Status (for free subscriptions)
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

    // Simulated Checkout UI
    if (simMode && simStep) {
        return (
            <Box sx={{ maxWidth: 520, mx: 'auto', mt: 4 }}>
                <Card sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.08)',
                }}>
                    {/* Header */}
                    <Box sx={{
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                        px: 3, py: 2.5,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Lock sx={{ fontSize: 18, color: '#4CAF50' }} />
                            <Typography sx={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>
                                Secure Checkout
                            </Typography>
                        </Box>
                        <Chip
                            label="DEMO"
                            size="small"
                            sx={{
                                bgcolor: 'rgba(255, 152, 0, 0.15)',
                                color: '#FFB74D',
                                fontWeight: 700,
                                fontSize: '0.65rem',
                                height: 22,
                            }}
                        />
                    </Box>

                    <CardContent sx={{ p: 3 }}>
                        {simStep === 'checkout' && (
                            <>
                                {/* Subscription info */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    {subscription && (
                                        <Avatar
                                            src={subscription.logoUrl}
                                            sx={{ width: 48, height: 48, border: '1px solid rgba(255,255,255,0.1)' }}
                                        />
                                    )}
                                    <Box>
                                        <Typography sx={{ fontWeight: 600, color: '#fff' }}>
                                            {subscription?.name || 'Subscription'}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>
                                            {subscriptionType} Plan
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ ml: 'auto', fontWeight: 700, color: '#fff', fontSize: '1.25rem' }}>
                                        {formatCurrency(price)}
                                    </Typography>
                                </Box>

                                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 3 }} />

                                {/* Payment method selector */}
                                <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', mb: 1.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                    Payment Method
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                                    {[
                                        { id: 'card', label: 'Card', icon: <CreditCard sx={{ fontSize: 20 }} /> },
                                        { id: 'upi', label: 'UPI', icon: <Smartphone sx={{ fontSize: 20 }} /> },
                                        { id: 'netbanking', label: 'Bank', icon: <AccountBalance sx={{ fontSize: 20 }} /> },
                                    ].map((method) => (
                                        <Box
                                            key={method.id}
                                            onClick={() => setSelectedMethod(method.id)}
                                            sx={{
                                                flex: 1,
                                                py: 1.5,
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5,
                                                borderRadius: 2,
                                                border: `1px solid ${selectedMethod === method.id ? 'rgba(229, 9, 20, 0.5)' : 'rgba(255,255,255,0.08)'}`,
                                                bgcolor: selectedMethod === method.id ? 'rgba(229, 9, 20, 0.06)' : 'transparent',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                color: selectedMethod === method.id ? '#E50914' : 'rgba(255,255,255,0.5)',
                                                '&:hover': {
                                                    borderColor: 'rgba(229, 9, 20, 0.3)',
                                                    bgcolor: 'rgba(229, 9, 20, 0.04)',
                                                },
                                            }}
                                        >
                                            {method.icon}
                                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>{method.label}</Typography>
                                        </Box>
                                    ))}
                                </Box>

                                {/* Fake form fields */}
                                {selectedMethod === 'card' && (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                                        <TextField
                                            fullWidth size="small" label="Card Number"
                                            value="4242 4242 4242 4242" disabled
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start"><CreditCard sx={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }} /></InputAdornment>,
                                            }}
                                            sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.03)', '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' } }, '& .Mui-disabled': { WebkitTextFillColor: 'rgba(255,255,255,0.5)' } }}
                                        />
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <TextField
                                                size="small" label="Expiry" value="12/34" disabled fullWidth
                                                sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.03)', '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' } }, '& .Mui-disabled': { WebkitTextFillColor: 'rgba(255,255,255,0.5)' } }}
                                            />
                                            <TextField
                                                size="small" label="CVC" value="123" disabled fullWidth
                                                sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.03)', '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' } }, '& .Mui-disabled': { WebkitTextFillColor: 'rgba(255,255,255,0.5)' } }}
                                            />
                                        </Box>
                                    </Box>
                                )}

                                {selectedMethod === 'upi' && (
                                    <Box sx={{ mb: 3 }}>
                                        <TextField
                                            fullWidth size="small" label="UPI ID"
                                            value="user@upi" disabled
                                            sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.03)', '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' } }, '& .Mui-disabled': { WebkitTextFillColor: 'rgba(255,255,255,0.5)' } }}
                                        />
                                    </Box>
                                )}

                                {selectedMethod === 'netbanking' && (
                                    <Box sx={{ mb: 3, textAlign: 'center', py: 2 }}>
                                        <AccountBalance sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)', mb: 1 }} />
                                        <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>
                                            Demo bank selected
                                        </Typography>
                                    </Box>
                                )}

                                <Alert
                                    severity="info"
                                    sx={{
                                        mb: 3,
                                        bgcolor: 'rgba(99, 102, 241, 0.06)',
                                        border: '1px solid rgba(99, 102, 241, 0.12)',
                                        '& .MuiAlert-icon': { color: 'rgba(99, 102, 241, 0.7)' },
                                    }}
                                >
                                    <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)' }}>
                                        <strong>Demo Mode</strong> — This is a simulated payment. No real money will be charged.
                                    </Typography>
                                </Alert>

                                {/* Pay Button */}
                                <Button
                                    fullWidth variant="contained" size="large"
                                    onClick={handleSimulatedPayment}
                                    startIcon={<Lock sx={{ fontSize: 18 }} />}
                                    sx={{
                                        py: 1.5,
                                        bgcolor: '#E50914',
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        boxShadow: '0 4px 14px rgba(229, 9, 20, 0.3)',
                                        '&:hover': { bgcolor: '#B81D24', boxShadow: '0 6px 20px rgba(229, 9, 20, 0.4)' },
                                    }}
                                >
                                    Pay {formatCurrency(price)}
                                </Button>

                                <Typography sx={{ textAlign: 'center', mt: 1.5, fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>
                                    <Lock sx={{ fontSize: 10, verticalAlign: 'middle', mr: 0.5 }} />
                                    Secured • Encrypted • Demo Mode
                                </Typography>
                            </>
                        )}

                        {simStep === 'processing' && (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <CircularProgress
                                    variant="determinate"
                                    value={simProgress}
                                    size={80}
                                    thickness={3}
                                    sx={{
                                        color: simProgress >= 100 ? '#4CAF50' : '#E50914',
                                        mb: 3,
                                    }}
                                />
                                <Typography sx={{ fontWeight: 600, color: '#fff', mb: 1, fontSize: '1.1rem' }}>
                                    {simProgress >= 100 ? 'Payment Complete!' : 'Processing Payment...'}
                                </Typography>
                                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8125rem', mb: 3 }}>
                                    {simProgress < 30 && 'Connecting to payment gateway...'}
                                    {simProgress >= 30 && simProgress < 60 && 'Verifying payment details...'}
                                    {simProgress >= 60 && simProgress < 90 && 'Processing transaction...'}
                                    {simProgress >= 90 && simProgress < 100 && 'Finalizing payment...'}
                                    {simProgress >= 100 && 'Redirecting to confirmation...'}
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={simProgress}
                                    sx={{
                                        height: 4,
                                        borderRadius: 2,
                                        bgcolor: 'rgba(255,255,255,0.04)',
                                        '& .MuiLinearProgress-bar': {
                                            bgcolor: simProgress >= 100 ? '#4CAF50' : '#E50914',
                                            borderRadius: 2,
                                        },
                                    }}
                                />
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Box>
        );
    }

    // Default payment page (before simulation or for real Stripe)
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
                            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                                Secure Payment
                            </Typography>

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
                                        bgcolor: '#E50914',
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        '&:hover': { bgcolor: '#B81D24' },
                                    }}
                                >
                                    {processing ? 'Processing...' : `Pay ${formatCurrency(price)}`}
                                </Button>

                                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 2 }}>
                                    <Lock sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
                                    Secured & Encrypted
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

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                <Typography variant="h6" fontWeight={700}>Total</Typography>
                                <Typography variant="h6" fontWeight={700} color="primary">
                                    {formatCurrency(price)}
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
