import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    InputAdornment,
    CircularProgress,
    Stepper,
    Step,
    StepLabel,
} from '@mui/material';
import {
    Email,
    Lock,
    VpnKey,
    ArrowBack,
    CheckCircle,
} from '@mui/icons-material';
import api from '../../services/api';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const steps = ['Enter Email', 'Verify OTP', 'Reset Password'];

    // Step 1: Send OTP
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!email.trim()) {
            setError('Please enter your email address');
            setLoading(false);
            return;
        }

        try {
            const response = await api.post('/auth/forgot-password', { email });
            if (response.data.success) {
                setSuccess('OTP sent to your email!');
                setActiveStep(1);
            } else {
                setError(response.data.message || 'Failed to send OTP');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        }

        setLoading(false);
    };

    // Step 2: Verify OTP and Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!otp.trim()) {
            setError('Please enter the OTP');
            setLoading(false);
            return;
        }

        if (activeStep === 1) {
            // Move to password reset step
            setActiveStep(2);
            setLoading(false);
            return;
        }

        // Step 3: Validate and reset password
        if (!newPassword || newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (newPassword.includes(' ')) {
            setError('Password cannot contain spaces');
            setLoading(false);
            return;
        }

        try {
            const response = await api.post('/auth/reset-password', {
                email,
                otp,
                newPassword,
            });

            if (response.data.success) {
                setSuccess('Password reset successful! Redirecting to login...');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setError(response.data.message || 'Failed to reset password');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
        }

        setLoading(false);
    };

    const textFieldStyles = {
        mb: 2,
        '& .MuiOutlinedInput-root': {
            backgroundColor: '#333333',
            '& fieldset': { borderColor: '#444444' },
            '&:hover fieldset': { borderColor: '#666666' },
            '&.Mui-focused fieldset': { borderColor: '#E50914' },
        },
        '& .MuiInputLabel-root': { color: '#999999' },
        '& .MuiInputLabel-root.Mui-focused': { color: '#E50914' },
        '& .MuiInputBase-input': { color: '#FFFFFF' },
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #141414 0%, #1A1A1A 50%, #221F1F 100%)',
                padding: 2,
                position: 'relative',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(ellipse at center, rgba(229, 9, 20, 0.1) 0%, transparent 70%)',
                    pointerEvents: 'none',
                },
            }}
        >
            <Card
                sx={{
                    maxWidth: 480,
                    width: '100%',
                    borderRadius: 2,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    backgroundColor: 'rgba(34, 31, 31, 0.95)',
                    border: '1px solid #333333',
                    backdropFilter: 'blur(10px)',
                }}
            >
                <CardContent sx={{ p: 4 }}>
                    {/* Header */}
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 800,
                                background: 'linear-gradient(135deg, #E50914 0%, #FF3D47 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '-0.5px',
                            }}
                        >
                            Reset Password
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1, color: '#E5E5E5' }}>
                            {activeStep === 0 && "Enter your email to receive a reset code"}
                            {activeStep === 1 && "Enter the OTP sent to your email"}
                            {activeStep === 2 && "Create your new password"}
                        </Typography>
                    </Box>

                    {/* Stepper */}
                    <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel
                                    sx={{
                                        '& .MuiStepLabel-label': { color: '#999999' },
                                        '& .MuiStepLabel-label.Mui-active': { color: '#E50914' },
                                        '& .MuiStepLabel-label.Mui-completed': { color: '#4CAF50' },
                                        '& .MuiStepIcon-root': { color: '#444444' },
                                        '& .MuiStepIcon-root.Mui-active': { color: '#E50914' },
                                        '& .MuiStepIcon-root.Mui-completed': { color: '#4CAF50' },
                                    }}
                                >
                                    {label}
                                </StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {/* Error Alert */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Success Alert */}
                    {success && (
                        <Alert
                            severity="success"
                            sx={{ mb: 3 }}
                            icon={<CheckCircle />}
                        >
                            {success}
                        </Alert>
                    )}

                    {/* Step 1: Email Form */}
                    {activeStep === 0 && (
                        <form onSubmit={handleSendOtp}>
                            <TextField
                                fullWidth
                                label="Email Address"
                                type="email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                required
                                sx={textFieldStyles}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Email sx={{ color: '#999999' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                disabled={loading}
                                sx={{
                                    py: 1.5,
                                    backgroundColor: '#E50914',
                                    '&:hover': { backgroundColor: '#B81D24' },
                                    '&:disabled': { backgroundColor: '#666666' },
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Send OTP'}
                            </Button>
                        </form>
                    )}

                    {/* Step 2: OTP Form */}
                    {activeStep === 1 && (
                        <form onSubmit={handleResetPassword}>
                            <TextField
                                fullWidth
                                label="Enter OTP"
                                value={otp}
                                onChange={(e) => { setOtp(e.target.value); setError(''); }}
                                required
                                sx={textFieldStyles}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <VpnKey sx={{ color: '#999999' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                inputProps={{ maxLength: 6 }}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                disabled={loading}
                                sx={{
                                    py: 1.5,
                                    backgroundColor: '#E50914',
                                    '&:hover': { backgroundColor: '#B81D24' },
                                    '&:disabled': { backgroundColor: '#666666' },
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify OTP'}
                            </Button>

                            <Button
                                fullWidth
                                variant="text"
                                onClick={() => handleSendOtp({ preventDefault: () => { } })}
                                disabled={loading}
                                sx={{ mt: 1, color: '#999999' }}
                            >
                                Resend OTP
                            </Button>
                        </form>
                    )}

                    {/* Step 3: New Password Form */}
                    {activeStep === 2 && (
                        <form onSubmit={handleResetPassword}>
                            <TextField
                                fullWidth
                                label="New Password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                                required
                                sx={textFieldStyles}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock sx={{ color: '#999999' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <TextField
                                fullWidth
                                label="Confirm Password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                                required
                                sx={textFieldStyles}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock sx={{ color: '#999999' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                disabled={loading}
                                sx={{
                                    py: 1.5,
                                    backgroundColor: '#E50914',
                                    '&:hover': { backgroundColor: '#B81D24' },
                                    '&:disabled': { backgroundColor: '#666666' },
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
                            </Button>
                        </form>
                    )}

                    {/* Back to Login Link */}
                    <Box sx={{ textAlign: 'center', mt: 3 }}>
                        <Link
                            to="/login"
                            style={{
                                color: '#E50914',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                            }}
                        >
                            <ArrowBack fontSize="small" />
                            Back to Login
                        </Link>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ForgotPassword;
