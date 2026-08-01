import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import './Login.css';

import bgVideo from '/blue-space-black-hole-live-wallpaper.mp4';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CUSTOMER',
    phone: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await API.post('/auth/register', formData);
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="live-login-container">
      {/* Background Live Video */}
      <video autoPlay loop muted playsInline className="background-video">
        <source src={bgVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Dark Overlay */}
      <div className="video-overlay"></div>

      {/* Glassmorphic Register Card */}
      <div className="glass-login-card retro-style" style={{ maxWidth: '560px', padding: '3rem 2.5rem' }}>
        <h2 className="sign-in-title" style={{ fontSize: '2.2rem', marginBottom: '1.5rem' }}>
          R e g i s t e r
        </h2>

        {error && <p className="error-message">{error}</p>}
        {success && (
          <p
            className="error-message"
            style={{
              color: '#4ade80',
              background: 'rgba(22, 101, 52, 0.6)',
              borderColor: '#22c55e',
            }}
          >
            {success}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          {/* Account Type Selection */}
          <div className="input-group">
            <label className="retro-label">Account Type</label>
            <div className="role-tabs" style={{ marginBottom: '0' }}>
              <button
                type="button"
                className={`tab-btn ${formData.role === 'CUSTOMER' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'CUSTOMER' })}
              >
                Customer
              </button>
              <button
                type="button"
                className={`tab-btn ${formData.role === 'PROVIDER' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'PROVIDER' })}
              >
                Provider
              </button>
            </div>
          </div>

          <div className="input-group">
            <label className="retro-label">Full Name</label>
            <input
              type="text"
              name="name"
              className="retro-input"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              required
            />
          </div>

          <div className="input-group">
            <label className="retro-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="retro-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              required
            />
          </div>

          <div className="input-group">
            <label className="retro-label">Password</label>
            <input
              type="password"
              name="password"
              className="retro-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
            />
          </div>

          <div className="input-group">
            <label className="retro-label">Phone Number</label>
            <input
              type="text"
              name="phone"
              className="retro-input"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              required
            />
          </div>

          <button type="submit" className="btn-login retro-btn">
            C r e a t e   A c c o u n t
          </button>
        </form>

        <p className="register-text">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;