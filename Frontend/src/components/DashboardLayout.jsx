import { useContext, useMemo, useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import AiAssistantModal from './AiAssistantModal';
import API from '../api/axios';

const SidebarItem = ({ to, icon, label, badge, end = false }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
  >
    <div className="nav-item-left">
      <span className="nav-item-icon">{icon}</span>
      <span className="nav-item-label">{label}</span>
    </div>
    {badge && <span className="nav-item-badge">{badge}</span>}
  </NavLink>
);

const DashboardLayout = () => {
  const { userRole, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [showAiModal, setShowAiModal] = useState(false);

  const { isCustomer, isProvider, isAdmin } = useMemo(() => {
    const normalizedRole = userRole?.replace(/^ROLE_/, '').toUpperCase();
    return {
      isCustomer: normalizedRole === 'CUSTOMER',
      isProvider: normalizedRole === 'PROVIDER',
      isAdmin: normalizedRole === 'ADMIN',
    };
  }, [userRole]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await API.get('/profile');
        if (response.data) setProfileData(response.data);
      } catch (err) {
        try {
          const res = await API.get('/users/profile');
          if (res.data) setProfileData(res.data);
        } catch (e) {
          console.warn('Could not load profile in topbar:', e);
        }
      }
    };
    fetchUserProfile();
  }, []);

  const handleLogout = () => {
    if (logout) logout();
    else {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      navigate('/login');
    }
  };

  const resolvedName =
    profileData?.name ||
    profileData?.username ||
    user?.name ||
    user?.email?.split('@')[0] ||
    localStorage.getItem('username') ||
    localStorage.getItem('email')?.split('@')[0] ||
    'User';

  const avatarInitial = resolvedName.charAt(0).toUpperCase();

  return (
    <div className="dashboard-app-shell">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .dashboard-app-shell {
          min-height: 100vh;
          background-color: #f8fafc;
          display: flex;
          flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #0f172a;
          position: relative;
        }

        /* TOP GLOBAL NAVBAR */
        .dash-topbar {
          height: 64px;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .topbar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #0f172a;
        }

        .brand-badge-icon {
          width: 36px;
          height: 36px;
          background: #2563eb;
          color: #ffffff;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }

        .topbar-brand-text h2 {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
        }

        .topbar-brand-text p {
          margin: 0;
          font-size: 0.72rem;
          color: #64748b;
        }

        .topbar-right-actions {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        /* TOPBAR AI BUTTON */
        .topbar-ai-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          color: #ffffff;
          border: none;
          padding: 7px 14px;
          border-radius: 20px;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.25);
          transition: transform 0.15s, opacity 0.15s;
        }

        .topbar-ai-btn:hover {
          opacity: 0.95;
          transform: translateY(-1px);
        }

        /* FLOATING AI ACTION BUTTON */
        .floating-ai-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          color: #ffffff;
          border: none;
          padding: 12px 20px;
          border-radius: 30px;
          font-size: 0.92rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
          z-index: 99;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .floating-ai-fab:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 10px 24px rgba(124, 58, 237, 0.5);
        }

        /* USER PROFILE PILL */
        .user-profile-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f1f5f9;
          padding: 4px 14px 4px 4px;
          border-radius: 20px;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.15s ease;
        }

        .user-profile-pill:hover {
          background: #e2e8f0;
          border-color: #cbd5e1;
        }

        .user-avatar-circle {
          width: 32px;
          height: 32px;
          background: #2563eb;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.88rem;
          box-shadow: 0 2px 5px rgba(37, 99, 235, 0.25);
        }

        .user-pill-name {
          font-size: 0.86rem;
          font-weight: 700;
          color: #1e293b;
        }

        /* BODY WITH SIDEBAR */
        .dashboard-body-container {
          display: flex;
          flex: 1;
        }

        .dash-sidebar {
          width: 240px;
          background: #ffffff;
          border-right: 1px solid #e2e8f0;
          padding: 20px 14px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          flex-shrink: 0;
          position: sticky;
          top: 64px;
          height: calc(100vh - 64px);
        }

        .sidebar-nav-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sidebar-section-heading {
          font-size: 0.72rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          padding: 6px 12px;
          margin-bottom: 4px;
        }

        .sidebar-nav-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-radius: 10px;
          color: #64748b;
          text-decoration: none;
          font-size: 0.88rem;
          font-weight: 500;
          transition: all 0.15s ease;
        }

        .sidebar-nav-item:hover {
          background-color: #f1f5f9;
          color: #0f172a;
        }

        .sidebar-nav-item.active {
          background-color: #2563eb;
          color: #ffffff;
          font-weight: 600;
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);
        }

        .nav-item-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nav-item-icon {
          font-size: 1rem;
        }

        .nav-item-badge {
          background: #ef4444;
          color: #ffffff;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 10px;
        }

        .sidebar-logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: transparent;
          border: none;
          border-radius: 10px;
          color: #ef4444;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          margin-top: 8px;
          transition: background 0.15s;
        }

        .sidebar-logout-btn:hover {
          background: #fef2f2;
        }

        .sidebar-pro-card {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border: 1px solid #bfdbfe;
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          margin-top: 14px;
        }

        .pro-card-icon {
          font-size: 1.3rem;
          margin-bottom: 4px;
        }

        .sidebar-pro-card h4 {
          margin: 0 0 4px 0;
          font-size: 0.88rem;
          font-weight: 700;
          color: #1e40af;
        }

        .sidebar-pro-card p {
          margin: 0 0 10px 0;
          font-size: 0.75rem;
          color: #3b82f6;
        }

        .btn-pro-upgrade {
          background: #2563eb;
          color: #ffffff;
          border: none;
          padding: 7px 14px;
          border-radius: 7px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
        }

        .dash-main-viewport {
          flex: 1;
          padding: 28px 36px;
          overflow-y: auto;
          background-color: #f8fafc;
        }

        @media (max-width: 860px) {
          .dash-sidebar {
            display: none;
          }
          .dash-main-viewport {
            padding: 20px 16px;
          }
        }
      `}</style>

      {/* TOP HEADER */}
      <header className="dash-topbar">
        <NavLink to="/dashboard" className="topbar-brand">
          <div className="brand-badge-icon">🔧</div>
          <div className="topbar-brand-text">
            <h2>LocalServiceProvider</h2>
            <p>Find • Book • Get It Done</p>
          </div>
        </NavLink>

        <div className="topbar-right-actions">
          {/* AI ASSISTANT BUTTON IN TOPBAR */}
          <button
            type="button"
            className="topbar-ai-btn"
            onClick={() => setShowAiModal(true)}
          >
            <span>✨</span>
            <span>AI Assistant</span>
          </button>

          {/* DYNAMIC NOTIFICATION BELL */}
          <NotificationBell />

          {/* DYNAMIC USER PROFILE PILL */}
          <div
            className="user-profile-pill"
            onClick={() => navigate('/profile')}
            title="View Profile"
          >
            <div className="user-avatar-circle">{avatarInitial}</div>
            <span className="user-pill-name">{resolvedName}</span>
          </div>
        </div>
      </header>

      {/* BODY WITH STICKY SIDEBAR */}
      <div className="dashboard-body-container">
        <aside className="dash-sidebar">
          <div>
            <div className="sidebar-section-heading">
              {isAdmin ? 'Admin Menu' : isProvider ? 'Provider Menu' : 'Customer Menu'}
            </div>

            <nav className="sidebar-nav-list">
              {(isCustomer || (!isProvider && !isAdmin)) && (
                <>
                  <SidebarItem to="/dashboard" icon="🏠" label="Dashboard" end />
                  <SidebarItem to="/services" icon="🔍" label="Browse Services" />
                  <SidebarItem to="/my-bookings" icon="📅" label="My Bookings" />
                  <SidebarItem to="/profile" icon="👤" label="My Profile" />
                </>
              )}

              {isProvider && (
                <>
                  <SidebarItem to="/provider-dashboard" icon="📋" label="Manage Bookings" />
                  <SidebarItem to="/create-service" icon="➕" label="Add Service" />
                  <SidebarItem to="/services" icon="🔍" label="Browse Services" />
                  <SidebarItem to="/profile" icon="👤" label="My Profile" />
                </>
              )}

              {isAdmin && (
                <>
                  <SidebarItem to="/admin" icon="🛡️" label="Admin Dashboard" />
                  <SidebarItem to="/services" icon="🔍" label="Browse Services" />
                  <SidebarItem to="/profile" icon="👤" label="My Profile" />
                </>
              )}

              <button type="button" className="sidebar-logout-btn" onClick={handleLogout}>
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </nav>
          </div>

          <div className="sidebar-pro-card">
            <div className="pro-card-icon">👑</div>
            <h4>Upgrade to Pro</h4>
            <p>Get priority service booking!</p>
            <button className="btn-pro-upgrade">Upgrade</button>
          </div>
        </aside>

        <main className="dash-main-viewport">
          <Outlet />
        </main>
      </div>

      {/* FLOATING AI ASSISTANT BUTTON (BOTTOM-RIGHT) */}
      <button
        type="button"
        className="floating-ai-fab"
        onClick={() => setShowAiModal(true)}
      >
        <span>✨</span>
        <span>Ask AI</span>
      </button>

      {/* AI ASSISTANT MODAL POPUP */}
      {showAiModal && (
        <AiAssistantModal onClose={() => setShowAiModal(false)} />
      )}
    </div>
  );
};

export default DashboardLayout;