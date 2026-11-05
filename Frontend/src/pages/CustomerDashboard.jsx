import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const CustomerDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [quickSearch, setQuickSearch] = useState('');

  const userName = user?.name || user?.email?.split('@')[0] || 'Customer';

  useEffect(() => {
    const fetchRecentBookings = async () => {
      try {
        const response = await API.get('/bookings/customer');
        const data = Array.isArray(response.data) ? response.data : [];
        setBookings(data);
      } catch (err) {
        console.error('Failed to load recent bookings:', err);
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchRecentBookings();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      navigate(`/services?query=${encodeURIComponent(quickSearch.trim())}`);
    } else {
      navigate('/services');
    }
  };

  const recentBookings = bookings.slice(0, 3);
  const totalBookingsCount = bookings.length;
  const completedCount = bookings.filter((b) => {
    const s = String(b.status || '').toUpperCase();
    return s === 'COMPLETED' || s === 'PAID';
  }).length;

  const popularCategories = [
    { name: 'Plumbing', icon: '🔧', desc: 'Pipes, leaks & drains' },
    { name: 'Electrical', icon: '⚡', desc: 'Wiring, fixtures & fans' },
    { name: 'Cleaning', icon: '🧹', desc: 'Deep clean & dusting' },
    { name: 'AC Repair', icon: '❄️', desc: 'Cooling & servicing' },
    { name: 'Automotive', icon: '🚗', desc: 'Car & bike maintenance' },
    { name: 'Painting', icon: '🎨', desc: 'Walls, polish & gloss' },
  ];

  return (
    <div className="dash-landing-container">
      <style>{`
        .dash-landing-container {
          max-width: 1160px;
          margin: 0 auto;
          color: #0f172a;
        }

        /* 1. WELCOME SECTION */
        .dash-greeting {
          margin-bottom: 24px;
        }

        .dash-greeting h1 {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px 0;
        }

        .dash-greeting p {
          color: #64748b;
          font-size: 0.92rem;
          margin: 0;
        }

        /* 2. SUMMARY CARDS ROW */
        .summary-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }

        .summary-metric-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .metric-icon-square {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.35rem;
          flex-shrink: 0;
        }

        .m-blue { background: #eff6ff; color: #2563eb; }
        .m-green { background: #f0fdf4; color: #16a34a; }
        .m-purple { background: #faf5ff; color: #9333ea; }
        .m-orange { background: #fff7ed; color: #ea580c; }

        .metric-details span {
          display: block;
          font-size: 0.78rem;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 2px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .metric-details h3 {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 800;
          color: #0f172a;
        }

        /* 3. PROMOTIONAL HERO BANNER */
        .promo-hero-card {
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%);
          border-radius: 18px;
          padding: 30px 36px;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 30px;
          box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.28);
          position: relative;
          overflow: hidden;
        }

        .promo-text-wrap {
          max-width: 540px;
          z-index: 2;
        }

        .promo-tag {
          display: inline-block;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.35);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          margin-bottom: 12px;
          letter-spacing: 0.5px;
        }

        .promo-text-wrap h2 {
          font-size: 1.65rem;
          font-weight: 800;
          margin: 0 0 8px 0;
          line-height: 1.25;
        }

        .promo-text-wrap p {
          font-size: 0.9rem;
          margin: 0 0 18px 0;
          color: rgba(255, 255, 255, 0.9);
        }

        .promo-search-bar {
          display: flex;
          background: #ffffff !important;
          background-color: #ffffff !important;
          border-radius: 12px;
          padding: 5px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
        }

        .promo-search-bar input {
          flex: 1;
          border: none;
          outline: none;
          padding: 10px 14px;
          font-size: 0.9rem;
          color: #0f172a !important;
          background: #ffffff !important;
          background-color: #ffffff !important;
        }

        .promo-search-bar input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 40px #ffffff inset !important;
          -webkit-text-fill-color: #0f172a !important;
        }

        .promo-search-bar button {
          background: #2563eb;
          color: #ffffff;
          border: none;
          padding: 0 22px;
          border-radius: 9px;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
        }

        .promo-art {
          font-size: 5.5rem;
          z-index: 2;
          user-select: none;
        }

        /* 4. QUICK ACTIONS ROW */
        .quick-actions-bar {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        .action-shortcut-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          text-decoration: none;
          color: #0f172a;
          transition: transform 0.15s, border-color 0.15s;
        }

        .action-shortcut-card:hover {
          transform: translateY(-2px);
          border-color: #2563eb;
        }

        .action-circle-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.15rem;
        }

        .action-title {
          font-size: 0.88rem;
          font-weight: 700;
          margin: 0;
        }

        .action-desc {
          font-size: 0.75rem;
          color: #64748b;
          margin: 2px 0 0 0;
        }

        /* 5. POPULAR SERVICES GRID */
        .section-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-header-row h3 {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 700;
          color: #0f172a;
        }

        .section-header-row a {
          font-size: 0.85rem;
          color: #2563eb;
          font-weight: 600;
          text-decoration: none;
        }

        .popular-cats-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 14px;
          margin-bottom: 34px;
        }

        .pop-cat-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 16px 12px;
          text-align: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .pop-cat-box:hover {
          border-color: #2563eb;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
          transform: translateY(-2px);
        }

        .pop-cat-icon {
          font-size: 1.8rem;
          margin-bottom: 8px;
        }

        .pop-cat-box h4 {
          margin: 0 0 4px 0;
          font-size: 0.85rem;
          font-weight: 700;
          color: #0f172a;
        }

        .pop-cat-box span {
          font-size: 0.72rem;
          color: #64748b;
        }

        /* 6. BOTTOM ROW: RECENT BOOKINGS + NOTIFICATIONS */
        .bottom-split-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
        }

        .split-card-panel {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 22px;
        }

        .booking-mini-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .booking-mini-item:last-child {
          border-bottom: none;
        }

        .booking-mini-title {
          font-weight: 700;
          font-size: 0.9rem;
          margin: 0 0 3px 0;
        }

        .booking-mini-meta {
          font-size: 0.78rem;
          color: #64748b;
          margin: 0;
        }

        .status-chip {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 700;
        }

        .status-COMPLETED { background: #eff6ff; color: #2563eb; }
        .status-PAID { background: #ecfdf5; color: #059669; }
        .status-PENDING { background: #fefce8; color: #ca8a04; }
        .status-ACCEPTED { background: #f0fdf4; color: #16a34a; }
        .status-CANCELLED { background: #fef2f2; color: #dc2626; }

        .notif-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .notif-item:last-child {
          border-bottom: none;
        }

        .notif-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #2563eb;
          margin-top: 6px;
          flex-shrink: 0;
        }

        .notif-text {
          font-size: 0.82rem;
          color: #334155;
          margin: 0;
          line-height: 1.4;
        }

        .notif-time {
          font-size: 0.72rem;
          color: #94a3b8;
        }

        @media (max-width: 960px) {
          .summary-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .popular-cats-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .quick-actions-bar {
            grid-template-columns: 1fr;
          }
          .bottom-split-row {
            grid-template-columns: 1fr;
          }
          .promo-art {
            display: none;
          }
        }
      `}</style>

      {/* 1. WELCOME SECTION */}
      <div className="dash-greeting">
        <h1>Welcome back, {userName}! 👋</h1>
        <p>Here is a quick summary of your service bookings and account activity</p>
      </div>

      {/* 2. SUMMARY CARDS */}
      <div className="summary-metrics-grid">
        <div className="summary-metric-card">
          <div className="metric-icon-square m-blue">📅</div>
          <div className="metric-details">
            <span>Total Bookings</span>
            <h3>{totalBookingsCount}</h3>
          </div>
        </div>

        <div className="summary-metric-card">
          <div className="metric-icon-square m-green">⭐</div>
          <div className="metric-details">
            <span>Completed Jobs</span>
            <h3>{completedCount}</h3>
          </div>
        </div>

        <div className="summary-metric-card">
          <div className="metric-icon-square m-purple">👛</div>
          <div className="metric-details">
            <span>Wallet Balance</span>
            <h3>₹250</h3>
          </div>
        </div>

        <div className="summary-metric-card">
          <div className="metric-icon-square m-orange">❤️</div>
          <div className="metric-details">
            <span>Favorite Pros</span>
            <h3>4</h3>
          </div>
        </div>
      </div>

      {/* 3. PROMOTIONAL BANNER & QUICK SEARCH */}
      <div className="promo-hero-card">
        <div className="promo-text-wrap">
          <span className="promo-tag">LIMITED OFFER • 20% OFF</span>
          <h2>Need a Home or Tech Repair?</h2>
          <p>Book verified, background-checked professionals near you in seconds.</p>
          <form onSubmit={handleSearchSubmit} className="promo-search-bar">
            <input
              type="text"
              placeholder="What service do you need? (e.g. Plumber, AC Repair)..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
            />
            <button type="submit">Find Services</button>
          </form>
        </div>
        <div className="promo-art">🏡</div>
      </div>

      {/* 4. QUICK ACTIONS */}
      <div className="quick-actions-bar">
        <Link to="/services" className="action-shortcut-card">
          <div className="action-circle-icon m-blue">➕</div>
          <div>
            <div className="action-title">Book a Service</div>
            <div className="action-desc">Explore verified professionals</div>
          </div>
        </Link>

        <Link to="/my-bookings" className="action-shortcut-card">
          <div className="action-circle-icon m-green">📋</div>
          <div>
            <div className="action-title">View All Bookings</div>
            <div className="action-desc">Track status and active orders</div>
          </div>
        </Link>

        <Link to="/my-bookings" className="action-shortcut-card">
          <div className="action-circle-icon m-purple">⭐</div>
          <div>
            <div className="action-title">Write a Review</div>
            <div className="action-desc">Rate your completed service</div>
          </div>
        </Link>
      </div>

      {/* 5. POPULAR SERVICES SHORTCUTS */}
      <div className="section-header-row">
        <h3>Popular Services</h3>
        <Link to="/services">View All Services →</Link>
      </div>

      <div className="popular-cats-grid">
        {popularCategories.map((c) => (
          <div
            key={c.name}
            className="pop-cat-box"
            onClick={() => navigate(`/services?category=${encodeURIComponent(c.name)}`)}
          >
            <div className="pop-cat-icon">{c.icon}</div>
            <h4>{c.name}</h4>
            <span>{c.desc}</span>
          </div>
        ))}
      </div>

      {/* 6. RECENT BOOKINGS & NOTIFICATIONS SPLIT */}
      <div className="bottom-split-row">
        {/* Recent Bookings */}
        <div className="split-card-panel">
          <div className="section-header-row" style={{ marginBottom: '14px' }}>
            <h3>Recent Bookings</h3>
            <Link to="/my-bookings">See All</Link>
          </div>

          {loadingBookings ? (
            <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>Loading recent bookings...</p>
          ) : recentBookings.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '20px 0' }}>No recent bookings. Book your first service today!</p>
          ) : (
            <div>
              {recentBookings.map((b) => {
                const s = String(b.status || 'PENDING').toUpperCase();
                return (
                  <div key={b.id} className="booking-mini-item">
                    <div>
                      <div className="booking-mini-title">{b.serviceTitle || `Service #${b.serviceId}`}</div>
                      <div className="booking-mini-meta">
                        {b.bookingDate ? new Date(b.bookingDate).toLocaleDateString() : 'Recent'} • {b.providerName || 'Provider'}
                      </div>
                    </div>
                    <span className={`status-chip status-${s}`}>{s}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications & Updates */}
        <div className="split-card-panel">
          <div className="section-header-row" style={{ marginBottom: '14px' }}>
            <h3>Notifications</h3>
            <span style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: '700' }}>Live</span>
          </div>

          <div className="notif-item">
            <span className="notif-dot" />
            <div>
              <p className="notif-text">Summer Discount 20% active on AC Servicing & Cleaning!</p>
              <span className="notif-time">2 hours ago</span>
            </div>
          </div>

          <div className="notif-item">
            <span className="notif-dot" style={{ background: '#16a34a' }} />
            <div>
              <p className="notif-text">Your profile is verified. You can book instant services.</p>
              <span className="notif-time">1 day ago</span>
            </div>
          </div>

          <div className="notif-item">
            <span className="notif-dot" style={{ background: '#ca8a04' }} />
            <div>
              <p className="notif-text">Remember to rate your recent completed service orders.</p>
              <span className="notif-time">3 days ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;