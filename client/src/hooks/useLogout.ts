import { auth } from '../firebase';
import { useCallback } from 'react';
import type { LotteryData } from '../App';

export function useLogout(setExtractedData: (data: LotteryData | null) => void, setShowCamera: (show: boolean) => void) {
  const handleLogout = useCallback(async () => {
    try {
      await auth.signOut();
      setExtractedData(null);
      setShowCamera(true);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [setExtractedData, setShowCamera]);

  return { handleLogout };
} 
