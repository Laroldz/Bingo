// ProtectedLayout.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import jwt_decode from 'jwt-decode';

function ProtectedLayout() {
  const token = sessionStorage.getItem('idToken');
  if (!token) {
    window.alert('No token found, please log in first');
    return <Navigate to="/" replace />;
  }

  // Optional: check token expiry
  try {
    const decoded = jwt_decode(token);
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && now > decoded.exp) {
      sessionStorage.removeItem('idToken');
      window.alert('Token expired');
      return <Navigate to="/" replace />;
    }
  } catch (err) {
    console.error('Token decode failed', err);
    window.alert('Token decode failed');
    return <Navigate to="/" replace />;
  }
  console.log("token is valid, success, user is: ", jwt_decode(token));
  //get the user id and username from the token
    const userId = jwt_decode(token).sub;
    const username = jwt_decode(token)["cognito:username"];
    console.log("user id: ", userId);
    console.log("username: ", username);
    sessionStorage.setItem('userId', userId);
    sessionStorage.setItem('username', username);

  // If valid, render the nested child routes:
  return <Outlet />;
}

export default ProtectedLayout;
