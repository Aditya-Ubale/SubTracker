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
  Chip,
  Divider,
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
  CheckCircle,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import { alertAPI } from '../../services/api';
import SuccessPopup from '../common/SuccessPopup';

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
      setSuccessMessage({ title: 'All Read!', message: 'All alerts have been marked as read.' });
      setShowSuccessPopup(true);
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDeleteAlert = async (alertId) => {
    try {
      await alertAPI.deleteAlert(alertId);
      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
      setSuccessMessage({ title: 'Deleted!', message: 'Alert has been removed.' });
      setShowSuccessPopup(true);
    } catch (error) {
      toast.error('Failed to delete alert');
    }
    setAnchorEl(null);
  };

  const getAlertIcon = (alertType) => {
    switch (alertType) {
      case 'PRICE_DROP':
        return <TrendingDown />;
      case 'RENEWAL_REMINDER':
        return <Event />;
      default:
        return <Notifications />;
    }
  };

  const getAlertColor = (alertType) => {
    switch (alertType) {
      case 'PRICE_DROP':
        return 'success';
      case 'RENEWAL_REMINDER':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3, borderRadius: 2 }} />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="rectangular" height={80} sx={{ mb: 2, borderRadius: 2 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Success Popup */}
      <SuccessPopup
        open={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title={successMessage.title}
        message={successMessage.message}
        icon="check"
      />

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Alerts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {unreadCount > 0 ? `${unreadCount} unread alerts` : 'All caught up!'}
          </Typography>
        </Box>
        {unreadCount > 0 && (
          <Button
            startIcon={<DoneAll />}
            onClick={handleMarkAllAsRead}
          >
            Mark All as Read
          </Button>
        )}
      </Box>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <Card sx={{ borderRadius: 3, textAlign: 'center', py: 8 }}>
          <NotificationsActive sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No alerts yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You'll receive alerts for upcoming renewals and price drops
          </Typography>
        </Card>
      ) : (
        <Card sx={{ borderRadius: 3 }}>
          <List sx={{ p: 0 }}>
            {alerts.map((alert, index) => (
              <React.Fragment key={alert.id}>
                <ListItem
                  sx={{
                    py: 2,
                    px: 3,
                    bgcolor: alert.isRead ? 'transparent' : 'rgba(229, 9, 20, 0.05)',
                    '&:hover': {
                      bgcolor: 'rgba(229, 9, 20, 0.08)',
                    },
                  }}
                  secondaryAction={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {!alert.isRead && (
                        <IconButton
                          size="small"
                          onClick={() => handleMarkAsRead(alert.id)}
                          title="Mark as read"
                        >
                          <CheckCircle color="primary" />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setAnchorEl(e.currentTarget);
                          setSelectedAlert(alert);
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: `${getAlertColor(alert.alertType)}.light`,
                        color: `${getAlertColor(alert.alertType)}.main`,
                      }}
                    >
                      {getAlertIcon(alert.alertType)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight={alert.isRead ? 400 : 600}>
                          {alert.title}
                        </Typography>
                        {!alert.isRead && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {alert.message}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={alert.alertType === 'PRICE_DROP' ? 'Price Drop' : 'Renewal'}
                            size="small"
                            color={getAlertColor(alert.alertType)}
                            sx={{ height: 20 }}
                          />
                          {alert.subscriptionName && (
                            <Typography variant="caption" color="text.secondary">
                              • {alert.subscriptionName}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            • {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
                {index < alerts.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Card>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => handleDeleteAlert(selectedAlert?.id)}>
          <Delete sx={{ mr: 1 }} fontSize="small" color="error" />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Alerts;