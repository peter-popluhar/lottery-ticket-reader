import { useState, useEffect } from 'react';
import { type User, onAuthStateChanged } from 'firebase/auth';
import './App.css';
import CameraCapture from './CameraCapture';
import { auth } from './firebase';
import Header from './components/Header';
import Auth from './components/Auth';
import Results from './components/Results';
import Loading from './components/Loading';
import ErrorMessage from './components/ErrorMessage';
import { useLogin } from './hooks/useLogin';
import { useLogout } from './hooks/useLogout';
import { useUpload } from './hooks/useUpload';
import { useCapture } from './hooks/useCapture';
import { useRetake } from './hooks/useRetake';
import { useFetchWinningNumbers } from './hooks/useFetchWinningNumbers';

export type LotteryData = {
  date: string;
  sanceNumber: string;
  winningNumbers: string[];
};

export type WinningNumbersData = {
  drawDate: string;
  mainGame1Numbers: number[];
  mainGame1Extra: number | null;
  mainGame2Numbers: number[];
  mainGame2Extra: number | null;
  addonNumbers: number[];
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [extractedData, setExtractedData] = useState<LotteryData | null>(null);
  const [showCamera, setShowCamera] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Login
  const { handleLogin, error: loginError } = useLogin();
  // Logout
  const { handleLogout } = useLogout(setExtractedData, setShowCamera);
  // Upload
  const { handleUpload, apiLoading, error: uploadError } = useUpload(setExtractedData, setShowCamera);
  // Capture
  const { handleCapture } = useCapture(setExtractedData, setError, setShowCamera, handleUpload);
  // Retake
  const { handleRetake } = useRetake(setExtractedData, setError, setShowCamera);
  // Fetch Winning Numbers
  const { handleFetchWinningNumbers, winningLoading, winningError, winningNumbers } = useFetchWinningNumbers(extractedData);

  // Auth state effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Combine errors for display
  const combinedError = error || loginError || uploadError;

  if (authLoading) {
    return <Loading message="Loading..." />;
  }

  return (
    <div className="App">
      <Header user={user} onLogout={handleLogout} />
      <main>
        {user ? (
          <>
            {showCamera ? (
              <CameraCapture onCapture={handleCapture} loading={apiLoading} />
            ) : (
              <>
                {apiLoading && <Loading message="Extracting data..." />}
                {extractedData && (
                  <Results
                    extractedData={extractedData}
                    onFetchWinningNumbers={handleFetchWinningNumbers}
                    winningLoading={winningLoading}
                    winningError={winningError}
                    winningNumbers={winningNumbers}
                  />
                )}
                <button onClick={handleRetake} className="retake-button">Retake / New Ticket</button>
              </>
            )}
            {combinedError && <ErrorMessage message={combinedError} />}
          </>
        ) : (
          <Auth onLogin={handleLogin} />
        )}
      </main>
    </div>
  );
}

export default App;
