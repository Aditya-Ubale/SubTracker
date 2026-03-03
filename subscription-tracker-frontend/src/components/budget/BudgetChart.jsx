/**
 * BudgetChart - Grouped Bar Chart with 3 sections per month
 * 
 * Shows: Expenses (Amber), Income (Green), Subscriptions (Red)
 * Displays last 6 months - fills in demo data for missing months
 */
import React from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '../../utils/helpers';

// Color palette - professional, muted
const CHART_COLORS = {
  expenses: '#F59E0B',      // Amber
  income: '#10B981',        // Emerald  
  subscriptions: '#DC2626', // Red
};

// Month names
const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const BudgetChart = ({ data = [], currentSubscriptionTotal = 0, currentIncome = 0, currentExpenses = 0 }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Generate chart data - only months with real data + current month
  const generateChartData = () => {
    const now = new Date();
    const currentMonthName = MONTH_NAMES[now.getMonth()];
    const currentYear = now.getFullYear();
    const currentKey = `${currentMonthName} ${currentYear}`;

    // Create a map of existing history data by "MONTH YEAR" key
    const historyMap = {};
    if (data && data.length > 0) {
      data.forEach(item => {
        const key = `${MONTH_NAMES[item.month - 1]} ${item.year}`;
        historyMap[key] = {
          Expenses: item.monthlyExpenses || 0,
          Income: item.monthlyIncome || 0,
          Subscriptions: item.subscriptionTotal || 0,
        };
      });
    }

    const chartData = [];

    // Add past months that have real history data (in chronological order)
    for (let i = 5; i >= 1; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = MONTH_NAMES[date.getMonth()];
      const year = date.getFullYear();
      const key = `${monthName} ${year}`;

      // Only include if real data exists for this month
      if (historyMap[key]) {
        chartData.push({
          name: key,
          ...historyMap[key],
        });
      }
    }

    // Always add the current month
    if (historyMap[currentKey]) {
      chartData.push({
        name: currentKey,
        ...historyMap[currentKey],
        Subscriptions: historyMap[currentKey].Subscriptions === 0
          ? currentSubscriptionTotal
          : historyMap[currentKey].Subscriptions,
      });
    } else {
      chartData.push({
        name: currentKey,
        Expenses: currentExpenses,
        Income: currentIncome,
        Subscriptions: currentSubscriptionTotal,
      });
    }

    return chartData;
  };

  const chartData = generateChartData();

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: '#1a1a1f',
            p: 1.5,
            borderRadius: 1,
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            minWidth: 160,
          }}
        >
          <Typography
            sx={{
              fontWeight: 600,
              color: 'rgba(255,255,255,0.9)',
              fontSize: '0.8125rem',
              mb: 1,
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              pb: 0.75,
            }}
          >
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 3,
                py: 0.375,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: entry.color,
                  }}
                />
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                  {entry.name}
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 600, color: '#fff', fontSize: '0.8125rem' }}>
                {formatCurrency(entry.value)}
              </Typography>
            </Box>
          ))}
        </Box>
      );
    }
    return null;
  };

  // Custom legend
  const CustomLegend = ({ payload }) => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        gap: 3,
        pt: 2,
        flexWrap: 'wrap',
      }}
    >
      {payload.map((entry, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: entry.color,
            }}
          />
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.75rem',
            }}
          >
            {entry.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );

  return (
    <Box sx={{ width: '100%', height: isMobile ? 280 : 320 }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
          barGap={1}
          barCategoryGap="20%"
        >
          {/* Subtle grid */}
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255, 255, 255, 0.04)"
            vertical={false}
          />

          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            dy={8}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              if (value >= 1000) {
                return `₹${(value / 1000).toFixed(0)}k`;
              }
              return `₹${value}`;
            }}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
          <Legend content={<CustomLegend />} />

          {/* Expenses bar - Amber */}
          <Bar
            dataKey="Expenses"
            name="Expenses"
            fill={CHART_COLORS.expenses}
            radius={[2, 2, 0, 0]}
            maxBarSize={32}
          />

          {/* Income bar - Green */}
          <Bar
            dataKey="Income"
            name="Income"
            fill={CHART_COLORS.income}
            radius={[2, 2, 0, 0]}
            maxBarSize={32}
          />

          {/* Subscriptions bar - Red */}
          <Bar
            dataKey="Subscriptions"
            name="Subscriptions"
            fill={CHART_COLORS.subscriptions}
            radius={[2, 2, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default BudgetChart;