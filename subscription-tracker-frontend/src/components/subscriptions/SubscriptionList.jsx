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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  Avatar,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  MoreVert,
  Edit,
  Delete,
  Visibility,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { subscriptionAPI } from '../../services/api';
import { formatCurrency, formatDate, getStatusColor, getCategoryIcon } from '../../utils/helpers';
import SuccessPopup from '../common/SuccessPopup';

const SubscriptionList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const categories = ['all', 'Streaming', 'Music', 'AI', 'Productivity', 'Gaming'];

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    filterAndSortSubscriptions();
  }, [subscriptions, searchTerm, categoryFilter, sortBy]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await subscriptionAPI.getUserSubscriptions();
      setSubscriptions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortSubscriptions = () => {
    let filtered = [...subscriptions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((sub) =>
        sub.subscriptionName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((sub) => sub.category === categoryFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.subscriptionName.localeCompare(b.subscriptionName);
        case 'price':
          return (b.customPrice || b.originalPrice) - (a.customPrice || a.originalPrice);
        case 'renewal':
          return new Date(a.renewalDate) - new Date(b.renewalDate);
        default:
          return 0;
      }
    });

    setFilteredSubscriptions(filtered);
  };

  const handleMenuOpen = (event, subscription) => {
    setAnchorEl(event.currentTarget);
    setSelectedSubscription(subscription);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = async () => {
    try {
      await subscriptionAPI.deleteSubscription(selectedSubscription.id);
      setShowSuccessPopup(true);
      fetchSubscriptions();
    } catch (error) {
      toast.error('Failed to delete subscription');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedSubscription(null);
    }
  };

  const totalMonthlySpend = filteredSubscriptions.reduce((sum, sub) => {
    const price = sub.customPrice || sub.originalPrice || 0;
    return sum + (sub.subscriptionType === 'YEARLY' ? price / 12 : price);
  }, 0);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3, borderRadius: 2 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rounded" height={200} />
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
        title="Deleted!"
        message="Subscription has been removed successfully."
        icon="check"
      />

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            My Subscriptions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subscriptions.length} active subscriptions • {formatCurrency(totalMonthlySpend)}/month
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/subscriptions/add')}
          sx={{
            backgroundColor: '#E50914',
            '&:hover': { backgroundColor: '#B81D24' },
          }}
        >
          Add Subscription
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search subscriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="price">Price (High to Low)</MenuItem>
                  <MenuItem value="renewal">Renewal Date</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Subscriptions Grid */}
      {filteredSubscriptions.length === 0 ? (
        <Card sx={{ borderRadius: 3, textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchTerm || categoryFilter !== 'all'
              ? 'No subscriptions match your filters'
              : 'No subscriptions yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchTerm || categoryFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Start tracking your subscriptions today!'}
          </Typography>
          {!searchTerm && categoryFilter === 'all' && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/subscriptions/add')}
            >
              Add Your First Subscription
            </Button>
          )}
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredSubscriptions.map((subscription) => (
            <Grid item xs={12} sm={6} md={4} key={subscription.id}>
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        src={subscription.subscriptionLogo}
                        sx={{ width: 48, height: 48, mr: 2, bgcolor: 'primary.light' }}
                      >
                        {getCategoryIcon(subscription.category)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          {subscription.subscriptionName}
                        </Typography>
                        <Chip
                          label={subscription.category}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            bgcolor: 'rgba(102, 126, 234, 0.1)',
                            color: 'primary.main',
                          }}
                        />
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, subscription)}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>

                  {/* Price */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {subscription.subscriptionType}
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="primary.main">
                      {formatCurrency(subscription.customPrice || subscription.originalPrice)}
                    </Typography>
                  </Box>

                  {/* Renewal Info */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      pt: 2,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Renewal Date
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {formatDate(subscription.renewalDate)}
                      </Typography>
                    </Box>
                    <Chip
                      label={
                        subscription.daysUntilRenewal !== null
                          ? subscription.daysUntilRenewal <= 0
                            ? 'Due Today'
                            : `${subscription.daysUntilRenewal} days`
                          : 'N/A'
                      }
                      size="small"
                      color={getStatusColor(subscription.daysUntilRenewal)}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem
          onClick={() => {
            navigate(`/subscriptions/${selectedSubscription?.id}`);
            handleMenuClose();
          }}
        >
          <Visibility sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate(`/subscriptions/${selectedSubscription?.id}/edit`);
            handleMenuClose();
          }}
        >
          <Edit sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteDialogOpen(true);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Delete sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Subscription</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedSubscription?.subscriptionName}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionList;