/**
 * Dashboard - Modern Fintech Dashboard
 * 
 * Design System: Linear/Vercel/Stripe inspired
 * - Soft dark theme (not harsh black)
 * - Spacious layout with clear hierarchy
 * - Subtle gradients and shadows
 * - Premium card-based design
 * - Smooth micro-interactions
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Skeleton,
  Avatar,
  IconButton,
  Chip,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  ArrowForward,
  Download,
  CalendarToday,
  MoreHoriz,
  TrendingUp,
  Schedule,
  NorthEast,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, isSameDay, parseISO, differenceInDays } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { subscriptionAPI, budgetAPI, alertAPI } from '../../services/api';
import { formatCurrency, formatDate, getCategoryIcon } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import StatsCard from './StatsCard';
import SuccessPopup from '../common/SuccessPopup';

// Get greeting based on time
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSubscriptions: 0,
    monthlySpend: 0,
    upcomingRenewals: 0,
    unreadAlerts: 0,
  });
  const [subscriptions, setSubscriptions] = useState([]);
  const [budgetSummary, setBudgetSummary] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDateSubscriptions, setSelectedDateSubscriptions] = useState([]);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const filtered = subscriptions.filter((sub) => {
      if (!sub.renewalDate) return false;
      return isSameDay(parseISO(sub.renewalDate), selectedDate);
    });
    setSelectedDateSubscriptions(filtered);
  }, [selectedDate, subscriptions]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [subsResponse, budgetResponse, renewalsResponse, alertsResponse] =
        await Promise.all([
          subscriptionAPI.getUserSubscriptions(),
          budgetAPI.getBudgetSummary(),
          subscriptionAPI.getUpcomingRenewals(7),
          alertAPI.getUnreadCount(),
        ]);

      const subs = subsResponse.data.data || [];
      const budget = budgetResponse.data.data;
      const renewals = renewalsResponse.data.data || [];
      const alertCount = alertsResponse.data.data || 0;

      setSubscriptions(subs);
      setBudgetSummary(budget);
      setStats({
        totalSubscriptions: subs.length,
        monthlySpend: budget?.subscriptionTotal || 0,
        upcomingRenewals: renewals.length,
        unreadAlerts: alertCount,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isUrgentRenewal = (renewalDate) => {
    if (!renewalDate) return false;
    const days = differenceInDays(parseISO(renewalDate), new Date());
    return days >= 0 && days <= 3;
  };

  // Get status badge for subscription
  const getStatusBadge = (subscription) => {
    if (!subscription.renewalDate) return null;
    const days = differenceInDays(parseISO(subscription.renewalDate), new Date());

    if (days < 0) return { label: 'Expired', color: 'error' };
    if (days <= 3) return { label: 'Renewing Soon', color: 'warning' };
    if (days <= 7) return { label: 'This Week', color: 'info' };
    return { label: 'Active', color: 'success' };
  };

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const daySubscriptions = subscriptions.filter((sub) => {
      if (!sub.renewalDate) return false;
      return isSameDay(parseISO(sub.renewalDate), date);
    });
    if (daySubscriptions.length === 0) return null;
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
        <Box
          sx={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            bgcolor: daySubscriptions.length > 1 ? '#f59e0b' : '#6366f1',
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
    if (daySubscriptions.length > 0) return 'has-renewal';
    return null;
  };

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(24);
      doc.setTextColor(99, 102, 241);
      doc.text('SubTracker Report', pageWidth / 2, 25, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(`Generated on ${format(new Date(), 'MMM d, yyyy')}`, pageWidth / 2, 35, { align: 'center' });

      doc.setFontSize(14);
      doc.setTextColor(50, 50, 50);
      doc.text('Monthly Overview', 14, 55);

      doc.setFontSize(10);
      doc.text(`Total Subscriptions: ${stats.totalSubscriptions}`, 14, 65);
      doc.text(`Monthly Spend: ${formatCurrency(stats.monthlySpend)}`, 14, 73);
      doc.text(`Upcoming Renewals: ${stats.upcomingRenewals}`, 14, 81);

      if (subscriptions.length > 0) {
        doc.setFontSize(14);
        doc.text('Active Subscriptions', 14, 100);

        const tableData = subscriptions.map((sub) => [
          sub.subscriptionName,
          sub.category,
          sub.subscriptionType,
          formatCurrency(sub.customPrice || sub.originalPrice),
          formatDate(sub.renewalDate),
        ]);

        doc.autoTable({
          startY: 108,
          head: [['Name', 'Category', 'Billing', 'Price', 'Next Renewal']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [99, 102, 241] },
          styles: { fontSize: 9 },
        });
      }

      doc.save(`subtracker-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      setShowSuccessPopup(true);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={6} md={3} key={i}>
              <Skeleton variant="rounded" height={140} sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)' }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <SuccessPopup
        open={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title="Report Exported"
        message="Your subscription report has been downloaded."
        icon="check"
      />

      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: '#fff',
              fontSize: '1.75rem',
              letterSpacing: '-0.02em',
              mb: 0.5,
            }}
          >
            {getGreeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
          </Typography>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.9375rem' }}>
            Here's your subscription overview for {format(new Date(), 'MMMM yyyy')}
          </Typography>
        </Box>

        {/* Export button - subtle */}
        <Tooltip title="Export Report">
          <IconButton
            onClick={handleExportPdf}
            disabled={exportingPdf}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            {exportingPdf ? (
              <CircularProgress size={20} sx={{ color: 'rgba(255,255,255,0.5)' }} />
            ) : (
              <Download sx={{ fontSize: 20, color: 'rgba(255, 255, 255, 0.6)' }} />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <StatsCard
            title="Subscriptions"
            value={stats.totalSubscriptions}
            icon="📊"
            color="#6366f1"
            onClick={() => navigate('/subscriptions')}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatsCard
            title="Monthly Spend"
            value={formatCurrency(stats.monthlySpend)}
            icon="💰"
            color="#10b981"
            onClick={() => navigate('/budget')}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatsCard
            title="Renewals"
            value={stats.upcomingRenewals}
            subtitle="Next 7 days"
            icon="📅"
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatsCard
            title="Alerts"
            value={stats.unreadAlerts}
            icon="🔔"
            color={stats.unreadAlerts > 0 ? '#ef4444' : '#6b7280'}
            onClick={() => navigate('/alerts')}
          />
        </Grid>
      </Grid>

      {/* Main Content - 2 columns */}
      <Grid container spacing={3}>
        {/* Left Column - Subscriptions */}
        <Grid item xs={12} lg={8}>
          {/* Active Subscriptions Card */}
          <Card
            sx={{
              bgcolor: 'rgba(22, 22, 26, 0.8)',
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.06)',
              mb: 3,
              height: 460,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CardContent sx={{ p: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Card Header */}
              <Box
                sx={{
                  p: 3,
                  pb: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 600, color: '#fff', fontSize: '1.0625rem' }}>
                    Active Subscriptions
                  </Typography>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.8125rem', mt: 0.25 }}>
                    {subscriptions.length} active subscription{subscriptions.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Add sx={{ fontSize: 18 }} />}
                  onClick={() => navigate('/subscriptions/add')}
                  sx={{
                    bgcolor: '#6366f1',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    px: 2,
                    py: 0.75,
                    borderRadius: 2,
                    textTransform: 'none',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
                    '&:hover': {
                      bgcolor: '#4f46e5',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                    },
                    transition: 'all 0.15s ease',
                  }}
                >
                  Add New
                </Button>
              </Box>

              {/* Subscription List */}
              {subscriptions.length === 0 ? (
                <Box sx={{ p: 6, textAlign: 'center' }}>
                  <Box sx={{ fontSize: '2.5rem', mb: 2, opacity: 0.6 }}>📭</Box>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 1 }}>
                    No subscriptions yet
                  </Typography>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.875rem', mb: 3 }}>
                    Start tracking your subscriptions to manage your spending
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => navigate('/subscriptions/add')}
                    sx={{
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&:hover': {
                        borderColor: '#6366f1',
                        bgcolor: 'rgba(99, 102, 241, 0.1)',
                      },
                    }}
                  >
                    Add Your First Subscription
                  </Button>
                </Box>
              ) : (
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  {subscriptions.slice(0, 5).map((subscription, index) => {
                    const status = getStatusBadge(subscription);
                    return (
                      <Box
                        key={subscription.id}
                        onClick={() => navigate(`/subscriptions/${subscription.id}`)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 2.5,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          borderBottom:
                            index < subscriptions.slice(0, 5).length - 1
                              ? '1px solid rgba(255, 255, 255, 0.04)'
                              : 'none',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.03)',
                          },
                        }}
                      >
                        {/* Left: Logo + Info */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={subscription.subscriptionLogo}
                            sx={{
                              width: 44,
                              height: 44,
                              bgcolor: 'rgba(99, 102, 241, 0.12)',
                              fontSize: '1.25rem',
                            }}
                          >
                            {getCategoryIcon(subscription.category)}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 500, color: '#fff', fontSize: '0.9375rem' }}>
                              {subscription.subscriptionName}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                              <Typography sx={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.8125rem' }}>
                                {subscription.subscriptionType}
                              </Typography>
                              <Typography sx={{ color: 'rgba(255, 255, 255, 0.25)' }}>•</Typography>
                              <Typography
                                sx={{
                                  color: isUrgentRenewal(subscription.renewalDate)
                                    ? '#f59e0b'
                                    : 'rgba(255, 255, 255, 0.45)',
                                  fontSize: '0.8125rem',
                                  fontWeight: isUrgentRenewal(subscription.renewalDate) ? 500 : 400,
                                }}
                              >
                                {formatDate(subscription.renewalDate)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        {/* Right: Price + Status */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {status && (
                            <Chip
                              label={status.label}
                              size="small"
                              sx={{
                                height: 24,
                                fontSize: '0.6875rem',
                                fontWeight: 500,
                                bgcolor:
                                  status.color === 'success'
                                    ? 'rgba(34, 197, 94, 0.12)'
                                    : status.color === 'warning'
                                      ? 'rgba(245, 158, 11, 0.12)'
                                      : status.color === 'error'
                                        ? 'rgba(239, 68, 68, 0.12)'
                                        : 'rgba(99, 102, 241, 0.12)',
                                color:
                                  status.color === 'success'
                                    ? '#22c55e'
                                    : status.color === 'warning'
                                      ? '#f59e0b'
                                      : status.color === 'error'
                                        ? '#ef4444'
                                        : '#6366f1',
                                border: 'none',
                              }}
                            />
                          )}
                          <Typography
                            sx={{
                              fontWeight: 600,
                              color: '#fff',
                              fontSize: '0.9375rem',
                              minWidth: 70,
                              textAlign: 'right',
                            }}
                          >
                            {formatCurrency(subscription.customPrice || subscription.originalPrice)}
                          </Typography>
                          <NorthEast
                            sx={{
                              fontSize: 18,
                              color: 'rgba(255, 255, 255, 0.3)',
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}

                  {/* View All link */}
                  {subscriptions.length > 5 && (
                    <Box
                      onClick={() => navigate('/subscriptions')}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        cursor: 'pointer',
                        borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.03)',
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          color: '#6366f1',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 0.5,
                        }}
                      >
                        View all {subscriptions.length} subscriptions
                        <ArrowForward sx={{ fontSize: 16 }} />
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Calendar */}
        <Grid item xs={12} lg={4}>
          <Card
            sx={{
              bgcolor: 'rgba(22, 22, 26, 0.8)',
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CalendarToday sx={{ fontSize: 18, color: 'rgba(255, 255, 255, 0.5)' }} />
                <Typography sx={{ fontWeight: 600, color: '#fff', fontSize: '1rem' }}>
                  Renewal Calendar
                </Typography>
              </Box>

              {/* Calendar with custom styling */}
              <Box
                sx={{
                  '& .react-calendar': {
                    width: '100%',
                    bgcolor: 'transparent',
                    border: 'none',
                    fontFamily: 'inherit',
                  },
                  '& .react-calendar__navigation': {
                    mb: 1,
                  },
                  '& .react-calendar__navigation button': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.875rem',
                    minWidth: 36,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                    },
                    '&:disabled': {
                      bgcolor: 'transparent',
                    },
                  },
                  '& .react-calendar__month-view__weekdays': {
                    textTransform: 'uppercase',
                    fontSize: '0.625rem',
                    fontWeight: 500,
                    color: 'rgba(255, 255, 255, 0.4)',
                  },
                  '& .react-calendar__month-view__weekdays abbr': {
                    textDecoration: 'none',
                  },
                  '& .react-calendar__tile': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.8125rem',
                    padding: '0.5em 0.25em',
                    borderRadius: '8px',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                    },
                  },
                  '& .react-calendar__tile--now': {
                    bgcolor: 'rgba(99, 102, 241, 0.15)',
                    color: '#6366f1',
                    fontWeight: 600,
                  },
                  '& .react-calendar__tile--active': {
                    bgcolor: '#6366f1 !important',
                    color: '#fff !important',
                  },
                  '& .react-calendar__tile.has-renewal': {
                    fontWeight: 600,
                    color: '#fff',
                  },
                }}
              >
                <Calendar
                  onChange={setSelectedDate}
                  value={selectedDate}
                  tileContent={tileContent}
                  tileClassName={tileClassName}
                />
              </Box>

              {/* Selected Date Subscriptions */}
              {selectedDateSubscriptions.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: 'rgba(255, 255, 255, 0.4)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      mb: 1.5,
                    }}
                  >
                    Renewals on {format(selectedDate, 'MMM d')}
                  </Typography>
                  {selectedDateSubscriptions.map((sub) => (
                    <Box
                      key={sub.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.03)',
                        mb: 1,
                      }}
                    >
                      <Avatar
                        src={sub.subscriptionLogo}
                        sx={{ width: 32, height: 32, bgcolor: 'rgba(99, 102, 241, 0.12)', fontSize: '0.875rem' }}
                      >
                        {getCategoryIcon(sub.category)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#fff' }}>
                          {sub.subscriptionName}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff' }}>
                        {formatCurrency(sub.customPrice || sub.originalPrice)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;