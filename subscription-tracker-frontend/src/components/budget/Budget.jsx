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
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  TrendingDown,
  Savings,
  Edit,
  Save,
  Warning,
  MoneyOff,
  Lightbulb,
  Cancel,
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
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3, borderRadius: 2 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={140} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const usagePercentage = budgetData?.budgetPercentageUsed || 0;
  const remainingBudget = budgetData?.remainingBudget || 0;
  const isOverBudget = remainingBudget < 0;
  const isOverSpending = usagePercentage > 100;
  const monthlyIncome = budgetData?.monthlyIncome || 0;
  const hasNoIncome = monthlyIncome === 0;

  // Determine usage color based on percentage
  const getUsageColor = () => {
    if (isOverSpending) return 'error';
    if (usagePercentage >= 80) return 'error';
    if (usagePercentage >= 50) return 'warning';
    return 'success';
  };

  const usageColor = getUsageColor();

  // Calculate how much over budget
  const overBudgetAmount = isOverBudget ? Math.abs(remainingBudget) : 0;

  return (
    <Box sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Success Popup */}
      <SuccessPopup
        open={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title="Budget Updated!"
        message="Your budget settings have been saved successfully."
        icon="check"
      />

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Budget Calculator
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track your income, expenses, and subscription costs
          </Typography>
        </Box>
        <Button
          variant={editing ? 'contained' : 'outlined'}
          startIcon={editing ? <Save /> : <Edit />}
          onClick={editing ? handleSave : () => setEditing(true)}
          disabled={saving}
        >
          {editing ? (saving ? 'Saving...' : 'Save Changes') : 'Edit Budget'}
        </Button>
      </Box>

      {/* Critical Alert - Over Budget */}
      {isOverBudget && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 2 }}
          icon={<MoneyOff />}
        >
          <AlertTitle sx={{ fontWeight: 700 }}>⚠️ Budget Deficit Alert!</AlertTitle>
          <Typography variant="body2">
            You're spending <strong>{formatCurrency(overBudgetAmount)}</strong> more than your income.
            Your total expenses ({formatCurrency((budgetData?.monthlyExpenses || 0) + (budgetData?.subscriptionTotal || 0))})
            exceed your monthly income ({formatCurrency(monthlyIncome)}).
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              💡 Suggestions to balance your budget:
            </Typography>
            <List dense sx={{ py: 0 }}>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Lightbulb color="warning" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Review and cancel unused subscriptions"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Lightbulb color="warning" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Look for cheaper alternatives or family plans"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Lightbulb color="warning" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Switch from monthly to yearly plans for savings"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            </List>
          </Box>
        </Alert>
      )}

      {/* No Income Warning */}
      {hasNoIncome && (
        <Alert
          severity="info"
          sx={{ mb: 3, borderRadius: 2 }}
        >
          <AlertTitle>Set Your Monthly Income</AlertTitle>
          Please set your monthly income to get accurate budget tracking and insights.
          <Button
            size="small"
            variant="outlined"
            sx={{ ml: 2 }}
            onClick={() => setEditing(true)}
          >
            Set Income
          </Button>
        </Alert>
      )}

      {/* Budget Input Form */}
      {editing && (
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Monthly Income"
                  type="number"
                  value={formData.monthlyIncome}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, monthlyIncome: e.target.value }))
                  }
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Monthly Expenses (excluding subscriptions)"
                  type="number"
                  value={formData.monthlyExpenses}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, monthlyExpenses: e.target.value }))
                  }
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Monthly Income
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {formatCurrency(budgetData?.monthlyIncome || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingDown sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Monthly Expenses
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} color="warning.main">
                {formatCurrency(budgetData?.monthlyExpenses || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalance sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Subscriptions
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                {formatCurrency(budgetData?.subscriptionTotal || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              bgcolor: isOverBudget ? 'error.50' : 'inherit',
              border: isOverBudget ? '2px solid' : 'none',
              borderColor: 'error.main',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {isOverBudget ? (
                  <Warning sx={{ color: 'error.main', mr: 1 }} />
                ) : (
                  <Savings sx={{ color: 'success.main', mr: 1 }} />
                )}
                <Typography variant="body2" color="text.secondary">
                  Remaining Budget
                </Typography>
                {isOverBudget && (
                  <Chip
                    label="DEFICIT"
                    size="small"
                    color="error"
                    sx={{ ml: 1, height: 20, fontSize: '0.65rem' }}
                  />
                )}
              </Box>
              <Typography
                variant="h4"
                fontWeight={700}
                color={isOverBudget ? 'error.main' : 'success.main'}
              >
                {isOverBudget ? '-' : ''}{formatCurrency(Math.abs(remainingBudget))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Budget Usage */}
      <Card sx={{ mb: 4, borderRadius: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              Budget Usage
            </Typography>
            {isOverSpending && (
              <Chip
                icon={<Warning />}
                label={`${usagePercentage.toFixed(1)}% - Over Budget!`}
                color="error"
                variant="filled"
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ flexGrow: 1, mr: 2, position: 'relative' }}>
              <LinearProgress
                variant="determinate"
                value={Math.min(usagePercentage, 100)}
                color={usageColor}
                sx={{
                  height: 16,
                  borderRadius: 8,
                  bgcolor: 'grey.200',
                }}
              />
              {/* Over budget indicator */}
              {isOverSpending && (
                <Box
                  sx={{
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 8,
                    height: 24,
                    bgcolor: 'error.main',
                    borderRadius: 1,
                    animation: 'pulse 1s infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                    },
                  }}
                />
              )}
            </Box>
            <Typography
              variant="h6"
              fontWeight={700}
              color={`${usageColor}.main`}
              sx={{ minWidth: 80, textAlign: 'right' }}
            >
              {usagePercentage.toFixed(1)}%
            </Typography>
          </Box>

          {/* Contextual Alerts */}
          {isOverSpending && (
            <Alert severity="error" sx={{ mt: 2 }} icon={<MoneyOff />}>
              <AlertTitle>Critical: Spending exceeds income by {(usagePercentage - 100).toFixed(1)}%</AlertTitle>
              You're spending {formatCurrency(overBudgetAmount)} more than you earn.
              Immediate action is recommended to avoid debt.
            </Alert>
          )}
          {!isOverSpending && usagePercentage >= 90 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              You're spending more than 90% of your income. Consider reducing expenses.
            </Alert>
          )}
          {usagePercentage >= 75 && usagePercentage < 90 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              You're using a significant portion of your income. Keep an eye on your spending.
            </Alert>
          )}
          {usagePercentage < 50 && monthlyIncome > 0 && (
            <Alert severity="success" sx={{ mt: 2 }}>
              🎉 Great job! You're saving more than 50% of your income.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats for Over Budget */}
      {isOverBudget && (
        <Card sx={{ mb: 4, borderRadius: 3, bgcolor: 'grey.50' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              📊 Budget Breakdown
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h5" fontWeight={700} color="success.main">
                    {formatCurrency(monthlyIncome)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Income
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h5" fontWeight={700} color="error.main">
                    {formatCurrency((budgetData?.monthlyExpenses || 0) + (budgetData?.subscriptionTotal || 0))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Spending
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h5" fontWeight={700} color="error.main">
                    -{formatCurrency(overBudgetAmount)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monthly Deficit
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Budget History Chart */}
      {budgetData?.history && budgetData.history.length > 0 && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Budget History
            </Typography>
            <BudgetChart data={budgetData.history} />
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Budget;