/**
 * Example App Integration for The Babes Club Auth System
 * 
 * This file demonstrates how to integrate the authentication system
 * into your React application with React Router v6.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';

// Auth imports
import { AuthProvider, useAuth } from './lib/auth';
import { 
  LoginPage, 
  SignupPage, 
  ProtectedRoute, 
  PublicOnlyRoute 
} from './components';

// ============================================================================
// Example Layout with Navigation
// ============================================================================

const Navigation: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '1rem 2rem',
        background: 'rgba(10, 10, 10, 0.9)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <Link
        to="/"
        style={{
          color: '#FFB6C1',
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '1.125rem',
          letterSpacing: '0.1em',
        }}
      >
        BABES CLUB
      </Link>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Link
          to="/shop"
          style={{
            color: 'rgba(255, 255, 255, 0.7)',
            textDecoration: 'none',
            fontSize: '0.875rem',
          }}
        >
          Shop
        </Link>

        {isAuthenticated ? (
          <>
            <Link
              to="/dashboard"
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                textDecoration: 'none',
                fontSize: '0.875rem',
              }}
            >
              Dashboard
            </Link>
            <span
              style={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.75rem',
              }}
            >
              Hi, {user?.displayName}
            </span>
            <button
              onClick={logout}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.8rem',
                fontWeight: 500,
                color: '#FFB6C1',
                background: 'transparent',
                border: '1px solid rgba(255, 182, 193, 0.3)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                textDecoration: 'none',
                fontSize: '0.875rem',
              }}
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.8rem',
                fontWeight: 500,
                color: '#0a0a0a',
                background: '#FFB6C1',
                borderRadius: '6px',
                textDecoration: 'none',
              }}
            >
              Join the Club
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

// ============================================================================
// Example Pages
// ============================================================================

const HomePage: React.FC = () => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      color: '#ffffff',
      paddingTop: '60px',
    }}
  >
    <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1rem' }}>
      Welcome to The Babes Club
    </h1>
    <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '2rem' }}>
      Exclusive jewelry, NFTs, and membership perks
    </p>
    <Link
      to="/shop"
      style={{
        padding: '1rem 2rem',
        background: '#FFB6C1',
        color: '#0a0a0a',
        textDecoration: 'none',
        fontWeight: 600,
        borderRadius: '12px',
      }}
    >
      Shop Now
    </Link>
  </div>
);

const ShopPage: React.FC = () => (
  <div
    style={{
      minHeight: '100vh',
      padding: '100px 2rem 2rem',
      background: '#0a0a0a',
      color: '#ffffff',
    }}
  >
    <h1>Shop</h1>
    <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
      Browse our collection (public page)
    </p>
  </div>
);

const DashboardPage: React.FC = () => {
  const { user, token } = useAuth();

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '100px 2rem 2rem',
        background: '#0a0a0a',
        color: '#ffffff',
      }}
    >
      <h1>Dashboard</h1>
      <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '2rem' }}>
        Welcome back, {user?.displayName}! (protected page)
      </p>

      <div
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '1rem',
        }}
      >
        <h3 style={{ marginBottom: '1rem' }}>Your Profile</h3>
        <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>
          <strong>User ID:</strong> {user?.userId}
        </p>
        <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>
          <strong>Email:</strong> {user?.email}
        </p>
        <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>
          <strong>Display Name:</strong> {user?.displayName}
        </p>
      </div>

      <div
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '1.5rem',
          borderRadius: '12px',
        }}
      >
        <h3 style={{ marginBottom: '1rem' }}>Token Info</h3>
        <p
          style={{
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.4)',
            wordBreak: 'break-all',
            fontFamily: 'monospace',
          }}
        >
          {token?.substring(0, 50)}...
        </p>
      </div>
    </div>
  );
};

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '100px 2rem 2rem',
        background: '#0a0a0a',
        color: '#ffffff',
      }}
    >
      <h1>Profile Settings</h1>
      <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
        Manage your account, {user?.displayName}
      </p>
    </div>
  );
};

const AdminPage: React.FC = () => (
  <div
    style={{
      minHeight: '100vh',
      padding: '100px 2rem 2rem',
      background: '#0a0a0a',
      color: '#ffffff',
    }}
  >
    <h1>Admin Panel</h1>
    <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
      Requires admin role (role-protected page)
    </p>
  </div>
);

// ============================================================================
// App Component with Routes
// ============================================================================

const AppRoutes: React.FC = () => {
  return (
    <>
      <Navigation />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />

        {/* Auth Routes (redirect if already logged in) */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute redirectTo="/dashboard">
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute redirectTo="/dashboard">
              <SignupPage />
            </PublicOnlyRoute>
          }
        />

        {/* Protected Routes (require authentication) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Role-Protected Route (requires admin role) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

// ============================================================================
// Main App with Providers
// ============================================================================

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider
        onAuthChange={(authenticated) => {
          console.log('[App] Auth state changed:', authenticated);
        }}
      >
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

// ============================================================================
// Usage Instructions
// ============================================================================

/**
 * INTEGRATION GUIDE
 * =================
 * 
 * 1. SETUP
 *    - Copy the auth files to your project's src/lib/auth directory
 *    - Copy the component files to your project's src/components directory
 *    - Install dependencies: npm install axios react-router-dom
 * 
 * 2. ENVIRONMENT VARIABLES
 *    Create a .env file with:
 *    ```
 *    VITE_API_BASE_URL=https://api.thebabesclub.com
 *    ```
 * 
 * 3. WRAP YOUR APP
 *    ```tsx
 *    import { AuthProvider } from './lib/auth';
 *    
 *    function App() {
 *      return (
 *        <AuthProvider>
 *          {/* Your app */}
 *        </AuthProvider>
 *      );
 *    }
 *    ```
 * 
 * 4. USE THE HOOK
 *    ```tsx
 *    import { useAuth } from './lib/auth';
 *    
 *    function MyComponent() {
 *      const { user, isAuthenticated, login, logout } = useAuth();
 *      
 *      if (!isAuthenticated) {
 *        return <button onClick={() => login(email, password)}>Login</button>;
 *      }
 *      
 *      return (
 *        <div>
 *          Welcome, {user.displayName}!
 *          <button onClick={logout}>Logout</button>
 *        </div>
 *      );
 *    }
 *    ```
 * 
 * 5. PROTECT ROUTES
 *    ```tsx
 *    import { ProtectedRoute, PublicOnlyRoute } from './components';
 *    
 *    <Route
 *      path="/dashboard"
 *      element={
 *        <ProtectedRoute>
 *          <Dashboard />
 *        </ProtectedRoute>
 *      }
 *    />
 *    
 *    <Route
 *      path="/login"
 *      element={
 *        <PublicOnlyRoute>
 *          <LoginPage />
 *        </PublicOnlyRoute>
 *      }
 *    />
 *    ```
 * 
 * 6. CUSTOMIZE FORMS
 *    The LoginForm and SignupForm components accept various props:
 *    - onSuccess: Callback after successful auth
 *    - onSwitchToLogin/onSwitchToSignup: Switch between forms
 *    - className: Add custom styles
 *    
 *    Or build your own forms using the useAuth hook directly!
 */
