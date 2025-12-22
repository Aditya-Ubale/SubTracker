/**
 * BudgetChart - Clean Analytical Chart Component
 * 
 * Design Principles:
 * - Minimal, clean data visualization
 * - Muted colors for calm reading
 * - Lighter grid lines to reduce clutter
 * - Small, unobtrusive legend
 * - Minimal tooltip
 */
import React from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '../../utils/helpers';

// Muted color palette for calm data visualization
const CHART_COLORS = {
  income: { stroke: 'rgba(16, 185, 129, 0.7)', fill: 'rgba(16, 185, 129, 0.15)' },
  expenses: { stroke: 'rgba(245, 158, 11, 0.7)', fill: 'rgba(245, 158, 11, 0.12)' },
  subscriptions: { stroke: 'rgba(239, 68, 68, 0.6)', fill: 'rgba(239, 68, 68, 0.1)' },
};

const BudgetChart = ({ data }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Transform data for chart
  const chartData = data
    .slice()
    .reverse()
    .map((item) => ({
      name: `${item.monthName?.substring(0, 3)} ${item.year}`,
      income: item.monthlyIncome,
      expenses: item.monthlyExpenses,
      subscriptions: item.subscriptionTotal,
    }));

  // Minimal custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: '#1a1a1a',
            p: 1.5,
            borderRadius: 1.5,
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            minWidth: 140,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: 'rgba(255,255,255,0.6)',
              display: 'block',
              mb: 0.75,
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
                gap: 2,
                py: 0.25,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: entry.color,
                  }}
                />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  {entry.name}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                {formatCurrency(entry.value)}
              </Typography>
            </Box>
          ))}
        </Box>
      );
    }
    return null;
  };

  // Custom legend with smaller, muted styling
  const CustomLegend = ({ payload }) => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        gap: 3,
        pt: 2,
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
              opacity: 0.8,
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: '0.7rem',
            }}
          >
            {entry.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );

  return (
    <Box sx={{ width: '100%', height: isMobile ? 260 : 320 }}>
      <ResponsiveContainer>
        <AreaChart
          data={chartData}
          margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.income.stroke} stopOpacity={0.3} />
              <stop offset="100%" stopColor={CHART_COLORS.income.stroke} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.expenses.stroke} stopOpacity={0.25} />
              <stop offset="100%" stopColor={CHART_COLORS.expenses.stroke} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="colorSubscriptions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.subscriptions.stroke} stopOpacity={0.2} />
              <stop offset="100%" stopColor={CHART_COLORS.subscriptions.stroke} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {/* Lighter grid lines for reduced clutter */}
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255, 255, 255, 0.04)"
            vertical={false}
          />

          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }}
            tickLine={false}
            axisLine={false}
            dy={8}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />

          {/* Muted green for income */}
          <Area
            type="monotone"
            dataKey="income"
            name="Income"
            stroke={CHART_COLORS.income.stroke}
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#colorIncome)"
          />

          {/* Muted orange for expenses */}
          <Area
            type="monotone"
            dataKey="expenses"
            name="Expenses"
            stroke={CHART_COLORS.expenses.stroke}
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#colorExpenses)"
          />

          {/* Muted red for subscriptions */}
          <Area
            type="monotone"
            dataKey="subscriptions"
            name="Subscriptions"
            stroke={CHART_COLORS.subscriptions.stroke}
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#colorSubscriptions)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default BudgetChart;