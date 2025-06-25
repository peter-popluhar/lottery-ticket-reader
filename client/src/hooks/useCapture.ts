import type { LotteryData } from '../App';

export function useCapture(
  setExtractedData: (data: LotteryData | null) => void,
  setError: (err: string | null) => void,
  setShowCamera: (show: boolean) => void,
  handleUpload: (file: File) => void
) {
  const handleCapture = (file: File) => {
    setExtractedData(null);
    setError(null);
    setShowCamera(false);
    handleUpload(file);
  };
  return { handleCapture };
} 
