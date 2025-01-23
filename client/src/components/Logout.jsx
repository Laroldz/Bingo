import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

function Logout () {
  const navigate = useNavigate(); // Initialize navigate
  const handleLogout = () => {
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('idToken');
    sessionStorage.removeItem('username');
    navigate('/');
  };

  useEffect (() => {
    handleLogout();
  }
    , []);

  return (
    <div>
      <h1>Logging Out...</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
export default Logout;
