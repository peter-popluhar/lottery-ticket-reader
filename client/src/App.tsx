import { useState, useEffect } from 'react';
import { type User, onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import './App.css';
import CameraCapture from './CameraCapture';
import { auth, googleProvider } from './firebase';

interface LotteryData {
  date: string;
  sanceNumber: string;
  winningNumbers: string[];
}

interface WinningNumbersData {
  drawDate: string;
  mainGame1Numbers: number[];
  mainGame1Extra: number | null;
  mainGame2Numbers: number[];
  mainGame2Extra: number | null;
  addonNumbers: number[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Helper to normalize date to YYYY-MM-DD
function normalizeDateString(dateStr: string): string {
  // Match DD.MM.YYYY or D.M.YYYY
  const match = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (match) {
    const [, d, m, y] = match;
    return `${y}-${m!.padStart(2, '0')}-${d!.padStart(2, '0')}`;
  }
  // Already in YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  // Try to parse with Date
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return dateStr; // fallback
}

// Helper to format date as DD.MM.YYYY
function formatDateDDMMYYYY(dateStr: string): string {
  // Accepts YYYY-MM-DD or ISO or DD.MM.YYYY
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, y, m, d] = match;
    return `${d}.${m}.${y}`;
  }
  // Already in DD.MM.YYYY
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dateStr)) return dateStr;
  // Try to parse with Date
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }
  return dateStr; // fallback
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [extractedData, setExtractedData] = useState<LotteryData | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(true);

  const [winningNumbers, setWinningNumbers] = useState<WinningNumbersData | null>(null);
  const [winningLoading, setWinningLoading] = useState(false);
  const [winningError, setWinningError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Authentication error:", error);
      setError("Failed to sign in.");
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setExtractedData(null);
      setShowCamera(true);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleUpload = async (file: File) => {
    if (!auth.currentUser) {
      setError("You must be logged in to upload an image.");
      return;
    }
    setApiLoading(true);
    setError(null);
    setExtractedData(null);

    const token = await auth.currentUser.getIdToken();
    const formData = new FormData();
    formData.append('lotteryImage', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/extract-lottery-data`, {
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

  const handleCapture = (file: File) => {
    setExtractedData(null);
    setError(null);
    setShowCamera(false);
    handleUpload(file);
  };

  const handleRetake = () => {
    setExtractedData(null);
    setError(null);
    setShowCamera(true);
  };

  const handleFetchWinningNumbers = async () => {
    if (!auth.currentUser || !extractedData?.date) return;
    setWinningLoading(true);
    setWinningError(null);
    setWinningNumbers(null);
    try {
      const token = await auth.currentUser.getIdToken();
      const normalizedDate = normalizeDateString(extractedData.date);
      const response = await fetch(`${API_BASE_URL}/api/winning-numbers?date=${encodeURIComponent(normalizedDate)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      const data: WinningNumbersData = await response.json();
      setWinningNumbers(data);
    } catch (err: unknown) {
      let message = 'Unknown error';
      if (err instanceof Error) message = err.message;
      setWinningError(`Failed to fetch winning numbers: ${message}`);
    } finally {
      setWinningLoading(false);
    }
  };

  if (authLoading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Lottery Ticket Reader</h1>
        {user && (
          <button onClick={handleLogout} className="sign-out-button">
            Sign Out
          </button>
        )}
      </header>
      <main>
        {user ? (
          <>
            {showCamera ? (
              <CameraCapture onCapture={handleCapture} loading={apiLoading} />
            ) : (
              <>
                {apiLoading && <div className="loading-container">Extracting data...</div>}
                {extractedData && (
                  <div className="results-container">
                    <h2>Extracted Information:</h2>
                    <p><strong>Date:</strong> {extractedData.date}</p>
                    <p><strong>Sance Number:</strong> {extractedData.sanceNumber}</p>
                    <h3>Winning Numbers:</h3>
                    <ul>
                      {extractedData.winningNumbers.map((row, index) => (
                        <li key={index}>{row}</li>
                      ))}
                    </ul>
                    <button onClick={handleFetchWinningNumbers} className="fetch-winning-button" disabled={winningLoading}>
                      {winningLoading ? 'Loading Winning Numbers...' : 'Show Official Winning Numbers'}
                    </button>
                    {winningError && <p className="error-message">{winningError}</p>}
                    {winningNumbers && (
                      <div className="winning-numbers-container">
                        <h2>Official Winning Numbers</h2>
                        <p><strong>Draw Date:</strong> {formatDateDDMMYYYY(winningNumbers.drawDate)}</p>
                        <h3>Main Game 1:</h3>
                        <p>
                          Numbers: {winningNumbers.mainGame1Numbers.slice().sort((a, b) => a - b).join(', ')}
                          {winningNumbers.mainGame1Extra !== null && (
                            <span> | <strong>Extra:</strong> {winningNumbers.mainGame1Extra}</span>
                          )}
                        </p>
                        <h3>Main Game 2:</h3>
                        <p>
                          Numbers: {winningNumbers.mainGame2Numbers.slice().sort((a, b) => a - b).join(', ')}
                          {winningNumbers.mainGame2Extra !== null && (
                            <span> | <strong>Extra:</strong> {winningNumbers.mainGame2Extra}</span>
                          )}
                        </p>
                        <h3>Add-on Numbers:</h3>
                        <p>{winningNumbers.addonNumbers.join('')}</p>
                      </div>
                    )}
                  </div>
                )}
                <button onClick={handleRetake} className="retake-button">Retake / New Ticket</button>
              </>
            )}
            {error && <p className="error-message">Error: {error}</p>}
          </>
        ) : (
          <div className="login-container">
            <h2>Please sign in to continue</h2>
            <button onClick={handleLogin} className="login-button">
              Sign in with Google
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
