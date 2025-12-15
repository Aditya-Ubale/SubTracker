import React, { useState, useEffect } from 'react';
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
  IconButton,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Person,
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';

// Validation rules
const VALIDATION_RULES = {
  name: {
    minLength: 2,
    pattern: /^[a-zA-Z\s]+$/,
    messages: {
      required: 'Full name is required',
      minLength: 'Name must be at least 2 characters',
      pattern: 'Name can only contain letters and spaces',
    },
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    messages: {
      required: 'Email is required',
      pattern: 'Please enter a valid email address',
    },
  },
  password: {
    minLength: 8,
    patterns: {
      uppercase: /[A-Z]/,
      lowercase: /[a-z]/,
      number: /\d/,
      special: /[!@#$%^&*]/,
      noSpaces: /^\S+$/,
    },
    messages: {
      required: 'Password is required',
      minLength: 'Password must be at least 8 characters',
      uppercase: 'Must contain at least 1 uppercase letter',
      lowercase: 'Must contain at least 1 lowercase letter',
      number: 'Must contain at least 1 number',
      special: 'Must contain at least 1 special character (!@#$%^&*)',
      noSpaces: 'Password cannot contain spaces',
    },
  },
  confirmPassword: {
    messages: {
      required: 'Please confirm your password',
      match: 'Passwords do not match',
    },
  },
};

const steps = ['Verify Email', 'Create Account'];

// Dark theme text field style
const darkTextFieldSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#333333',
    '& fieldset': { borderColor: '#444444' },
    '&:hover fieldset': { borderColor: '#666666' },
    '&.Mui-focused fieldset': { borderColor: '#E50914' },
  },
  '& .MuiInputLabel-root': { color: '#999999' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#E50914' },
  '& .MuiInputBase-input': { color: '#FFFFFF' },
  '& .MuiFormHelperText-root': { color: '#666666' },
};

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [globalError, setGlobalError] = useState('');

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Validate individual field
  const validateField = (name, value) => {
    const rules = VALIDATION_RULES[name];
    if (!rules) return '';

    if (!value || value.trim() === '') {
      return rules.messages.required;
    }

    if (name === 'name') {
      if (value.trim().length < rules.minLength) {
        return rules.messages.minLength;
      }
      if (!rules.pattern.test(value)) {
        return rules.messages.pattern;
      }
    }

    if (name === 'email') {
      if (!rules.pattern.test(value)) {
        return rules.messages.pattern;
      }
    }

    if (name === 'password') {
      if (value.length < rules.minLength) {
        return rules.messages.minLength;
      }
      if (!rules.patterns.noSpaces.test(value)) {
        return rules.messages.noSpaces;
      }
      if (!rules.patterns.uppercase.test(value)) {
        return rules.messages.uppercase;
      }
      if (!rules.patterns.lowercase.test(value)) {
        return rules.messages.lowercase;
      }
      if (!rules.patterns.number.test(value)) {
        return rules.messages.number;
      }
      if (!rules.patterns.special.test(value)) {
        return rules.messages.special;
      }
    }

    if (name === 'confirmPassword') {
      if (value !== formData.password) {
        return rules.messages.match;
      }
    }

    return '';
  };

  // Get password strength
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: 'error' };

    let score = 0;
    const rules = VALIDATION_RULES.password.patterns;

    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (rules.uppercase.test(password)) score += 20;
    if (rules.lowercase.test(password)) score += 15;
    if (rules.number.test(password)) score += 15;
    if (rules.special.test(password)) score += 20;

    if (score < 40) return { score, label: 'Weak', color: 'error' };
    if (score < 70) return { score, label: 'Medium', color: 'warning' };
    if (score < 90) return { score, label: 'Strong', color: 'info' };
    return { score: 100, label: 'Very Strong', color: 'success' };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setGlobalError('');

    // Validate on change
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));

    // Re-validate confirm password if password changes
    if (name === 'password' && formData.confirmPassword) {
      const confirmError = value !== formData.confirmPassword
        ? VALIDATION_RULES.confirmPassword.messages.match
        : '';
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }

    // Reset OTP state if email changes
    if (name === 'email') {
      setOtpSent(false);
      setOtpVerified(false);
      setActiveStep(0);
    }
  };

  // Send OTP
  const handleSendOtp = async () => {
    const emailError = validateField('email', formData.email);
    if (emailError) {
      setErrors((prev) => ({ ...prev, email: emailError }));
      return;
    }

    setLoading(true);
    setGlobalError('');
    setSuccessMessage('');

    try {
      const response = await authAPI.sendOtp(formData.email);
      setOtpSent(true);
      setCooldown(60);
      setSuccessMessage(response.data.message || 'OTP sent to your email!');
    } catch (error) {
      setGlobalError(error.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      setErrors((prev) => ({ ...prev, otp: 'Please enter a 6-digit OTP' }));
      return;
    }

    setLoading(true);
    setGlobalError('');

    try {
      await authAPI.verifyOtp(formData.email, formData.otp);
      setOtpVerified(true);
      setActiveStep(1);
      setSuccessMessage('Email verified successfully!');
    } catch (error) {
      setGlobalError(error.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Submit signup
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const newErrors = {};
    ['name', 'password', 'confirmPassword'].forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!otpVerified) {
      setGlobalError('Please verify your email first');
      return;
    }

    setLoading(true);
    setGlobalError('');

    const result = await signup(formData.name, formData.email, formData.password);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setGlobalError(result.message);
    }

    setLoading(false);
  };

  const passwordStrength = getPasswordStrength(formData.password);

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
          maxWidth: 500,
          width: '100%',
          borderRadius: 2,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          backgroundColor: 'rgba(34, 31, 31, 0.95)',
          border: '1px solid #333333',
          backdropFilter: 'blur(10px)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Logo/Title */}
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
              Create Account
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: '#E5E5E5' }}>
              Start tracking your subscriptions today!
            </Typography>
          </Box>

          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label, index) => (
              <Step key={label} completed={index === 0 ? otpVerified : false}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Global Error */}
          {globalError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {globalError}
            </Alert>
          )}

          {/* Success Message */}
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Field - Always visible */}
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={otpVerified}
              error={!!errors.email}
              helperText={errors.email}
              sx={{ mb: 2, ...darkTextFieldSx }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: '#999999' }} />
                  </InputAdornment>
                ),
                endAdornment: otpVerified && (
                  <InputAdornment position="end">
                    <CheckCircle sx={{ color: '#4CAF50' }} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Step 1: OTP Verification */}
            {!otpVerified && (
              <>
                {otpSent && (
                  <TextField
                    fullWidth
                    label="Enter 6-digit OTP"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    error={!!errors.otp}
                    helperText={errors.otp || 'Check your email for the verification code'}
                    sx={{ mb: 2, ...darkTextFieldSx }}
                    inputProps={{ maxLength: 6 }}
                  />
                )}

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  {!otpSent ? (
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleSendOtp}
                      disabled={loading || !formData.email}
                      sx={{
                        py: 1.5,
                        backgroundColor: '#E50914',
                        '&:hover': { backgroundColor: '#B81D24' },
                      }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : 'Send OTP'}
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outlined"
                        onClick={handleSendOtp}
                        disabled={loading || cooldown > 0}
                        sx={{ flex: 1 }}
                      >
                        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleVerifyOtp}
                        disabled={loading || formData.otp.length !== 6}
                        sx={{
                          flex: 1,
                          backgroundColor: '#E50914',
                          '&:hover': { backgroundColor: '#B81D24' },
                        }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify OTP'}
                      </Button>
                    </>
                  )}
                </Box>
              </>
            )}

            {/* Step 2: Account Details */}
            {otpVerified && (
              <>
                {/* Full Name */}
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={!!errors.name}
                  helperText={errors.name || 'Only letters and spaces allowed'}
                  sx={{ mb: 2, ...darkTextFieldSx }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person sx={{ color: '#999999' }} />
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Password */}
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  error={!!errors.password}
                  helperText={errors.password}
                  sx={{ mb: 1, ...darkTextFieldSx }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: '#999999' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: '#999999' }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Password Strength */}
                {formData.password && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Password Strength
                      </Typography>
                      <Chip
                        label={passwordStrength.label}
                        size="small"
                        color={passwordStrength.color}
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={passwordStrength.score}
                      color={passwordStrength.color}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                )}

                {/* Password Requirements */}
                <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Password Requirements:
                  </Typography>
                  <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {[
                      { label: '8+ chars', test: formData.password.length >= 8 },
                      { label: 'Uppercase', test: /[A-Z]/.test(formData.password) },
                      { label: 'Lowercase', test: /[a-z]/.test(formData.password) },
                      { label: 'Number', test: /\d/.test(formData.password) },
                      { label: 'Special (!@#$%^&*)', test: /[!@#$%^&*]/.test(formData.password) },
                    ].map((req) => (
                      <Chip
                        key={req.label}
                        label={req.label}
                        size="small"
                        icon={req.test ? <CheckCircle fontSize="small" /> : <ErrorIcon fontSize="small" />}
                        color={req.test ? 'success' : 'default'}
                        variant={req.test ? 'filled' : 'outlined'}
                        sx={{ fontSize: '0.7rem' }}
                      />
                    ))}
                  </Box>
                </Box>

                {/* Confirm Password */}
                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  sx={{ mb: 3, ...darkTextFieldSx }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: '#999999' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                          sx={{ color: '#999999' }}
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
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
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </>
            )}
          </form>

          {/* Login Link */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" sx={{ color: '#999999' }}>
              Already have an account?{' '}
              <Link
                to="/login"
                style={{
                  color: '#E50914',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Login
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Signup;