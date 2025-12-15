import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  IconButton,
  Divider,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Link,
} from '@mui/material';
import {
  Dashboard,
  Subscriptions,
  Favorite,
  AccountBalance,
  Notifications,
  CompareArrows,
  ChevronLeft,
  ChevronRight,
  Help,
  Info,
  ContactSupport,
  Close,
} from '@mui/icons-material';

const drawerWidth = 240;
const collapsedWidth = 64;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'My Subscriptions', icon: <Subscriptions />, path: '/subscriptions' },
  { text: 'Wishlist', icon: <Favorite />, path: '/wishlist' },
  { text: 'Budget', icon: <AccountBalance />, path: '/budget' },
  { text: 'Alerts', icon: <Notifications />, path: '/alerts' },
  { text: 'Compare', icon: <CompareArrows />, path: '/compare' },
];

const Sidebar = ({ open, onClose, variant = 'permanent' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const handleNavigation = (path) => {
    navigate(path);
    if (variant === 'temporary') {
      onClose();
    }
  };

  const currentWidth = collapsed ? collapsedWidth : drawerWidth;

  const drawerContent = (
    <>
      <Toolbar />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 64px)' }}>
        {/* Collapse Toggle */}
        <Box sx={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end', p: 1 }}>
          <IconButton
            onClick={() => setCollapsed(!collapsed)}
            size="small"
            sx={{
              color: '#E5E5E5',
              bgcolor: '#333333',
              '&:hover': {
                bgcolor: '#E50914',
                color: '#FFFFFF',
              },
            }}
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        </Box>

        {/* Main Menu */}
        <Box sx={{ overflow: 'auto', flex: 1, mt: 1 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding sx={{ px: collapsed ? 1 : 2, mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  selected={location.pathname === item.path}
                  sx={{
                    borderRadius: 1,
                    minHeight: 48,
                    justifyContent: collapsed ? 'center' : 'initial',
                    px: collapsed ? 2 : 2.5,
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(229, 9, 20, 0.2)',
                      borderLeft: '3px solid #E50914',
                      '& .MuiListItemIcon-root': {
                        color: '#E50914',
                      },
                      '& .MuiListItemText-primary': {
                        color: '#FFFFFF',
                        fontWeight: 600,
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(229, 9, 20, 0.3)',
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: collapsed ? 0 : 40,
                      mr: collapsed ? 0 : 2,
                      justifyContent: 'center',
                      color: location.pathname === item.path ? '#E50914' : '#E5E5E5',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        color: location.pathname === item.path ? '#FFFFFF' : '#E5E5E5',
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Bottom Section - Help, About, Contact */}
        <Box sx={{ mt: 'auto', pb: 2 }}>
          <Divider sx={{ mb: 2, borderColor: '#333333' }} />

          {!collapsed && (
            <Box sx={{ px: 3, mb: 1 }}>
              <Typography variant="caption" sx={{ color: '#666666', fontWeight: 600 }}>
                SUPPORT
              </Typography>
            </Box>
          )}

          <List dense>
            <ListItem disablePadding sx={{ px: collapsed ? 1 : 2 }}>
              <ListItemButton
                onClick={() => setHelpOpen(true)}
                sx={{
                  borderRadius: 1,
                  minHeight: 40,
                  justifyContent: collapsed ? 'center' : 'initial',
                  px: collapsed ? 2 : 2.5,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, mr: collapsed ? 0 : 2, justifyContent: 'center', color: '#E5E5E5' }}>
                  <Help fontSize="small" />
                </ListItemIcon>
                {!collapsed && <ListItemText primary="Help" primaryTypographyProps={{ variant: 'body2', color: '#E5E5E5' }} />}
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding sx={{ px: collapsed ? 1 : 2 }}>
              <ListItemButton
                onClick={() => setAboutOpen(true)}
                sx={{
                  borderRadius: 1,
                  minHeight: 40,
                  justifyContent: collapsed ? 'center' : 'initial',
                  px: collapsed ? 2 : 2.5,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, mr: collapsed ? 0 : 2, justifyContent: 'center', color: '#E5E5E5' }}>
                  <Info fontSize="small" />
                </ListItemIcon>
                {!collapsed && <ListItemText primary="About" primaryTypographyProps={{ variant: 'body2', color: '#E5E5E5' }} />}
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding sx={{ px: collapsed ? 1 : 2 }}>
              <ListItemButton
                onClick={() => setContactOpen(true)}
                sx={{
                  borderRadius: 1,
                  minHeight: 40,
                  justifyContent: collapsed ? 'center' : 'initial',
                  px: collapsed ? 2 : 2.5,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, mr: collapsed ? 0 : 2, justifyContent: 'center', color: '#E5E5E5' }}>
                  <ContactSupport fontSize="small" />
                </ListItemIcon>
                {!collapsed && <ListItemText primary="Contact" primaryTypographyProps={{ variant: 'body2', color: '#E5E5E5' }} />}
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Box>

      {/* Help Dialog */}
      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#221F1F' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Help sx={{ color: '#E50914' }} />
            <Typography color="#FFFFFF">Help Center</Typography>
          </Box>
          <IconButton onClick={() => setHelpOpen(false)} size="small" sx={{ color: '#E5E5E5' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#221F1F', borderColor: '#333333' }}>
          <Typography variant="h6" gutterBottom color="#FFFFFF">Getting Started</Typography>
          <Typography variant="body2" paragraph color="#E5E5E5">
            Welcome to Subscription Tracker! Here's how to get started:
          </Typography>
          <Typography variant="body2" component="div" color="#E5E5E5">
            <ol style={{ paddingLeft: 20 }}>
              <li><strong style={{ color: '#E50914' }}>Add Subscriptions:</strong> Go to "My Subscriptions" and click "Add New".</li>
              <li><strong style={{ color: '#E50914' }}>Set Your Budget:</strong> Navigate to "Budget" to set your monthly income.</li>
              <li><strong style={{ color: '#E50914' }}>Track Renewals:</strong> The calendar shows upcoming renewal dates.</li>
              <li><strong style={{ color: '#E50914' }}>Compare Services:</strong> Use "Compare" to find the best subscription.</li>
            </ol>
          </Typography>
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#221F1F' }}>
          <Button onClick={() => setHelpOpen(false)} sx={{ color: '#E5E5E5' }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* About Dialog */}
      <Dialog open={aboutOpen} onClose={() => setAboutOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#221F1F' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Info sx={{ color: '#E50914' }} />
            <Typography color="#FFFFFF">About</Typography>
          </Box>
          <IconButton onClick={() => setAboutOpen(false)} size="small" sx={{ color: '#E5E5E5' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#221F1F', borderColor: '#333333' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" fontWeight={700} sx={{
              background: 'linear-gradient(135deg, #E50914 0%, #FF3D47 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              SubTracker
            </Typography>
            <Typography variant="body2" color="#666666">
              Version 1.0.0
            </Typography>
          </Box>
          <Typography variant="body2" paragraph color="#E5E5E5">
            Subscription Tracker helps you manage all your subscriptions in one place.
          </Typography>
          <Divider sx={{ my: 2, borderColor: '#333333' }} />
          <Typography variant="body2" color="#666666" align="center">
            Built with ❤️ using React & Spring Boot
          </Typography>
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#221F1F' }}>
          <Button onClick={() => setAboutOpen(false)} sx={{ color: '#E5E5E5' }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={contactOpen} onClose={() => setContactOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#221F1F' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ContactSupport sx={{ color: '#E50914' }} />
            <Typography color="#FFFFFF">Contact Us</Typography>
          </Box>
          <IconButton onClick={() => setContactOpen(false)} size="small" sx={{ color: '#E5E5E5' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#221F1F', borderColor: '#333333' }}>
          <Box sx={{ bgcolor: '#1A1A1A', p: 2, borderRadius: 1, border: '1px solid #333333', mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom color="#FFFFFF">
              📧 Email Support
            </Typography>
            <Typography variant="body2" color="#E5E5E5">
              <Link href="mailto:support@subtracker.com" sx={{ color: '#E50914' }}>
                support@subtracker.com
              </Link>
            </Typography>
          </Box>
          <Typography variant="body2" color="#666666" align="center">
            Response time: 24-48 hours
          </Typography>
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#221F1F' }}>
          <Button onClick={() => setContactOpen(false)} sx={{ color: '#E5E5E5' }}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: currentWidth,
        flexShrink: 0,
        transition: 'width 0.3s ease',
        '& .MuiDrawer-paper': {
          width: currentWidth,
          boxSizing: 'border-box',
          backgroundColor: '#1A1A1A',
          borderRight: '1px solid #333333',
          transition: 'width 0.3s ease',
          overflowX: 'hidden',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;