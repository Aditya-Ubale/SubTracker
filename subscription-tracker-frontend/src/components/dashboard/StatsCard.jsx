import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';

const StatsCard = ({ title, value, subtitle, icon, color, onClick }) => {
  const isClickable = !!onClick;

  return (
    <Card
      sx={{
        borderRadius: 2,
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#221F1F',
        border: '1px solid #333333',
        '&:hover': isClickable
          ? {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5)',
            borderColor: color || '#E50914',
            '& .hover-arrow': {
              opacity: 1,
              transform: 'translateX(0)',
            },
          }
          : {},
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: color || '#E50914',
        },
      }}
      onClick={onClick}
    >
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body2"
              sx={{
                color: '#666666',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '0.75rem',
              }}
              gutterBottom
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{
                color: '#FFFFFF',
                mt: 1,
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: '#666666' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              fontSize: 40,
              opacity: 0.9,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
            }}
          >
            {icon}
          </Box>
        </Box>

        {isClickable && (
          <Box
            className="hover-arrow"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mt: 2,
              opacity: 0.6,
              transition: 'all 0.3s ease',
              transform: 'translateX(-5px)',
            }}
          >
            <Typography variant="caption" sx={{ color: '#E50914', fontWeight: 600 }}>
              View Details
            </Typography>
            <ArrowForward sx={{ fontSize: 14, color: '#E50914' }} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;