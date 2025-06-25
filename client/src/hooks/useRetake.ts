import type { LotteryData } from '../App';

export function useRetake(
  setExtractedData: (data: LotteryData | null) => void,
  setError: (err: string | null) => void,
  setShowCamera: (show: boolean) => void
) {
  const handleRetake = () => {
    setExtractedData(null);
    setError(null);
    setShowCamera(true);
  };
  return { handleRetake };
} 
