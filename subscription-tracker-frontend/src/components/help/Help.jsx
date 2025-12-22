/**
 * Help - Support & Documentation
 * 
 * Design Philosophy:
 * - Clean, scannable FAQ
 * - Purposeful quick actions
 * - Restrained colors
 * - Typography-first hierarchy
 */
import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Collapse,
    IconButton,
} from '@mui/material';
import {
    ExpandMore,
    ChevronRight,
    Send,
    Book,
    Lightbulb,
    Email,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const FAQ_ITEMS = [
    {
        q: 'How do I add a new subscription?',
        a: 'Go to the Subscriptions page and click "Add". You can select from popular services or create a custom entry.',
    },
    {
        q: 'How are renewal dates calculated?',
        a: 'Renewal dates are automatically calculated based on your billing frequency and start date. You\'ll receive alerts before each renewal.',
    },
    {
        q: 'Can I track price changes?',
        a: 'Yes. Add items to your wishlist and set a target price. We\'ll notify you when prices drop.',
    },
    {
        q: 'How is monthly spend calculated?',
        a: 'All subscriptions are normalized to monthly amounts. Yearly plans are divided by 12, weekly by 4, etc.',
    },
    {
        q: 'Is my data secure?',
        a: 'Yes. We use industry-standard encryption. We never store payment information.',
    },
    {
        q: 'Can I export my data?',
        a: 'You can export a PDF report from the Dashboard containing all subscriptions and spending data.',
    },
];

const Help = () => {
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const toggleFaq = (index) => {
        setExpandedFaq(expandedFaq === index ? null : index);
    };

    const handleSend = () => {
        if (!message.trim()) {
            toast.error('Please enter your message');
            return;
        }
        setSending(true);
        setTimeout(() => {
            setSending(false);
            setMessage('');
            toast.success('Message sent. We\'ll respond within 24 hours.');
        }, 800);
    };

    // Quick action link component
    const QuickAction = ({ icon: Icon, title, description, color }) => (
        <Box
            sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.04)',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                },
            }}
        >
            <Box
                sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                    bgcolor: `${color}12`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1.5,
                }}
            >
                <Icon sx={{ fontSize: 16, color: color }} />
            </Box>
            <Typography sx={{
                fontWeight: 500,
                color: '#fff',
                fontSize: '0.875rem',
                mb: 0.25,
            }}>
                {title}
            </Typography>
            <Typography sx={{
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: '0.8125rem',
            }}>
                {description}
            </Typography>
        </Box>
    );

    // FAQ item component
    const FaqItem = ({ question, answer, isExpanded, onToggle, isLast }) => (
        <Box
            sx={{
                borderBottom: isLast ? 'none' : '1px solid rgba(255, 255, 255, 0.04)',
            }}
        >
            <Box
                onClick={onToggle}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1.5,
                    cursor: 'pointer',
                    '&:hover': {
                        '& .faq-question': {
                            color: '#fff',
                        },
                    },
                }}
            >
                <Typography
                    className="faq-question"
                    sx={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '0.875rem',
                        fontWeight: 450,
                        transition: 'color 0.15s ease',
                        pr: 2,
                    }}
                >
                    {question}
                </Typography>
                <IconButton size="small" sx={{ color: 'rgba(255, 255, 255, 0.3)' }}>
                    {isExpanded ? (
                        <ExpandMore sx={{ fontSize: 18 }} />
                    ) : (
                        <ChevronRight sx={{ fontSize: 18 }} />
                    )}
                </IconButton>
            </Box>
            <Collapse in={isExpanded}>
                <Typography sx={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '0.8125rem',
                    pb: 2,
                    pr: 4,
                    lineHeight: 1.6,
                }}>
                    {answer}
                </Typography>
            </Collapse>
        </Box>
    );

    return (
        <Box sx={{ maxWidth: 720, mx: 'auto' }}>
            {/* Page Header - Centered */}
            <Box sx={{ mb: 5, textAlign: 'center' }}>
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 600,
                        color: '#fff',
                        fontSize: '1.375rem',
                        letterSpacing: '-0.02em',
                    }}
                >
                    Help
                </Typography>
                <Typography sx={{
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '0.875rem',
                    mt: 0.5,
                }}>
                    Get answers and support
                </Typography>
            </Box>

            {/* Quick Actions - Centered */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 2,
                mb: 5,
                flexWrap: 'wrap',
            }}>
                <Box sx={{ width: { xs: '100%', sm: 200 } }}>
                    <QuickAction
                        icon={Book}
                        title="Documentation"
                        description="Learn the basics"
                        color="#E50914"
                    />
                </Box>
                <Box sx={{ width: { xs: '100%', sm: 200 } }}>
                    <QuickAction
                        icon={Lightbulb}
                        title="Feature Requests"
                        description="Suggest improvements"
                        color="#10b981"
                    />
                </Box>
                <Box sx={{ width: { xs: '100%', sm: 200 } }}>
                    <QuickAction
                        icon={Email}
                        title="Email Support"
                        description="Get in touch"
                        color="#f59e0b"
                    />
                </Box>
            </Box>

            {/* FAQ Section */}
            <Box sx={{ mb: 5 }}>
                <Typography sx={{
                    fontSize: '0.7rem',
                    color: 'rgba(255, 255, 255, 0.35)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    mb: 2,
                    fontWeight: 500,
                }}>
                    Frequently Asked Questions
                </Typography>

                <Box sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    px: 2.5,
                }}>
                    {FAQ_ITEMS.map((item, index) => (
                        <FaqItem
                            key={index}
                            question={item.q}
                            answer={item.a}
                            isExpanded={expandedFaq === index}
                            onToggle={() => toggleFaq(index)}
                            isLast={index === FAQ_ITEMS.length - 1}
                        />
                    ))}
                </Box>
            </Box>

            {/* Contact Support - Centered */}
            <Box sx={{ maxWidth: 400, mx: 'auto' }}>
                <Typography sx={{
                    fontSize: '0.7rem',
                    color: 'rgba(255, 255, 255, 0.35)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    mb: 2,
                    fontWeight: 500,
                    textAlign: 'center',
                }}>
                    Contact Support
                </Typography>

                <Box sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    p: 2.5,
                }}>
                    <Typography sx={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '0.8125rem',
                        mb: 2,
                        textAlign: 'center',
                    }}>
                        Can't find what you're looking for? Send us a message.
                    </Typography>

                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        placeholder="Describe your issue..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                bgcolor: 'rgba(255, 255, 255, 0.02)',
                                fontSize: '0.875rem',
                                '& fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.06)',
                                },
                                '&:hover fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.12)',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: 'rgba(229, 9, 20, 0.5)',
                                    borderWidth: 1,
                                },
                            },
                        }}
                    />

                    <Button
                        fullWidth
                        onClick={handleSend}
                        disabled={sending}
                        startIcon={<Send sx={{ fontSize: 14 }} />}
                        sx={{
                            bgcolor: '#E50914',
                            color: '#fff',
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            textTransform: 'none',
                            py: 1,
                            borderRadius: 1.5,
                            '&:hover': {
                                bgcolor: '#b8070f',
                            },
                            '&.Mui-disabled': {
                                bgcolor: 'rgba(229, 9, 20, 0.4)',
                                color: 'rgba(255, 255, 255, 0.5)',
                            },
                        }}
                    >
                        {sending ? 'Sending...' : 'Send message'}
                    </Button>
                </Box>

                {/* Version */}
                <Typography sx={{
                    color: 'rgba(255, 255, 255, 0.2)',
                    fontSize: '0.7rem',
                    mt: 3,
                    textAlign: 'center',
                }}>
                    SubTracker v1.0.0
                </Typography>
            </Box>
        </Box>
    );
};

export default Help;
