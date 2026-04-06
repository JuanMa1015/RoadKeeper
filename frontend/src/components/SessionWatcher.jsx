import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const getTokenExpiry = (token) => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
};

export default function SessionWatcher() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      const expiresAt = getTokenExpiry(token);
      if (expiresAt && Date.now() >= expiresAt) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('temp_token');
        navigate('/login', { replace: true });
      }
    };

    checkSession();
    const intervalId = window.setInterval(checkSession, 30000);

    return () => window.clearInterval(intervalId);
  }, [navigate]);

  return null;
}