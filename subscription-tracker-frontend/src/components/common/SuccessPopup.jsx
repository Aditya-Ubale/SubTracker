import React from 'react';
import { Dialog, DialogContent, Box, Typography, IconButton, Zoom } from '@mui/material';
import { Close, CheckCircle, Favorite, Star } from '@mui/icons-material';

const SuccessPopup = ({ open, onClose, title, message, icon = 'check' }) => {
    const getIcon = () => {
        switch (icon) {
            case 'heart':
                return <Favorite sx={{ fontSize: 60, color: '#E50914' }} />;
            case 'star':
                return <Star sx={{ fontSize: 60, color: '#FF8C42' }} />;
            default:
                return <CheckCircle sx={{ fontSize: 60, color: '#4CAF50' }} />;
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            TransitionComponent={Zoom}
            transitionDuration={300}
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    backgroundColor: '#221F1F',
                    border: '1px solid #333333',
                    overflow: 'visible',
                },
            }}
        >
            <IconButton
                onClick={onClose}
                sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: '#666666',
                    '&:hover': {
                        color: '#FFFFFF',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                }}
            >
                <Close />
            </IconButton>

            <DialogContent sx={{ textAlign: 'center', py: 5, px: 4 }}>
                {/* Confetti-like dots */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        overflow: 'hidden',
                        pointerEvents: 'none',
                    }}
                >
                    {[...Array(12)].map((_, i) => (
                        <Box
                            key={i}
                            sx={{
                                position: 'absolute',
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: i % 3 === 0 ? '#E50914' : i % 3 === 1 ? '#4CAF50' : '#FF8C42',
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                animation: `float ${2 + Math.random() * 2}s ease-in-out infinite`,
                                animationDelay: `${Math.random() * 2}s`,
                                opacity: 0.6,
                                '@keyframes float': {
                                    '0%, 100%': { transform: 'translateY(0) scale(1)' },
                                    '50%': { transform: 'translateY(-10px) scale(1.1)' },
                                },
                            }}
                        />
                    ))}
                </Box>

                {/* Icon with glow effect */}
                <Box
                    sx={{
                        display: 'inline-flex',
                        p: 2,
                        borderRadius: '50%',
                        background: 'rgba(229, 9, 20, 0.1)',
                        mb: 3,
                        animation: 'pulse 2s infinite',
                        '@keyframes pulse': {
                            '0%': { boxShadow: '0 0 0 0 rgba(229, 9, 20, 0.4)' },
                            '70%': { boxShadow: '0 0 0 20px rgba(229, 9, 20, 0)' },
                            '100%': { boxShadow: '0 0 0 0 rgba(229, 9, 20, 0)' },
                        },
                    }}
                >
                    {getIcon()}
                </Box>

                {/* Title */}
                <Typography
                    variant="h5"
                    fontWeight={700}
                    sx={{
                        mb: 1,
                        color: '#FFFFFF',
                    }}
                >
                    {title}
                </Typography>

                {/* Message */}
                <Typography
                    variant="body1"
                    sx={{ color: '#E5E5E5' }}
                >
                    {message}
                </Typography>
            </DialogContent>
        </Dialog>
    );
};

export default SuccessPopup;
