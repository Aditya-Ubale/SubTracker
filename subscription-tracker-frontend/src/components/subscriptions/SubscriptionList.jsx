/**
 * SubscriptionList - Premium Subscription Management Page
 * 
 * Design Refinements:
 * - Reduced red usage (red only for urgent renewals ≤7 days)
 * - Neutral text for prices; emphasis via size/weight
 * - Service name as primary visual focus
 * - De-emphasized frequency labels (MONTHLY/YEARLY)
 * - Softer category pills with reduced saturation
 * - Subtle "days left" badge styling
 * - Improved search/filter section with reduced height
 * - Micro-interactions: elevation + soft shadow on hover
 * - Max 2 accent colors: indigo (#6366f1), amber for urgent
 */
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
  MoreVert,
  Edit,
  Delete,
  Visibility,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { subscriptionAPI } from '../../services/api';
import { formatCurrency, formatDate, getCategoryIcon } from '../../utils/helpers';
import SuccessPopup from '../common/SuccessPopup';

// Category styling with softer, desaturated colors
const CATEGORY_STYLES = {
  'Streaming': { bg: 'rgba(239, 68, 68, 0.08)', color: 'rgba(239, 68, 68, 0.8)' },
  'Music': { bg: 'rgba(16, 185, 129, 0.08)', color: 'rgba(16, 185, 129, 0.8)' },
  'AI': { bg: 'rgba(139, 92, 246, 0.08)', color: 'rgba(139, 92, 246, 0.8)' },
  'Productivity': { bg: 'rgba(59, 130, 246, 0.08)', color: 'rgba(59, 130, 246, 0.8)' },
  'Gaming': { bg: 'rgba(34, 197, 94, 0.08)', color: 'rgba(34, 197, 94, 0.8)' },
  'default': { bg: 'rgba(107, 114, 128, 0.08)', color: 'rgba(156, 163, 175, 0.9)' },
};

// Get renewal status styling - red only for urgent (≤7 days)
const getRenewalStyle = (daysUntilRenewal) => {
  if (daysUntilRenewal === null || daysUntilRenewal === undefined) {
    return { bg: 'rgba(107, 114, 128, 0.1)', color: 'rgba(156, 163, 175, 0.8)', label: 'N/A' };
  }
  if (daysUntilRenewal <= 0) {
    return { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', label: 'Due Today' };
  }
  if (daysUntilRenewal <= 3) {
    return { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', label: `${daysUntilRenewal} days` };
  }
  if (daysUntilRenewal <= 7) {
    return { bg: 'rgba(245, 158, 11, 0.08)', color: 'rgba(245, 158, 11, 0.8)', label: `${daysUntilRenewal} days` };
  }
  // Calm, subtle badge for non-urgent
  return { bg: 'rgba(99, 102, 241, 0.08)', color: 'rgba(129, 140, 248, 0.9)', label: `${daysUntilRenewal} days` };
};

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
    event.stopPropagation();
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

  // Get category style with fallback
  const getCategoryStyle = (category) => {
    return CATEGORY_STYLES[category] || CATEGORY_STYLES.default;
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={48} sx={{ mb: 3, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={56} sx={{ mb: 3, borderRadius: 2 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rounded" height={180} sx={{ borderRadius: 3 }} />
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

      {/* Header - Cleaner styling */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              color: '#fff',
              letterSpacing: '-0.02em',
              mb: 0.5,
            }}
          >
            My Subscriptions
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.45)' }}>
            {subscriptions.length} active • {formatCurrency(totalMonthlySpend)}/month
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/subscriptions/add')}
          sx={{
            bgcolor: '#E50914',
            px: 2.5,
            py: 1,
            fontWeight: 600,
            '&:hover': {
              bgcolor: '#C2070F',
              transform: 'translateY(-1px)',
            },
            '&:active': {
              transform: 'scale(0.98)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          Add New
        </Button>
      </Box>

      {/* Search & Filters - Reduced height, better spacing */}
      <Card
        sx={{
          mb: 4,
          borderRadius: 2.5,
          bgcolor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: 'none',
        }}
      >
        <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                placeholder="Search subscriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255, 255, 255, 0.02)',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.08)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                    '&.Mui-focused fieldset': { borderColor: 'rgba(99, 102, 241, 0.5)' },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(255, 255, 255, 0.3)', // Lower contrast placeholder
                    opacity: 1,
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.02)',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.08)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                  }}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.02)',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.08)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                  }}
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
        <Card
          sx={{
            borderRadius: 3,
            textAlign: 'center',
            py: 8,
            bgcolor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.6)' }} gutterBottom>
            {searchTerm || categoryFilter !== 'all'
              ? 'No subscriptions match your filters'
              : 'No subscriptions yet'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.4)', mb: 3 }}>
            {searchTerm || categoryFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Start tracking your subscriptions today!'}
          </Typography>
          {!searchTerm && categoryFilter === 'all' && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/subscriptions/add')}
              sx={{
                bgcolor: '#E50914',
                '&:hover': { bgcolor: '#C2070F' },
              }}
            >
              Add Your First Subscription
            </Button>
          )}
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredSubscriptions.map((subscription, index) => {
            const categoryStyle = getCategoryStyle(subscription.category);
            const renewalStyle = getRenewalStyle(subscription.daysUntilRenewal);

            return (
              <Grid item xs={12} sm={6} md={4} key={subscription.id}>
                <Card
                  onClick={() => navigate(`/subscriptions/${subscription.id}`)}
                  sx={{
                    borderRadius: 3,
                    cursor: 'pointer',
                    bgcolor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',

                    // Micro-interaction: elevation + soft shadow on hover
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.035)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 24px rgba(0, 0, 0, 0.25)',

                      // Highlight menu button on card hover
                      '& .menu-button': {
                        opacity: 1,
                      },
                    },
                  }}
                >
                  {/* Slightly vary internal spacing for organic feel */}
                  <CardContent sx={{ p: 2.5, pb: index % 2 === 0 ? 2.5 : 2.75, '&:last-child': { pb: index % 2 === 0 ? 2.5 : 2.75 } }}>

                    {/* Header - Service name as primary focus */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          src={subscription.subscriptionLogo}
                          sx={{
                            width: 44,
                            height: 44,
                            bgcolor: 'rgba(99, 102, 241, 0.12)',
                            fontSize: '1.1rem',
                          }}
                        >
                          {getCategoryIcon(subscription.category)}
                        </Avatar>
                        <Box>
                          {/* Primary focus: Service name */}
                          <Typography
                            variant="subtitle1"
                            fontWeight={600}
                            sx={{
                              color: '#fff',
                              lineHeight: 1.3,
                              mb: 0.5,
                            }}
                          >
                            {subscription.subscriptionName}
                          </Typography>

                          {/* Category pill - softer, desaturated */}
                          <Chip
                            label={subscription.category}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.65rem',
                              fontWeight: 500,
                              bgcolor: categoryStyle.bg,
                              color: categoryStyle.color,
                              border: 'none',
                              '& .MuiChip-label': { px: 1 },
                            }}
                          />
                        </Box>
                      </Box>

                      {/* Menu button - subtle background on hover */}
                      <IconButton
                        className="menu-button"
                        size="small"
                        onClick={(e) => handleMenuOpen(e, subscription)}
                        sx={{
                          opacity: 0.5,
                          color: 'rgba(255, 255, 255, 0.6)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            opacity: 1,
                            bgcolor: 'rgba(255, 255, 255, 0.08)',
                          },
                        }}
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* Price Section - Neutral color, emphasis via size/weight */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        {/* Price - prominent via size, not color */}
                        <Typography
                          variant="h5"
                          fontWeight={700}
                          sx={{ color: 'rgba(255, 255, 255, 0.9)' }} // Neutral, not red
                        >
                          {formatCurrency(subscription.customPrice || subscription.originalPrice)}
                        </Typography>

                        {/* Frequency - de-emphasized */}
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.35)', // Lower opacity
                            fontSize: '0.7rem',
                            textTransform: 'lowercase',
                          }}
                        >
                          /{subscription.subscriptionType === 'YEARLY' ? 'year' : 'mo'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Renewal Section - Soft visual separation */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        pt: 2,
                        mt: 1,
                        // Soft separator instead of strong border
                        borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                      }}
                    >
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.35)',
                            fontSize: '0.7rem',
                          }}
                        >
                          Renews
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.75)',
                            fontWeight: 500,
                          }}
                        >
                          {formatDate(subscription.renewalDate)}
                        </Typography>
                      </Box>

                      {/* Days badge - subtle, red only for urgent */}
                      <Chip
                        label={renewalStyle.label}
                        size="small"
                        sx={{
                          height: 24,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          bgcolor: renewalStyle.bg,
                          color: renewalStyle.color,
                          border: 'none',
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Actions Menu - Subtle styling */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            bgcolor: '#1a1a1a',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 2,
            minWidth: 160,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          },
        }}
      >
        <MenuItem
          onClick={() => {
            navigate(`/subscriptions/${selectedSubscription?.id}`);
            handleMenuClose();
          }}
          sx={{
            py: 1.25,
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.04)' },
          }}
        >
          <Visibility sx={{ mr: 1.5, fontSize: 18, color: 'rgba(255,255,255,0.6)' }} />
          <Typography variant="body2">View Details</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate(`/subscriptions/${selectedSubscription?.id}/edit`);
            handleMenuClose();
          }}
          sx={{
            py: 1.25,
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.04)' },
          }}
        >
          <Edit sx={{ mr: 1.5, fontSize: 18, color: 'rgba(255,255,255,0.6)' }} />
          <Typography variant="body2">Edit</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteDialogOpen(true);
            handleMenuClose();
          }}
          sx={{
            py: 1.25,
            color: '#ef4444',
            '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' },
          }}
        >
          <Delete sx={{ mr: 1.5, fontSize: 18 }} />
          <Typography variant="body2">Delete</Typography>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#1a1a1a',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.08)',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={600}>Delete Subscription</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Are you sure you want to delete "{selectedSubscription?.subscriptionName}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1.5 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.04)' },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            sx={{
              bgcolor: '#ef4444',
              '&:hover': { bgcolor: '#dc2626' },
              '&:active': { transform: 'scale(0.98)' },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionList;