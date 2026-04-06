import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const getTokenExpiry = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
};

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const expiresAt = getTokenExpiry(token);
  if (expiresAt && Date.now() >= expiresAt) {
    localStorage.removeItem('token');
    sessionStorage.removeItem('temp_token');
    return <Navigate to="/login" replace state={{ from: location, expired: true }} />;
  }

  return children;
}