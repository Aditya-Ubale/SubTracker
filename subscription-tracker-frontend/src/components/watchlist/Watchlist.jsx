import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Chip,
  Skeleton,
  FormControlLabel,
  Switch,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Delete,
  TrendingDown,
  Notifications,
  ShoppingCart,
  OpenInNew,
  Favorite,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { watchlistAPI, subscriptionAPI } from '../../services/api';
import { formatCurrency, getCategoryIcon } from '../../utils/helpers';
import SuccessPopup from '../common/SuccessPopup';

const Wishlist = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [availableSubscriptions, setAvailableSubscriptions] = useState([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [targetPrice, setTargetPrice] = useState('');
  const [notifyOnDrop, setNotifyOnDrop] = useState(true);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [addedSubscriptionName, setAddedSubscriptionName] = useState('');
  const [successType, setSuccessType] = useState('add'); // 'add' or 'remove'

  useEffect(() => {
    fetchWishlist();
    fetchAvailableSubscriptions();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await watchlistAPI.getWatchlist();
      setWishlist(response.data.data || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSubscriptions = async () => {
    try {
      const response = await subscriptionAPI.getAllAvailable();
      setAvailableSubscriptions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const handleAddToWishlist = async () => {
    if (!selectedSubscription) {
      toast.error('Please select a subscription');
      return;
    }

    try {
      await watchlistAPI.addToWatchlist({
        subscriptionId: selectedSubscription.id,
        targetPrice: targetPrice ? parseFloat(targetPrice) : null,
        notifyOnPriceDrop: notifyOnDrop,
      });
      setAddedSubscriptionName(selectedSubscription.name);
      setSuccessType('add');
      setShowSuccessPopup(true);
      setAddDialogOpen(false);
      setSelectedSubscription(null);
      setTargetPrice('');
      fetchWishlist();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to wishlist');
    }
  };

  const handleRemoveFromWishlist = async (id) => {
    try {
      await watchlistAPI.removeFromWatchlist(id);
      setSuccessType('remove');
      setShowSuccessPopup(true);
      fetchWishlist();
    } catch (error) {
      toast.error('Failed to remove from wishlist');
    }
  };

  const handleSubscribeNow = (subscriptionId) => {
    navigate(`/subscriptions/add?subscriptionId=${subscriptionId}`);
  };

  const handleBuyNow = (websiteUrl) => {
    if (websiteUrl) {
      window.open(websiteUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast.info('Website URL not available for this subscription');
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3, borderRadius: 2 }} />
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rounded" height={280} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Favorite sx={{ color: '#ff6b6b' }} /> My Wishlist
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track prices for subscriptions you're interested in
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setAddDialogOpen(true)}
          sx={{
            backgroundColor: '#E50914',
            '&:hover': { backgroundColor: '#B81D24' },
          }}
        >
          Add to Wishlist
        </Button>
      </Box>

      {/* Wishlist Grid */}
      {wishlist.length === 0 ? (
        <Card sx={{ borderRadius: 3, textAlign: 'center', py: 8 }}>
          <Box sx={{ fontSize: 64, mb: 2 }}>💝</Box>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Your wishlist is empty
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add subscriptions to track their prices and get notified when they drop!
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddDialogOpen(true)}
          >
            Add to Wishlist
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {wishlist.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card
                sx={{
                  borderRadius: 3,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                  },
                }}
              >
                <CardContent>
                  {/* Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      src={item.subscriptionLogo}
                      sx={{ width: 48, height: 48, mr: 2, bgcolor: 'primary.light' }}
                    >
                      {getCategoryIcon(item.category)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" fontWeight={600}>
                        {item.subscriptionName}
                      </Typography>
                      <Chip label={item.category} size="small" sx={{ height: 20 }} />
                    </Box>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveFromWishlist(item.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>

                  {/* Prices */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Current Monthly Price
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color="primary.main">
                        {formatCurrency(item.currentPriceMonthly)}
                      </Typography>
                    </Box>
                    {item.targetPrice && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Target Price
                        </Typography>
                        <Typography variant="body1" fontWeight={600} color="success.main">
                          {formatCurrency(item.targetPrice)}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Alert Status */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 2,
                      p: 1,
                      bgcolor: 'rgba(102, 126, 234, 0.1)',
                      borderRadius: 1,
                    }}
                  >
                    <Notifications sx={{ mr: 1, color: 'primary.main' }} fontSize="small" />
                    <Typography variant="body2" color="primary.main">
                      {item.notifyOnPriceDrop
                        ? 'Price drop alerts enabled'
                        : 'Alerts disabled'}
                    </Typography>
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<OpenInNew />}
                      onClick={() => handleBuyNow(item.websiteUrl)}
                      sx={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #ee5a5a 0%, #ff9500 100%)',
                        },
                      }}
                    >
                      Buy Now
                    </Button>
                    <Tooltip title="Add to my subscriptions">
                      <IconButton
                        onClick={() => handleSubscribeNow(item.subscriptionId)}
                        sx={{
                          bgcolor: 'rgba(17, 153, 142, 0.1)',
                          color: '#11998e',
                          '&:hover': {
                            bgcolor: 'rgba(17, 153, 142, 0.2)',
                          },
                        }}
                      >
                        <ShoppingCart />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add to Wishlist Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Favorite sx={{ color: '#ff6b6b' }} /> Add to Wishlist
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select a subscription to track its price
          </Typography>

          <Grid container spacing={2}>
            {availableSubscriptions
              .filter((sub) => !wishlist.find((w) => w.subscriptionId === sub.id))
              .map((sub) => (
                <Grid item xs={12} sm={6} key={sub.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: selectedSubscription?.id === sub.id ? 2 : 1,
                      borderColor: selectedSubscription?.id === sub.id ? 'primary.main' : 'divider',
                      '&:hover': { borderColor: 'primary.main' },
                    }}
                    onClick={() => setSelectedSubscription(sub)}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          src={sub.logoUrl}
                          sx={{ width: 36, height: 36, mr: 1.5, bgcolor: 'primary.light' }}
                        >
                          {getCategoryIcon(sub.category)}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight={600}>
                            {sub.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatCurrency(sub.priceMonthly)}/mo
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>

          {selectedSubscription && (
            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                label="Target Price (Optional)"
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                helperText="Get notified when price drops below this amount"
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notifyOnDrop}
                    onChange={(e) => setNotifyOnDrop(e.target.checked)}
                  />
                }
                label="Notify me on price drops"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddToWishlist}
            disabled={!selectedSubscription}
            sx={{
              backgroundColor: '#E50914',
              '&:hover': { backgroundColor: '#B81D24' },
            }}
          >
            Add to Wishlist
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Popup */}
      <SuccessPopup
        open={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title={successType === 'remove' ? 'Removed!' : 'Added to Wishlist!'}
        message={successType === 'remove'
          ? 'Item has been removed from your wishlist.'
          : `${addedSubscriptionName} is now on your wishlist. We'll notify you of price drops!`}
        icon={successType === 'remove' ? 'check' : 'heart'}
      />
    </Box>
  );
};

export default Wishlist;