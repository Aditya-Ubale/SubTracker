/**
 * Sidebar - Modern Collapsible Navigation
 * 
 * Design: Linear/Vercel inspired
 * - Collapsible (72px collapsed, 240px expanded)
 * - Smooth animations
 * - Clean iconography
 * - Hover tooltips when collapsed
 */
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Dashboard,
  Subscriptions,
  TrendingUp,
  CompareArrows,
  Favorite,
  Notifications,
  Logout,
  Settings,
  HelpOutline,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

// Sidebar dimensions
const SIDEBAR_EXPANDED = 240;
const SIDEBAR_COLLAPSED = 72;

// Navigation structure
const NAV_SECTIONS = [
  {
    id: 'main',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: Dashboard },
      { path: '/subscriptions', label: 'Subscriptions', icon: Subscriptions },
    ],
  },
  {
    id: 'planning',
    label: 'Planning',
    items: [
      { path: '/budget', label: 'Budget', icon: TrendingUp },
      { path: '/compare', label: 'Compare', icon: CompareArrows },
      { path: '/wishlist', label: 'Wishlist', icon: Favorite },
    ],
  },
  {
    id: 'activity',
    label: 'Activity',
    items: [{ path: '/alerts', label: 'Alerts', icon: Notifications }],
  },
];

const BOTTOM_NAV = [
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/help', label: 'Help', icon: HelpOutline },
];

const Sidebar = ({ open, onClose, variant = 'permanent' }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) onClose?.();
  };

  const isActive = (path) => location.pathname === path;

  // Navigation item component
  const NavItem = ({ item, isBottom = false }) => {
    const Icon = item.icon;
    const active = isActive(item.path);

    const button = (
      <ListItemButton
        onClick={() => handleNavigation(item.path)}
        sx={{
          py: 1,
          px: collapsed ? 1.5 : 1.5,
          borderRadius: 2,
          minHeight: 40,
          justifyContent: collapsed ? 'center' : 'flex-start',
          position: 'relative',
          bgcolor: active ? 'rgba(99, 102, 241, 0.1)' : 'transparent',

          '&:hover': {
            bgcolor: active
              ? 'rgba(99, 102, 241, 0.15)'
              : 'rgba(255, 255, 255, 0.05)',
          },

          // Active indicator
          '&::before': active
            ? {
              content: '""',
              position: 'absolute',
              left: 0,
              top: '20%',
              bottom: '20%',
              width: 3,
              borderRadius: '0 4px 4px 0',
              bgcolor: '#6366f1',
            }
            : {},
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: collapsed ? 0 : 36,
            justifyContent: 'center',
          }}
        >
          <Icon
            sx={{
              fontSize: 20,
              color: active ? '#6366f1' : 'rgba(255, 255, 255, 0.5)',
              transition: 'color 0.15s ease',
            }}
          />
        </ListItemIcon>
        {!collapsed && (
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: active ? 500 : 400,
              color: active ? '#fff' : 'rgba(255, 255, 255, 0.65)',
            }}
          />
        )}
      </ListItemButton>
    );

    if (collapsed) {
      return (
        <Tooltip title={item.label} placement="right" arrow>
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            {button}
          </ListItem>
        </Tooltip>
      );
    }

    return (
      <ListItem disablePadding sx={{ mb: 0.5 }}>
        {button}
      </ListItem>
    );
  };

  const drawerContent = (
    <Box
      sx={{
        width: sidebarWidth,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#0f0f12',
        borderRight: '1px solid rgba(255, 255, 255, 0.06)',
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* Logo & Toggle */}
      <Box
        sx={{
          px: collapsed ? 1.5 : 2,
          py: 2,
          mt: isMobile ? 0 : 7,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                bgcolor: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  color: '#6366f1',
                }}
              >
                S
              </Typography>
            </Box>
            <Typography
              sx={{
                fontWeight: 600,
                color: '#fff',
                fontSize: '0.9375rem',
                letterSpacing: '-0.01em',
              }}
            >
              SubTracker
            </Typography>
          </Box>
        )}

        {collapsed && (
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '0.9375rem',
                color: '#6366f1',
              }}
            >
              S
            </Typography>
          </Box>
        )}

        {!isMobile && !collapsed && (
          <IconButton
            size="small"
            onClick={() => setCollapsed(true)}
            sx={{
              color: 'rgba(255, 255, 255, 0.4)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                color: 'rgba(255, 255, 255, 0.7)',
              },
            }}
          >
            <ChevronLeft sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Box>

      {/* Expand button when collapsed */}
      {!isMobile && collapsed && (
        <Box sx={{ px: 1.5, mb: 1 }}>
          <IconButton
            size="small"
            onClick={() => setCollapsed(false)}
            sx={{
              width: '100%',
              color: 'rgba(255, 255, 255, 0.4)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                color: 'rgba(255, 255, 255, 0.7)',
              },
            }}
          >
            <ChevronRight sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      )}

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 1.5, py: 1 }}>
        {NAV_SECTIONS.map((section, idx) => (
          <Box key={section.id} sx={{ mb: 2 }}>
            {/* Section label */}
            {section.label && !collapsed && (
              <Typography
                sx={{
                  px: 1.5,
                  pt: idx > 0 ? 1.5 : 0,
                  pb: 0.75,
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.35)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {section.label}
              </Typography>
            )}

            <List disablePadding>
              {section.items.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </List>
          </Box>
        ))}
      </Box>

      {/* Bottom Section */}
      <Box sx={{ px: 1.5, pb: 2 }}>
        {/* Divider */}
        <Box
          sx={{
            height: 1,
            bgcolor: 'rgba(255, 255, 255, 0.06)',
            mb: 1.5,
            mx: collapsed ? 0 : 0,
          }}
        />

        {/* Bottom Nav */}
        <List disablePadding>
          {BOTTOM_NAV.map((item) => (
            <NavItem key={item.path} item={item} isBottom />
          ))}
        </List>

        {/* User Profile */}
        <Box
          sx={{
            mt: 1.5,
            p: collapsed ? 1 : 1.5,
            borderRadius: 2,
            bgcolor: 'rgba(255, 255, 255, 0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: collapsed ? 0 : 1.5,
          }}
        >
          <Tooltip title={collapsed ? user?.name : ''} placement="right">
            <Avatar
              sx={{
                width: collapsed ? 36 : 32,
                height: collapsed ? 36 : 32,
                bgcolor: 'rgba(99, 102, 241, 0.15)',
                color: '#6366f1',
                fontSize: collapsed ? '0.875rem' : '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </Avatar>
          </Tooltip>

          {!collapsed && (
            <>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontWeight: 500,
                    color: 'rgba(255, 255, 255, 0.85)',
                    fontSize: '0.8125rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user?.name || 'User'}
                </Typography>
                <Typography
                  sx={{
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '0.6875rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user?.email || 'user@email.com'}
                </Typography>
              </Box>

              <Tooltip title="Sign out" placement="top">
                <IconButton
                  size="small"
                  onClick={handleLogout}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.4)',
                    '&:hover': {
                      bgcolor: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                    },
                  }}
                >
                  <Logout sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: sidebarWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: sidebarWidth,
          boxSizing: 'border-box',
          borderRight: 'none',
          bgcolor: 'transparent',
          transition: 'width 0.2s ease',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;