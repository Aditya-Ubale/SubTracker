/**
 * Sidebar - Modern Collapsible Navigation
 * 
 * Design: Uses centralized theme from /styles/theme.js
 * - Collapsible (72px collapsed, 240px expanded)
 * - Smooth animations
 * - Clean iconography
 * - SubTracker brand colors (red primary)
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

// Import theme
import { colors, transitions, borderRadius, typography } from '../../styles/theme';

// Sidebar dimensions
const SIDEBAR_EXPANDED = 220;
const SIDEBAR_COLLAPSED = 64;

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

  // On mobile, never collapse (use full drawer)
  const isCollapsed = isMobile ? false : collapsed;
  const sidebarWidth = isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

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
  const NavItem = ({ item }) => {
    const Icon = item.icon;
    const active = isActive(item.path);

    const button = (
      <ListItemButton
        onClick={() => handleNavigation(item.path)}
        sx={{
          py: 0.875,
          px: isCollapsed ? 1.25 : 1.25,
          borderRadius: borderRadius.md,
          minHeight: 38,
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          position: 'relative',
          bgcolor: active ? colors.bg.cardHover : 'transparent',

          '&:hover': {
            bgcolor: colors.bg.cardHover,
          },

          // Active indicator - subtle left border
          '&::before': active
            ? {
              content: '""',
              position: 'absolute',
              left: 0,
              top: '25%',
              bottom: '25%',
              width: 2,
              borderRadius: '0 2px 2px 0',
              bgcolor: colors.primary,
            }
            : {},
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: isCollapsed ? 0 : 32,
            justifyContent: 'center',
          }}
        >
          <Icon
            sx={{
              fontSize: 18,
              color: active ? colors.text.primary : colors.text.muted,
              transition: transitions.fast,
            }}
          />
        </ListItemIcon>
        {!isCollapsed && (
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              fontSize: typography.fontSize.sm,
              fontWeight: active ? typography.fontWeight.medium : typography.fontWeight.normal,
              color: active ? colors.text.primary : colors.text.secondary,
            }}
          />
        )}
      </ListItemButton>
    );

    if (isCollapsed) {
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
        minHeight: '100%',
        bgcolor: colors.bg.secondary,
        borderRight: `1px solid ${colors.border.default}`,
        transition: 'width 0.15s ease-out',
        pt: isMobile ? 0 : 8,
      }}
    >
      {/* Collapse Toggle */}
      {!isMobile && (
        <Box
          sx={{
            px: isCollapsed ? 1.5 : 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-end',
          }}
        >
          <Tooltip title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
            <IconButton
              size="small"
              onClick={() => setCollapsed(!collapsed)}
              sx={{
                color: colors.text.dim,
                '&:hover': {
                  bgcolor: colors.bg.cardHover,
                  color: colors.text.secondary,
                },
              }}
            >
              {isCollapsed ? <ChevronRight sx={{ fontSize: 18 }} /> : <ChevronLeft sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Navigation */}
      <Box sx={{ px: 1.5, py: 1 }}>
        {NAV_SECTIONS.map((section, idx) => (
          <Box key={section.id} sx={{ mb: idx === NAV_SECTIONS.length - 1 ? 0 : 2 }}>
            {/* Section label */}
            {section.label && !isCollapsed && (
              <Typography
                sx={{
                  px: 1.25,
                  pt: idx > 0 ? 1.5 : 0,
                  pb: 0.5,
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.dim,
                  letterSpacing: '0.04em',
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
      <Box sx={{ px: 1.5, pb: 2, pt: 1 }}>
        {/* Divider */}
        <Box
          sx={{
            height: 1,
            bgcolor: colors.border.default,
            mb: 1.5,
          }}
        />

        {/* Bottom Nav - Settings & Help */}
        <List disablePadding>
          {BOTTOM_NAV.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </List>

        {/* User Profile */}
        <Box
          sx={{
            mt: 1.5,
            p: isCollapsed ? 0.875 : 1.25,
            borderRadius: borderRadius.md,
            bgcolor: colors.bg.cardHover,
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: isCollapsed ? 0 : 1.5,
          }}
        >
          <Tooltip title={isCollapsed ? user?.name : ''} placement="right">
            <Avatar
              sx={{
                width: isCollapsed ? 32 : 28,
                height: isCollapsed ? 32 : 28,
                bgcolor: colors.bg.tertiary,
                color: colors.text.secondary,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                border: `1px solid ${colors.border.default}`,
                cursor: 'pointer',
              }}
            >
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </Avatar>
          </Tooltip>

          {!isCollapsed && (
            <>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontWeight: typography.fontWeight.medium,
                    color: colors.text.primary,
                    fontSize: typography.fontSize.sm,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user?.name || 'User'}
                </Typography>
                <Typography
                  sx={{
                    color: colors.text.dim,
                    fontSize: typography.fontSize.xs,
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
                    color: colors.text.dim,
                    '&:hover': {
                      bgcolor: colors.status.errorBg,
                      color: colors.status.error,
                    },
                  }}
                >
                  <Logout sx={{ fontSize: 14 }} />
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
          transition: 'width 0.15s ease-out',
          height: '100vh',
          overflowY: 'auto',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;