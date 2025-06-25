import React from 'react';

interface LoadingProps {
  message: string;
}

const Loading: React.FC<LoadingProps> = ({ message }) => (
  <div className="loading-container">{message}</div>
);

export default Loading; 
