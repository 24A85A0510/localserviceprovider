import { useState, useEffect, useContext } from 'react';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const NotificationBell = () => {
  const { userId } = useContext(AuthContext); // Dynamically reads the logged-in userId
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!userId) return;
    try {
      const [listRes, countRes] = await Promise.all([
        API.get(`/notifications/user/${userId}`),
        API.get(`/notifications/user/${userId}/unread`),
      ]);
      setNotifications(listRes.data);
      setUnreadCount(countRes.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Polls every 10 seconds
    return () => clearInterval(interval);
  }, [userId]);

  const markAsRead = async (id) => {
    try {
      await API.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#fff',
          fontSize: '1.2rem',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              backgroundColor: '#dc3545',
              color: '#fff',
              borderRadius: '50%',
              padding: '2px 6px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
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
            top: '35px',
            width: '300px',
            maxHeight: '350px',
            overflowY: 'auto',
            backgroundColor: '#222',
            border: '1px solid #444',
            borderRadius: '6px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
            zIndex: 1000,
            padding: '10px',
          }}
        >
          <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #333', paddingBottom: '5px', color: '#fff' }}>
            Notifications
          </h4>
          {notifications.length === 0 ? (
            <p style={{ color: '#888', fontSize: '0.9rem', textAlign: 'center' }}>No notifications</p>
          ) : (
            notifications.map((item) => {
              const isItemRead = item.isRead ?? item.read;
              return (
                <div
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  style={{
                    padding: '8px',
                    marginBottom: '6px',
                    borderRadius: '4px',
                    backgroundColor: isItemRead ? '#1a1a1a' : '#333',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  <p style={{ margin: 0, color: isItemRead ? '#aaa' : '#fff' }}>{item.message}</p>
                  <small style={{ color: '#666' }}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleTimeString() : ''}
                  </small>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;