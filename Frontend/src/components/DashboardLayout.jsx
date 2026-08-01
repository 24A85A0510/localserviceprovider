import { useContext, useMemo } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const SidebarItem = ({ to, icon, label, badge }) => (
  <NavLink
    to={to}
    style={({ isActive }) => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      borderRadius: '8px',
      color: isActive ? '#ffffff' : '#cbd5e1',
      backgroundColor: isActive ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
      borderLeft: isActive ? '3px solid #38bdf8' : '3px solid transparent',
      textDecoration: 'none',
      fontWeight: isActive ? '600' : '400',
      fontSize: '0.95rem',
      transition: 'all 0.2s ease',
    })}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      <span>{label}</span>
    </div>
    {badge && (
      <span
        style={{
          backgroundColor: '#f59e0b',
          color: '#0f172a',
          fontSize: '0.75rem',
          fontWeight: '700',
          padding: '2px 8px',
          borderRadius: '12px',
        }}
      >
        {badge}
      </span>
    )}
  </NavLink>
);

const DashboardLayout = () => {
  const { userRole } = useContext(AuthContext);

  const { isCustomer, isProvider, isAdmin } = useMemo(() => {
    const normalizedRole = userRole?.replace(/^ROLE_/, '').toUpperCase();
    return {
      isCustomer: normalizedRole === 'CUSTOMER',
      isProvider: normalizedRole === 'PROVIDER',
      isAdmin: normalizedRole === 'ADMIN',
    };
  }, [userRole]);

  return (
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 60px)', backgroundColor: '#090d16', color: '#fff', overflow: 'hidden' }}>
      {/* ------------------------------------------------------------------ */}
      {/* 1. DYNAMIC LIVE VIDEO BACKGROUND FOR ENTIRE DASHBOARD */}
      {/* ------------------------------------------------------------------ */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <source src="/generate_live_video_second.mp4" type="video/mp4" />
        Your browser does not support video background.
      </video>

      {/* ------------------------------------------------------------------ */}
      {/* 2. DARK GLASSMORPHIC OVERLAY FOR READABILITY */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(9, 13, 22, 0.75)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* ------------------------------------------------------------------ */}
      {/* 3. FOREGROUND DASHBOARD CONTENT WRAPPER */}
      {/* ------------------------------------------------------------------ */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
        {/* PERMANENT DASHBOARD SIDEBAR */}
        <aside
          style={{
            width: '240px',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '24px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            flexShrink: 0,
            position: 'sticky',
            top: '60px',
            height: 'calc(100vh - 60px)',
          }}
        >
          <div style={{ padding: '0 8px 16px 8px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>
              {isAdmin ? 'Admin Menu' : isProvider ? 'Provider Panel' : 'Customer Menu'}
            </h3>
          </div>

          {/* Dynamic Sidebar Nav Links based on Role */}
          {(isCustomer || (!isProvider && !isAdmin)) && (
            <>
              <SidebarItem to="/my-bookings" icon="📄" label="My Bookings" />
              <SidebarItem to="/services" icon="🔍" label="Explore Services" />
            </>
          )}

          {isProvider && (
            <>
              <SidebarItem to="/provider-dashboard" icon="📋" label="Manage Bookings" />
              <SidebarItem to="/create-service" icon="➕" label="Add Service" />
              <SidebarItem to="/services" icon="🔍" label="Explore Services" />
            </>
          )}

          {isAdmin && (
            <>
              <SidebarItem to="/admin" icon="🛡️" label="Admin Dashboard" />
              <SidebarItem to="/services" icon="🔍" label="Explore Services" />
            </>
          )}

          <SidebarItem to="/profile" icon="👤" label="Profile" />
        </aside>

        {/* DYNAMIC PAGE CONTENT AREA */}
        <main style={{ flex: 1, padding: '30px', overflowY: 'auto', width: 'calc(100% - 240px)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;