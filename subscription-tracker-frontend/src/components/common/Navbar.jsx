import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Divider,
  ListItemIcon,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Person,
  Logout,
  Settings,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleClose();
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#141414',
        borderBottom: '1px solid #333333',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          sx={{
            mr: 2,
            '&:hover': {
              backgroundColor: 'rgba(229, 9, 20, 0.1)',
            },
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* Logo */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/dashboard')}
        >
          <Typography
            variant="h5"
            noWrap
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.5px',
              background: 'linear-gradient(135deg, #E50914 0%, #FF3D47 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            SubTracker
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* User Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="body2"
            sx={{
              display: { xs: 'none', sm: 'block' },
              color: '#E5E5E5',
              mr: 1,
            }}
          >
            {user?.name || 'User'}
          </Typography>
          <IconButton
            onClick={handleMenu}
            sx={{
              p: 0.5,
              border: '2px solid transparent',
              transition: 'border-color 0.2s',
              '&:hover': {
                borderColor: '#E50914',
              },
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                background: 'linear-gradient(135deg, #E50914 0%, #B81D24 100%)',
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                mt: 1,
                backgroundColor: '#221F1F',
                border: '1px solid #333333',
                minWidth: 200,
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={600} color="#FFFFFF">
                {user?.name || 'User'}
              </Typography>
              <Typography variant="caption" color="#666666">
                {user?.email || 'user@example.com'}
              </Typography>
            </Box>
            <Divider sx={{ borderColor: '#333333' }} />
            <MenuItem
              onClick={handleClose}
              sx={{
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(229, 9, 20, 0.08)',
                },
              }}
            >
              <ListItemIcon>
                <Person fontSize="small" sx={{ color: '#E5E5E5' }} />
              </ListItemIcon>
              <Typography color="#E5E5E5">Profile</Typography>
            </MenuItem>
            <MenuItem
              onClick={handleClose}
              sx={{
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(229, 9, 20, 0.08)',
                },
              }}
            >
              <ListItemIcon>
                <Settings fontSize="small" sx={{ color: '#E5E5E5' }} />
              </ListItemIcon>
              <Typography color="#E5E5E5">Settings</Typography>
            </MenuItem>
            <Divider sx={{ borderColor: '#333333' }} />
            <MenuItem
              onClick={handleLogout}
              sx={{
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(229, 9, 20, 0.08)',
                },
              }}
            >
              <ListItemIcon>
                <Logout fontSize="small" sx={{ color: '#E50914' }} />
              </ListItemIcon>
              <Typography color="#E50914">Logout</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;