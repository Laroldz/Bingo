// src/components/Callback.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Parse the 'code' from ?code=...
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) {
      console.error('No code found in the URL');
      navigate('/');
      return;
    }

    // 2. Exchange the code for tokens using Cognito’s /oauth2/token endpoint
    const domain = import.meta.env.VITE_COGNITO_DOMAIN;
    const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_COGNITO_REDIRECT_URI;
console.log('Cognito Domain:', domain);
console.log('Client ID:', clientId);
console.log('Redirect URI:', redirectUri);
console.log('Client Secret:', import.meta.env.VITE_COGNITO_CLIENT_SECRET);


    const tokenUrl = `${domain}oauth2/token`;
    console.log( 'tokenUrl:', tokenUrl );
    const data = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      client_id: clientId,
      redirect_uri: redirectUri,
      client_secret: import.meta.env.VITE_COGNITO_CLIENT_SECRET,
    });

    axios.post(tokenUrl, data, {headers: { 'Content-Type': 'application/x-www-form-urlencoded' },}).then((res) => {
        // 3. res.data contains { id_token, access_token, refresh_token, expires_in, token_type }
        const { id_token, access_token } = res.data;
        console.log('Tokens:', { id_token, access_token });
        if (!id_token) {
          console.error('No id_token returned by Cognito');
          navigate('/');
          return;
        }

        // 4. Store tokens in local/session storage
        sessionStorage.setItem('idToken', id_token);
        sessionStorage.setItem('accessToken', access_token);
        console.log('Tokens stored in session storage');

        // 5. Remove ?code from the URL (so it’s not visible)
        window.history.replaceState(null, '', window.location.pathname);

        // 6. Redirect to a protected page or home
        console.log("id token:", id_token);
        console.log("access token:", access_token);
        navigate('/mysheets'); // or /mysheets, etc.
      })
      
      .catch((err) => {
        console.error('Error exchanging code for tokens:', err);
        //navigate('/fasdfs');
      });
  }, [navigate]);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Exchanging code for tokens...</h2>
    </div>
  );
}

export default Callback;
