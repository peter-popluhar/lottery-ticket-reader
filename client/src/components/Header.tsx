import React from 'react';
import type { User } from 'firebase/auth';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => (
  <AppBar position="static">
    <Toolbar>
      <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
        Lottery Ticket Reader
      </Typography>
      {user && (
        <Button color="inherit" onClick={onLogout}>
          Sign Out
        </Button>
      )}
    </Toolbar>
  </AppBar>
);

export default Header; 
