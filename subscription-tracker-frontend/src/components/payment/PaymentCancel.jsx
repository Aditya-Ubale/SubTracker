import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
} from '@mui/material';
import { Cancel } from '@mui/icons-material';

const PaymentCancel = () => {
    const navigate = useNavigate();

    return (
        <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
            <Card sx={{ borderRadius: 3, textAlign: 'center', py: 6 }}>
                <CardContent>
                    <Cancel sx={{ fontSize: 80, color: '#ff9800', mb: 2 }} />
                    <Typography variant="h4" fontWeight={700} color="#ff9800" gutterBottom>
                        Payment Cancelled
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Your payment was cancelled. No charges were made.
                    </Typography>
                    <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button variant="outlined" onClick={() => navigate('/wishlist')}>
                            Back to Wishlist
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => navigate(-1)}
                            sx={{ bgcolor: '#E50914', '&:hover': { bgcolor: '#B81D24' } }}
                        >
                            Try Again
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default PaymentCancel;
