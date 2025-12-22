import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Avatar,
    Chip,
    CircularProgress,
    IconButton,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    LinearProgress,
    Tabs,
    Tab,
} from '@mui/material';
import {
    People,
    Subscriptions,
    TrendingUp,
    AttachMoney,
    Refresh,
    Logout,
    Schedule,
    Warning,
    CheckCircle,
    Cancel,
    Storage,
} from '@mui/icons-material';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    LineChart,
    Line,
    ResponsiveContainer,
} from 'recharts';
import { toast } from 'react-toastify';
import { adminAPI } from '../../services/api';
import { format } from 'date-fns';

const COLORS = ['#E50914', '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#00BCD4', '#795548'];

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);
    const [users, setUsers] = useState([]);
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        // Check admin authentication
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) {
            navigate('/admin/login');
            return;
        }

        fetchDashboardData();
        fetchUsers();
    }, [navigate]);

    const fetchDashboardData = async () => {
        try {
            setRefreshing(true);
            const response = await adminAPI.getDashboard();
            if (response.data.success) {
                setDashboardData(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching dashboard:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                navigate('/admin/login');
            } else {
                toast.error('Failed to load dashboard data');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await adminAPI.getUsers();
            if (response.data.success) {
                setUsers(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        toast.success('Logged out successfully');
        navigate('/admin/login');
    };

    const handleTriggerScraping = async () => {
        try {
            await adminAPI.triggerScraping();
            toast.success('Price scraping triggered!');
        } catch (error) {
            toast.error('Failed to trigger scraping');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#0a0a0a' }}>
                <CircularProgress sx={{ color: '#E50914' }} />
            </Box>
        );
    }

    const overview = dashboardData?.overview || {};
    const userAnalytics = dashboardData?.userAnalytics || {};
    const subscriptionAnalytics = dashboardData?.subscriptionAnalytics || {};
    const financialMetrics = dashboardData?.financialMetrics || {};
    const upcomingRenewals = dashboardData?.upcomingRenewals || [];
    const dataHealth = dashboardData?.dataHealth || {};

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a', p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} color="#fff">
                        Admin Dashboard
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        SubTracker Statistics & Analytics
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={fetchDashboardData}
                        disabled={refreshing}
                        sx={{ color: '#fff', borderColor: '#333', '&:hover': { borderColor: '#E50914' } }}
                    >
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleTriggerScraping}
                        sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' } }}
                    >
                        Trigger Scraping
                    </Button>
                    <IconButton onClick={handleLogout} sx={{ color: '#E50914' }}>
                        <Logout />
                    </IconButton>
                </Box>
            </Box>

            {/* Tabs */}
            <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{ mb: 3, borderBottom: '1px solid #333' }}
            >
                <Tab label="Overview" sx={{ color: '#fff' }} />
                <Tab label="Analytics" sx={{ color: '#fff' }} />
                <Tab label="Users" sx={{ color: '#fff' }} />
            </Tabs>

            {/* Tab 0: Overview */}
            {activeTab === 0 && (
                <>
                    {/* Summary Cards */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} sm={6} md={2.4}>
                            <StatCard
                                title="Total Users"
                                value={overview.totalUsers || 0}
                                icon={<People />}
                                color="#E50914"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                            <StatCard
                                title="Active Users (30d)"
                                value={overview.activeUsers || 0}
                                icon={<TrendingUp />}
                                color="#4CAF50"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                            <StatCard
                                title="Total Subscriptions"
                                value={overview.totalSubscriptions || 0}
                                icon={<Subscriptions />}
                                color="#2196F3"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                            <StatCard
                                title="Active Subs"
                                value={overview.activeSubscriptions || 0}
                                icon={<CheckCircle />}
                                color="#9C27B0"
                                subtitle={`${overview.expiredSubscriptions || 0} expired`}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                            <StatCard
                                title="Total MRR"
                                value={formatCurrency(overview.totalMRR)}
                                icon={<AttachMoney />}
                                color="#FF9800"
                                isValue
                            />
                        </Grid>
                    </Grid>

                    {/* Upcoming Renewals Table */}
                    <Card sx={{ mb: 4, bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={700} color="#fff" sx={{ mb: 2 }}>
                                <Schedule sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Upcoming Renewals (Next 30 Days)
                            </Typography>
                            <TableContainer component={Paper} sx={{ bgcolor: 'transparent' }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ color: '#999', borderColor: '#333' }}>User</TableCell>
                                            <TableCell sx={{ color: '#999', borderColor: '#333' }}>Subscription</TableCell>
                                            <TableCell sx={{ color: '#999', borderColor: '#333' }}>Renewal Date</TableCell>
                                            <TableCell sx={{ color: '#999', borderColor: '#333' }}>Days Left</TableCell>
                                            <TableCell sx={{ color: '#999', borderColor: '#333' }}>Price</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {upcomingRenewals.length > 0 ? (
                                            upcomingRenewals.slice(0, 10).map((renewal, index) => (
                                                <TableRow key={index}>
                                                    <TableCell sx={{ color: '#fff', borderColor: '#333' }}>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={600}>{renewal.userName}</Typography>
                                                            <Typography variant="caption" sx={{ color: '#999' }}>{renewal.userEmail}</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell sx={{ color: '#fff', borderColor: '#333' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Avatar src={renewal.subscriptionLogo} sx={{ width: 24, height: 24 }} />
                                                            {renewal.subscriptionName}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell sx={{ color: '#fff', borderColor: '#333' }}>
                                                        {renewal.renewalDate}
                                                    </TableCell>
                                                    <TableCell sx={{ borderColor: '#333' }}>
                                                        <Chip
                                                            label={`${renewal.daysUntilRenewal} days`}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: renewal.daysUntilRenewal <= 7 ? 'rgba(244, 67, 54, 0.2)' : 'rgba(76, 175, 80, 0.2)',
                                                                color: renewal.daysUntilRenewal <= 7 ? '#f44336' : '#4CAF50',
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ color: '#fff', borderColor: '#333' }}>
                                                        {formatCurrency(renewal.price)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center" sx={{ color: '#999', borderColor: '#333' }}>
                                                    No upcoming renewals
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>

                    {/* Data Health */}
                    <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={700} color="#fff" sx={{ mb: 2 }}>
                                <Storage sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Data Health (Scraping)
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={6} md={3}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="body2" sx={{ color: '#999', mb: 1 }}>Last Scrape</Typography>
                                        <Typography variant="h6" color="#fff">{dataHealth.lastScrapeTime || 'N/A'}</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="body2" sx={{ color: '#999', mb: 1 }}>Success Rate</Typography>
                                        <Typography variant="h6" color="#4CAF50">{dataHealth.scrapeSuccessRate || 0}%</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="body2" sx={{ color: '#999', mb: 1 }}>Services Scraped</Typography>
                                        <Typography variant="h6" color="#fff">{dataHealth.totalScrapedServices || 0}</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="body2" sx={{ color: '#999', mb: 1 }}>Failed</Typography>
                                        <Typography variant="h6" color="#f44336">{dataHealth.failedScrapes || 0}</Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Tab 1: Analytics */}
            {activeTab === 1 && (
                <Grid container spacing={3}>
                    {/* User Growth Chart */}
                    <Grid item xs={12} md={6}>
                        <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333', height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight={700} color="#fff" sx={{ mb: 2 }}>
                                    User Growth Over Time
                                </Typography>
                                <Box sx={{ height: 300 }}>
                                    <ResponsiveContainer>
                                        <LineChart data={userAnalytics.userGrowth || []}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                            <XAxis dataKey="period" stroke="#999" />
                                            <YAxis stroke="#999" />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                                                labelStyle={{ color: '#fff' }}
                                            />
                                            <Line type="monotone" dataKey="count" stroke="#E50914" strokeWidth={3} dot={{ fill: '#E50914' }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Box>
                                <Box sx={{ mt: 2 }}>
                                    <Typography component="div" variant="body2" sx={{ color: '#999' }}>
                                        Churn Rate: <Chip label={`${userAnalytics.churnRate || 0}%`} size="small" sx={{ ml: 1, bgcolor: 'rgba(244, 67, 54, 0.2)', color: '#f44336' }} />
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#999', mt: 0.5 }}>
                                        Inactive Users (30d+): <strong style={{ color: '#fff' }}>{userAnalytics.inactiveUsers || 0}</strong>
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Subscriptions by Category */}
                    <Grid item xs={12} md={6}>
                        <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333', height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight={700} color="#fff" sx={{ mb: 2 }}>
                                    Subscriptions by Category
                                </Typography>
                                <Box sx={{ height: 300 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={subscriptionAnalytics.byCategory || []}
                                                dataKey="count"
                                                nameKey="category"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100}
                                                label={({ category, percentage }) => `${category} (${percentage}%)`}
                                            >
                                                {(subscriptionAnalytics.byCategory || []).map((entry, index) => (
                                                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Top Subscriptions */}
                    <Grid item xs={12} md={6}>
                        <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight={700} color="#fff" sx={{ mb: 2 }}>
                                    Most Popular Subscriptions
                                </Typography>
                                <Box sx={{ height: 300 }}>
                                    <ResponsiveContainer>
                                        <BarChart data={subscriptionAnalytics.topSubscriptions || []} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                            <XAxis type="number" stroke="#999" />
                                            <YAxis dataKey="name" type="category" stroke="#999" width={100} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                                                labelStyle={{ color: '#fff' }}
                                            />
                                            <Bar dataKey="userCount" fill="#E50914" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* MRR Trend */}
                    <Grid item xs={12} md={6}>
                        <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight={700} color="#fff" sx={{ mb: 2 }}>
                                    Monthly Recurring Revenue (MRR) Trend
                                </Typography>
                                <Box sx={{ height: 300 }}>
                                    <ResponsiveContainer>
                                        <LineChart data={financialMetrics.mrrTrend || []}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                            <XAxis dataKey="month" stroke="#999" />
                                            <YAxis stroke="#999" />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                                                labelStyle={{ color: '#fff' }}
                                                formatter={(value) => formatCurrency(value)}
                                            />
                                            <Line type="monotone" dataKey="mrr" stroke="#4CAF50" strokeWidth={3} dot={{ fill: '#4CAF50' }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Box>
                                <Box sx={{ mt: 2, textAlign: 'center' }}>
                                    <Typography variant="body2" sx={{ color: '#999' }}>
                                        Current MRR: <strong style={{ color: '#4CAF50', fontSize: '1.2rem' }}>{formatCurrency(financialMetrics.currentMRR)}</strong>
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Status Breakdown */}
                    <Grid item xs={12}>
                        <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight={700} color="#fff" sx={{ mb: 3 }}>
                                    Subscription Status Breakdown
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={4}>
                                        <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 2, border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                                            <CheckCircle sx={{ fontSize: 40, color: '#4CAF50', mb: 1 }} />
                                            <Typography variant="h4" fontWeight={700} color="#4CAF50">
                                                {subscriptionAnalytics.statusBreakdown?.active || 0}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#999' }}>Active</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'rgba(255, 152, 0, 0.1)', borderRadius: 2, border: '1px solid rgba(255, 152, 0, 0.3)' }}>
                                            <Warning sx={{ fontSize: 40, color: '#FF9800', mb: 1 }} />
                                            <Typography variant="h4" fontWeight={700} color="#FF9800">
                                                {subscriptionAnalytics.statusBreakdown?.expiringSoon || 0}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#999' }}>Expiring Soon</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'rgba(244, 67, 54, 0.1)', borderRadius: 2, border: '1px solid rgba(244, 67, 54, 0.3)' }}>
                                            <Cancel sx={{ fontSize: 40, color: '#f44336', mb: 1 }} />
                                            <Typography variant="h4" fontWeight={700} color="#f44336">
                                                {subscriptionAnalytics.statusBreakdown?.cancelled || 0}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#999' }}>Cancelled</Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Tab 2: Users */}
            {activeTab === 2 && (
                <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight={700} color="#fff" sx={{ mb: 3 }}>
                            User Management ({users.length} users)
                        </Typography>
                        <TableContainer component={Paper} sx={{ bgcolor: 'transparent' }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ color: '#999', borderColor: '#333', fontWeight: 700 }}>User</TableCell>
                                        <TableCell sx={{ color: '#999', borderColor: '#333', fontWeight: 700 }}>Email</TableCell>
                                        <TableCell sx={{ color: '#999', borderColor: '#333', fontWeight: 700 }}>Joined Date</TableCell>
                                        <TableCell sx={{ color: '#999', borderColor: '#333', fontWeight: 700 }}>Last Login</TableCell>
                                        <TableCell sx={{ color: '#999', borderColor: '#333', fontWeight: 700 }}>Subscriptions</TableCell>
                                        <TableCell sx={{ color: '#999', borderColor: '#333', fontWeight: 700 }}>Monthly Spend</TableCell>
                                        <TableCell sx={{ color: '#999', borderColor: '#333', fontWeight: 700 }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
                                            <TableCell sx={{ color: '#fff', borderColor: '#333' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Avatar sx={{ bgcolor: '#E50914' }}>
                                                        {user.name?.charAt(0)?.toUpperCase()}
                                                    </Avatar>
                                                    <Typography fontWeight={600}>{user.name}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ color: '#fff', borderColor: '#333' }}>{user.email}</TableCell>
                                            <TableCell sx={{ color: '#fff', borderColor: '#333' }}>
                                                {user.joinedDate ? format(new Date(user.joinedDate), 'MMM dd, yyyy') : 'N/A'}
                                            </TableCell>
                                            <TableCell sx={{ color: '#fff', borderColor: '#333' }}>
                                                {user.lastLogin ? format(new Date(user.lastLogin), 'MMM dd, yyyy HH:mm') : 'Never'}
                                            </TableCell>
                                            <TableCell sx={{ borderColor: '#333' }}>
                                                <Chip
                                                    label={user.totalSubscriptions || 0}
                                                    size="small"
                                                    sx={{ bgcolor: 'rgba(33, 150, 243, 0.2)', color: '#2196F3' }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ color: '#fff', borderColor: '#333' }}>
                                                {formatCurrency(user.totalMonthlySpend)}
                                            </TableCell>
                                            <TableCell sx={{ borderColor: '#333' }}>
                                                <Chip
                                                    label={user.isActive ? 'Active' : 'Inactive'}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: user.isActive ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                                                        color: user.isActive ? '#4CAF50' : '#f44336',
                                                    }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color, subtitle, isValue }) => (
    <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333', height: '100%' }}>
        <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography variant="body2" sx={{ color: '#999', mb: 1 }}>{title}</Typography>
                    <Typography variant={isValue ? 'h5' : 'h4'} fontWeight={700} color="#fff">
                        {value}
                    </Typography>
                    {subtitle && (
                        <Typography variant="caption" sx={{ color: '#999' }}>{subtitle}</Typography>
                    )}
                </Box>
                <Avatar sx={{ bgcolor: `${color}20`, color }}>
                    {icon}
                </Avatar>
            </Box>
        </CardContent>
    </Card>
);

export default AdminDashboard;
