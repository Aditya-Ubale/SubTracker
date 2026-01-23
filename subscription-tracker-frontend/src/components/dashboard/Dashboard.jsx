/**
 * Dashboard - SubTracker Dashboard (Polished)
 * 
 * DESIGN: Professional, human-designed SaaS dashboard
 * - Fixed header alignment
 * - Subtle visual enhancements
 * - Matched panel heights
 * - Clear hierarchy
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
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  ArrowForward,
  Download,
  CalendarToday,
  TrendingUp,
  CreditCard,
  AccountBalanceWallet,
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
import SuccessPopup from '../common/SuccessPopup';

// Import theme
import { colors, shadows, borderRadius, transitions, typography } from '../../styles/theme';

// ============================================
// FIXED HEIGHTS FOR LAYOUT ALIGNMENT
// ============================================
const CARD_HEIGHT = 400;

// ============================================
// HELPER FUNCTIONS
// ============================================

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// ============================================
// STATS CARD COMPONENT (Enhanced)
// ============================================

const StatsCard = ({ title, value, icon: Icon, accentColor, onClick }) => (
  <Card
    onClick={onClick}
    sx={{
      bgcolor: colors.bg.card,
      borderRadius: borderRadius.lg,
      border: `1px solid ${colors.border.default}`,
      boxShadow: shadows.sm,
      cursor: onClick ? 'pointer' : 'default',
      transition: transitions.default,
      position: 'relative',
      overflow: 'hidden',
      '&:hover': onClick ? {
        bgcolor: colors.bg.cardHover,
        borderColor: colors.border.hover,
        boxShadow: shadows.card,
        '& .stat-icon': {
          transform: 'scale(1.1)',
        },
      } : {},
    }}
  >
    {/* Subtle accent bar */}
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        bgcolor: accentColor,
        opacity: 0.6,
      }}
    />
    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          {/* Label */}
          <Typography
            sx={{
              fontSize: typography.fontSize.xs,
              color: colors.text.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: typography.fontWeight.medium,
              mb: 0.75,
            }}
          >
            {title}
          </Typography>

          {/* Value */}
          <Typography
            sx={{
              fontSize: '1.5rem',
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            {value}
          </Typography>
        </Box>

        {/* Icon */}
        {Icon && (
          <Box
            className="stat-icon"
            sx={{
              width: 40,
              height: 40,
              borderRadius: borderRadius.md,
              bgcolor: `${accentColor}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: transitions.default,
            }}
          >
            <Icon sx={{ fontSize: 20, color: accentColor }} />
          </Box>
        )}
      </Box>
    </CardContent>
  </Card>
);

// ============================================
// SUBSCRIPTION ITEM COMPONENT (Enhanced)
// ============================================

const SubscriptionItem = ({ subscription, onClick, isLast }) => {
  const days = subscription.renewalDate
    ? differenceInDays(parseISO(subscription.renewalDate), new Date())
    : null;

  const getStatusChip = () => {
    if (days === null) return null;
    if (days < 0) return { label: 'Overdue', color: colors.status.error };
    if (days === 0) return { label: 'Today', color: colors.status.warning };
    if (days <= 3) return { label: `${days}d`, color: colors.status.warning };
    return { label: `${days}d left`, color: colors.text.dim };
  };

  const status = getStatusChip();

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        py: 1.25,
        px: 2.5,
        cursor: 'pointer',
        transition: transitions.fast,
        borderBottom: !isLast ? `1px solid ${colors.border.divider}` : 'none',
        '&:hover': {
          bgcolor: colors.bg.cardHover,
        },
      }}
    >
      {/* Logo */}
      <Avatar
        src={subscription.subscriptionLogo}
        sx={{
          width: 36,
          height: 36,
          bgcolor: subscription.subscriptionLogo ? 'transparent' : colors.bg.tertiary,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          color: colors.text.secondary,
          border: `1px solid ${colors.border.default}`,
          mr: 1.5,
        }}
      >
        {subscription.subscriptionName?.[0] || '?'}
      </Avatar>

      {/* Name & Status */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: typography.fontWeight.medium,
            color: colors.text.primary,
            fontSize: typography.fontSize.base,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {subscription.subscriptionName}
        </Typography>
        {status && (
          <Typography
            sx={{
              fontSize: typography.fontSize.xs,
              color: status.color,
            }}
          >
            {status.label}
          </Typography>
        )}
      </Box>

      {/* Price */}
      <Typography
        sx={{
          fontWeight: typography.fontWeight.semibold,
          color: colors.text.primary,
          fontSize: typography.fontSize.base,
          ml: 2,
          flexShrink: 0,
        }}
      >
        {formatCurrency(subscription.customPrice || subscription.originalPrice)}
      </Typography>
    </Box>
  );
};

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSubscriptions: 0,
    monthlySpend: 0,
    upcomingRenewals: 0,
    unreadAlerts: 0,
    savings: 0,
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

      const savings = budget?.remainingBudget || 0;

      setStats({
        totalSubscriptions: subs.length,
        monthlySpend: budget?.subscriptionTotal || 0,
        upcomingRenewals: renewals.length,
        unreadAlerts: alertCount,
        savings: savings > 0 ? savings : 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.25 }}>
        <Box
          sx={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            bgcolor: colors.primary,
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

      doc.setFontSize(20);
      doc.setTextColor(50, 50, 50);
      doc.text('Subscription Report', pageWidth / 2, 25, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(`Generated ${format(new Date(), 'MMMM d, yyyy')}`, pageWidth / 2, 33, { align: 'center' });

      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      doc.text('Summary', 14, 50);

      doc.setFontSize(10);
      doc.text(`Active Subscriptions: ${stats.totalSubscriptions}`, 14, 60);
      doc.text(`Monthly Spend: ${formatCurrency(stats.monthlySpend)}`, 14, 68);
      doc.text(`Budget Remaining: ${formatCurrency(stats.savings)}`, 14, 76);

      if (subscriptions.length > 0) {
        doc.setFontSize(12);
        doc.text('Subscriptions', 14, 92);

        const tableData = subscriptions.map((sub) => [
          sub.subscriptionName,
          sub.category,
          sub.subscriptionType,
          formatCurrency(sub.customPrice || sub.originalPrice),
          formatDate(sub.renewalDate),
        ]);

        doc.autoTable({
          startY: 98,
          head: [['Name', 'Category', 'Billing', 'Price', 'Renews']],
          body: tableData,
          theme: 'plain',
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: [60, 60, 60],
            fontStyle: 'bold',
          },
          styles: { fontSize: 9, textColor: [80, 80, 80] },
          alternateRowStyles: { fillColor: [250, 250, 250] },
        });
      }

      doc.save(`subscriptions-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      setShowSuccessPopup(true);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setExportingPdf(false);
    }
  };

  // ============================================
  // LOADING STATE
  // ============================================

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1100, mx: 'auto', px: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width={220} height={32} sx={{ bgcolor: colors.bg.cardHover }} />
          <Skeleton variant="text" width={280} height={18} sx={{ bgcolor: colors.bg.tertiary, mt: 0.5 }} />
        </Box>

        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={4} key={i}>
              <Skeleton variant="rounded" height={110} sx={{ borderRadius: 2, bgcolor: colors.bg.cardHover }} />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2.5}>
          <Grid item xs={12} lg={7}>
            <Skeleton variant="rounded" height={CARD_HEIGHT} sx={{ borderRadius: 2, bgcolor: colors.bg.cardHover }} />
          </Grid>
          <Grid item xs={12} lg={5}>
            <Skeleton variant="rounded" height={CARD_HEIGHT} sx={{ borderRadius: 2, bgcolor: colors.bg.cardHover }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', px: 2 }}>
      <SuccessPopup
        open={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title="Export Complete"
        message="Your subscription report has been downloaded."
        icon="check"
      />

      {/* ============================================
          HEADER SECTION
      ============================================ */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography
            sx={{
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              fontSize: '1.625rem',
              letterSpacing: '-0.02em',
              lineHeight: 1.3,
            }}
          >
            {getGreeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </Typography>
          <Typography sx={{ color: colors.text.muted, fontSize: typography.fontSize.sm, mt: 0.25 }}>
            Subscription overview for {format(new Date(), 'MMMM yyyy')}
          </Typography>
        </Box>

        {/* Export button */}
        <Tooltip title="Export Report" arrow>
          <IconButton
            onClick={handleExportPdf}
            disabled={exportingPdf}
            sx={{
              bgcolor: colors.bg.card,
              border: `1px solid ${colors.border.default}`,
              borderRadius: borderRadius.md,
              width: 38,
              height: 38,
              '&:hover': {
                bgcolor: colors.bg.cardHover,
                borderColor: colors.border.hover,
              },
            }}
          >
            {exportingPdf ? (
              <CircularProgress size={16} sx={{ color: colors.text.muted }} />
            ) : (
              <Download sx={{ fontSize: 18, color: colors.text.secondary }} />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* ============================================
          STATS CARDS
      ============================================ */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <StatsCard
            title="Monthly Spend"
            value={formatCurrency(stats.monthlySpend)}
            accentColor={colors.primary}
            onClick={() => navigate('/budget')}
            icon={TrendingUp}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <StatsCard
            title="Active Subscriptions"
            value={stats.totalSubscriptions}
            accentColor={colors.accent.indigo}
            onClick={() => navigate('/subscriptions')}
            icon={CreditCard}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <StatsCard
            title="Budget Remaining"
            value={formatCurrency(stats.savings)}
            accentColor={colors.accent.green}
            onClick={() => navigate('/budget')}
            icon={AccountBalanceWallet}
          />
        </Grid>
      </Grid>

      {/* ============================================
          MAIN CONTENT - Two Columns (Matched Heights)
      ============================================ */}
      <Grid container spacing={2.5} sx={{ alignItems: 'stretch' }}>
        {/* Left Column - Subscriptions List */}
        <Grid item xs={12} lg={7}>
          <Card
            sx={{
              bgcolor: colors.bg.card,
              borderRadius: borderRadius.lg,
              border: `1px solid ${colors.border.default}`,
              boxShadow: shadows.sm,
              height: CARD_HEIGHT,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Card Header - FIXED ALIGNMENT */}
            <Box
              sx={{
                px: 2.5,
                py: 1.75,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: `1px solid ${colors.border.default}`,
                flexShrink: 0,
              }}
            >
              <Typography
                sx={{
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.primary,
                  fontSize: typography.fontSize.lg,
                }}
              >
                Active Subscriptions
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<Add sx={{ fontSize: 16 }} />}
                onClick={() => navigate('/subscriptions/add')}
                sx={{
                  bgcolor: colors.primary,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  px: 1.75,
                  py: 0.5,
                  minHeight: 32,
                  borderRadius: borderRadius.md,
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: colors.primaryLight,
                  },
                  transition: transitions.fast,
                }}
              >
                Add New
              </Button>
            </Box>

            {/* Subscription count */}
            <Box sx={{ px: 2.5, py: 1, borderBottom: `1px solid ${colors.border.divider}`, flexShrink: 0 }}>
              <Typography sx={{ fontSize: typography.fontSize.xs, color: colors.text.muted }}>
                {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}
              </Typography>
            </Box>

            {/* Subscription List - Scrollable */}
            <CardContent sx={{ p: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {subscriptions.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography sx={{ color: colors.text.secondary, mb: 0.5, fontSize: typography.fontSize.base }}>
                    No subscriptions yet
                  </Typography>
                  <Typography sx={{ color: colors.text.dim, fontSize: typography.fontSize.sm, mb: 2 }}>
                    Track your first subscription to get started
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={() => navigate('/subscriptions/add')}
                    sx={{
                      borderColor: colors.border.hover,
                      color: colors.text.secondary,
                      alignSelf: 'center',
                      borderRadius: borderRadius.md,
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: colors.text.muted,
                        bgcolor: colors.bg.cardHover,
                      },
                    }}
                  >
                    Add Subscription
                  </Button>
                </Box>
              ) : (
                <Box
                  sx={{
                    flex: 1,
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': {
                      width: '3px',
                    },
                    '&::-webkit-scrollbar-track': {
                      bgcolor: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      bgcolor: colors.border.hover,
                      borderRadius: '2px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      bgcolor: colors.text.dim,
                    },
                  }}
                >
                  {subscriptions.map((subscription, index) => (
                    <SubscriptionItem
                      key={subscription.id}
                      subscription={subscription}
                      onClick={() => navigate(`/subscriptions/${subscription.id}`)}
                      isLast={index === subscriptions.length - 1}
                    />
                  ))}
                </Box>
              )}

              {/* View All link */}
              {subscriptions.length > 0 && (
                <Box
                  onClick={() => navigate('/subscriptions')}
                  sx={{
                    px: 2.5,
                    py: 1.25,
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderTop: `1px solid ${colors.border.default}`,
                    transition: transitions.fast,
                    flexShrink: 0,
                    '&:hover': {
                      bgcolor: colors.bg.cardHover,
                    },
                  }}
                >
                  <Typography
                    sx={{
                      color: colors.text.muted,
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.5,
                      '&:hover': {
                        color: colors.text.secondary,
                      },
                    }}
                  >
                    View all subscriptions
                    <ArrowForward sx={{ fontSize: 14 }} />
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Calendar */}
        <Grid item xs={12} lg={5}>
          <Card
            sx={{
              bgcolor: colors.bg.card,
              borderRadius: borderRadius.lg,
              border: `1px solid ${colors.border.default}`,
              boxShadow: shadows.sm,
              height: CARD_HEIGHT,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexShrink: 0 }}>
                <CalendarToday sx={{ fontSize: 18, color: colors.text.muted }} />
                <Typography
                  sx={{
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.text.primary,
                    fontSize: typography.fontSize.lg,
                  }}
                >
                  Renewal Calendar
                </Typography>
              </Box>

              {/* Calendar */}
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  '& .react-calendar': {
                    width: '100%',
                    bgcolor: 'transparent',
                    border: 'none',
                    fontFamily: 'inherit',
                  },
                  '& .react-calendar__navigation': {
                    mb: 0.5,
                  },
                  '& .react-calendar__navigation button': {
                    color: colors.text.secondary,
                    fontSize: typography.fontSize.sm,
                    minWidth: 32,
                    borderRadius: borderRadius.sm,
                    '&:hover': {
                      bgcolor: colors.bg.cardHover,
                    },
                    '&:disabled': {
                      bgcolor: 'transparent',
                      color: colors.text.dim,
                    },
                  },
                  '& .react-calendar__month-view__weekdays': {
                    textTransform: 'uppercase',
                    fontSize: '10px',
                    fontWeight: typography.fontWeight.medium,
                    color: colors.text.dim,
                  },
                  '& .react-calendar__month-view__weekdays abbr': {
                    textDecoration: 'none',
                  },
                  '& .react-calendar__tile': {
                    color: colors.text.secondary,
                    fontSize: typography.fontSize.sm,
                    padding: '0.4em 0.2em',
                    borderRadius: borderRadius.sm,
                    '&:hover': {
                      bgcolor: colors.bg.cardHover,
                    },
                  },
                  '& .react-calendar__tile--now': {
                    bgcolor: colors.primaryMuted,
                    color: colors.text.primary,
                    fontWeight: typography.fontWeight.medium,
                  },
                  '& .react-calendar__tile--active': {
                    bgcolor: `${colors.primary} !important`,
                    color: `${colors.white} !important`,
                  },
                  '& .react-calendar__tile.has-renewal': {
                    fontWeight: typography.fontWeight.medium,
                    color: colors.text.primary,
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
                <Box
                  sx={{
                    mt: 1.5,
                    pt: 1.5,
                    borderTop: `1px solid ${colors.border.default}`,
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.text.dim,
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      mb: 1,
                    }}
                  >
                    Renewals on {format(selectedDate, 'MMM d')}
                  </Typography>
                  {selectedDateSubscriptions.map((sub) => (
                    <Box
                      key={sub.id}
                      onClick={() => navigate(`/subscriptions/${sub.id}`)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        py: 0.75,
                        px: 1.25,
                        borderRadius: borderRadius.md,
                        cursor: 'pointer',
                        transition: transitions.fast,
                        mb: 0.5,
                        '&:hover': {
                          bgcolor: colors.bg.cardHover,
                        },
                        '&:last-child': { mb: 0 },
                      }}
                    >
                      <Avatar
                        src={sub.subscriptionLogo}
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor: colors.bg.tertiary,
                          fontSize: typography.fontSize.xs,
                          color: colors.text.secondary,
                          border: `1px solid ${colors.border.default}`,
                        }}
                      >
                        {sub.subscriptionName?.[0]}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: typography.fontSize.sm,
                            fontWeight: typography.fontWeight.medium,
                            color: colors.text.primary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {sub.subscriptionName}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          fontSize: typography.fontSize.sm,
                          fontWeight: typography.fontWeight.semibold,
                          color: colors.text.primary,
                          flexShrink: 0,
                        }}
                      >
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