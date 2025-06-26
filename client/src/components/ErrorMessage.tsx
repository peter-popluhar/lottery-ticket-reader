import React from 'react';
import Alert from '@mui/material/Alert';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => (
  <Alert severity="error">Error: {message}</Alert>
);

export default ErrorMessage; 
