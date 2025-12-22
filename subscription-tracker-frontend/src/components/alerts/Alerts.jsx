/**
 * Alerts - Premium Notification Center
 * 
 * Design Principles:
 * - Clean list-based layout
 * - Subtle unread indicators
 * - Consistent with app design system
 * - Muted colors, red only for critical actions
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Skeleton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  TrendingDown,
  Event,
  MoreVert,
  Delete,
  DoneAll,
  Check,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import { alertAPI } from '../../services/api';
import SuccessPopup from '../common/SuccessPopup';

// Muted alert type styling
const ALERT_STYLES = {
  'PRICE_DROP': {
    icon: <TrendingDown />,
    bg: 'rgba(16, 185, 129, 0.08)',
    color: 'rgba(16, 185, 129, 0.8)',
    label: 'Price Drop',
  },
  'RENEWAL_REMINDER': {
    icon: <Event />,
    bg: 'rgba(245, 158, 11, 0.08)',
    color: 'rgba(245, 158, 11, 0.8)',
    label: 'Renewal',
  },
  'default': {
    icon: <Notifications />,
    bg: 'rgba(99, 102, 241, 0.08)',
    color: 'rgba(99, 102, 241, 0.8)',
    label: 'Alert',
  },
};

const Alerts = () => {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await alertAPI.getAllAlerts();
      setAlerts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (alertId) => {
    try {
      await alertAPI.markAsRead(alertId);
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, isRead: true } : alert
        )
      );
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await alertAPI.markAllAsRead();
      setAlerts((prev) => prev.map((alert) => ({ ...alert, isRead: true })));
      setSuccessMessage({ title: 'Done!', message: 'All alerts marked as read.' });
      setShowSuccessPopup(true);
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDeleteAlert = async (alertId) => {
    try {
      await alertAPI.deleteAlert(alertId);
      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
      setSuccessMessage({ title: 'Deleted!', message: 'Alert removed.' });
      setShowSuccessPopup(true);
    } catch (error) {
      toast.error('Failed to delete alert');
    }
    setAnchorEl(null);
  };

  const getAlertStyle = (alertType) => {
    return ALERT_STYLES[alertType] || ALERT_STYLES.default;
  };

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  if (loading) {
    return (
      <Box>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width={150} height={40} />
          <Skeleton variant="text" width={200} height={24} />
        </Box>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="rectangular" height={72} sx={{ mb: 1.5, borderRadius: 2 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <SuccessPopup
        open={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title={successMessage.title}
        message={successMessage.message}
        icon="check"
      />

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                color: '#fff',
                letterSpacing: '-0.02em',
                mb: 0.5,
              }}
            >
              Alerts
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </Typography>
          </Box>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<DoneAll sx={{ fontSize: 18 }} />}
              onClick={handleMarkAllAsRead}
              sx={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.8125rem',
                '&:hover': {
                  color: '#fff',
                  bgcolor: 'rgba(255,255,255,0.04)',
                },
              }}
            >
              Mark all read
            </Button>
          )}
        </Box>
      </Box>

      {/* Empty State */}
      {alerts.length === 0 ? (
        <Card
          sx={{
            borderRadius: 3,
            textAlign: 'center',
            py: 8,
            bgcolor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 2,
              bgcolor: 'rgba(255, 255, 255, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2.5,
            }}
          >
            <NotificationsActive sx={{ fontSize: 28, color: 'rgba(255,255,255,0.3)' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#fff' }}>
            No alerts
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', maxWidth: 280, mx: 'auto' }}>
            You'll receive alerts for upcoming renewals and price drops
          </Typography>
        </Card>
      ) : (
        <Card
          sx={{
            borderRadius: 3,
            bgcolor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            overflow: 'hidden',
          }}
        >
          <List sx={{ p: 0 }}>
            {alerts.map((alert, index) => {
              const style = getAlertStyle(alert.alertType);

              return (
                <ListItem
                  key={alert.id}
                  sx={{
                    py: 2,
                    px: 2.5,
                    bgcolor: alert.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.03)',
                    borderBottom: index < alerts.length - 1
                      ? '1px solid rgba(255, 255, 255, 0.04)'
                      : 'none',
                    transition: 'background 0.15s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.03)',
                    },
                  }}
                  secondaryAction={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {!alert.isRead && (
                        <IconButton
                          size="small"
                          onClick={() => handleMarkAsRead(alert.id)}
                          sx={{
                            color: 'rgba(255,255,255,0.4)',
                            '&:hover': {
                              color: '#10b981',
                              bgcolor: 'rgba(16, 185, 129, 0.1)',
                            },
                          }}
                        >
                          <Check sx={{ fontSize: 18 }} />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setAnchorEl(e.currentTarget);
                          setSelectedAlert(alert);
                        }}
                        sx={{
                          color: 'rgba(255,255,255,0.35)',
                          '&:hover': {
                            color: 'rgba(255,255,255,0.6)',
                            bgcolor: 'rgba(255,255,255,0.04)',
                          },
                        }}
                      >
                        <MoreVert sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: style.bg,
                        color: style.color,
                        width: 40,
                        height: 40,
                      }}
                    >
                      {style.icon}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: alert.isRead ? 500 : 600,
                            color: '#fff',
                          }}
                        >
                          {alert.title}
                        </Typography>
                        {!alert.isRead && (
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              bgcolor: '#6366f1',
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'rgba(255,255,255,0.5)',
                            display: 'block',
                            mb: 0.5,
                          }}
                        >
                          {alert.message}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: style.color,
                              fontSize: '0.7rem',
                            }}
                          >
                            {style.label}
                          </Typography>
                          {alert.subscriptionName && (
                            <>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.25)' }}>•</Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                                {alert.subscriptionName}
                              </Typography>
                            </>
                          )}
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.25)' }}>•</Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)' }}>
                            {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        </Card>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            bgcolor: '#1a1a1a',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 2,
            minWidth: 140,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          },
        }}
      >
        <MenuItem
          onClick={() => handleDeleteAlert(selectedAlert?.id)}
          sx={{
            py: 1,
            color: '#ef4444',
            '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' },
          }}
        >
          <Delete sx={{ mr: 1.5, fontSize: 18 }} />
          <Typography variant="body2">Delete</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Alerts;