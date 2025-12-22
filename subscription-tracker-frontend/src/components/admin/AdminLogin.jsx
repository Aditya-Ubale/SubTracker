import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    InputAdornment,
    IconButton,
    CircularProgress,
} from '@mui/material';
import {
    AdminPanelSettings,
    Email,
    Lock,
    Visibility,
    VisibilityOff,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { adminAPI } from '../../services/api';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email || !formData.password) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            setLoading(true);
            const response = await adminAPI.login(formData);

            if (response.data.success) {
                const { token, name, email, role } = response.data.data;

                // Store admin token separately
                localStorage.setItem('adminToken', token);
                localStorage.setItem('adminUser', JSON.stringify({ name, email, role }));

                toast.success('Login successful!');
                navigate('/admin/dashboard');
            }
        } catch (error) {
            console.error('Admin login error:', error);
            toast.error(error.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
                p: 2,
            }}
        >
            <Card
                sx={{
                    maxWidth: 420,
                    width: '100%',
                    bgcolor: 'rgba(26, 26, 26, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(229, 9, 20, 0.3)',
                    borderRadius: 3,
                }}
            >
                <CardContent sx={{ p: 4 }}>
                    {/* Logo and Title */}
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #E50914 0%, #B20710 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 2,
                                boxShadow: '0 4px 20px rgba(229, 9, 20, 0.4)',
                            }}
                        >
                            <AdminPanelSettings sx={{ fontSize: 40, color: '#fff' }} />
                        </Box>
                        <Typography variant="h4" fontWeight={700} color="#fff" sx={{ mb: 1 }}>
                            Admin Portal
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                            SubTracker Administration
                        </Typography>
                    </Box>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Email Address"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            sx={{ mb: 2 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Email sx={{ color: '#E50914' }} />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            fullWidth
                            label="Password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={handleChange}
                            sx={{ mb: 3 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Lock sx={{ color: '#E50914' }} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                            sx={{ color: 'rgba(255,255,255,0.5)' }}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            sx={{
                                py: 1.5,
                                bgcolor: '#E50914',
                                fontSize: '1rem',
                                fontWeight: 600,
                                '&:hover': {
                                    bgcolor: '#B81D24',
                                },
                            }}
                        >
                            {loading ? (
                                <CircularProgress size={24} sx={{ color: '#fff' }} />
                            ) : (
                                'Login to Admin'
                            )}
                        </Button>
                    </form>

                    {/* Footer */}
                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                            Authorized personnel only
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default AdminLogin;
