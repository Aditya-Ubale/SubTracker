/**
 * Dashboard - SubTracker Dashboard (Redesigned)
 * 
 * DESIGN: Premium SaaS dashboard inspired by Stripe / Linear / Vercel
 * - 12-column responsive grid with max-width 1400px
 * - Balanced layout with no empty space
 * - Glass-effect cards with hover animations
 * - Consistent 8px spacing grid
 * - Clean typography hierarchy
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
  Tooltip,
  CircularProgress,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Add,
  ArrowForward,
  Download,
  CalendarToday,
  TrendingUp,
  CreditCard,
  AccountBalanceWallet,
  NotificationsNone,
  ArrowUpward,
  ArrowDownward,
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
// DESIGN TOKENS (Dashboard-specific)
// ============================================
const DASHBOARD_MAX_WIDTH = 1400;
const SECTION_GAP = 4; // 32px (MUI spacing unit = 8px)
const CARD_GAP = 3; // 24px
const CARD_PADDING = 3; // 24px
const CARD_RADIUS = borderRadius.xl; // 16px
const MAIN_CARD_MIN_HEIGHT = 440;

// Glassmorphism card base style
const glassCard = {
  bgcolor: 'rgba(26, 26, 31, 0.7)',
  backdropFilter: 'blur(12px)',
  borderRadius: CARD_RADIUS,
  border: `1px solid ${colors.border.default}`,
  boxShadow: shadows.elevated,
  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'hidden',
  '&:hover': {
    borderColor: colors.border.hover,
    boxShadow: shadows.cardHover,
    transform: 'translateY(-2px)',
  },
};

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
// STATS CARD COMPONENT (Premium)
// ============================================

const StatsCard = ({ title, value, icon: Icon, accentColor, onClick, subtitle }) => (
  <Card
    onClick={onClick}
    sx={{
      ...glassCard,
      cursor: onClick ? 'pointer' : 'default',
      position: 'relative',
      '&:hover': onClick ? {
        ...glassCard['&:hover'],
        '& .stat-icon': {
          transform: 'scale(1.1) rotate(5deg)',
        },
        '& .stat-accent': {
          opacity: 0.15,
          transform: 'scale(1.2)',
        },
      } : {},
    }}
  >
    {/* Background accent glow */}
    <Box
      className="stat-accent"
      sx={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 100,
        height: 100,
        borderRadius: '50%',
        bgcolor: accentColor,
        opacity: 0.06,
        filter: 'blur(30px)',
        transition: 'all 0.4s ease',
      }}
    />

    {/* Top accent line */}
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: `linear-gradient(90deg, ${accentColor}, transparent)`,
        opacity: 0.5,
      }}
    />

    <CardContent sx={{ p: CARD_PADDING, '&:last-child': { pb: CARD_PADDING } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Label */}
          <Typography
            sx={{
              fontSize: '0.6875rem',
              color: colors.text.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
              mb: 1.25,
            }}
          >
            {title}
          </Typography>

          {/* Value */}
          <Typography
            sx={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: colors.text.primary,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            {value}
          </Typography>

          {/* Subtitle */}
          {subtitle && (
            <Typography
              sx={{
                fontSize: '0.8125rem',
                color: colors.text.dim,
                mt: 0.75,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {/* Icon */}
        {Icon && (
          <Box
            className="stat-icon"
            sx={{
              width: 44,
              height: 44,
              borderRadius: borderRadius.lg,
              bgcolor: `${accentColor}12`,
              border: `1px solid ${accentColor}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              flexShrink: 0,
            }}
          >
            <Icon sx={{ fontSize: 22, color: accentColor }} />
          </Box>
        )}
      </Box>
    </CardContent>
  </Card>
);

// ============================================
// SUBSCRIPTION ITEM COMPONENT (Premium)
// ============================================

const SubscriptionItem = ({ subscription, onClick, isLast }) => {
  const days = subscription.renewalDate
    ? differenceInDays(parseISO(subscription.renewalDate), new Date())
    : null;

  const getStatusChip = () => {
    if (days === null) return null;
    if (days < 0) return { label: 'Overdue', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', glow: '0 0 12px rgba(239, 68, 68, 0.2)' };
    if (days === 0) return { label: 'Today', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', glow: 'none' };
    if (days <= 3) return { label: `${days}d left`, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', glow: 'none' };
    if (days <= 7) return { label: `${days}d left`, color: colors.text.muted, bg: 'transparent', glow: 'none' };
    return null;
  };

  const status = getStatusChip();

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        py: 1.5,
        px: CARD_PADDING,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        borderBottom: !isLast ? `1px solid ${colors.border.divider}` : 'none',
        '&:hover': {
          bgcolor: 'rgba(255, 255, 255, 0.03)',
          '& .sub-arrow': {
            opacity: 1,
            transform: 'translateX(0)',
          },
        },
      }}
    >
      {/* Logo */}
      <Avatar
        src={subscription.subscriptionLogo}
        sx={{
          width: 38,
          height: 38,
          bgcolor: subscription.subscriptionLogo ? 'transparent' : colors.bg.tertiary,
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: colors.text.secondary,
          border: `1px solid ${colors.border.default}`,
          mr: 2,
          flexShrink: 0,
        }}
      >
        {subscription.subscriptionName?.[0] || '?'}
      </Avatar>

      {/* Name & Plan */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 500,
            color: colors.text.primary,
            fontSize: '0.875rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.4,
          }}
        >
          {subscription.subscriptionName}
        </Typography>
        <Typography
          sx={{
            fontSize: '0.75rem',
            color: colors.text.dim,
            lineHeight: 1.4,
          }}
        >
          {subscription.subscriptionType || 'Monthly'}
        </Typography>
      </Box>

      {/* Status Badge */}
      {status && (
        <Chip
          label={status.label}
          size="small"
          sx={{
            height: 22,
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: status.color,
            bgcolor: status.bg,
            border: 'none',
            borderRadius: borderRadius.full,
            boxShadow: status.glow,
            mr: 1.5,
            '& .MuiChip-label': { px: 1 },
          }}
        />
      )}

      {/* Price */}
      <Typography
        sx={{
          fontWeight: 600,
          color: colors.text.primary,
          fontSize: '0.875rem',
          flexShrink: 0,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {formatCurrency(subscription.customPrice || subscription.originalPrice)}
      </Typography>

      {/* Arrow indicator */}
      <ArrowForward
        className="sub-arrow"
        sx={{
          fontSize: 14,
          color: colors.text.dim,
          ml: 1,
          opacity: 0,
          transform: 'translateX(-4px)',
          transition: 'all 0.15s ease',
        }}
      />
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
    budgetLimit: 0,
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
        budgetLimit: budget?.monthlyBudget || 0,
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

  // Budget usage percentage
  const budgetUsage = stats.budgetLimit > 0 ? Math.min((stats.monthlySpend / stats.budgetLimit) * 100, 100) : 0;
  const budgetColor = budgetUsage > 90 ? colors.status.error : budgetUsage > 70 ? colors.status.warning : colors.accent.green;

  // ============================================
  // LOADING STATE
  // ============================================

  if (loading) {
    return (
      <Box sx={{ maxWidth: DASHBOARD_MAX_WIDTH, mx: 'auto', px: { xs: 2, md: 3 } }}>
        <Box sx={{ mb: SECTION_GAP }}>
          <Skeleton variant="text" width={260} height={36} sx={{ bgcolor: colors.bg.cardHover, borderRadius: 1 }} />
          <Skeleton variant="text" width={300} height={20} sx={{ bgcolor: colors.bg.tertiary, mt: 0.5, borderRadius: 1 }} />
        </Box>

        <Grid container spacing={CARD_GAP} sx={{ mb: SECTION_GAP }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
              <Skeleton variant="rounded" height={130} sx={{ borderRadius: CARD_RADIUS, bgcolor: colors.bg.cardHover }} />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={CARD_GAP}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Skeleton variant="rounded" height={MAIN_CARD_MIN_HEIGHT} sx={{ borderRadius: CARD_RADIUS, bgcolor: colors.bg.cardHover }} />
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Skeleton variant="rounded" height={MAIN_CARD_MIN_HEIGHT} sx={{ borderRadius: CARD_RADIUS, bgcolor: colors.bg.cardHover }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <Box sx={{ maxWidth: DASHBOARD_MAX_WIDTH, mx: 'auto', px: { xs: 2, md: 3 } }}>
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
      <Box
        sx={{
          mb: SECTION_GAP,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontWeight: 700,
              color: colors.text.primary,
              fontSize: { xs: '1.5rem', md: '1.75rem' },
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
            }}
          >
            {getGreeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </Typography>
          <Typography
            sx={{
              color: colors.text.muted,
              fontSize: '0.875rem',
              mt: 0.5,
              letterSpacing: '0.01em',
            }}
          >
            Here's your subscription overview for {format(new Date(), 'MMMM yyyy')}
          </Typography>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={exportingPdf ? <CircularProgress size={14} sx={{ color: colors.text.muted }} /> : <Download sx={{ fontSize: 16 }} />}
            onClick={handleExportPdf}
            disabled={exportingPdf}
            sx={{
              borderColor: colors.border.hover,
              color: colors.text.secondary,
              borderRadius: borderRadius.md,
              textTransform: 'none',
              px: 2,
              py: 0.75,
              fontSize: '0.8125rem',
              fontWeight: 500,
              '&:hover': {
                borderColor: colors.text.muted,
                bgcolor: 'rgba(255, 255, 255, 0.04)',
              },
            }}
          >
            Export
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<Add sx={{ fontSize: 18 }} />}
            onClick={() => navigate('/subscriptions/add')}
            sx={{
              bgcolor: colors.primary,
              color: '#fff',
              borderRadius: borderRadius.md,
              textTransform: 'none',
              px: 2.5,
              py: 0.75,
              fontSize: '0.8125rem',
              fontWeight: 500,
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
              '&:hover': {
                bgcolor: colors.primaryLight,
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.3)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Add Subscription
          </Button>
        </Box>
      </Box>

      {/* ============================================
          STATS CARDS ROW (4 equal columns)
      ============================================ */}
      <Grid container spacing={CARD_GAP} sx={{ mb: SECTION_GAP }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Monthly Spend"
            value={formatCurrency(stats.monthlySpend)}
            accentColor={colors.primary}
            onClick={() => navigate('/budget')}
            icon={TrendingUp}
            subtitle="this month"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Active Subscriptions"
            value={stats.totalSubscriptions}
            accentColor={colors.accent.indigo}
            onClick={() => navigate('/subscriptions')}
            icon={CreditCard}
            subtitle="services tracked"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Budget Remaining"
            value={formatCurrency(stats.savings)}
            accentColor={colors.accent.green}
            onClick={() => navigate('/budget')}
            icon={AccountBalanceWallet}
            subtitle={stats.budgetLimit > 0 ? `of ${formatCurrency(stats.budgetLimit)}` : 'set a budget'}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Upcoming Renewals"
            value={stats.upcomingRenewals}
            accentColor={colors.accent.orange}
            onClick={() => navigate('/alerts')}
            icon={NotificationsNone}
            subtitle="next 7 days"
          />
        </Grid>
      </Grid>

      {/* ============================================
          BUDGET PROGRESS BAR (Compact strip)
      ============================================ */}
      {stats.budgetLimit > 0 && (
        <Card
          sx={{
            ...glassCard,
            mb: SECTION_GAP,
            '&:hover': {
              ...glassCard['&:hover'],
              transform: 'none',
            },
          }}
        >
          <CardContent sx={{ px: CARD_PADDING, py: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: colors.text.secondary }}>
                Budget Usage
              </Typography>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: budgetColor }}>
                {budgetUsage.toFixed(0)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={budgetUsage}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'rgba(255, 255, 255, 0.06)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: budgetColor,
                  borderRadius: 3,
                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                },
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75 }}>
              <Typography sx={{ fontSize: '0.6875rem', color: colors.text.dim }}>
                {formatCurrency(stats.monthlySpend)} spent
              </Typography>
              <Typography sx={{ fontSize: '0.6875rem', color: colors.text.dim }}>
                {formatCurrency(stats.budgetLimit)} limit
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ============================================
          MAIN CONTENT - Two Columns
          Left: Active Subscriptions (60%)
          Right: Renewal Calendar (40%)
      ============================================ */}
      <Grid container spacing={CARD_GAP} sx={{ alignItems: 'stretch' }}>
        {/* ---- LEFT: Active Subscriptions ---- */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card
            sx={{
              ...glassCard,
              minHeight: MAIN_CARD_MIN_HEIGHT,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              '&:hover': {
                ...glassCard['&:hover'],
                transform: 'none',
              },
            }}
          >
            {/* Card Header */}
            <Box
              sx={{
                px: CARD_PADDING,
                py: 2.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: `1px solid ${colors.border.default}`,
                flexShrink: 0,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: colors.text.primary,
                    fontSize: '1.125rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Active Subscriptions
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: colors.text.dim, mt: 0.25 }}>
                  {subscriptions.length} service{subscriptions.length !== 1 ? 's' : ''} tracked
                </Typography>
              </Box>
              <Button
                size="small"
                endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                onClick={() => navigate('/subscriptions')}
                sx={{
                  color: colors.text.muted,
                  textTransform: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  borderRadius: borderRadius.md,
                  px: 1.5,
                  '&:hover': {
                    color: colors.text.primary,
                    bgcolor: 'rgba(255, 255, 255, 0.04)',
                  },
                }}
              >
                View all
              </Button>
            </Box>

            {/* Subscription List */}
            <CardContent sx={{ p: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {subscriptions.length === 0 ? (
                <Box sx={{
                  p: 5, textAlign: 'center', flex: 1,
                  display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: borderRadius.xl,
                      bgcolor: 'rgba(255, 255, 255, 0.03)',
                      border: `1px dashed ${colors.border.hover}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2.5,
                    }}
                  >
                    <CreditCard sx={{ fontSize: 28, color: colors.text.dim }} />
                  </Box>
                  <Typography sx={{ color: colors.text.secondary, mb: 0.5, fontSize: '0.9375rem', fontWeight: 500 }}>
                    No subscriptions yet
                  </Typography>
                  <Typography sx={{ color: colors.text.dim, fontSize: '0.8125rem', mb: 3, maxWidth: 260 }}>
                    Start tracking your subscriptions to see spending insights
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={() => navigate('/subscriptions/add')}
                    sx={{
                      borderColor: colors.border.hover,
                      color: colors.text.secondary,
                      borderRadius: borderRadius.md,
                      textTransform: 'none',
                      px: 2.5,
                      '&:hover': {
                        borderColor: colors.text.muted,
                        bgcolor: 'rgba(255, 255, 255, 0.04)',
                      },
                    }}
                  >
                    Add Your First Subscription
                  </Button>
                </Box>
              ) : (
                <Box
                  sx={{
                    flex: 1,
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': { width: '4px' },
                    '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                    '&::-webkit-scrollbar-thumb': {
                      bgcolor: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '2px',
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.15)' },
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
            </CardContent>
          </Card>
        </Grid>

        {/* ---- RIGHT: Renewal Calendar ---- */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card
            sx={{
              ...glassCard,
              minHeight: MAIN_CARD_MIN_HEIGHT,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              '&:hover': {
                ...glassCard['&:hover'],
                transform: 'none',
              },
            }}
          >
            <CardContent sx={{ p: CARD_PADDING, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexShrink: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: borderRadius.md,
                      bgcolor: `${colors.accent.indigo}12`,
                      border: `1px solid ${colors.accent.indigo}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CalendarToday sx={{ fontSize: 16, color: colors.accent.indigo }} />
                  </Box>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      color: colors.text.primary,
                      fontSize: '1.125rem',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Renewal Calendar
                  </Typography>
                </Box>
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
                    mb: 0.75,
                  },
                  '& .react-calendar__navigation button': {
                    color: colors.text.secondary,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    minWidth: 36,
                    borderRadius: borderRadius.md,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.06)',
                    },
                    '&:disabled': {
                      bgcolor: 'transparent',
                      color: colors.text.dim,
                    },
                  },
                  '& .react-calendar__month-view__weekdays': {
                    textTransform: 'uppercase',
                    fontSize: '0.625rem',
                    fontWeight: 600,
                    color: colors.text.dim,
                    letterSpacing: '0.05em',
                  },
                  '& .react-calendar__month-view__weekdays abbr': {
                    textDecoration: 'none',
                  },
                  '& .react-calendar__tile': {
                    color: colors.text.secondary,
                    fontSize: '0.8125rem',
                    padding: '0.5em 0.25em',
                    borderRadius: borderRadius.md,
                    transition: 'all 0.1s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.06)',
                    },
                  },
                  '& .react-calendar__tile--now': {
                    bgcolor: `${colors.primary}18`,
                    color: colors.text.primary,
                    fontWeight: 600,
                  },
                  '& .react-calendar__tile--active': {
                    bgcolor: `${colors.primary} !important`,
                    color: `#fff !important`,
                    fontWeight: 600,
                  },
                  '& .react-calendar__tile.has-renewal': {
                    fontWeight: 600,
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
                    mt: 2,
                    pt: 2,
                    borderTop: `1px solid ${colors.border.default}`,
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: colors.text.dim,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      mb: 1.25,
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
                        py: 0.875,
                        px: 1.5,
                        borderRadius: borderRadius.md,
                        cursor: 'pointer',
                        transition: 'all 0.1s ease',
                        mb: 0.5,
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.04)',
                        },
                        '&:last-child': { mb: 0 },
                      }}
                    >
                      <Avatar
                        src={sub.subscriptionLogo}
                        sx={{
                          width: 30,
                          height: 30,
                          bgcolor: colors.bg.tertiary,
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          color: colors.text.secondary,
                          border: `1px solid ${colors.border.default}`,
                        }}
                      >
                        {sub.subscriptionName?.[0]}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: '0.8125rem',
                            fontWeight: 500,
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
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          color: colors.text.primary,
                          flexShrink: 0,
                          fontVariantNumeric: 'tabular-nums',
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