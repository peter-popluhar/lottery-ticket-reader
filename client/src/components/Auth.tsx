import React from 'react';

interface AuthProps {
  onLogin: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => (
  <div className="login-container">
    <h2>Please sign in to continue</h2>
    <button onClick={onLogin} className="login-button">
      Sign in with Google
    </button>
  </div>
);

export default Auth; 
