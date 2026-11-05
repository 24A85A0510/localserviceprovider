import { useState, useEffect, useContext, useRef } from 'react';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const NotificationBell = () => {
  const { userId: contextUserId } = useContext(AuthContext);
  const resolvedUserId = contextUserId || localStorage.getItem('userId');

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!resolvedUserId) return;
    try {
      const [listRes, countRes] = await Promise.all([
        API.get(`/notifications/user/${resolvedUserId}`),
        API.get(`/notifications/user/${resolvedUserId}/unread`),
      ]);
      const listData = Array.isArray(listRes.data)
        ? listRes.data
        : listRes.data?.content || [];
      const countData =
        typeof countRes.data === 'number'
          ? countRes.data
          : listData.filter((n) => !(n.isRead ?? n.read)).length;

      setNotifications(listData);
      setUnreadCount(countData);
    } catch (err) {
      console.warn('Failed to fetch notifications from backend:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, [resolvedUserId]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await API.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    const unreadItems = notifications.filter((item) => !(item.isRead ?? item.read));
    await Promise.all(unreadItems.map((n) => markAsRead(n.id)));
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          fontSize: '1.1rem',
          color: '#475569',
          transition: 'all 0.15s ease',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              borderRadius: '10px',
              padding: '1px 5px',
              fontSize: '0.68rem',
              fontWeight: '800',
              border: '2px solid #ffffff',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '46px',
            width: '320px',
            maxHeight: '380px',
            overflowY: 'auto',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.15)',
            zIndex: 1000,
            color: '#0f172a',
            fontFamily: 'inherit',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: '#0f172a' }}>
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </h4>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ padding: '6px 0' }}>
            {notifications.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.86rem', textAlign: 'center', padding: '24px 16px', margin: 0 }}>
                No notifications right now.
              </p>
            ) : (
              notifications.map((item) => {
                const isItemRead = item.isRead ?? item.read;
                return (
                  <div
                    key={item.id}
                    onClick={() => markAsRead(item.id)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: isItemRead ? '#ffffff' : '#eff6ff',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                      <span
                        style={{
                          fontSize: '0.84rem',
                          fontWeight: isItemRead ? '600' : '700',
                          color: isItemRead ? '#334155' : '#1e40af',
                        }}
                      >
                        {item.title || 'Notification'}
                      </span>
                      <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </small>
                    </div>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem', lineHeight: '1.4' }}>
                      {item.message || item.text}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;