import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [selectedRole, setSelectedRole] = useState('CUSTOMER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  // --- FORGOT PASSWORD STATES ---
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

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

      let rawToken = typeof token === 'string' ? token : '';
      const cleanToken = rawToken.replace(/^"(.*)"$/, '$1').trim();

      if (!cleanToken || !cleanToken.startsWith('eyJ')) {
        setError('Login failed: Invalid token format received from backend.');
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

      localStorage.setItem('token', cleanToken);
      if (extractedUserId && !String(extractedUserId).includes('@')) {
        localStorage.setItem('userId', extractedUserId);
      } else {
        localStorage.removeItem('userId');
      }

      const fullUserData = {
        id: extractedUserId,
        email: responseEmail || email,
        role: cleanRole,
      };

      login(cleanToken, fullUserData, cleanRole);

      // Role-based route redirection
      if (cleanRole === 'ADMIN') {
        navigate('/admin');
      } else if (cleanRole === 'PROVIDER') {
        navigate('/provider-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          'Login failed. Please check credentials.'
      );
    }
  };

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
      setForgotMessage(response.data || 'Password reset successful! You can now log in.');
      setTimeout(() => resetForgotState(), 2500);
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
    <div className="login-page-root">
      <style>{`
        .login-page-root {
          min-height: 100vh;
          width: 100%;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .login-shell {
          width: 100%;
          max-width: 920px;
          min-height: 580px;
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 20px 45px -15px rgba(15, 23, 42, 0.12), 0 0 1px 1px rgba(15, 23, 42, 0.05);
          display: flex;
          overflow: hidden;
        }

        .login-banner-col {
          flex: 1.1;
          background: linear-gradient(145deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%);
          color: #ffffff;
          padding: 40px 36px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
        }

        .brand-header-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-icon-box {
          width: 42px;
          height: 42px;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.35);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }

        .brand-name-text {
          font-size: 1.15rem;
          font-weight: 700;
          margin: 0;
          color: #ffffff;
        }

        .brand-subtext {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.8);
          margin: 2px 0 0 0;
        }

        .banner-content-body {
          margin: 24px 0;
        }

        .banner-content-body h2 {
          font-size: 1.7rem;
          font-weight: 800;
          line-height: 1.25;
          margin: 0 0 12px 0;
          color: #ffffff;
        }

        .banner-content-body p {
          font-size: 0.9rem;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.88);
          margin: 0 0 18px 0;
        }

        .feature-bullets {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .feature-bullets li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.86rem;
          font-weight: 500;
        }

        .bullet-tick {
          width: 20px;
          height: 20px;
          background: rgba(255, 255, 255, 0.22);
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .banner-svg-holder {
          width: 100%;
          max-height: 150px;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
        }

        .banner-svg-holder svg {
          width: 100%;
          max-width: 320px;
          height: auto;
          max-height: 140px;
        }

        .login-form-col {
          flex: 1;
          background: #ffffff;
          padding: 40px 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
        }

        .form-content-inner {
          width: 100%;
          max-width: 360px;
        }

        .form-title-head h2 {
          font-size: 1.6rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px 0;
        }

        .form-title-head p {
          font-size: 0.86rem;
          color: #64748b;
          margin: 0 0 20px 0;
        }

        .role-switch-container {
          display: flex;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 10px;
          margin-bottom: 20px;
          gap: 4px;
        }

        .role-option-btn {
          flex: 1;
          padding: 8px;
          background: transparent;
          border: none;
          font-size: 0.82rem;
          font-weight: 600;
          color: #64748b;
          border-radius: 7px;
          cursor: pointer;
        }

        .role-option-btn.active {
          background: #2563eb;
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
        }

        .input-block {
          margin-bottom: 14px;
        }

        .input-block label {
          display: block;
          font-size: 0.82rem;
          font-weight: 600;
          color: #334155;
          margin-bottom: 6px;
        }

        .input-box-wrapper {
          display: flex;
          align-items: center;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          background: #ffffff !important;
          background-color: #ffffff !important;
          overflow: hidden;
          padding: 0 12px;
        }

        .input-box-wrapper:focus-within {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .input-box-wrapper input {
          width: 100%;
          border: none;
          outline: none;
          background: #ffffff !important;
          background-color: #ffffff !important;
          padding: 10px 6px;
          font-size: 0.9rem;
          color: #0f172a !important;
        }

        /* Prevent dark autofill */
        .input-box-wrapper input:-webkit-autofill,
        .input-box-wrapper input:-webkit-autofill:hover,
        .input-box-wrapper input:-webkit-autofill:focus,
        .input-box-wrapper input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 40px #ffffff inset !important;
          -webkit-text-fill-color: #0f172a !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        .pwd-toggle-text {
          background: transparent;
          border: none;
          color: #2563eb;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
        }

        .options-inline-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          font-size: 0.82rem;
        }

        .remember-checkbox-label {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #64748b;
          cursor: pointer;
        }

        .forgot-btn-link {
          background: transparent;
          border: none;
          color: #2563eb;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
        }

        .primary-action-btn {
          width: 100%;
          background: #2563eb;
          color: #ffffff;
          border: none;
          padding: 12px;
          border-radius: 10px;
          font-size: 0.92rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.28);
        }

        .primary-action-btn:hover {
          background: #1d4ed8;
        }

        .divider-label {
          position: relative;
          text-align: center;
          margin: 18px 0;
        }

        .divider-label::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #e2e8f0;
        }

        .divider-label span {
          position: relative;
          background: #ffffff;
          padding: 0 10px;
          font-size: 0.78rem;
          color: #94a3b8;
        }

        .oauth-btn-grid {
          display: flex;
          gap: 10px;
          margin-bottom: 16px;
        }

        .oauth-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          border: 1.5px solid #e2e8f0;
          background: #ffffff;
          border-radius: 10px;
          font-size: 0.84rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
        }

        .oauth-btn:hover {
          background: #f8fafc;
        }

        .bottom-switch-link {
          text-align: center;
          font-size: 0.85rem;
          color: #64748b;
          margin: 0;
        }

        .bottom-switch-link a {
          color: #2563eb;
          font-weight: 600;
          text-decoration: none;
        }

        .msg-alert {
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 0.84rem;
          margin-bottom: 14px;
        }

        .msg-alert.err {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .msg-alert.ok {
          background: #f0fdf4;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }

        .return-login-btn {
          width: 100%;
          margin-top: 14px;
          background: transparent;
          border: none;
          color: #64748b;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.84rem;
        }

        @media (max-width: 840px) {
          .login-shell {
            flex-direction: column;
            max-width: 440px;
          }
          .login-banner-col {
            display: none;
          }
          .login-form-col {
            padding: 32px 24px;
          }
        }
      `}</style>

      <div className="login-shell">
        {/* LEFT BRAND PANEL */}
        <div className="login-banner-col">
          <div className="brand-header-row">
            <div className="brand-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <div>
              <h1 className="brand-name-text">LocalServiceProvider</h1>
              <p className="brand-subtext">Find • Book • Get It Done</p>
            </div>
          </div>

          <div className="banner-content-body">
            <h2>Your Local Services at Your Fingertips</h2>
            <p>Connect with trusted local service providers for all your needs — quickly and easily.</p>
            <ul className="feature-bullets">
              <li><span className="bullet-tick">✓</span> Trusted Professionals</li>
              <li><span className="bullet-tick">✓</span> Affordable Prices</li>
              <li><span className="bullet-tick">✓</span> Instant Booking</li>
            </ul>
          </div>

          <div className="banner-svg-holder">
            <svg viewBox="0 0 340 180" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="15" y="70" width="30" height="110" rx="3" fill="#1d4ed8" fillOpacity="0.4" />
              <rect x="55" y="45" width="38" height="135" rx="3" fill="#1d4ed8" fillOpacity="0.5" />
              <rect x="100" y="85" width="32" height="95" rx="3" fill="#1d4ed8" fillOpacity="0.3" />
              <rect x="140" y="55" width="40" height="125" rx="3" fill="#1d4ed8" fillOpacity="0.4" />
              <rect x="190" y="80" width="32" height="100" rx="3" fill="#1d4ed8" fillOpacity="0.3" />
              <rect x="230" y="40" width="38" height="140" rx="3" fill="#1d4ed8" fillOpacity="0.5" />
              <rect x="275" y="65" width="36" height="115" rx="3" fill="#1d4ed8" fillOpacity="0.4" />

              <circle cx="170" cy="95" r="40" fill="#38bdf8" fillOpacity="0.25" />
              <circle cx="170" cy="80" r="20" fill="#fed7aa" />
              <path d="M150 78 C150 66 190 66 190 78 Z" fill="#2563eb" />
              <path d="M147 78 L193 78 L190 82 L150 82 Z" fill="#1e40af" />
              <path d="M138 135 C138 108 202 108 202 135 Z" fill="#2563eb" />
              <rect x="158" y="110" width="24" height="24" rx="4" fill="#ffffff" fillOpacity="0.9" />
              <path d="M165 116 L175 116" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M170 111 L170 121" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* RIGHT FORM PANEL */}
        <div className="login-form-col">
          {!isForgotMode ? (
            <div className="form-content-inner">
              <div className="form-title-head">
                <h2>Welcome Back!</h2>
                <p>Login to your account</p>
              </div>

              {/* ROLE TOGGLE */}
              <div className="role-switch-container">
                {['CUSTOMER', 'PROVIDER', 'ADMIN'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={`role-option-btn ${selectedRole === role ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedRole(role);
                      setError('');
                    }}
                  >
                    {role.charAt(0) + role.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              {error && <div className="msg-alert err">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="input-block">
                  <label>Email Address</label>
                  <div className="input-box-wrapper">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="input-block">
                  <label>Password</label>
                  <div className="input-box-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                    />
                    <button
                      type="button"
                      className="pwd-toggle-text"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div className="options-inline-row">
                  <label className="remember-checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember Me</span>
                  </label>
                  <button
                    type="button"
                    className="forgot-btn-link"
                    onClick={() => setIsForgotMode(true)}
                  >
                    Forgot Password?
                  </button>
                </div>

                <button type="submit" className="primary-action-btn">
                  <span>Login</span>
                  <span>→</span>
                </button>
              </form>

              <div className="divider-label">
                <span>or continue with</span>
              </div>

              <div className="oauth-btn-grid">
                <button type="button" onClick={handleGoogleLogin} className="oauth-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Google</span>
                </button>
                <button type="button" onClick={handleGithubLogin} className="oauth-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>GitHub</span>
                </button>
              </div>

              <p className="bottom-switch-link">
                Don't have an account? <Link to="/register">Sign Up</Link>
              </p>
            </div>
          ) : (
            <div className="form-content-inner">
              <div className="form-title-head">
                <h2>Reset Password</h2>
                <p>Verify your details to restore access</p>
              </div>

              {forgotError && <div className="msg-alert err">{forgotError}</div>}
              {forgotMessage && <div className="msg-alert ok">{forgotMessage}</div>}

              {forgotStep === 1 ? (
                <form onSubmit={handleRequestOtp}>
                  <div className="input-block">
                    <label>Registered Email</label>
                    <div className="input-box-wrapper">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter email"
                        required
                      />
                    </div>
                  </div>
                  <div className="input-block">
                    <label>Registered Phone Number</label>
                    <div className="input-box-wrapper">
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="10-digit phone"
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="primary-action-btn" disabled={loading}>
                    {loading ? 'Sending OTP...' : 'Send OTP →'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword}>
                  <div className="input-block">
                    <label>6-Digit OTP</label>
                    <div className="input-box-wrapper">
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        required
                      />
                    </div>
                  </div>
                  <div className="input-block">
                    <label>New Password</label>
                    <div className="input-box-wrapper">
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="primary-action-btn" disabled={loading}>
                    {loading ? 'Updating...' : 'Reset Password →'}
                  </button>
                </form>
              )}

              <button type="button" className="return-login-btn" onClick={resetForgotState}>
                ← Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;