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
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';

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

const theme = createTheme();

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
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Loading message="Loading..." />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box minHeight="100vh" display="flex" flexDirection="column">
        <Header user={user} onLogout={handleLogout} />
        <Container maxWidth="md" sx={{ flex: 1, py: 4 }}>
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
                  <Box display="flex" justifyContent="center" mt={2}>
                    <Button variant="outlined" color="primary" onClick={handleRetake}
                      size="large">
                      Retake / New Ticket
                    </Button>
                  </Box>
                </>
              )}
              {combinedError && <ErrorMessage message={combinedError} />}
            </>
          ) : (
            <Auth onLogin={handleLogin} />
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
