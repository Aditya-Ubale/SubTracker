import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    CircularProgress,
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { stripeAPI } from '../../services/api';

const PaymentSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState(null);

    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        if (sessionId) {
            verifyPayment();
        } else {
            setLoading(false);
            setError('Invalid session');
        }
    }, [sessionId]);

    const verifyPayment = async () => {
        try {
            const response = await stripeAPI.verifyPayment({ session_id: sessionId });

            if (response.data.data.status === 'SUCCESS') {
                setVerified(true);
                toast.success('Payment successful! Subscription activated.');
            } else {
                setError(response.data.data.failureReason || 'Payment verification failed');
            }
        } catch (err) {
            console.error('Verification error:', err);
            setError(err.response?.data?.message || 'Failed to verify payment');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress sx={{ color: '#E50914', mb: 2 }} />
                <Typography>Verifying your payment...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
            <Card sx={{ borderRadius: 3, textAlign: 'center', py: 6 }}>
                <CardContent>
                    {verified ? (
                        <>
                            <CheckCircle sx={{ fontSize: 80, color: '#4CAF50', mb: 2 }} />
                            <Typography variant="h4" fontWeight={700} color="#4CAF50" gutterBottom>
                                Payment Successful!
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                Your subscription has been activated
                            </Typography>
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
                                {error || 'Your payment could not be verified'}
                            </Typography>
                            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
                                <Button variant="outlined" onClick={() => navigate('/wishlist')}>
                                    Back to Wishlist
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={() => navigate('/wishlist')}
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
};

export default PaymentSuccess;
