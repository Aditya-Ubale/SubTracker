import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Skeleton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Add,
  ArrowForward,
  Download,
  CalendarMonth,
  Event,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, isSameDay, parseISO } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { subscriptionAPI, budgetAPI, alertAPI } from '../../services/api';
import { formatCurrency, formatDate, getCategoryIcon } from '../../utils/helpers';
import StatsCard from './StatsCard';
import SubscriptionCard from './SubscriptionCard';
import SuccessPopup from '../common/SuccessPopup';

const Dashboard = () => {
  const navigate = useNavigate();
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

  // Calendar tile content
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

    if (daySubscriptions.length > 0) return 'has-renewal';
    return null;
  };

  // PDF Export function
  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(24);
      doc.setTextColor(102, 126, 234);
      doc.text('Subscription Tracker Report', pageWidth / 2, 25, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 35, { align: 'center' });

      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Budget Summary', 14, 50);

      doc.setFontSize(11);
      doc.text(`Monthly Income: ${formatCurrency(budgetSummary?.monthlyIncome || 0)}`, 14, 60);
      doc.text(`Monthly Expenses: ${formatCurrency(budgetSummary?.monthlyExpenses || 0)}`, 14, 68);
      doc.text(`Subscription Total: ${formatCurrency(budgetSummary?.subscriptionTotal || 0)}`, 14, 76);
      doc.text(`Remaining Budget: ${formatCurrency(budgetSummary?.remainingBudget || 0)}`, 14, 84);

      doc.setFontSize(16);
      doc.text('Active Subscriptions', 14, 100);

      if (subscriptions.length > 0) {
        const tableData = subscriptions.map((sub) => [
          sub.subscriptionName,
          sub.category,
          sub.subscriptionType,
          formatCurrency(sub.customPrice || sub.originalPrice),
          formatDate(sub.renewalDate),
        ]);

        doc.autoTable({
          startY: 108,
          head: [['Subscription', 'Category', 'Type', 'Price', 'Renewal']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [102, 126, 234] },
          styles: { fontSize: 9 },
        });
      }

      doc.save(`subscription-report-${new Date().toISOString().split('T')[0]}.pdf`);
      setShowSuccessPopup(true);

    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setExportingPdf(false);
    }
  };

  // Get current month renewals
  const currentMonthRenewals = subscriptions.filter((sub) => {
    if (!sub.renewalDate) return false;
    const renewalDate = parseISO(sub.renewalDate);
    const now = new Date();
    return renewalDate.getMonth() === now.getMonth() && renewalDate.getFullYear() === now.getFullYear();
  });

  if (loading) {
    return (
      <Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={120} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Success Popup */}
      <SuccessPopup
        open={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title="PDF Exported!"
        message="Your subscription report has been downloaded successfully."
        icon="check"
      />

      {/* Welcome Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Welcome Back! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your subscriptions today.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Subscriptions"
            value={stats.totalSubscriptions}
            icon="📊"
            color="#E50914"
            onClick={() => navigate('/subscriptions')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Monthly Spend"
            value={formatCurrency(stats.monthlySpend)}
            icon="💰"
            color="#4CAF50"
            onClick={() => navigate('/budget')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Upcoming Renewals"
            value={stats.upcomingRenewals}
            subtitle="Next 7 days"
            icon="📅"
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Unread Alerts"
            value={stats.unreadAlerts}
            icon="🔔"
            color="#ef4444"
            onClick={() => navigate('/alerts')}
          />
        </Grid>
      </Grid>

      {/* Active Subscriptions + Export  */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Active Subscriptions */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Active Subscriptions
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Add />}
                  onClick={() => navigate('/subscriptions/add')}
                  sx={{
                    backgroundColor: '#E50914',
                    '&:hover': { backgroundColor: '#B81D24' },
                  }}
                >
                  Add New
                </Button>
              </Box>

              {subscriptions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No subscriptions yet
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => navigate('/subscriptions/add')}
                    sx={{ mt: 1 }}
                  >
                    Add Your First
                  </Button>
                </Box>
              ) : (
                <Box>
                  {subscriptions.slice(0, 3).map((subscription) => (
                    <Box
                      key={subscription.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.5,
                        mb: 1,
                        borderRadius: 2,
                        bgcolor: 'grey.50',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'grey.100',
                          transform: 'translateX(4px)',
                        },
                      }}
                      onClick={() => navigate(`/subscriptions/${subscription.id}`)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          src={subscription.subscriptionLogo}
                          sx={{ width: 40, height: 40, bgcolor: 'primary.light' }}
                        >
                          {getCategoryIcon(subscription.category)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {subscription.subscriptionName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {subscription.subscriptionType} • Renews {formatDate(subscription.renewalDate)}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                        {formatCurrency(subscription.customPrice || subscription.originalPrice)}
                      </Typography>
                    </Box>
                  ))}
                  {subscriptions.length > 3 && (
                    <Button
                      fullWidth
                      endIcon={<ArrowForward />}
                      onClick={() => navigate('/subscriptions')}
                      sx={{ mt: 1 }}
                    >
                      View All ({subscriptions.length})
                    </Button>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Export Report Section */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 3,
              height: '100%',
              background: 'linear-gradient(135deg, rgba(229, 9, 20, 0.1) 0%, rgba(184, 29, 36, 0.05) 100%)',
              border: '1px solid #E50914',
            }}
          >
            <CardContent sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              height: '100%',
              py: 3,
            }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: '#E50914',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                }}
              >
                <Download sx={{ color: 'white', fontSize: 28 }} />
              </Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Export Report
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Download your subscription data as a PDF report
              </Typography>
              <Button
                variant="contained"
                startIcon={exportingPdf ? <CircularProgress size={18} color="inherit" /> : <Download />}
                onClick={handleExportPdf}
                disabled={exportingPdf}
                sx={{
                  backgroundColor: '#E50914',
                  '&:hover': { backgroundColor: '#B81D24' },
                  px: 3,
                }}
              >
                {exportingPdf ? 'Exporting...' : 'Export PDF'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Subscription Calendar */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CalendarMonth color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Subscription Calendar
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Calendar */}
            <Grid item xs={12} md={6}>
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
                    padding: 0.6em 0.3em;
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
                  .react-calendar__navigation {
                    margin-bottom: 0.5em;
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
                    text-transform: uppercase;
                    font-size: 0.75em;
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
            </Grid>

            {/* Right panel */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
                {/* Selected Date */}
                <Card variant="outlined" sx={{ borderRadius: 2, flex: 1 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Event color="primary" fontSize="small" />
                      <Typography variant="subtitle1" fontWeight={600}>
                        {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                      </Typography>
                    </Box>
                    {selectedDateSubscriptions.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          No renewals scheduled for this date
                        </Typography>
                      </Box>
                    ) : (
                      <List sx={{ p: 0 }} dense>
                        {selectedDateSubscriptions.map((sub) => (
                          <ListItem key={sub.id} sx={{ px: 0 }}>
                            <ListItemAvatar>
                              <Avatar src={sub.subscriptionLogo} sx={{ width: 36, height: 36, bgcolor: 'primary.light' }}>
                                {getCategoryIcon(sub.category)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={<Typography variant="body2" fontWeight={600}>{sub.subscriptionName}</Typography>}
                              secondary={formatCurrency(sub.customPrice || sub.originalPrice)}
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>

                {/* This Month */}
                <Card variant="outlined" sx={{ borderRadius: 2, flex: 1 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        This Month
                      </Typography>
                      <Chip
                        label={`${currentMonthRenewals.length} renewal${currentMonthRenewals.length !== 1 ? 's' : ''}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                    {currentMonthRenewals.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        No renewals this month 🎉
                      </Typography>
                    ) : (
                      <List sx={{ p: 0 }} dense>
                        {currentMonthRenewals.slice(0, 4).map((sub) => (
                          <ListItem key={sub.id} sx={{ px: 0, py: 0.5 }}>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2">{sub.subscriptionName}</Typography>
                                  <Typography variant="body2" fontWeight={600} color="primary.main">
                                    {formatCurrency(sub.customPrice || sub.originalPrice)}
                                  </Typography>
                                </Box>
                              }
                              secondary={format(parseISO(sub.renewalDate), 'MMM d')}
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box >
  );
};

export default Dashboard;