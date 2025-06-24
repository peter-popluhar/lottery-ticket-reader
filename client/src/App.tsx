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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [extractedData, setExtractedData] = useState<LotteryData | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(true);

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
