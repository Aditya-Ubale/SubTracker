/**
 * Budget Calculator - Premium SaaS Budget Page
 * 
 * Design Principles (Linear/Stripe/Notion inspired):
 * - Minimal, calm dark theme
 * - Lightweight summary cards
 * - Slim, refined progress bar
 * - Subtle shadows instead of borders
 * - 8px grid spacing system
 * - Red accent used sparingly
 * - Clear visual hierarchy
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  InputAdornment,
  LinearProgress,
  Skeleton,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  Savings,
  Edit,
  Save,
  Warning,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { budgetAPI } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import BudgetChart from './BudgetChart';
import SuccessPopup from '../common/SuccessPopup';

const Budget = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [budgetData, setBudgetData] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [formData, setFormData] = useState({
    monthlyIncome: '',
    monthlyExpenses: '',
  });

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      const response = await budgetAPI.getBudgetSummary();
      const data = response.data.data;
      setBudgetData(data);
      setFormData({
        monthlyIncome: data.monthlyIncome || '',
        monthlyExpenses: data.monthlyExpenses || '',
      });
    } catch (error) {
      console.error('Error fetching budget:', error);
      toast.error('Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.monthlyIncome || !formData.monthlyExpenses) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setSaving(true);
      const response = await budgetAPI.updateBudget({
        monthlyIncome: parseFloat(formData.monthlyIncome),
        monthlyExpenses: parseFloat(formData.monthlyExpenses),
      });
      setBudgetData(response.data.data);
      setEditing(false);
      setShowSuccessPopup(true);
    } catch (error) {
      toast.error('Failed to update budget');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width={180} height={36} />
          <Skeleton variant="text" width={280} height={20} />
        </Box>
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={6} md={3} key={i}>
              <Skeleton variant="rounded" height={88} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const usagePercentage = budgetData?.budgetPercentageUsed || 0;
  const remainingBudget = budgetData?.remainingBudget || 0;
  const isOverBudget = remainingBudget < 0;
  const monthlyIncome = budgetData?.monthlyIncome || 0;
  const hasNoIncome = monthlyIncome === 0;

  // Muted status colors
  const getStatusStyle = () => {
    if (usagePercentage > 100) return { color: 'rgba(239, 68, 68, 0.7)', status: 'over' };
    if (usagePercentage >= 80) return { color: 'rgba(245, 158, 11, 0.7)', status: 'warning' };
    return { color: 'rgba(16, 185, 129, 0.6)', status: 'healthy' };
  };

  const statusStyle = getStatusStyle();

  // Summary card data
  const summaryCards = [
    {
      label: 'Income',
      value: budgetData?.monthlyIncome || 0,
      icon: <TrendingUp sx={{ fontSize: 16 }} />,
      iconColor: 'rgba(16, 185, 129, 0.6)',
    },
    {
      label: 'Expenses',
      value: budgetData?.monthlyExpenses || 0,
      icon: <TrendingDown sx={{ fontSize: 16 }} />,
      iconColor: 'rgba(245, 158, 11, 0.6)',
    },
    {
      label: 'Subscriptions',
      value: budgetData?.subscriptionTotal || 0,
      icon: <CreditCard sx={{ fontSize: 16 }} />,
      iconColor: 'rgba(239, 68, 68, 0.5)',
    },
    {
      label: 'Remaining',
      value: remainingBudget,
      icon: isOverBudget ? <Warning sx={{ fontSize: 16 }} /> : <Savings sx={{ fontSize: 16 }} />,
      iconColor: isOverBudget ? 'rgba(239, 68, 68, 0.6)' : 'rgba(16, 185, 129, 0.6)',
      isNegative: isOverBudget,
    },
  ];

  return (
    <Box>
      <SuccessPopup
        open={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title="Saved"
        message="Budget updated successfully."
        icon="check"
      />

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: '#fff',
                letterSpacing: '-0.01em',
                mb: 0.5,
              }}
            >
              Budget
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.8125rem' }}
            >
              Track income, expenses, and subscriptions
            </Typography>
          </Box>
          <Button
            size="small"
            startIcon={editing ? <Save sx={{ fontSize: 16 }} /> : <Edit sx={{ fontSize: 16 }} />}
            onClick={editing ? handleSave : () => setEditing(true)}
            disabled={saving}
            sx={{
              px: 2,
              py: 0.75,
              fontSize: '0.8125rem',
              fontWeight: 500,
              borderRadius: 1.5,
              ...(editing ? {
                bgcolor: '#E50914',
                color: '#fff',
                '&:hover': { bgcolor: '#C2070F' },
              } : {
                bgcolor: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.6)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                },
              }),
            }}
          >
            {editing ? (saving ? 'Saving...' : 'Save') : 'Edit'}
          </Button>
        </Box>
      </Box>

      {/* Edit Form - Compact */}
      {editing && (
        <Card
          sx={{
            mb: 3,
            borderRadius: 2,
            bgcolor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: 'none',
          }}
        >
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Monthly Income"
                  type="number"
                  value={formData.monthlyIncome}
                  onChange={(e) => setFormData((prev) => ({ ...prev, monthlyIncome: e.target.value }))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255,255,255,0.02)',
                      fontSize: '0.875rem',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                    },
                    '& .MuiInputLabel-root': { fontSize: '0.8125rem' },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Monthly Expenses"
                  type="number"
                  value={formData.monthlyExpenses}
                  onChange={(e) => setFormData((prev) => ({ ...prev, monthlyExpenses: e.target.value }))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255,255,255,0.02)',
                      fontSize: '0.875rem',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                    },
                    '& .MuiInputLabel-root': { fontSize: '0.8125rem' },
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* No Income Notice - Calm */}
      {hasNoIncome && !editing && (
        <Alert
          severity="info"
          sx={{
            mb: 3,
            borderRadius: 2,
            bgcolor: 'rgba(99, 102, 241, 0.06)',
            border: '1px solid rgba(99, 102, 241, 0.12)',
            py: 1,
            '& .MuiAlert-icon': { color: 'rgba(99, 102, 241, 0.6)' },
          }}
        >
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Set your monthly income to enable budget tracking.
          </Typography>
        </Alert>
      )}

      {/* Over Budget Alert - Calm warning */}
      {isOverBudget && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
            bgcolor: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.12)',
            py: 1.5,
            '& .MuiAlert-icon': { color: 'rgba(239, 68, 68, 0.6)' },
          }}
        >
          <AlertTitle sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)' }}>
            Over budget
          </AlertTitle>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Spending exceeds income by {formatCurrency(Math.abs(remainingBudget))}
          </Typography>
        </Alert>
      )}

      {/* Summary Cards - Lightweight */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {summaryCards.map((card, index) => (
          <Grid item xs={6} md={3} key={index}>
            <Card
              sx={{
                borderRadius: 2,
                bgcolor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                },
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                {/* Icon + Label row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                  <Box sx={{ color: card.iconColor }}>
                    {card.icon}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {card.label}
                  </Typography>
                </Box>

                {/* Value - Primary focus, not oversized */}
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: card.isNegative ? 'rgba(239, 68, 68, 0.8)' : 'rgba(255,255,255,0.9)',
                    fontSize: '1.125rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {card.isNegative && '−'}{formatCurrency(Math.abs(card.value))}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Budget Usage - Refined progress bar */}
      <Card
        sx={{
          mb: 4,
          borderRadius: 2,
          bgcolor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          {/* Header row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 2 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}
            >
              Budget usage
            </Typography>
            {/* Percentage - Secondary, not dominant */}
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: statusStyle.color,
                fontSize: '0.8125rem',
              }}
            >
              {usagePercentage.toFixed(0)}%
            </Typography>
          </Box>

          {/* Slim progress bar with reduced saturation */}
          <LinearProgress
            variant="determinate"
            value={Math.min(usagePercentage, 100)}
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: 'rgba(255, 255, 255, 0.04)',
              '& .MuiLinearProgress-bar': {
                bgcolor: statusStyle.color,
                borderRadius: 2,
              },
            }}
          />

          {/* Status message - Calm and encouraging */}
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.4)',
              display: 'block',
              mt: 1.5,
              fontSize: '0.75rem',
            }}
          >
            {statusStyle.status === 'over'
              ? `${formatCurrency(Math.abs(remainingBudget))} over budget`
              : statusStyle.status === 'warning'
                ? 'Approaching limit'
                : `${formatCurrency(remainingBudget)} available`
            }
          </Typography>
        </CardContent>
      </Card>

      {/* Budget History Chart - Calm data surface */}
      {budgetData?.history && budgetData.history.length > 0 && (
        <Card
          sx={{
            borderRadius: 2,
            bgcolor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: 'rgba(255,255,255,0.8)', mb: 2 }}
            >
              History
            </Typography>
            <BudgetChart data={budgetData.history} />
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Budget;