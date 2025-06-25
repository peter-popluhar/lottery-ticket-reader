import React from 'react';
import type { User } from 'firebase/auth';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => (
  <header className="App-header">
    <h1>Lottery Ticket Reader</h1>
    {user && (
      <button onClick={onLogout} className="sign-out-button">
        Sign Out
      </button>
    )}
  </header>
);

export default Header; 
