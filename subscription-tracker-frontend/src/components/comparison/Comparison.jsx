import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  CompareArrows,
  Check,
  Close,
  FilterList,
} from '@mui/icons-material';
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
import { subscriptionAPI } from '../../services/api';
import { formatCurrency, getCategoryIcon } from '../../utils/helpers';

// Category-specific feature labels
const CATEGORY_FEATURES = {
  'Streaming': [
    { key: 'maxDevices', label: 'Max Screens/Devices' },
    { key: 'streamingQuality', label: 'Video Quality' },
  ],
  'Music': [
    { key: 'maxDevices', label: 'Devices Allowed' },
    { key: 'features', label: 'Key Features' },
  ],
  'AI': [
    { key: 'features', label: 'AI Capabilities' },
    { key: 'maxDevices', label: 'Max Users/Devices Allowed' },
  ],
  'Productivity': [
    { key: 'features', label: 'Features Included' },
    { key: 'maxDevices', label: 'Team Members Allowed' },
  ],
  'Storage': [
    { key: 'features', label: 'Storage Features' },
    { key: 'maxDevices', label: 'Devices for Sync' },
  ],
  'Gaming': [
    { key: 'features', label: 'Game Library' },
    { key: 'maxDevices', label: 'Supported Platforms' },
  ],
  'default': [
    { key: 'features', label: 'Key Features' },
    { key: 'maxDevices', label: 'Max Devices' },
  ],
};

const Comparison = () => {
  const [loading, setLoading] = useState(true);
  const [availableSubscriptions, setAvailableSubscriptions] = useState([]);
  const [selectedSubscriptions, setSelectedSubscriptions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await subscriptionAPI.getAllAvailable();
      setAvailableSubscriptions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(availableSubscriptions.map((sub) => sub.category))];
    return cats.sort();
  }, [availableSubscriptions]);

  // Filter subscriptions by selected category
  const filteredSubscriptions = useMemo(() => {
    if (!selectedCategory) return availableSubscriptions;
    return availableSubscriptions.filter((sub) => sub.category === selectedCategory);
  }, [availableSubscriptions, selectedCategory]);

  // Handle category change
  const handleCategoryChange = (event) => {
    const newCategory = event.target.value;
    setSelectedCategory(newCategory);
    // Clear selections if category changes
    setSelectedSubscriptions([]);
  };

  const handleToggleSubscription = (subscription) => {
    setSelectedSubscriptions((prev) => {
      const exists = prev.find((s) => s.id === subscription.id);
      if (exists) {
        return prev.filter((s) => s.id !== subscription.id);
      }
      if (prev.length >= 4) {
        return prev; // Max 4 subscriptions
      }
      return [...prev, subscription];
    });
  };

  const clearSelection = () => {
    setSelectedSubscriptions([]);
  };

  // Get the current category (from selected subscriptions or filter)
  const currentCategory = useMemo(() => {
    if (selectedSubscriptions.length > 0) {
      return selectedSubscriptions[0].category;
    }
    return selectedCategory || 'default';
  }, [selectedSubscriptions, selectedCategory]);

  // Get category-specific features to display
  const featuresToDisplay = CATEGORY_FEATURES[currentCategory] || CATEGORY_FEATURES['default'];

  // Parse features string (JSON) safely
  const parseFeatures = (featuresStr) => {
    if (!featuresStr) return 'N/A';
    try {
      const features = JSON.parse(featuresStr);
      if (Array.isArray(features)) {
        return features.slice(0, 3).join(', '); // Show first 3 features
      }
      return featuresStr;
    } catch {
      // If not JSON, return as is
      return featuresStr;
    }
  };

  // Get feature value for a subscription
  const getFeatureValue = (subscription, featureKey) => {
    if (featureKey === 'features') {
      return parseFeatures(subscription.features);
    }
    return subscription[featureKey] || 'N/A';
  };

  // Prepare chart data - Show ACTUAL monthly and yearly prices
  const priceChartData = selectedSubscriptions.map((sub) => ({
    name: sub.name,
    'Monthly Price': sub.priceMonthly,
    'Yearly Price': sub.priceYearly,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 2,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        >
          <Typography fontWeight={600}>{label}</Typography>
          {payload.map((entry, index) => (
            <Box key={index} sx={{ color: entry.color, mt: 0.5 }}>
              {entry.name}: {formatCurrency(entry.value)}
            </Box>
          ))}
        </Box>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3, borderRadius: 2 }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={6} sm={4} md={2} key={i}>
              <Skeleton variant="rounded" height={120} />
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
          <Typography variant="h4" fontWeight={700}>
            Compare Subscriptions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Compare similar subscriptions within the same category
          </Typography>
        </Box>
        {selectedSubscriptions.length > 0 && (
          <Button variant="outlined" onClick={clearSelection}>
            Clear Selection ({selectedSubscriptions.length})
          </Button>
        )}
      </Box>

      {/* Category Filter */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FilterList color="primary" />
            <Typography variant="subtitle1" fontWeight={600}>
              Filter by Category
            </Typography>
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel>Select Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Select Category"
                onChange={handleCategoryChange}
              >
                <MenuItem value="">
                  <em>All Categories</em>
                </MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getCategoryIcon(cat)}
                      {cat}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedCategory && (
              <Chip
                label={`Showing: ${selectedCategory}`}
                onDelete={() => setSelectedCategory('')}
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
          {!selectedCategory && (
            <Alert severity="info" sx={{ mt: 2 }}>
              💡 <strong>Tip:</strong> Select a category to compare similar subscriptions.
              Comparing subscriptions within the same category gives you more meaningful insights!
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Selection Grid */}
      <Card sx={{ mb: 4, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Select Subscriptions to Compare
            {selectedCategory && (
              <Chip
                label={selectedCategory}
                size="small"
                sx={{ ml: 2 }}
                color="primary"
              />
            )}
          </Typography>
          {filteredSubscriptions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No subscriptions found in this category
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filteredSubscriptions.map((sub) => {
                const isSelected = selectedSubscriptions.find((s) => s.id === sub.id);
                const canSelect = selectedSubscriptions.length < 4 || isSelected;

                return (
                  <Grid item xs={6} sm={4} md={2} key={sub.id}>
                    <Card
                      sx={{
                        cursor: canSelect ? 'pointer' : 'not-allowed',
                        border: isSelected ? 2 : 1,
                        borderColor: isSelected ? 'primary.main' : 'divider',
                        opacity: !canSelect ? 0.5 : 1,
                        transition: 'all 0.2s',
                        '&:hover': canSelect ? {
                          borderColor: 'primary.main',
                          transform: 'translateY(-2px)',
                        } : {},
                      }}
                      onClick={() => canSelect && handleToggleSubscription(sub)}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 2 }}>
                        <Box sx={{ position: 'relative', display: 'inline-block' }}>
                          <Avatar
                            src={sub.logoUrl}
                            sx={{ width: 48, height: 48, mx: 'auto', mb: 1, bgcolor: 'primary.light' }}
                          >
                            {getCategoryIcon(sub.category)}
                          </Avatar>
                          {isSelected && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: -4,
                                right: -4,
                                bgcolor: 'primary.main',
                                borderRadius: '50%',
                                width: 20,
                                height: 20,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Check sx={{ color: 'white', fontSize: 14 }} />
                            </Box>
                          )}
                        </Box>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {sub.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatCurrency(sub.priceMonthly)}/mo
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {selectedSubscriptions.length >= 2 && (
        <>
          {/* Price Comparison Chart - Full Width */}
          <Card sx={{ mb: 4, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Price Comparison
              </Typography>
              <Box sx={{ height: 350 }}>
                <ResponsiveContainer>
                  <BarChart data={priceChartData} margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `₹${value.toLocaleString()}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="Monthly Price"
                      fill="#E50914"
                      radius={[8, 8, 0, 0]}
                      barSize={60}
                    />
                    <Bar
                      dataKey="Yearly Price"
                      fill="#B81D24"
                      radius={[8, 8, 0, 0]}
                      barSize={60}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          {/* Feature Comparison Table */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Feature Comparison
                <Chip
                  label={currentCategory !== 'default' ? currentCategory : 'Mixed'}
                  size="small"
                  sx={{ ml: 2 }}
                  color="secondary"
                />
              </Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table sx={{ tableLayout: 'fixed' }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 700, width: '20%' }}>Feature</TableCell>
                      {selectedSubscriptions.map((sub) => (
                        <TableCell key={sub.id} align="center" sx={{ fontWeight: 700 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <Avatar src={sub.logoUrl} sx={{ width: 28, height: 28 }}>
                              {getCategoryIcon(sub.category)}
                            </Avatar>
                            {sub.name}
                          </Box>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Monthly Price */}
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Monthly Price</TableCell>
                      {selectedSubscriptions.map((sub) => (
                        <TableCell key={sub.id} align="center">
                          <Typography fontWeight={700} color="primary.main">
                            {formatCurrency(sub.priceMonthly)}
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Yearly Price */}
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Yearly Price</TableCell>
                      {selectedSubscriptions.map((sub) => (
                        <TableCell key={sub.id} align="center">
                          <Box>
                            <Typography>{formatCurrency(sub.priceYearly)}</Typography>
                            <Typography variant="caption" color="success.main">
                              Save {formatCurrency((sub.priceMonthly * 12) - sub.priceYearly)}/yr
                            </Typography>
                          </Box>
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Dynamic Category-Specific Features */}
                    {featuresToDisplay.map((feature) => (
                      <TableRow key={feature.key}>
                        <TableCell sx={{ fontWeight: 600 }}>{feature.label}</TableCell>
                        {selectedSubscriptions.map((sub) => (
                          <TableCell key={sub.id} align="center">
                            <Typography variant="body2">
                              {getFeatureValue(sub, feature.key)}
                            </Typography>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}

                    {/* Description (if available) */}
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, verticalAlign: 'top' }}>Description</TableCell>
                      {selectedSubscriptions.map((sub) => (
                        <TableCell key={sub.id} align="left" sx={{ verticalAlign: 'top' }}>
                          <Typography
                            variant="body2"
                            sx={{
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                              lineHeight: 1.6,
                            }}
                          >
                            {sub.description || 'No description available'}
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      {selectedSubscriptions.length < 2 && (
        <Card sx={{ borderRadius: 3, textAlign: 'center', py: 8 }}>
          <CompareArrows sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Select at least 2 subscriptions to compare
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedCategory
              ? `Choose from ${filteredSubscriptions.length} ${selectedCategory} subscriptions above`
              : 'Select a category first, then choose subscriptions to compare'}
          </Typography>
        </Card>
      )}
    </Box>
  );
};

export default Comparison;