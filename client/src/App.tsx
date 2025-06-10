import { useState } from 'react';
import CameraCapture from './CameraCapture';

interface LotteryData {
  date: string;
  sanceNumber: string;
  winningNumbers: string[];
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<LotteryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = (file: File) => {
    setSelectedFile(file);
    setExtractedData(null); // Clear previous results
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please capture an image.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('lotteryImage', selectedFile);

    try {
      const response = await fetch('http://localhost:3001/extract-lottery-data', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data: LotteryData = await response.json();
      setExtractedData(data);
    } catch (err: unknown) {
      console.error('Error uploading or processing image:', err);
      let message = 'Unknown error';
      if (err instanceof Error) {
        message = err.message;
      }
      setError(`Failed to extract data: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Lottery Ticket Extractor</h1>
      <CameraCapture onCapture={handleCapture} />
      <button onClick={handleUpload} disabled={!selectedFile || loading}>
        {loading ? 'Extracting...' : 'Extract Numbers'}
      </button>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {extractedData && (
        <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '15px' }}>
          <h2>Extracted Information:</h2>
          <p><strong>Date:</strong> {extractedData.date}</p>
          <p><strong>Sance Number:</strong> {extractedData.sanceNumber}</p>
          <h3>Winning Numbers:</h3>
          <ul>
            {extractedData.winningNumbers.map((row, index) => (
              <li key={index}>{row}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
