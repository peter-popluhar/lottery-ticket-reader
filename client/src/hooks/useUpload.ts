import { useState } from 'react';
import { auth } from '../firebase';
import type { LotteryData } from '../App';

export function useUpload(setExtractedData: (data: LotteryData | null) => void, setShowCamera: (show: boolean) => void) {
  const [apiLoading, setApiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    if (!auth.currentUser) {
      setError('You must be logged in to upload an image.');
      return;
    }
    setApiLoading(true);
    setError(null);
    setExtractedData(null);

    const token = await auth.currentUser.getIdToken();
    const formData = new FormData();
    formData.append('lotteryImage', file);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/extract-lottery-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data: LotteryData = await response.json();
      setExtractedData(data);
      setShowCamera(false);
    } catch (err: unknown) {
      console.error('Error uploading or processing image:', err);
      let message = 'Unknown error';
      if (err instanceof Error) {
        message = err.message;
      }
      setError(`Failed to extract data: ${message}`);
      setShowCamera(true); // Allow retry
    } finally {
      setApiLoading(false);
    }
  };

  return { handleUpload, apiLoading, error };
} 
