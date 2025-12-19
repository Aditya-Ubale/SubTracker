import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, Toolbar, useMediaQuery } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Components
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ForgotPassword from './components/auth/ForgotPassword';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import Dashboard from './components/dashboard/Dashboard';
import SubscriptionList from './components/subscriptions/SubscriptionList';
import AddSubscription from './components/subscriptions/AddSubscription';
import EditSubscription from './components/subscriptions/EditSubscription';
import SubscriptionDetails from './components/subscriptions/SubscriptionDetails';
import Wishlist from './components/watchlist/Watchlist';
import Budget from './components/budget/Budget';
import Alerts from './components/alerts/Alerts';
import Comparison from './components/comparison/Comparison';

// Netflix-inspired Dark Theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#E50914',
      light: '#FF3D47',
      dark: '#B81D24',
    },
    secondary: {
      main: '#564D4D',
      light: '#6D6262',
      dark: '#3D3636',
    },
    success: {
      main: '#4CAF50',
      light: '#6FBF73',
      dark: '#3B873E',
    },
    warning: {
      main: '#FF8C42',
      light: '#FFB74D',
      dark: '#F57C00',
    },
    error: {
      main: '#E50914',
      light: '#FF3D47',
      dark: '#B81D24',
    },
    background: {
      default: '#141414',
      paper: '#221F1F',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#E5E5E5',
      disabled: '#666666',
    },
    divider: '#333333',
    action: {
      hover: 'rgba(229, 9, 20, 0.08)',
      selected: 'rgba(229, 9, 20, 0.16)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      color: '#FFFFFF',
    },
    h5: {
      fontWeight: 600,
      color: '#FFFFFF',
    },
    h6: {
      fontWeight: 600,
      color: '#FFFFFF',
    },
    body1: {
      color: '#E5E5E5',
    },
    body2: {
      color: '#E5E5E5',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'html, body, #root': {
          overflowX: 'hidden',
          maxWidth: '100vw',
          backgroundColor: '#141414',
        },
        '::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '::-webkit-scrollbar-track': {
          background: '#141414',
        },
        '::-webkit-scrollbar-thumb': {
          background: '#333333',
          borderRadius: '4px',
        },
        '::-webkit-scrollbar-thumb:hover': {
          background: '#444444',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 4,
          fontWeight: 600,
        },
        contained: {
          backgroundColor: '#E50914',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#B81D24',
          },
        },
        outlined: {
          borderColor: '#333333',
          color: '#FFFFFF',
          '&:hover': {
            borderColor: '#E50914',
            backgroundColor: 'rgba(229, 9, 20, 0.08)',
          },
        },
        text: {
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: '#221F1F !important',
          backgroundImage: 'none !important',
          borderRadius: 8,
          border: '1px solid #333333',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
          '&:hover': {
            borderColor: '#444444',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          '&:last-child': {
            paddingBottom: 16,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          backgroundColor: '#333333',
          color: '#FFFFFF',
        },
        colorPrimary: {
          backgroundColor: '#E50914',
          color: '#FFFFFF',
        },
        colorSuccess: {
          backgroundColor: '#4CAF50',
          color: '#FFFFFF',
        },
        colorWarning: {
          backgroundColor: '#FF8C42',
          color: '#000000',
        },
        colorError: {
          backgroundColor: '#E50914',
          color: '#FFFFFF',
        },
        outlined: {
          borderColor: '#333333',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(51, 51, 51, 0.5)',
            '& fieldset': {
              borderColor: '#333333',
            },
            '&:hover fieldset': {
              borderColor: '#666666',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#E50914',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#666666',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#E50914',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(51, 51, 51, 0.5)',
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: '#221F1F !important',
          backgroundImage: 'none !important',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#221F1F',
          border: '1px solid #333333',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#333333',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(229, 9, 20, 0.08)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(229, 9, 20, 0.16)',
            '&:hover': {
              backgroundColor: 'rgba(229, 9, 20, 0.24)',
            },
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: '#E50914',
          color: '#FFFFFF',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: '#333333',
        },
        bar: {
          backgroundColor: '#E50914',
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          backgroundColor: '#221F1F',
          border: '1px solid #333333',
        },
        standardSuccess: {
          borderColor: '#4CAF50',
          '& .MuiAlert-icon': {
            color: '#4CAF50',
          },
        },
        standardWarning: {
          borderColor: '#FF8C42',
          '& .MuiAlert-icon': {
            color: '#FF8C42',
          },
        },
        standardError: {
          borderColor: '#E50914',
          '& .MuiAlert-icon': {
            color: '#E50914',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#333333',
        },
        head: {
          backgroundColor: '#1A1A1A',
          color: '#FFFFFF',
          fontWeight: 600,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: 'rgba(229, 9, 20, 0.15)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(229, 9, 20, 0.25)',
            '&:hover': {
              backgroundColor: 'rgba(229, 9, 20, 0.35)',
            },
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          color: '#FFFFFF',
        },
        input: {
          color: '#FFFFFF',
          '&::placeholder': {
            color: '#666666',
            opacity: 1,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: 'rgba(229, 9, 20, 0.15)',
          },
        },
      },
    },
  },
});

// Layout component for authenticated pages
const AuthenticatedLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', overflow: 'hidden', backgroundColor: '#141414' }}>
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        variant={isMobile ? 'temporary' : 'permanent'}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          maxWidth: '100%',
          minHeight: '100vh',
          backgroundColor: '#141414',
          overflowX: 'hidden',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <Dashboard />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/subscriptions"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SubscriptionList />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/subscriptions/add"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <AddSubscription />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/subscriptions/:id"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SubscriptionDetails />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/subscriptions/:id/edit"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <EditSubscription />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <Wishlist />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/budget"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <Budget />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <Alerts />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/compare"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <Comparison />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          theme="dark"
          toastStyle={{
            backgroundColor: '#221F1F',
            border: '1px solid #333333',
            color: '#FFFFFF',
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;