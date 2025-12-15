import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    Avatar,
} from '@mui/material';
import { formatCurrency, formatDate, getStatusColor, getCategoryIcon } from '../../utils/helpers';

const SubscriptionCard = ({ subscription, onClick }) => {
    const price = subscription.customPrice || subscription.originalPrice;
    const statusColor = getStatusColor(subscription.daysUntilRenewal);

    return (
        <Card
            sx={{
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                backgroundColor: '#221F1F',
                border: '1px solid #333333',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
                    borderColor: '#E50914',
                },
            }}
            onClick={onClick}
        >
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                        src={subscription.subscriptionLogo}
                        sx={{
                            width: 48,
                            height: 48,
                            mr: 2,
                            bgcolor: '#333333',
                        }}
                    >
                        {getCategoryIcon(subscription.category)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" fontWeight={600} sx={{ color: '#FFFFFF' }}>
                            {subscription.subscriptionName}
                        </Typography>
                        <Chip
                            label={subscription.category}
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                bgcolor: 'rgba(229, 9, 20, 0.15)',
                                color: '#E50914',
                            }}
                        />
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#999999' }}>
                        {subscription.subscriptionType}
                    </Typography>
                    <Typography variant="h6" fontWeight={700} sx={{ color: '#E50914' }}>
                        {formatCurrency(price)}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        pt: 2,
                        borderTop: '1px solid #333333',
                    }}
                >
                    <Typography variant="caption" sx={{ color: '#666666' }}>
                        Renews: {formatDate(subscription.renewalDate)}
                    </Typography>
                    <Chip
                        label={
                            subscription.daysUntilRenewal !== null
                                ? `${subscription.daysUntilRenewal} days`
                                : 'N/A'
                        }
                        size="small"
                        color={statusColor}
                        sx={{ fontWeight: 600 }}
                    />
                </Box>
            </CardContent>
        </Card>
    );
};

export default SubscriptionCard;
