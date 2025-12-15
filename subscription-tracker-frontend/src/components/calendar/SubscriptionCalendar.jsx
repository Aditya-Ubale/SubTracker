import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Skeleton,
} from '@mui/material';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, isSameDay, parseISO } from 'date-fns';
import { subscriptionAPI } from '../../services/api';
import { formatCurrency, getCategoryIcon } from '../../utils/helpers';

const SubscriptionCalendar = () => {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDateSubscriptions, setSelectedDateSubscriptions] = useState([]);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    const filtered = subscriptions.filter((sub) => {
      if (!sub.renewalDate) return false;
      return isSameDay(parseISO(sub.renewalDate), selectedDate);
    });
    setSelectedDateSubscriptions(filtered);
  }, [selectedDate, subscriptions]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await subscriptionAPI.getUserSubscriptions();
      setSubscriptions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;

    const daySubscriptions = subscriptions.filter((sub) => {
      if (!sub.renewalDate) return false;
      return isSameDay(parseISO(sub.renewalDate), date);
    });

    if (daySubscriptions.length === 0) return null;

    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: 0.5,
        }}
      >
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: daySubscriptions.length > 1 ? 'error.main' : 'primary.main',
          }}
        />
      </Box>
    );
  };

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null;

    const daySubscriptions = subscriptions.filter((sub) => {
      if (!sub.renewalDate) return false;
      return isSameDay(parseISO(sub.renewalDate), date);
    });

    if (daySubscriptions.length > 0) {
      return 'has-renewal';
    }
    return null;
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3, borderRadius: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rounded" height={400} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rounded" height={400} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Get renewals for current month
  const currentMonthRenewals = subscriptions.filter((sub) => {
    if (!sub.renewalDate) return false;
    const renewalDate = parseISO(sub.renewalDate);
    const now = new Date();
    return (
      renewalDate.getMonth() === now.getMonth() &&
      renewalDate.getFullYear() === now.getFullYear()
    );
  });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Subscription Calendar
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View all your subscription renewal dates at a glance
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Calendar */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <style>
                {`
                  .react-calendar {
                    width: 100%;
                    border: none;
                    font-family: inherit;
                    background: transparent;
                    color: #FFFFFF;
                  }
                  .react-calendar__tile {
                    padding: 1em 0.5em;
                    position: relative;
                    color: #E5E5E5;
                  }
                  .react-calendar__tile--now {
                    background: rgba(229, 9, 20, 0.2) !important;
                    border-radius: 8px;
                  }
                  .react-calendar__tile--active {
                    background: #E50914 !important;
                    border-radius: 8px;
                    color: #FFFFFF !important;
                  }
                  .react-calendar__tile:hover {
                    background: rgba(229, 9, 20, 0.2);
                    border-radius: 8px;
                  }
                  .react-calendar__tile.has-renewal {
                    background: rgba(229, 9, 20, 0.15);
                    border-radius: 8px;
                  }
                  .react-calendar__navigation button {
                    color: #FFFFFF;
                    font-weight: 600;
                  }
                  .react-calendar__navigation button:hover {
                    background: rgba(229, 9, 20, 0.2);
                    border-radius: 8px;
                  }
                  .react-calendar__navigation button:disabled {
                    color: #666666;
                  }
                  .react-calendar__month-view__weekdays {
                    font-weight: 600;
                    color: #E50914;
                  }
                  .react-calendar__month-view__days__day--weekend {
                    color: #FF8C42;
                  }
                  .react-calendar__month-view__days__day--neighboringMonth {
                    color: #666666;
                  }
                `}
              </style>
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate}
                tileContent={tileContent}
                tileClassName={tileClassName}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Selected Date */}
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {format(selectedDate, 'MMMM d, yyyy')}
              </Typography>
              {selectedDateSubscriptions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No renewals on this date
                </Typography>
              ) : (
                <List sx={{ p: 0 }}>
                  {selectedDateSubscriptions.map((sub) => (
                    <ListItem key={sub.id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar
                          src={sub.subscriptionLogo}
                          sx={{ bgcolor: 'primary.light' }}
                        >
                          {getCategoryIcon(sub.category)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={sub.subscriptionName}
                        secondary={formatCurrency(sub.customPrice || sub.originalPrice)}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* This Month's Renewals */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                This Month's Renewals
              </Typography>
              {currentMonthRenewals.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No renewals this month
                </Typography>
              ) : (
                <List sx={{ p: 0 }}>
                  {currentMonthRenewals.map((sub) => (
                    <ListItem key={sub.id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar
                          src={sub.subscriptionLogo}
                          sx={{ bgcolor: 'primary.light', width: 36, height: 36 }}
                        >
                          {getCategoryIcon(sub.category)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={600}>
                            {sub.subscriptionName}
                          </Typography>
                        }
                        secondary={format(parseISO(sub.renewalDate), 'MMM d')}
                      />
                      <Chip
                        label={formatCurrency(sub.customPrice || sub.originalPrice)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SubscriptionCalendar;