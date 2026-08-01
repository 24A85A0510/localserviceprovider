import { useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const OAuth2RedirectHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  // Helper function to decode JWT payload safely
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

  useEffect(() => {
    const rawToken = searchParams.get('token');
    const roleParam = searchParams.get('role');

    // 1. Sanitize the token string
    const token = rawToken ? rawToken.replace(/^"(.*)"$/, '$1').trim() : null;

    if (token && token.startsWith('eyJ')) {
      const decoded = parseJwt(token);

      // 2. Extract user metadata & role dynamically
      let userRole =
        roleParam ||
        decoded?.role ||
        decoded?.roles?.[0] ||
        decoded?.authorities?.[0] ||
        'CUSTOMER';

      userRole = userRole.replace(/^ROLE_/, '').toUpperCase();

      const email = decoded?.sub || decoded?.email || '';
      const userId = decoded?.id || decoded?.userId || null;

      // 3. Persist explicitly to LocalStorage for API Axios headers
      localStorage.setItem('token', token);
      if (userId && !String(userId).includes('@')) {
        localStorage.setItem('userId', String(userId));
      } else {
        localStorage.removeItem('userId');
      }

      const userData = {
        id: userId,
        email,
        role: userRole,
      };

      // 4. Set global Auth Context
      login(token, userData, userRole);

      // 5. Navigate based on authenticated role
      if (userRole === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (userRole === 'PROVIDER') {
        navigate('/profile', { replace: true });
      } else {
        navigate('/services', { replace: true });
      }
    } else {
      console.error('Invalid or missing OAuth2 JWT token in URL params.');
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, login]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '80vh',
        color: '#ffffff',
      }}
    >
      <h2>Authenticating with Google...</h2>
      <p style={{ color: '#94a3b8' }}>Please wait while we log you in.</p>
    </div>
  );
};

export default OAuth2RedirectHandler;