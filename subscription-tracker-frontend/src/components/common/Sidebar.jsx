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
const SIDEBAR_EXPANDED = 230;
const SIDEBAR_COLLAPSED = 68;

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
          py: 1,
          px: isCollapsed ? 1.5 : 1.5,
          borderRadius: '8px',
          minHeight: 40,
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          position: 'relative',
          bgcolor: active ? 'rgba(220, 38, 38, 0.08)' : 'transparent',
          transition: 'all 0.18s ease',

          '&:hover': {
            bgcolor: active ? 'rgba(220, 38, 38, 0.12)' : 'rgba(255, 255, 255, 0.04)',
            '& .nav-icon': {
              color: active ? colors.primary : colors.text.secondary,
            },
            '& .nav-label': {
              color: colors.text.primary,
            },
          },

          // Active indicator - thin left accent border
          '&::before': active
            ? {
              content: '""',
              position: 'absolute',
              left: 0,
              top: '20%',
              bottom: '20%',
              width: 3,
              borderRadius: '0 3px 3px 0',
              bgcolor: colors.primary,
              boxShadow: '0 0 8px rgba(220, 38, 38, 0.3)',
            }
            : {},
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: isCollapsed ? 0 : 36,
            justifyContent: 'center',
          }}
        >
          <Icon
            className="nav-icon"
            sx={{
              fontSize: 20,
              color: active ? colors.primary : colors.text.muted,
              transition: 'color 0.18s ease',
            }}
          />
        </ListItemIcon>
        {!isCollapsed && (
          <ListItemText
            primary={item.label}
            className="nav-label"
            primaryTypographyProps={{
              fontSize: '0.8125rem',
              fontWeight: active ? 600 : 400,
              color: active ? colors.text.primary : colors.text.secondary,
              transition: 'color 0.18s ease, font-weight 0.18s ease',
              letterSpacing: '-0.01em',
            }}
          />
        )}
      </ListItemButton>
    );

    if (isCollapsed) {
      return (
        <Tooltip title={item.label} placement="right" arrow>
          <ListItem disablePadding sx={{ mb: 0.25 }}>
            {button}
          </ListItem>
        </Tooltip>
      );
    }

    return (
      <ListItem disablePadding sx={{ mb: 0.25 }}>
        {button}
      </ListItem>
    );
  };

  const drawerContent = (
    <Box
      sx={{
        width: sidebarWidth,
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: colors.bg.secondary,
        borderRight: `1px solid ${colors.border.default}`,
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
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
                width: 28,
                height: 28,
                borderRadius: '6px',
                border: `1px solid ${colors.border.default}`,
                transition: 'all 0.18s ease',
                '&:hover': {
                  bgcolor: colors.bg.cardHover,
                  color: colors.text.secondary,
                  borderColor: colors.border.hover,
                },
              }}
            >
              {isCollapsed ? <ChevronRight sx={{ fontSize: 16 }} /> : <ChevronLeft sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Navigation */}
      <Box sx={{ px: 1.5, py: 0.5, flex: 1 }}>
        {NAV_SECTIONS.map((section, idx) => (
          <Box key={section.id} sx={{ mb: idx === NAV_SECTIONS.length - 1 ? 0 : 1 }}>
            {/* Section label */}
            {section.label && !isCollapsed && (
              <Typography
                sx={{
                  px: 1.5,
                  pt: idx > 0 ? 2 : 0.5,
                  pb: 0.75,
                  fontSize: '0.625rem',
                  fontWeight: 600,
                  color: colors.text.dim,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {section.label}
              </Typography>
            )}

            {/* Section separator for collapsed state */}
            {section.label && isCollapsed && idx > 0 && (
              <Box
                sx={{
                  height: 1,
                  bgcolor: colors.border.default,
                  mx: 1.5,
                  my: 1.5,
                }}
              />
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
            mx: 0.5,
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
          onClick={() => handleNavigation('/settings')}
          sx={{
            mt: 2,
            p: isCollapsed ? 1 : 1.25,
            borderRadius: '10px',
            bgcolor: 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${colors.border.default}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: isCollapsed ? 0 : 1.25,
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.04)',
              borderColor: colors.border.hover,
              '& .user-avatar': {
                borderColor: 'rgba(220, 38, 38, 0.4)',
              },
            },
          }}
        >
          <Tooltip title={isCollapsed ? user?.name : ''} placement="right">
            <Avatar
              className="user-avatar"
              sx={{
                width: isCollapsed ? 34 : 32,
                height: isCollapsed ? 34 : 32,
                bgcolor: 'rgba(220, 38, 38, 0.1)',
                color: colors.primary,
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: '2px solid transparent',
                transition: 'border-color 0.18s ease',
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
                    fontWeight: 500,
                    color: colors.text.primary,
                    fontSize: '0.8125rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.3,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {user?.name || 'User'}
                </Typography>
                <Typography
                  sx={{
                    color: colors.text.dim,
                    fontSize: '0.6875rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.3,
                  }}
                >
                  {user?.email || 'user@email.com'}
                </Typography>
              </Box>

              <Tooltip title="Sign out" placement="top">
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                  sx={{
                    color: colors.text.dim,
                    width: 28,
                    height: 28,
                    borderRadius: '6px',
                    transition: 'all 0.18s ease',
                    '&:hover': {
                      bgcolor: 'rgba(220, 38, 38, 0.1)',
                      color: colors.primary,
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
          transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          // Hide scrollbar
          '&::-webkit-scrollbar': {
            width: 0,
          },
          scrollbarWidth: 'none',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;