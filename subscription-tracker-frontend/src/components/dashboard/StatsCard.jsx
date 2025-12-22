/**
 * StatsCard - Modern Fintech Stats Card
 * 
 * Design: Linear/Vercel inspired
 * - Clean, spacious layout
 * - Soft background with subtle border
 * - Icon in colored pill
 * - Large bold value
 * - Hover state with elevation
 */
import React from 'react';
import { Box, Typography } from '@mui/material';
import { NorthEast, TrendingUp, TrendingDown } from '@mui/icons-material';

const StatsCard = ({
  title,
  value,
  subtitle,
  icon,
  trend, // 'up', 'down', or null
  trendValue, // e.g., '+12%'
  color = '#6366f1',
  onClick,
}) => {
  const isClickable = !!onClick;

  return (
    <Box
      onClick={onClick}
      sx={{
        bgcolor: 'rgba(22, 22, 26, 0.8)',
        borderRadius: 3,
        border: '1px solid rgba(255, 255, 255, 0.06)',
        p: 2.5,
        height: 140,
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',

        // Subtle gradient overlay
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '60%',
          background: `linear-gradient(180deg, ${color}08 0%, transparent 100%)`,
          pointerEvents: 'none',
        },

        '&:hover': isClickable ? {
          bgcolor: 'rgba(28, 28, 33, 0.95)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
          '& .arrow-icon': {
            opacity: 1,
            transform: 'translate(0, 0)',
          },
        } : {},
      }}
    >
      {/* Top row: Icon + Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Icon pill */}
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: `${color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
            }}
          >
            {icon}
          </Box>
          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              letterSpacing: '0.01em',
            }}
          >
            {title}
          </Typography>
        </Box>

        {/* Click arrow */}
        {isClickable && (
          <Box
            className="arrow-icon"
            sx={{
              opacity: 0,
              transform: 'translate(-4px, 4px)',
              transition: 'all 0.2s ease',
            }}
          >
            <NorthEast sx={{ fontSize: 18, color: 'rgba(255, 255, 255, 0.4)' }} />
          </Box>
        )}
      </Box>

      {/* Bottom: Value + Trend */}
      <Box sx={{ zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
          <Typography
            sx={{
              color: '#fff',
              fontWeight: 600,
              fontSize: '1.75rem',
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            {value}
          </Typography>

          {/* Trend indicator */}
          {trend && trendValue && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.25,
                px: 0.75,
                py: 0.25,
                borderRadius: 1,
                bgcolor: trend === 'up' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              }}
            >
              {trend === 'up' ? (
                <TrendingUp sx={{ fontSize: 12, color: '#22c55e' }} />
              ) : (
                <TrendingDown sx={{ fontSize: 12, color: '#ef4444' }} />
              )}
              <Typography
                sx={{
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  color: trend === 'up' ? '#22c55e' : '#ef4444',
                }}
              >
                {trendValue}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Subtitle */}
        {subtitle && (
          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.35)',
              fontSize: '0.75rem',
              mt: 0.5,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default StatsCard;