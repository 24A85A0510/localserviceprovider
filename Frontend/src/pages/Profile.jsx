import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Profile = () => {
  const { token, userId, userRole } = useContext(AuthContext);

  // Profile Form State
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
    profilePic: '', // Stores Base64 data string for persistence
  });
  const [isEditing, setIsEditing] = useState(false);
  const [updateMsg, setUpdateMsg] = useState({ type: '', text: '' });

  // Activity History State
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const normalizedRole = userRole?.replace(/^ROLE_/, '').toUpperCase();

  useEffect(() => {
    // Check that userId exists and is not literal "null" or "undefined"
    if (userId && userId !== 'null' && userId !== 'undefined' && token) {
      fetchUserProfile();
      fetchUserActivity();
    } else {
      setLoading(false);
    }
  }, [userId, token]);

  // Fetch User Info
  const fetchUserProfile = async () => {
    try {
      const res = await axios.get(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserInfo({
        name: res.data.name || '',
        email: res.data.email || '',
        phone: res.data.phone || res.data.phoneNumber || '',
        profilePic: res.data.profilePic || res.data.avatarUrl || '',
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  // Fetch User Activity (Bookings or Listed Services)
  const fetchUserActivity = async () => {
    setLoading(true);
    try {
      const endpoint =
        normalizedRole === 'PROVIDER'
          ? `/api/services/provider/${userId}`
          : `/api/bookings/user/${userId}`;

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Ensure res.data is an array before setting state to avoid .map errors
      if (Array.isArray(res.data)) {
        setActivity(res.data);
      } else if (res.data && typeof res.data === 'object') {
        // Handle paginated responses or wrapped objects (e.g. { content: [...] })
        setActivity(res.data.content || res.data.services || res.data.bookings || []);
      } else {
        setActivity([]);
      }
    } catch (err) {
      console.error('Error fetching activity:', err);
      setActivity([]);
    } finally {
      setLoading(false);
    }
  };

  // Converts uploaded image file to a persistent Base64 Data URL
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserInfo((prev) => ({ ...prev, profilePic: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Form Submit
  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdateMsg({ type: '', text: '' });
    try {
      await axios.put(`/api/users/${userId}`, userInfo, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUpdateMsg({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (err) {
      setUpdateMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile.',
      });
    }
  };

  return (
    <div style={styles.container}>
      <h2>User Profile</h2>

      {updateMsg.text && (
        <div
          style={{
            ...styles.alert,
            backgroundColor: updateMsg.type === 'success' ? '#28a745' : '#dc3545',
          }}
        >
          {updateMsg.text}
        </div>
      )}

      {/* --- Section 1: Contact Information & Profile Picture --- */}
      <div style={styles.card}>
        {/* Profile Avatar Header */}
        <div style={styles.avatarSection}>
          <div style={styles.avatarContainer}>
            <img
              src={userInfo.profilePic || 'https://via.placeholder.com/120?text=User'}
              alt="Profile"
              style={styles.avatarImg}
            />
            {isEditing && (
              <label htmlFor="avatar-upload" style={styles.uploadBadge}>
                📷
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
        </div>

        <h3>Contact Information</h3>
        {!isEditing ? (
          <div>
            <p><strong>Name:</strong> {userInfo.name}</p>
            <p><strong>Email:</strong> {userInfo.email}</p>
            <p><strong>Phone:</strong> {userInfo.phone || 'Not provided'}</p>
            <p><strong>Role:</strong> {normalizedRole || 'USER'}</p>
            <button style={styles.btnPrimary} onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdate} style={styles.form}>
            <div style={styles.formGroup}>
              <label>Full Name</label>
              <input
                type="text"
                value={userInfo.name}
                onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Email Address</label>
              <input
                type="email"
                value={userInfo.email}
                onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Phone Number</label>
              <input
                type="text"
                value={userInfo.phone}
                onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                style={styles.input}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={styles.btnSuccess}>
                Save Changes
              </button>
              <button
                type="button"
                style={styles.btnSecondary}
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* --- Section 2: Activity Log --- */}
      <div style={styles.card}>
        <h3>
          {normalizedRole === 'PROVIDER' ? 'My Listed Services' : 'Past Booking Activity'}
        </h3>
        {loading ? (
          <p>Loading activity...</p>
        ) : !Array.isArray(activity) || activity.length === 0 ? (
          <p>No activity found.</p>
        ) : (
          <ul style={styles.activityList}>
            {normalizedRole === 'PROVIDER'
              ? activity.map((item) => (
                  <li key={item.id} style={styles.activityItem}>
                    <div>
                      <strong>{item.title || item.name}</strong>
                      <p>{item.description}</p>
                    </div>
                    <span style={styles.badge}>₹{item.price}</span>
                  </li>
                ))
              : activity.map((item) => (
                  <li key={item.id} style={styles.activityItem}>
                    <div>
                      <strong>Booking #{item.id}</strong>
                      <p>Date: {item.bookingDate || 'N/A'}</p>
                    </div>
                    <span
                      style={{
                        ...styles.statusBadge,
                        backgroundColor:
                          item.status === 'CONFIRMED'
                            ? '#28a745'
                            : item.status === 'PENDING'
                            ? '#ffc107'
                            : '#6c757d',
                      }}
                    >
                      {item.status}
                    </span>
                  </li>
                ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '800px', margin: '2rem auto', padding: '0 1rem', color: '#fff' },
  card: { backgroundColor: '#222', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #333' },
  alert: { padding: '0.8rem', color: '#fff', borderRadius: '4px', marginBottom: '1rem' },
  avatarSection: { display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' },
  avatarContainer: { position: 'relative', width: '120px', height: '120px' },
  avatarImg: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid #007bff' },
  uploadBadge: { position: 'absolute', bottom: '0', right: '0', backgroundColor: '#007bff', padding: '8px', borderRadius: '50%', cursor: 'pointer', fontSize: '1rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  input: { padding: '0.5rem', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#333', color: '#fff' },
  btnPrimary: { backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' },
  btnSuccess: { backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' },
  btnSecondary: { backgroundColor: '#6c757d', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' },
  activityList: { listStyle: 'none', padding: 0, margin: 0 },
  activityItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 0', borderBottom: '1px solid #333' },
  badge: { backgroundColor: '#17a2b8', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.85rem' },
  statusBadge: { color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.85rem' },
};

export default Profile;