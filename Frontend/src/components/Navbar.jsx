import { useContext, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { token, userRole, currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Role Normalization
  const { isCustomer, isProvider, isAdmin } = useMemo(() => {
    const normalizedRole = userRole?.replace(/^ROLE_/, '').toUpperCase();
    return {
      isCustomer: normalizedRole === 'CUSTOMER',
      isProvider: normalizedRole === 'PROVIDER',
      isAdmin: normalizedRole === 'ADMIN',
    };
  }, [userRole]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = useMemo(() => {
    if (!currentUser) return 'User';
    if (currentUser.name) return currentUser.name;
    if (currentUser.firstName && currentUser.lastName) {
      return `${currentUser.firstName} ${currentUser.lastName.charAt(0)}.`;
    }
    return currentUser.username || 'User';
  }, [currentUser]);

  return (
    <header
      style={{
        height: '60px',
        backgroundColor: 'rgba(11, 17, 32, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 80,
        width: '100%',
      }}
    >
      {/* Brand Title & Header Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <Link
          to="/"
          style={{ textDecoration: 'none', color: '#ffffff', fontSize: '1.15rem', fontWeight: '700' }}
        >
          Local Service Provider
        </Link>

        <Link
          to="/services"
          style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}
        >
          Explore Services
        </Link>

        {token && (isCustomer || (!isProvider && !isAdmin)) && (
          <Link
            to="/my-bookings"
            style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}
          >
            My Bookings
          </Link>
        )}

        {token && isProvider && (
          <>
            <Link
              to="/provider-dashboard"
              style={{ color: '#38bdf8', fontWeight: '600', textDecoration: 'none', fontSize: '0.9rem' }}
            >
              📋 Manage Bookings
            </Link>
            <Link
              to="/create-service"
              style={{ color: '#38bdf8', fontWeight: '600', textDecoration: 'none', fontSize: '0.9rem' }}
            >
              + Add Service
            </Link>
          </>
        )}

        {token && (
          <Link
            to="/profile"
            style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}
          >
            Profile
          </Link>
        )}

        {token && isAdmin && (
          <Link
            to="/admin"
            style={{ color: '#f59e0b', fontWeight: 'bold', textDecoration: 'none', fontSize: '0.9rem' }}
          >
            🛡️ Admin Panel
          </Link>
        )}
      </div>

      {/* Top Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Notification Bell */}
        {token && <NotificationBell />}

        {/* User Welcome Badge & Logout */}
        {token ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              onClick={() => navigate('/profile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                padding: '4px 10px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                Welcome, <strong>{displayName}</strong>
              </span>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: '#cbd5e1',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '0.8rem',
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                padding: '6px 12px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.85rem',
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link
              to="/login"
              style={{
                color: '#f8fafc',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '500',
              }}
            >
              Login
            </Link>
            <Link
              to="/register"
              style={{
                color: '#ffffff',
                backgroundColor: '#2563eb',
                padding: '6px 12px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.85rem',
              }}
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;