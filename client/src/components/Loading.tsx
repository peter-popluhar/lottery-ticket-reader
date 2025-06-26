import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

interface LoadingProps {
  message: string;
}

const Loading: React.FC<LoadingProps> = ({ message }) => (
  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="30vh">
    <CircularProgress sx={{ mb: 2 }} />
    <Typography variant="body1">{message}</Typography>
  </Box>
);

export default Loading; 
