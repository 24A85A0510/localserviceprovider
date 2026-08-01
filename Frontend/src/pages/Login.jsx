import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [selectedRole, setSelectedRole] = useState('CUSTOMER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // --- FORGOT PASSWORD STATES ---
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = Request OTP, 2 = Verify OTP & Reset
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // --- OAUTH2 SOCIAL LOGIN HANDLERS ---
  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  };

  const handleGithubLogin = () => {
    window.location.href = 'http://localhost:8080/oauth2/authorization/github';
  };

  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await API.post('/auth/login', { email, password });
      const { token, id, email: responseEmail, role: responseRole } = response.data;

      // 1. Sanitize the token string to prevent corrupted tokens in localStorage
      let rawToken = typeof token === 'string' ? token : '';
      const cleanToken = rawToken.replace(/^"(.*)"$/, '$1').trim();

      if (!cleanToken || !cleanToken.startsWith('eyJ')) {
        setError('Login failed: Invalid token format received from backend.');
        console.error('Invalid token payload received:', token);
        return;
      }

      let userRole = responseRole || '';
      let extractedUserId = id || null;

      const decoded = parseJwt(cleanToken);
      if (!userRole && decoded) {
        userRole = decoded?.role || decoded?.roles?.[0] || decoded?.authorities?.[0] || '';
      }
      if (!extractedUserId && decoded) {
        const possibleId = decoded?.id || decoded?.userId;
        if (possibleId && !String(possibleId).includes('@')) {
          extractedUserId = possibleId;
        }
      }

      const cleanRole = userRole.replace(/^ROLE_/, '').toUpperCase();

      if (cleanRole !== selectedRole) {
        setError(`Access Denied: Registered as ${cleanRole}, not ${selectedRole}.`);
        return;
      }

      const rawId = extractedUserId;
      const finalUserId = rawId && !String(rawId).includes('@') ? rawId : null;

      // 2. Save the properly formatted token
      localStorage.setItem('token', cleanToken);
      if (finalUserId) {
        localStorage.setItem('userId', finalUserId);
      } else {
        localStorage.removeItem('userId');
      }

      const fullUserData = {
        id: finalUserId,
        email: responseEmail || email,
        role: cleanRole,
      };

      login(cleanToken, fullUserData, cleanRole);

      if (cleanRole === 'ADMIN') {
        navigate('/admin');
      } else if (cleanRole === 'PROVIDER') {
        navigate('/profile');
      } else {
        navigate('/my-bookings');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          'Login failed. Please check credentials.'
      );
    }
  };

  // --- HANDLER: STEP 1 - REQUEST OTP ---
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');
    setLoading(true);

    try {
      const response = await API.post('/auth/forgot-password', { email, phone });
      setForgotMessage(response.data || 'OTP sent successfully!');
      setForgotStep(2);
    } catch (err) {
      setForgotError(
        err.response?.data?.message ||
          err.response?.data ||
          'Failed to send OTP. Please check email and phone number.'
      );
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER: STEP 2 - VERIFY OTP & RESET PASSWORD ---
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');
    setLoading(true);

    try {
      const response = await API.post('/auth/reset-password', {
        email,
        phone,
        otp,
        newPassword,
      });
      setForgotMessage(
        response.data || 'Password reset successful! You can now log in.'
      );
      setTimeout(() => {
        resetForgotState();
      }, 2500);
    } catch (err) {
      setForgotError(
        err.response?.data?.message ||
          err.response?.data ||
          'Failed to reset password. Check OTP.'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForgotState = () => {
    setIsForgotMode(false);
    setForgotStep(1);
    setEmail('');
    setPhone('');
    setOtp('');
    setNewPassword('');
    setForgotError('');
    setForgotMessage('');
  };

  return (
    <div className="live-login-container">
      <video autoPlay loop muted playsInline className="background-video">
        <source src="/dashboard-bg.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="video-overlay"></div>

      <div className="glass-login-card retro-style">
        {!isForgotMode ? (
          <>
            <h2 className="sign-in-title">S i g n   I n</h2>

            <div className="role-tabs">
              <button
                type="button"
                className={`tab-btn ${selectedRole === 'CUSTOMER' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedRole('CUSTOMER');
                  setError('');
                }}
              >
                Customer
              </button>
              <button
                type="button"
                className={`tab-btn ${selectedRole === 'PROVIDER' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedRole('PROVIDER');
                  setError('');
                }}
              >
                Provider
              </button>
              <button
                type="button"
                className={`tab-btn ${selectedRole === 'ADMIN' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedRole('ADMIN');
                  setError('');
                }}
              >
                Admin
              </button>
            </div>

            {error && <p className="error-message">{error}</p>}

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="retro-label">
                  {selectedRole.charAt(0) + selectedRole.slice(1).toLowerCase()} Username
                </label>
                <input
                  type="email"
                  className="retro-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Username"
                  required
                />
              </div>

              <div className="input-group">
                <label className="retro-label">Password</label>
                <input
                  type="password"
                  className="retro-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
              </div>

              <div className="forgot-link-container">
                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={() => setIsForgotMode(true)}
                >
                  Forgot Password?
                </button>
              </div>

              <button type="submit" className="btn-login retro-btn">
                L o g   I n
              </button>
            </form>

            <div style={{ margin: '18px 0 12px 0', textAlign: 'center' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem' }}>
                OR CONTINUE WITH
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="retro-btn"
                style={{
                  flex: 1,
                  backgroundColor: '#4285F4',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                }}
              >
                Google
              </button>

              <button
                type="button"
                onClick={handleGithubLogin}
                className="retro-btn"
                style={{
                  flex: 1,
                  backgroundColor: '#24292e',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                }}
              >
                GitHub
              </button>
            </div>

            <p className="register-text">
              Don't have an account? <Link to="/register">Register here</Link>
            </p>
          </>
        ) : (
          <div className="forgot-password-box">
            <h2 className="sign-in-title">R e s e t</h2>

            {forgotError && <p className="error-message">{forgotError}</p>}
            {forgotMessage && <p className="success-message">{forgotMessage}</p>}

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestOtp}>
                <div className="input-group">
                  <label className="retro-label">Registered Email</label>
                  <input
                    type="email"
                    className="retro-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Registered Email"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="retro-label">Registered Phone Number</label>
                  <input
                    type="text"
                    className="retro-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter Phone Number"
                    required
                  />
                </div>

                <button type="submit" className="btn-login retro-btn" disabled={loading}>
                  {loading ? 'Sending OTP...' : 'S e n d   O T P'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <div className="input-group">
                  <label className="retro-label">OTP (6 Digits)</label>
                  <input
                    type="text"
                    className="retro-input"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="retro-label">New Password</label>
                  <input
                    type="password"
                    className="retro-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter New Password"
                    required
                  />
                </div>

                <button type="submit" className="btn-login retro-btn" disabled={loading}>
                  {loading ? 'Updating...' : 'R e s e t   P a s s w o r d'}
                </button>
              </form>
            )}

            <button
              type="button"
              className="back-to-login-btn"
              onClick={resetForgotState}
            >
              ← Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;