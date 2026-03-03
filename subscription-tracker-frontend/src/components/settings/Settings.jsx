/**
 * Settings - Premium Account Settings
 * 
 * Design Philosophy:
 * - Clean, scannable layout
 * - Purposeful grouping over generic cards
 * - Restrained colors and subtle interactions
 * - Typography-first hierarchy
 */
import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Switch,
    Avatar,
    Grid,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    InputAdornment,
} from '@mui/material';
import { Check, Close, Visibility, VisibilityOff } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';

const Settings = () => {
    const { user, updateUser } = useAuth();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [settings, setSettings] = useState({
        name: user?.name || '',
        email: user?.email || '',
        emailAlerts: true,
        renewalReminders: true,
        priceDropAlerts: true,
        weeklyReport: false,
    });

    // Password change dialog state
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    const handleSave = async () => {
        if (!settings.name || settings.name.trim().length < 2) {
            toast.error('Name must be at least 2 characters');
            return;
        }

        setSaving(true);
        try {
            const response = await authAPI.updateProfile({ name: settings.name.trim() });
            const updatedProfile = response.data.data;
            updateUser({ name: updatedProfile.name });
            setSaved(true);
            toast.success('Settings saved');
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!passwordData.currentPassword) {
            toast.error('Please enter your current password');
            return;
        }
        if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setChangingPassword(true);
        try {
            await authAPI.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            toast.success('Password changed successfully!');
            setPasswordDialogOpen(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    };

    // Get account age text
    const getAccountAge = () => {
        if (!user?.createdAt) return 'Account created recently';
        const created = new Date(user.createdAt);
        const now = new Date();
        const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Account created today';
        if (diffDays === 1) return 'Account created yesterday';
        if (diffDays < 30) return `Account created ${diffDays} days ago`;
        const months = Math.floor(diffDays / 30);
        return `Account created ${months} month${months > 1 ? 's' : ''} ago`;
    };

    // Reusable toggle row component
    const SettingToggle = ({ label, description, checked, onChange }) => (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 1.5,
            }}
        >
            <Box sx={{ pr: 3 }}>
                <Typography sx={{
                    color: 'rgba(255, 255, 255, 0.88)',
                    fontSize: '0.875rem',
                    fontWeight: 450,
                }}>
                    {label}
                </Typography>
                {description && (
                    <Typography sx={{
                        color: 'rgba(255, 255, 255, 0.4)',
                        fontSize: '0.8125rem',
                        mt: 0.25,
                    }}>
                        {description}
                    </Typography>
                )}
            </Box>
            <Switch
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                sx={{
                    '& .MuiSwitch-switchBase': {
                        '&.Mui-checked': {
                            color: '#fff',
                            '& + .MuiSwitch-track': {
                                backgroundColor: 'rgba(229, 9, 20, 0.7)',
                                opacity: 1,
                            },
                        },
                    },
                    '& .MuiSwitch-track': {
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    },
                }}
            />
        </Box>
    );

    // Section header component
    const SectionHeader = ({ title, description }) => (
        <Box sx={{ mb: 2.5 }}>
            <Typography sx={{
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: '#fff',
                letterSpacing: '-0.01em',
            }}>
                {title}
            </Typography>
            {description && (
                <Typography sx={{
                    fontSize: '0.8125rem',
                    color: 'rgba(255, 255, 255, 0.4)',
                    mt: 0.25,
                }}>
                    {description}
                </Typography>
            )}
        </Box>
    );

    // Dark text field style for dialogs
    const darkFieldSx = {
        '& .MuiOutlinedInput-root': {
            bgcolor: 'rgba(255, 255, 255, 0.03)',
            fontSize: '0.875rem',
            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.08)' },
            '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
            '&.Mui-focused fieldset': { borderColor: 'rgba(229, 9, 20, 0.5)', borderWidth: 1 },
        },
        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
        '& .MuiInputLabel-root.Mui-focused': { color: 'rgba(229, 9, 20, 0.8)' },
    };

    return (
        <Box sx={{ maxWidth: 720, mx: 'auto' }}>
            {/* Page Header */}
            <Box sx={{ mb: 5 }}>
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 600,
                        color: '#fff',
                        fontSize: '1.375rem',
                        letterSpacing: '-0.02em',
                    }}
                >
                    Settings
                </Typography>
                <Typography sx={{
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '0.875rem',
                    mt: 0.5,
                }}>
                    Manage your account and preferences
                </Typography>
            </Box>

            {/* Profile Section */}
            <Box sx={{ mb: 5 }}>
                <SectionHeader title="Profile" />

                {/* Avatar + Basic Info */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2.5,
                    mb: 3,
                    pb: 3,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                }}>
                    <Avatar
                        sx={{
                            width: 56,
                            height: 56,
                            bgcolor: 'rgba(229, 9, 20, 0.12)',
                            color: 'rgba(229, 9, 20, 0.9)',
                            fontSize: '1.25rem',
                            fontWeight: 600,
                        }}
                    >
                        {settings.name?.[0]?.toUpperCase() || 'U'}
                    </Avatar>
                    <Box>
                        <Typography sx={{
                            color: '#fff',
                            fontWeight: 500,
                            fontSize: '0.9375rem',
                        }}>
                            {settings.name || 'User'}
                        </Typography>
                        <Typography sx={{
                            color: 'rgba(255, 255, 255, 0.4)',
                            fontSize: '0.8125rem',
                        }}>
                            {user?.email || 'user@email.com'}
                        </Typography>
                    </Box>
                </Box>

                {/* Form Fields */}
                <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={6}>
                        <Typography sx={{
                            fontSize: '0.75rem',
                            color: 'rgba(255, 255, 255, 0.5)',
                            mb: 0.75,
                            fontWeight: 500,
                        }}>
                            Display name
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            value={settings.name}
                            onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                                    fontSize: '0.875rem',
                                    '& fieldset': {
                                        borderColor: 'rgba(255, 255, 255, 0.08)',
                                        transition: 'border-color 0.15s ease',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'rgba(255, 255, 255, 0.15)',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: 'rgba(229, 9, 20, 0.5)',
                                        borderWidth: 1,
                                    },
                                },
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography sx={{
                            fontSize: '0.75rem',
                            color: 'rgba(255, 255, 255, 0.5)',
                            mb: 0.75,
                            fontWeight: 500,
                        }}>
                            Email address
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            value={settings.email}
                            disabled
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'rgba(255, 255, 255, 0.02)',
                                    fontSize: '0.875rem',
                                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.05)' },
                                },
                                '& .Mui-disabled': {
                                    WebkitTextFillColor: 'rgba(255, 255, 255, 0.35)',
                                },
                            }}
                        />
                    </Grid>
                </Grid>
            </Box>

            {/* Notifications Section */}
            <Box sx={{ mb: 5 }}>
                <SectionHeader
                    title="Notifications"
                    description="Choose what updates you receive"
                />

                <Box sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    px: 2.5,
                    py: 0.5,
                }}>
                    <SettingToggle
                        label="Email notifications"
                        description="Receive important updates via email"
                        checked={settings.emailAlerts}
                        onChange={(val) => setSettings({ ...settings, emailAlerts: val })}
                    />
                    <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.04)' }} />
                    <SettingToggle
                        label="Renewal reminders"
                        description="Get notified 3 days before subscriptions renew"
                        checked={settings.renewalReminders}
                        onChange={(val) => setSettings({ ...settings, renewalReminders: val })}
                    />
                    <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.04)' }} />
                    <SettingToggle
                        label="Price drop alerts"
                        description="Be notified when wishlist items become cheaper"
                        checked={settings.priceDropAlerts}
                        onChange={(val) => setSettings({ ...settings, priceDropAlerts: val })}
                    />
                    <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.04)' }} />
                    <SettingToggle
                        label="Weekly digest"
                        description="Summary of your spending each week"
                        checked={settings.weeklyReport}
                        onChange={(val) => setSettings({ ...settings, weeklyReport: val })}
                    />
                </Box>
            </Box>

            {/* Security Section */}
            <Box sx={{ mb: 5 }}>
                <SectionHeader title="Security" />

                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1.5,
                    px: 2.5,
                    bgcolor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                }}>
                    <Box>
                        <Typography sx={{
                            color: 'rgba(255, 255, 255, 0.88)',
                            fontSize: '0.875rem',
                            fontWeight: 450,
                        }}>
                            Password
                        </Typography>
                        <Typography sx={{
                            color: 'rgba(255, 255, 255, 0.4)',
                            fontSize: '0.8125rem',
                        }}>
                            {getAccountAge()}
                        </Typography>
                    </Box>
                    <Button
                        size="small"
                        onClick={() => setPasswordDialogOpen(true)}
                        sx={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            textTransform: 'none',
                            px: 2,
                            '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.06)',
                                color: '#fff',
                            },
                        }}
                    >
                        Change
                    </Button>
                </Box>
            </Box>

            {/* Save Button */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                pt: 2,
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            }}>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    sx={{
                        bgcolor: saved ? 'rgba(16, 185, 129, 0.15)' : '#E50914',
                        color: saved ? 'rgba(16, 185, 129, 0.9)' : '#fff',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        textTransform: 'none',
                        px: 3,
                        py: 0.875,
                        borderRadius: 1.5,
                        minWidth: 100,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            bgcolor: saved ? 'rgba(16, 185, 129, 0.2)' : '#b8070f',
                        },
                        '&.Mui-disabled': {
                            bgcolor: 'rgba(229, 9, 20, 0.5)',
                            color: 'rgba(255, 255, 255, 0.5)',
                        },
                    }}
                >
                    {saved ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Check sx={{ fontSize: 16 }} /> Saved
                        </Box>
                    ) : saving ? 'Saving...' : 'Save changes'}
                </Button>
            </Box>

            {/* Change Password Dialog */}
            <Dialog
                open={passwordDialogOpen}
                onClose={() => setPasswordDialogOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: '#1a1a1f',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 2,
                    },
                }}
            >
                <DialogTitle sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 600,
                    pb: 1,
                }}>
                    Change Password
                    <IconButton
                        onClick={() => setPasswordDialogOpen(false)}
                        sx={{ color: 'rgba(255,255,255,0.4)' }}
                    >
                        <Close fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                    <TextField
                        fullWidth
                        label="Current Password"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        sx={{ mb: 2, mt: 1, ...darkFieldSx }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        edge="end"
                                        sx={{ color: 'rgba(255,255,255,0.4)' }}
                                    >
                                        {showCurrentPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        fullWidth
                        label="New Password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        helperText="Must be at least 6 characters"
                        sx={{ mb: 2, ...darkFieldSx }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        edge="end"
                                        sx={{ color: 'rgba(255,255,255,0.4)' }}
                                    >
                                        {showNewPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        fullWidth
                        label="Confirm New Password"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        error={passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword}
                        helperText={
                            passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                                ? 'Passwords do not match'
                                : ''
                        }
                        sx={{ ...darkFieldSx }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button
                        onClick={() => setPasswordDialogOpen(false)}
                        sx={{
                            color: 'rgba(255,255,255,0.6)',
                            textTransform: 'none',
                            fontSize: '0.8125rem',
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleChangePassword}
                        disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                        sx={{
                            bgcolor: '#E50914',
                            color: '#fff',
                            textTransform: 'none',
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            px: 2.5,
                            borderRadius: 1.5,
                            '&:hover': { bgcolor: '#b8070f' },
                            '&.Mui-disabled': {
                                bgcolor: 'rgba(229, 9, 20, 0.3)',
                                color: 'rgba(255,255,255,0.4)',
                            },
                        }}
                    >
                        {changingPassword ? 'Changing...' : 'Change Password'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Settings;
