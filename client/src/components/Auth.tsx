import React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

interface AuthProps {
  onLogin: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => (
  <Container maxWidth="xs" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
    <Typography variant="h5" component="h2" sx={{ mb: 3, mt: 2, textAlign: 'center' }}>
      Please sign in to continue
    </Typography>
    <Button variant="contained" color="primary" onClick={onLogin} size="large">
      Sign in with Google
    </Button>
  </Container>
);

export default Auth; 
